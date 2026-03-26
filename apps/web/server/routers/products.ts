// =============================================================================
// WERA — Products Router
// Public procedures: list, bySlug, search, related
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { productSearchSchema, pincodeCheckSchema } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

export const productsRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // list — paginated product listing with filters + sorting
  // -------------------------------------------------------------------------
  list: publicProcedure
    .input(productSearchSchema)
    .query(async ({ ctx, input }) => {
      const {
        query,
        categorySlug,
        minPrice,
        maxPrice,
        sizes,
        colors,
        sortBy,
        page,
        limit,
        isFeatured,
        isNewArrival,
      } = input;

      const where: Prisma.ProductWhereInput = {
        status: "ACTIVE",
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isNewArrival !== undefined && { isNewArrival }),
        ...(categorySlug && {
          category: { slug: categorySlug },
        }),
        ...(query && {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { tags: { hasSome: [query.toLowerCase()] } },
          ],
        }),
        ...((minPrice !== undefined || maxPrice !== undefined || sizes || colors) && {
          variants: {
            some: {
              ...(minPrice !== undefined && {
                price: { gte: minPrice },
              }),
              ...(maxPrice !== undefined && {
                price: { lte: maxPrice },
              }),
              ...(sizes && { size: { in: sizes } }),
              ...(colors && { color: { in: colors } }),
            },
          },
        }),
      };

      const orderBy: Prisma.ProductOrderByWithRelationInput =
        sortBy === "newest"
          ? { createdAt: "desc" }
          : sortBy === "best_selling"
            ? { salesCount: "desc" }
            : sortBy === "top_rated"
              ? { avgRating: "desc" }
              : sortBy === "price_asc"
                ? { variants: { _count: "asc" } }
                : { variants: { _count: "desc" } };

      const [items, total] = await Promise.all([
        ctx.db.product.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
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
        }),
        ctx.db.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    }),

  // -------------------------------------------------------------------------
  // bySlug — single product detail (PDP)
  // -------------------------------------------------------------------------
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.slug, status: "ACTIVE" },
        include: {
          category: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
          reviews: {
            where: { approved: true },
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      return product;
    }),

  // -------------------------------------------------------------------------
  // search — full-text search using PostgreSQL
  // -------------------------------------------------------------------------
  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(1).max(200) }))
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { description: { contains: input.query, mode: "insensitive" } },
            { tags: { hasSome: [input.query.toLowerCase()] } },
          ],
        },
        take: 20,
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
            take: 1,
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

      return products;
    }),

  // -------------------------------------------------------------------------
  // related — products in the same category (excluding current)
  // -------------------------------------------------------------------------
  related: publicProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        categoryId: z.string().cuid(),
        limit: z.number().int().min(1).max(12).default(8),
      })
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: {
          status: "ACTIVE",
          categoryId: input.categoryId,
          id: { not: input.productId },
        },
        take: input.limit,
        orderBy: { salesCount: "desc" },
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

      return products;
    }),

  // -------------------------------------------------------------------------
  // checkPincode — verify serviceability (Mocked for QikInk transition)
  // -------------------------------------------------------------------------
  checkPincode: publicProcedure
    .input(pincodeCheckSchema)
    .query(async ({ input }) => {
      // QikInk services most of India. Simplified regex mock.
      const isValid = /^\d{6}$/.test(input.pincode);
      return { serviceable: isValid };
    }),
});
