// =============================================================================
// WERA — Admin Router (Admin-only)
// Full admin dashboard operations: products, orders, customers, coupons,
// CMS, reviews, analytics, settings, Merch Factory sync
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Decimal } from "@prisma/client/runtime/library";
import { createTRPCRouter, adminProcedure } from "../trpc";
import {
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema,
  createCouponSchema,
  updateCouponSchema,
  createBannerSchema,
  updateBannerSchema,
  createCollectionSchema,
  updateCollectionSchema,
  createCategorySchema,
  updateCategorySchema,
  moderateReviewSchema,
  updateSiteContentSchema,
  orderSearchSchema,
  productSearchSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
} from "@/lib/validations";

export const adminRouter = createTRPCRouter({
  // =========================================================================
  // DASHBOARD KPIs — Section 7.1
  // =========================================================================

  dashboard: adminProcedure
    .input(
      z.object({
        period: z.enum(["today", "week", "month", "custom"]).default("month"),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let startDate: Date;

      if (input.period === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (input.period === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.period === "custom" && input.dateFrom) {
        startDate = input.dateFrom;
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const endDate = input.dateTo ?? now;

      const dateFilter = {
        createdAt: { gte: startDate, lte: endDate },
      };

      const [
        orders,
        totalOrderCount,
        customers,
        pendingFulfillment,
        lowStockVariants,
        recentOrders,
      ] = await Promise.all([
        // Revenue + AOV
        ctx.db.order.findMany({
          where: {
            ...dateFilter,
            status: {
              notIn: ["CANCELLED", "REFUNDED", "PENDING"],
            },
          },
          select: { total: true },
        }),
        // Total order count
        ctx.db.order.count({ where: dateFilter }),
        // Customer stats
        ctx.db.user.findMany({
          where: { role: "CUSTOMER", ...dateFilter },
          select: {
            id: true,
            _count: { select: { orders: true } },
          },
        }),
        // Pending fulfilment queue
        ctx.db.order.count({
          where: {
            status: { in: ["PAYMENT_CONFIRMED", "PROCESSING"] },
          },
        }),
        // Low stock alerts
        ctx.db.productVariant.count({
          where: { stock: { lte: 5 } },
        }),
        // Recent 10 orders
        ctx.db.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            user: {
              select: { name: true, email: true },
            },
          },
        }),
      ]);

      const totalRevenue = orders.reduce(
        (sum, o) => sum.add(o.total),
        new Decimal(0)
      );

      const averageOrderValue =
        orders.length > 0
          ? totalRevenue.div(orders.length).toDecimalPlaces(2)
          : new Decimal(0);

      const newCustomers = customers.filter(
        (c) => c._count.orders <= 1
      ).length;
      const returningCustomers = customers.filter(
        (c) => c._count.orders > 1
      ).length;

      // Orders by status
      const ordersByStatus = await ctx.db.order.groupBy({
        by: ["status"],
        _count: { status: true },
      });

      return {
        totalRevenue: totalRevenue.toString(),
        totalOrders: totalOrderCount,
        averageOrderValue: averageOrderValue.toString(),
        newCustomers,
        returningCustomers,
        pendingFulfillment,
        lowStockCount: lowStockVariants,
        ordersByStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        recentOrders,
      };
    }),

  // -------------------------------------------------------------------------
  // Revenue trend data for charts
  // -------------------------------------------------------------------------
  revenueTrend: adminProcedure
    .input(
      z.object({
        days: z.number().int().min(7).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(
        Date.now() - input.days * 24 * 60 * 60 * 1000
      );

      const orders = await ctx.db.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { notIn: ["CANCELLED", "REFUNDED", "PENDING"] },
        },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      // Group by date
      const grouped = new Map<string, { revenue: Decimal; orders: number }>();

      for (const order of orders) {
        const dateKey = order.createdAt.toISOString().split("T")[0]!;
        const existing = grouped.get(dateKey) ?? {
          revenue: new Decimal(0),
          orders: 0,
        };
        grouped.set(dateKey, {
          revenue: existing.revenue.add(order.total),
          orders: existing.orders + 1,
        });
      }

      return Array.from(grouped.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue.toString(),
        orders: data.orders,
      }));
    }),

  // -------------------------------------------------------------------------
  // Top products
  // -------------------------------------------------------------------------
  topProducts: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findMany({
        orderBy: { salesCount: "desc" },
        take: input.limit,
        select: {
          id: true,
          title: true,
          slug: true,
          salesCount: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      });
    }),

  // =========================================================================
  // PRODUCT MANAGEMENT — Section 7.2
  // =========================================================================

  productsList: adminProcedure
    .input(productSearchSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) where.status = input.status;
      if (input.query) {
        where.OR = [
          { title: { contains: input.query, mode: "insensitive" } },
          { slug: { contains: input.query, mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.product.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            categoryId: true,
            salesCount: true,
            isFeatured: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { variants: true, reviews: true } },
          },
        }),
        ctx.db.product.count({ where }),
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

  productDetail: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          category: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
          reviews: {
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
      }

      return product;
    }),

  createProduct: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { variants, images, ...productData } = input;

      return ctx.db.product.create({
        data: {
          ...productData,
          variants: {
            create: variants.map((v) => ({
              ...v,
              price: new Decimal(v.price),
              comparePrice: v.comparePrice
                ? new Decimal(v.comparePrice)
                : null,
            })),
          },
          images: { create: images },
        },
        include: { variants: true, images: true },
      });
    }),

  updateProduct: adminProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, variants, images, ...productData } = input;

      // Update product fields
      const updated = await ctx.db.product.update({
        where: { id },
        data: productData,
      });

      // If variants are provided, replace all
      if (variants) {
        await ctx.db.productVariant.deleteMany({ where: { productId: id } });
        await ctx.db.productVariant.createMany({
          data: variants.map((v) => ({
            ...v,
            productId: id,
            price: new Decimal(v.price),
            comparePrice: v.comparePrice
              ? new Decimal(v.comparePrice)
              : null,
          })),
        });
      }

      // If images are provided, replace all
      if (images) {
        await ctx.db.productImage.deleteMany({ where: { productId: id } });
        await ctx.db.productImage.createMany({
          data: images.map((img) => ({ ...img, productId: id })),
        });
      }

      return ctx.db.product.findUnique({
        where: { id },
        include: { variants: true, images: true },
      });
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.product.delete({ where: { id: input.id } });
      return { success: true };
    }),

  bulkUpdateProductStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string().cuid()).min(1).max(100),
        status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.product.updateMany({
        where: { id: { in: input.ids } },
        data: { status: input.status },
      });
      return { success: true, count: input.ids.length };
    }),

  // =========================================================================
  // ORDER MANAGEMENT — Section 7.3
  // =========================================================================

  ordersList: adminProcedure
    .input(orderSearchSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) where.status = input.status;
      if (input.userId) where.userId = input.userId;
      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) where.createdAt.gte = input.dateFrom;
        if (input.dateTo) where.createdAt.lte = input.dateTo;
      }
      if (input.query) {
        where.OR = [
          { orderNumber: { contains: input.query, mode: "insensitive" } },
          { user: { email: { contains: input.query, mode: "insensitive" } } },
          { user: { name: { contains: input.query, mode: "insensitive" } } },
          { guestEmail: { contains: input.query, mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
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

  orderDetail: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      images: { where: { isPrimary: true }, take: 1 },
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }

      return order;
    }),

  updateOrderStatus: adminProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.db.order.update({
        where: { id },
        data,
      });
    }),

  cancelOrder: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: { items: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }

      if (order.status === "CANCELLED" || order.status === "REFUNDED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order is already cancelled/refunded.",
        });
      }

      // Restore stock
      await Promise.all(
        order.items.map((item) =>
          ctx.db.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );

      // Initiate Razorpay refund if payment was captured
      if (order.razorpayPaymentId) {
        try {
          const { createRazorpayRefund } = await import("@/lib/razorpay");
          await createRazorpayRefund(order.razorpayPaymentId);
        } catch (error) {
          console.error("[Razorpay] Refund failed:", error);
        }
      }

      // Cancel on QikInk if submitted
      if (order.merchOrderId) {
        try {
          // QikInk cancellation happens via support email or dashboard for now
          // Could be expanded with an endpoint: await qikink.cancelOrder(...)
          console.log(`[QikInk] Manual cancellation required for order: ${order.merchOrderId}`);
        } catch (error) {
          console.error("[QikInk] Cancellation failed:", error);
        }
      }

      return ctx.db.order.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),

  // =========================================================================
  // CUSTOMER MANAGEMENT — Section 7.4
  // =========================================================================

  customersList: adminProcedure
    .input(
      z.object({
        query: z.string().max(200).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { role: "CUSTOMER" };

      if (input.query) {
        where.OR = [
          { name: { contains: input.query, mode: "insensitive" } },
          { email: { contains: input.query, mode: "insensitive" } },
          { phone: { contains: input.query } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        }),
        ctx.db.user.count({ where }),
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

  customerDetail: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
          addresses: true,
          _count: { select: { orders: true, reviews: true } },
        },
      });

      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found." });
      }

      // Calculate lifetime spend
      const lifetimeSpend = customer.orders.reduce(
        (sum, o) => sum.add(o.total),
        new Decimal(0)
      );

      return {
        ...customer,
        lifetimeSpend: lifetimeSpend.toString(),
        firstOrderDate: customer.orders[customer.orders.length - 1]?.createdAt ?? null,
        lastOrderDate: customer.orders[0]?.createdAt ?? null,
      };
    }),

  // =========================================================================
  // COUPON MANAGEMENT — Section 7.5
  // =========================================================================

  couponsList: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const [items, total] = await Promise.all([
        ctx.db.coupon.findMany({
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: { _count: { select: { orders: true } } },
        }),
        ctx.db.coupon.count(),
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

  createCoupon: adminProcedure
    .input(createCouponSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.coupon.create({
        data: {
          ...input,
          value: new Decimal(input.value),
          minOrderValue: input.minOrderValue
            ? new Decimal(input.minOrderValue)
            : null,
        },
      });
    }),

  updateCoupon: adminProcedure
    .input(updateCouponSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };

      if (data.value) updateData.value = new Decimal(data.value);
      if (data.minOrderValue)
        updateData.minOrderValue = new Decimal(data.minOrderValue);

      return ctx.db.coupon.update({ where: { id }, data: updateData });
    }),

  deleteCoupon: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.coupon.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // =========================================================================
  // CMS — Section 7.6 (Banners, Collections, Categories, SiteContent)
  // =========================================================================

  // --- Banners ---
  bannersList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.banner.findMany({ orderBy: { sortOrder: "asc" } });
  }),

  createBanner: adminProcedure
    .input(createBannerSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.banner.create({ data: input });
    }),

  updateBanner: adminProcedure
    .input(updateBannerSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.banner.update({ where: { id }, data });
    }),

  deleteBanner: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.banner.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // --- Collections ---
  collectionsList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.collection.findMany({ orderBy: { sortOrder: "asc" } });
  }),

  createCollection: adminProcedure
    .input(createCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.collection.create({ data: input });
    }),

  updateCollection: adminProcedure
    .input(updateCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.collection.update({ where: { id }, data });
    }),

  deleteCollection: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collection.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // --- Categories ---
  categoriesList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
    });
  }),

  createCategory: adminProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.create({ data: input });
    }),

  updateCategory: adminProcedure
    .input(updateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.category.update({ where: { id }, data });
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const hasProducts = await ctx.db.product.count({
        where: { categoryId: input.id },
      });
      if (hasProducts > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete — ${hasProducts} products are in this category.`,
        });
      }
      await ctx.db.category.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // --- Site Content ---
  siteContentList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.siteContent.findMany();
  }),

  updateSiteContent: adminProcedure
    .input(updateSiteContentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.siteContent.upsert({
        where: { key: input.key },
        update: { value: input.value },
        create: { key: input.key, value: input.value },
      });
    }),

  // =========================================================================
  // REVIEW MODERATION — Section 7 (Review Moderation Queue)
  // =========================================================================

  pendingReviews: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = { approved: false };

      const [items, total] = await Promise.all([
        ctx.db.review.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            product: { select: { id: true, title: true, slug: true } },
          },
        }),
        ctx.db.review.count({ where }),
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

  moderateReview: adminProcedure
    .input(moderateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.update({
        where: { id: input.id },
        data: { approved: input.approved },
      });

      // If approved, update product avg rating + count
      if (input.approved) {
        const stats = await ctx.db.review.aggregate({
          where: { productId: review.productId, approved: true },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await ctx.db.product.update({
          where: { id: review.productId },
          data: {
            avgRating: stats._avg.rating ?? 0,
            reviewCount: stats._count.rating,
          },
        });
      }

      return review;
    }),

  deleteReview: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.delete({
        where: { id: input.id },
      });

      // Recalculate product stats
      const stats = await ctx.db.review.aggregate({
        where: { productId: review.productId, approved: true },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await ctx.db.product.update({
        where: { id: review.productId },
        data: {
          avgRating: stats._avg.rating ?? 0,
          reviewCount: stats._count.rating,
        },
      });

      return { success: true };
    }),

  // =========================================================================
  // BLOG MANAGEMENT — Section 7.6
  // =========================================================================

  blogList: adminProcedure.query(async ({ ctx }) => {
    // Blog posts stored as SiteContent with key prefix "blog_"
    // For a production app, you'd want a dedicated BlogPost model
    // Using SiteContent for now to avoid schema changes
    return ctx.db.siteContent.findMany({
      where: { key: { startsWith: "blog_" } },
    });
  }),

  createBlogPost: adminProcedure
    .input(createBlogPostSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.siteContent.create({
        data: {
          key: `blog_${input.slug}`,
          value: input as any,
        },
      });
    }),

  updateBlogPost: adminProcedure
    .input(updateBlogPostSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.siteContent.update({
        where: { id },
        data: { value: data as any },
      });
    }),

  deleteBlogPost: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.siteContent.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // =========================================================================
  // NEWSLETTER SUBSCRIBERS
  // =========================================================================

  subscribersList: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const [items, total] = await Promise.all([
        ctx.db.newsletterSubscriber.findMany({
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.newsletterSubscriber.count(),
      ]);

      return { items, total };
    }),

  // =========================================================================
  // QIKINK SYNC — Section 8.4
  // =========================================================================

  syncProducts: adminProcedure.mutation(async ({ ctx }) => {
    const qikink = await import("@/lib/qikink");
    
    const variants = await ctx.db.productVariant.findMany({
      where: { merchVariantId: { not: null } },
      include: { product: true }
    });

    let synced = 0;
    let errors = 0;

    for (const variant of variants) {
      if (!variant.merchVariantId) continue;
      
      try {
        const qikProduct = await qikink.getProduct(variant.merchVariantId);
        
        await ctx.db.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: qikProduct.stockStatus === 'in_stock' ? 100 : 0,
            price: qikProduct.price || variant.price,
          },
        });

        await ctx.db.product.update({
          where: { id: variant.productId },
          data: { updatedAt: new Date() },
        });

        synced++;
      } catch (error) {
        console.error(`[QikInk] Sync failed for ${variant.merchVariantId}:`, error);
        errors++;
      }
    }

    return { synced, errors, totalChecked: variants.length };
  }),

  // =========================================================================
  // STORE SETTINGS — Section 7.8
  // =========================================================================

  getSettings: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.siteContent.findMany({
      where: { key: { startsWith: "settings_" } },
    });

    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      settingsMap[s.key.replace("settings_", "")] = s.value;
    }

    return settingsMap;
  }),

  updateSettings: adminProcedure
    .input(
      z.object({
        key: z.string().min(1).max(100),
        value: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.siteContent.upsert({
        where: { key: `settings_${input.key}` },
        update: { value: input.value },
        create: { key: `settings_${input.key}`, value: input.value },
      });
    }),
});
