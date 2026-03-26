// =============================================================================
// WERA — Categories Router
// Public procedures: list, bySlug
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const categoriesRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // list — all categories with children and product counts
  // -------------------------------------------------------------------------
  list: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { products: { where: { status: "ACTIVE" } } },
        },
      },
    });

    // Return top-level categories (parentId is null) with children nested
    return categories.filter((c) => c.parentId === null);
  }),

  // -------------------------------------------------------------------------
  // bySlug — single category with its products
  // -------------------------------------------------------------------------
  bySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
        sortBy: z
          .enum(["newest", "price_asc", "price_desc", "best_selling", "top_rated"])
          .default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { slug: input.slug },
        include: {
          children: { orderBy: { sortOrder: "asc" } },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found.",
        });
      }

      // Include products from this category AND all child categories
      const categoryIds = [
        category.id,
        ...category.children.map((c) => c.id),
      ];

      const orderBy =
        input.sortBy === "newest"
          ? { createdAt: "desc" as const }
          : input.sortBy === "best_selling"
            ? { salesCount: "desc" as const }
            : input.sortBy === "top_rated"
              ? { avgRating: "desc" as const }
              : undefined;

      const [products, total] = await Promise.all([
        ctx.db.product.findMany({
          where: {
            status: "ACTIVE",
            categoryId: { in: categoryIds },
          },
          orderBy,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
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
              orderBy: { sortOrder: "asc" },
            },
            category: {
              select: { name: true, slug: true },
            },
          },
        }),
        ctx.db.product.count({
          where: {
            status: "ACTIVE",
            categoryId: { in: categoryIds },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / input.limit);

      return {
        category,
        products: {
          items: products,
          total,
          page: input.page,
          limit: input.limit,
          totalPages,
          hasNext: input.page < totalPages,
          hasPrev: input.page > 1,
        },
      };
    }),
});
