// =============================================================================
// WERA — Checkout Router (Auth-gated)
// Procedures: createOrder (Razorpay), verify, trackOrder
// Section 8.5 + Section 15.2/15.3
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Decimal } from "@prisma/client/runtime/library";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { createOrderSchema, verifyPaymentSchema } from "@/lib/validations";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import * as qikink from "@/lib/qikink";

// GST rate from PRD Section 7.8 — default 18%
const GST_RATE = new Decimal("0.18");
const FREE_SHIPPING_THRESHOLD = new Decimal("999");
const FLAT_SHIPPING_RATE = new Decimal("99");

export const checkoutRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // createOrder — Step 1: Validate items, compute totals, create Razorpay order
  // PRD Section 15.3: NEVER trust client-side prices
  // -------------------------------------------------------------------------
  createOrder: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Validate address ownership
      const address = await ctx.db.address.findUnique({
        where: { id: input.addressId, userId: ctx.user.id },
      });

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shipping address not found.",
        });
      }

      // 2. Fetch all variants from DB — authoritative prices
      const variantIds = input.items.map((i) => i.variantId);
      const variants = await ctx.db.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          product: { select: { id: true, title: true, status: true } },
        },
      });

      if (variants.length !== input.items.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more items are no longer available.",
        });
      }

      // 3. Validate stock + compute subtotal from DB prices
      let subtotal = new Decimal(0);
      const orderItems: {
        variantId: string;
        quantity: number;
        price: Decimal;
        merchVariantId: string | null;
      }[] = [];

      for (const item of input.items) {
        const variant = variants.find((v) => v.id === item.variantId);

        if (!variant || variant.product.status !== "ACTIVE") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product "${variant?.product.title ?? "Unknown"}" is not available.`,
          });
        }

        if (variant.stock < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient stock for "${variant.product.title}" (${variant.size}/${variant.color}). Only ${variant.stock} left.`,
          });
        }

        const lineTotal = variant.price.mul(item.quantity);
        subtotal = subtotal.add(lineTotal);

        orderItems.push({
          variantId: variant.id,
          quantity: item.quantity,
          price: variant.price,
          merchVariantId: variant.merchVariantId,
        });
      }

      // 4. Apply coupon discount (if provided)
      let discount = new Decimal(0);
      let freeShipping = false;

      if (input.couponCode) {
        const coupon = await ctx.db.coupon.findUnique({
          where: { code: input.couponCode },
        });

        if (
          coupon &&
          coupon.isActive &&
          (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
          (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
          (!coupon.minOrderValue || subtotal.gte(coupon.minOrderValue))
        ) {
          // Per-user limit check
          const userUsage = await ctx.db.order.count({
            where: { userId: ctx.user.id, couponCode: coupon.code },
          });

          if (userUsage < coupon.perUserLimit) {
            if (coupon.firstOrderOnly) {
              const orderCount = await ctx.db.order.count({
                where: { userId: ctx.user.id },
              });
              if (orderCount > 0) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "This coupon is only valid for first-time orders.",
                });
              }
            }

            if (coupon.type === "PERCENTAGE") {
              discount = subtotal.mul(coupon.value).div(100);
            } else if (coupon.type === "FIXED") {
              discount = Decimal.min(coupon.value, subtotal);
            } else if (coupon.type === "FREE_SHIPPING") {
              freeShipping = true;
            }
          }
        }
      }

      // 5. Compute shipping
      const shipping =
        freeShipping || subtotal.gte(FREE_SHIPPING_THRESHOLD)
          ? new Decimal(0)
          : FLAT_SHIPPING_RATE;

      // 6. Compute GST (on subtotal - discount)
      const taxableAmount = subtotal.sub(discount);
      const gst = taxableAmount.mul(GST_RATE).toDecimalPlaces(2);

      // 7. Compute total
      const total = taxableAmount.add(shipping).add(gst);

      // 8. Create Razorpay order (amount in paise)
      const totalPaise = total.mul(100).toNumber();

      const razorpayOrder = await createRazorpayOrder({
        amount: Math.round(totalPaise),
        currency: "INR",
        receipt: `wera_${Date.now()}`,
        notes: {
          customer_email: ctx.user.email,
          user_id: ctx.user.id,
        },
      });

      // 9. Store pending order in DB
      const order = await ctx.db.order.create({
        data: {
          userId: ctx.user.id,
          status: "PENDING",
          razorpayOrderId: razorpayOrder.id,
          addressId: input.addressId,
          subtotal,
          discount,
          shipping,
          gst,
          total,
          couponCode: input.couponCode ?? null,
          notes: input.notes ?? null,
          gstInvoiceRequested: input.gstInvoiceRequested,
          items: {
            create: orderItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: total.toString(),
        currency: "INR",
      };
    }),

  // -------------------------------------------------------------------------
  // verify — Step 3: Verify Razorpay signature, confirm order, push to MF
  // PRD Section 15.2: NEVER skip signature verification
  // -------------------------------------------------------------------------
  verify: protectedProcedure
    .input(verifyPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify Razorpay signature — timing-safe comparison
      const isValid = verifyRazorpaySignature(
        input.razorpayOrderId,
        input.razorpayPaymentId,
        input.razorpaySignature
      );

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment verification failed. Invalid signature.",
        });
      }

      // 2. Find the pending order
      const order = await ctx.db.order.findFirst({
        where: {
          razorpayOrderId: input.razorpayOrderId,
          userId: ctx.user.id,
          status: "PENDING",
        },
        include: {
          items: {
            include: {
              variant: true,
            },
          },
          shippingAddress: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found or already processed.",
        });
      }

      // 3. Update order status + store payment ID
      const confirmedOrder = await ctx.db.order.update({
        where: { id: order.id },
        data: {
          status: "PAYMENT_CONFIRMED",
          razorpayPaymentId: input.razorpayPaymentId,
        },
      });

      // 4. Decrement stock for each variant
      await Promise.all(
        order.items.map((item) =>
          ctx.db.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      // 5. Increment product sales count
      const productIds = [
        ...new Set(order.items.map((item) => item.variant.productId)),
      ];
      await Promise.all(
        productIds.map((productId) => {
          const totalQty = order.items
            .filter((item) => item.variant.productId === productId)
            .reduce((sum, item) => sum + item.quantity, 0);

          return ctx.db.product.update({
            where: { id: productId },
            data: { salesCount: { increment: totalQty } },
          });
        })
      );

      // 6. Increment coupon usage
      if (order.couponCode) {
        await ctx.db.coupon.update({
          where: { code: order.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 7. Push order to QikInk for fulfilment
      try {
        const qikResponse = await qikink.createOrder({
          externalOrderId: order.orderNumber,
          items: order.items.map((item) => ({
            variantId: item.variant.merchVariantId ?? item.variantId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            name: order.shippingAddress.fullName,
            line1: order.shippingAddress.line1,
            line2: order.shippingAddress.line2 ?? undefined,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pincode: order.shippingAddress.pincode,
            country: order.shippingAddress.country,
            phone: order.shippingAddress.phone,
          },
        });

        await ctx.db.order.update({
          where: { id: order.id },
          data: {
            merchOrderId: qikResponse.orderId,
            status: "PROCESSING",
          },
        });
      } catch (error) {
        // Log but don't fail — admin can manually retry
        console.error("[QikInk] Order submission failed:", error);
      }

      return {
        success: true,
        orderNumber: confirmedOrder.orderNumber,
        orderId: confirmedOrder.id,
      };
    }),

  // -------------------------------------------------------------------------
  // trackOrder — guest order tracking by order number + email
  // -------------------------------------------------------------------------
  trackOrder: publicProcedure
    .input(
      z.object({
        orderNumber: z.string(),
        email: z.string().email(),
      })
    )
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          orderNumber: input.orderNumber,
          OR: [
            { user: { email: input.email } },
            { guestEmail: input.email },
          ],
        },
        select: {
          orderNumber: true,
          status: true,
          trackingNumber: true,
          trackingUrl: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              price: true,
              variant: {
                select: {
                  size: true,
                  color: true,
                  product: {
                    select: { title: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found. Please check your order number and email.",
        });
      }

      return order;
    }),
});
