// =============================================================================
// WERA — Cart Router
// Public procedures: validate cart items, get shipping rates
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { shippingRateRequestSchema, applyCouponSchema } from "@/lib/validations";
import { Decimal } from "@prisma/client/runtime/library";

export const cartRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // validate — server-side cart validation
  // Checks stock, prices, and returns authoritative cart state
  // Never trust client-side prices — PRD Section 15.3
  // -------------------------------------------------------------------------
  validate: publicProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              variantId: z.string().cuid(),
              quantity: z.number().int().min(1).max(10),
            })
          )
          .min(1)
          .max(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const variantIds = input.items.map((i) => i.variantId);

      const variants = await ctx.db.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
        },
      });

      const validatedItems = input.items
        .map((item) => {
          const variant = variants.find((v) => v.id === item.variantId);
          if (!variant || variant.product.status !== "ACTIVE") return null;

          const availableQty = Math.min(item.quantity, variant.stock);
          if (availableQty <= 0) return null;

          return {
            variantId: variant.id,
            productId: variant.product.id,
            title: variant.product.title,
            slug: variant.product.slug,
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            price: variant.price.toString(),
            comparePrice: variant.comparePrice?.toString() ?? null,
            quantity: availableQty,
            maxStock: variant.stock,
            imageUrl: variant.product.images[0]?.url ?? "",
            imageAlt: variant.product.images[0]?.altText ?? null,
          };
        })
        .filter(Boolean);

      // Compute subtotal server-side
      const subtotal = validatedItems.reduce((sum, item) => {
        if (!item) return sum;
        return sum.add(new Decimal(item.price).mul(item.quantity));
      }, new Decimal(0));

      return {
        items: validatedItems,
        subtotal: subtotal.toString(),
        itemCount: validatedItems.reduce(
          (sum, item) => sum + (item?.quantity ?? 0),
          0
        ),
      };
    }),

  // -------------------------------------------------------------------------
  // shippingRates — calculate rates for a pincode
  // -------------------------------------------------------------------------
  shippingRates: publicProcedure
    .input(shippingRateRequestSchema)
    .query(async ({ input }) => {
      // Replaced Merch Factory dynamic shipping with Wera Standard Rates
      return { 
        serviceable: /^\d{6}$/.test(input.pincode), 
        options: [
          { method: "Standard", rate: "99.00", currency: "INR", estimatedDays: 5 },
          { method: "Express", rate: "199.00", currency: "INR", estimatedDays: 2 }
        ]
      };
    }),

  // -------------------------------------------------------------------------
  // applyCoupon — validate and return discount info
  // -------------------------------------------------------------------------
  applyCoupon: publicProcedure
    .input(
      applyCouponSchema.extend({
        subtotal: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const coupon = await ctx.db.coupon.findUnique({
        where: { code: input.code.toUpperCase() },
      });

      if (!coupon) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid coupon code.",
        });
      }

      if (!coupon.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This coupon is no longer active.",
        });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This coupon has expired.",
        });
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This coupon has reached its maximum usage limit.",
        });
      }

      const subtotal = new Decimal(input.subtotal);

      if (
        coupon.minOrderValue &&
        subtotal.lt(coupon.minOrderValue)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimum order value of ₹${coupon.minOrderValue} required.`,
        });
      }

      // Check first-order-only for logged-in users
      if (coupon.firstOrderOnly && ctx.user) {
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

      // Per-user limit check
      if (ctx.user) {
        const userUsage = await ctx.db.order.count({
          where: {
            userId: ctx.user.id,
            couponCode: coupon.code,
          },
        });
        if (userUsage >= coupon.perUserLimit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already used this coupon the maximum number of times.",
          });
        }
      }

      // Calculate discount
      let discount = new Decimal(0);
      if (coupon.type === "PERCENTAGE") {
        discount = subtotal.mul(coupon.value).div(100);
      } else if (coupon.type === "FIXED") {
        discount = Decimal.min(coupon.value, subtotal);
      }
      // FREE_SHIPPING: discount stays 0, but shipping becomes free

      return {
        valid: true,
        code: coupon.code,
        type: coupon.type,
        discount: discount.toFixed(2),
        freeShipping: coupon.type === "FREE_SHIPPING",
        message: coupon.type === "FREE_SHIPPING"
          ? "Free shipping applied!"
          : `₹${discount.toFixed(2)} discount applied!`,
      };
    }),
});
