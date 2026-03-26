// =============================================================================
// WERA — Banners Router
// Public procedure: list active banners
// =============================================================================

import { createTRPCRouter, publicProcedure } from "../trpc";

export const bannersRouter = createTRPCRouter({
  // -------------------------------------------------------------------------
  // list — active banners within valid date range
  // -------------------------------------------------------------------------
  list: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();

    return ctx.db.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
  }),
});
