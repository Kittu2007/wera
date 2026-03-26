// =============================================================================
// WERA — Collections Router
// Public procedures: list, bySlug
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const collectionsRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // list — all active collections
  // -------------------------------------------------------------------------
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.collection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  // -------------------------------------------------------------------------
  // bySlug — single collection with its products
  // -------------------------------------------------------------------------
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.collection.findUnique({
        where: { slug: input.slug, isActive: true },
      });

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found.",
        });
      }

      // Fetch products by the stored product IDs
      const products =
        collection.productIds.length > 0
          ? await ctx.db.product.findMany({
              where: {
                id: { in: collection.productIds },
                status: "ACTIVE",
              },
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
                  select: {
                    url: true,
                    altText: true,
                    isPrimary: true,
                    sortOrder: true,
                  },
                  orderBy: { sortOrder: "asc" },
                },
                category: {
                  select: { name: true, slug: true },
                },
              },
            })
          : [];

      return { collection, products };
    }),
});
