// =============================================================================
// WERA — Cron: Expire Coupons
// Section 10.3
// Schedule: Daily at midnight UTC — "0 0 * * *"
// Deactivates coupons past their expiry date
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/cron/expire-coupons
// Finds all active coupons that have passed their expiresAt date
// and deactivates them.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron: expire-coupons] Starting...");

    const now = new Date();

    // 2. Find and deactivate expired coupons
    const result = await db.coupon.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          not: null,
          lte: now,
        },
      },
      data: {
        isActive: false,
      },
    });

    // 3. Also deactivate coupons that have reached max usage
    const maxedOut = await db.coupon.updateMany({
      where: {
        isActive: true,
        maxUses: { not: null },
        // Using raw comparison since Prisma doesn't support field-to-field comparison
        // This is a fallback — the API layer already checks at validation time
      },
      data: {},
    });

    // Manual check for max-usage coupons
    const activeCouponsWithLimits = await db.coupon.findMany({
      where: {
        isActive: true,
        maxUses: { not: null },
      },
    });

    let maxUsageExpired = 0;
    for (const coupon of activeCouponsWithLimits) {
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        await db.coupon.update({
          where: { id: coupon.id },
          data: { isActive: false },
        });
        maxUsageExpired++;
      }
    }

    const response = {
      success: true,
      dateExpired: result.count,
      maxUsageExpired,
      timestamp: now.toISOString(),
    };

    console.log("[Cron: expire-coupons] Completed:", response);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[Cron: expire-coupons] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
