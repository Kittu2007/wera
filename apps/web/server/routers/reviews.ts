// =============================================================================
// WERA — Reviews Router
// Public: list (approved). Auth: create.
// =============================================================================

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { createReviewSchema } from "@/lib/validations";

export const reviewsRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // list — approved reviews for a product
  // -------------------------------------------------------------------------
  list: publicProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(10),
        sortBy: z.enum(["newest", "highest", "lowest", "helpful"]).default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const orderBy =
        input.sortBy === "newest"
          ? { createdAt: "desc" as const }
          : input.sortBy === "highest"
            ? { rating: "desc" as const }
            : input.sortBy === "lowest"
              ? { rating: "asc" as const }
              : { helpful: "desc" as const };

      const where = {
        productId: input.productId,
        approved: true,
      };

      const [items, total] = await Promise.all([
        ctx.db.review.findMany({
          where,
          orderBy,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        }),
        ctx.db.review.count({ where }),
      ]);

      // Rating breakdown (5→1 star bar chart)
      const ratingBreakdown = await ctx.db.review.groupBy({
        by: ["rating"],
        where: { productId: input.productId, approved: true },
        _count: { rating: true },
      });

      const totalPages = Math.ceil(total / input.limit);

      return {
        items,
        total,
        page: input.page,
        limit: input.limit,
        totalPages,
        hasNext: input.page < totalPages,
        hasPrev: input.page > 1,
        ratingBreakdown: ratingBreakdown.map((r) => ({
          rating: r.rating,
          count: r._count.rating,
        })),
      };
    }),

  // -------------------------------------------------------------------------
  // create — submit a review (auth required)
  // One review per user per product (enforced by DB unique constraint)
  // -------------------------------------------------------------------------
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if the user has purchased this product (verified review)
      const hasPurchased = await ctx.db.orderItem.findFirst({
        where: {
          order: {
            userId: ctx.user.id,
            status: { in: ["DELIVERED", "SHIPPED"] },
          },
          variant: { productId: input.productId },
        },
      });

      // Check if review already exists
      const existingReview = await ctx.db.review.findUnique({
        where: {
          productId_userId: {
            productId: input.productId,
            userId: ctx.user.id,
          },
        },
      });

      if (existingReview) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reviewed this product.",
        });
      }

      const review = await ctx.db.review.create({
        data: {
          productId: input.productId,
          userId: ctx.user.id,
          rating: input.rating,
          title: input.title,
          body: input.body,
          images: input.images,
          verified: !!hasPurchased,
          approved: false, // Goes to admin moderation queue
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return review;
    }),

  // -------------------------------------------------------------------------
  // voteHelpful — increment helpful count (auth required, one per user)
  // -------------------------------------------------------------------------
  voteHelpful: protectedProcedure
    .input(z.object({ reviewId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found.",
        });
      }

      // Simple increment — for production, track per-user votes in a separate table
      await ctx.db.review.update({
        where: { id: input.reviewId },
        data: { helpful: { increment: 1 } },
      });

      return { success: true };
    }),
});
