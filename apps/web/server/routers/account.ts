// =============================================================================
// WERA — Account Router (Auth-gated)
// Procedures: orders, orderDetail, wishlist, addresses, profile
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  updateUserProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  toggleWishlistSchema,
  newsletterSubscribeSchema,
  contactFormSchema,
} from "@/lib/validations";

export const accountRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // profile — get current user profile
  // -------------------------------------------------------------------------
  profile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }),

  // -------------------------------------------------------------------------
  // updateProfile — update name, phone, avatar
  // -------------------------------------------------------------------------
  updateProfile: protectedProcedure
    .input(updateUserProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      });
    }),

  // =========================================================================
  // ORDERS
  // =========================================================================

  // -------------------------------------------------------------------------
  // orders — paginated order history
  // -------------------------------------------------------------------------
  orders: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(10),
        status: z
          .enum([
            "PENDING",
            "PAYMENT_CONFIRMED",
            "PROCESSING",
            "IN_PRODUCTION",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        userId: ctx.user.id,
        ...(input.status && { status: input.status }),
      };

      const [items, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        }),
        ctx.db.order.count({ where }),
      ]);

      const totalPages = Math.ceil(total / input.limit);

      return {
        items,
        total,
        page: input.page,
        limit: input.limit,
        totalPages,
        hasNext: input.page < totalPages,
        hasPrev: input.page > 1,
      };
    }),

  // -------------------------------------------------------------------------
  // orderDetail — single order with all line items + addresses
  // -------------------------------------------------------------------------
  orderDetail: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      images: {
                        where: { isPrimary: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
          shippingAddress: true,
          coupon: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found.",
        });
      }

      return order;
    }),

  // =========================================================================
  // WISHLIST
  // =========================================================================

  // -------------------------------------------------------------------------
  // wishlist — get all wishlist items with product data
  // -------------------------------------------------------------------------
  wishlist: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.wishlistItem.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (items.length === 0) return [];

    // Fetch product data for wishlist items
    const productIds = items.map((i) => i.productId);
    const products = await ctx.db.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: {
        id: true,
        slug: true,
        title: true,
        avgRating: true,
        reviewCount: true,
        salesCount: true,
        isFeatured: true,
        isNewArrival: true,
        status: true,
        variants: {
          select: {
            id: true,
            price: true,
            comparePrice: true,
            size: true,
            color: true,
            colorHex: true,
            stock: true,
          },
        },
        images: {
          select: { url: true, altText: true, isPrimary: true, sortOrder: true },
          where: { isPrimary: true },
          take: 1,
        },
        category: {
          select: { name: true, slug: true },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => ({
      ...item,
      product: productMap.get(item.productId) ?? null,
    }));
  }),

  // -------------------------------------------------------------------------
  // toggleWishlist — add or remove a product from wishlist
  // -------------------------------------------------------------------------
  toggleWishlist: protectedProcedure
    .input(toggleWishlistSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: ctx.user.id,
            productId: input.productId,
          },
        },
      });

      if (existing) {
        await ctx.db.wishlistItem.delete({
          where: { id: existing.id },
        });
        return { added: false };
      }

      await ctx.db.wishlistItem.create({
        data: {
          userId: ctx.user.id,
          productId: input.productId,
        },
      });

      return { added: true };
    }),

  // =========================================================================
  // ADDRESSES
  // =========================================================================

  // -------------------------------------------------------------------------
  // addresses — list all user addresses
  // -------------------------------------------------------------------------
  addresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.address.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ isDefault: "desc" }, { fullName: "asc" }],
    });
  }),

  // -------------------------------------------------------------------------
  // createAddress — add a new address
  // -------------------------------------------------------------------------
  createAddress: protectedProcedure
    .input(createAddressSchema)
    .mutation(async ({ ctx, input }) => {
      // If this is the default, unset others
      if (input.isDefault) {
        await ctx.db.address.updateMany({
          where: { userId: ctx.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return ctx.db.address.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });
    }),

  // -------------------------------------------------------------------------
  // updateAddress — edit an existing address
  // -------------------------------------------------------------------------
  updateAddress: protectedProcedure
    .input(updateAddressSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const address = await ctx.db.address.findUnique({
        where: { id, userId: ctx.user.id },
      });

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found.",
        });
      }

      // If setting as default, unset others
      if (data.isDefault) {
        await ctx.db.address.updateMany({
          where: { userId: ctx.user.id, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return ctx.db.address.update({ where: { id }, data });
    }),

  // -------------------------------------------------------------------------
  // deleteAddress — remove an address (only if not used by orders)
  // -------------------------------------------------------------------------
  deleteAddress: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const address = await ctx.db.address.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: { _count: { select: { orders: true } } },
      });

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found.",
        });
      }

      if (address._count.orders > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Cannot delete this address — it is linked to existing orders.",
        });
      }

      await ctx.db.address.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // =========================================================================
  // NEWSLETTER + CONTACT (can be public but placed here for org)
  // =========================================================================

  subscribeNewsletter: protectedProcedure
    .input(newsletterSubscribeSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.newsletterSubscriber.upsert({
        where: { email: input.email },
        update: {},
        create: { email: input.email },
      });
      return { success: true };
    }),

  submitContact: protectedProcedure
    .input(contactFormSchema)
    .mutation(async ({ input }) => {
      // In production, send email via Resend to admin
      // For now, log the contact form submission
      console.log("[Contact Form]", input);
      return { success: true, message: "Message sent successfully." };
    }),
});
