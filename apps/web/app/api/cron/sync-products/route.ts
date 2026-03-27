// =============================================================================
// WERA — Cron: Sync Products from Merch Factory
// Section 8.4 + Section 10.3
// Schedule: Daily at 1am UTC (6:30am IST) — "0 1 * * *"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProduct } from "@/lib/qikink";

// ---------------------------------------------------------------------------
// GET /api/cron/sync-products
// Vercel Cron triggers this route. Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron: sync-products] Unauthorized request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron: sync-products] Starting QikInk product sync...");

    // 2. Fetch all variants that have a merchVariantId mapped
    const variants = await db.productVariant.findMany({
      where: { merchVariantId: { not: null } },
      include: { product: true }
    });

    let synced = 0;
    let errors = 0;

    // 3. Sync each variant individually from QikInk
    for (const variant of variants) {
      if (!variant.merchVariantId) continue;
      
      try {
        const qikProduct = await getProduct(variant.merchVariantId);
        
        await db.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: qikProduct.stockStatus === 'in_stock' ? 100 : 0,
            price: qikProduct.price || variant.price,
          },
        });

        await db.product.update({
          where: { id: variant.productId },
          data: { updatedAt: new Date() },
        });

        synced++;
      } catch (error) {
        console.error(
          `[Cron: sync-products] Error syncing variant ${variant.merchVariantId}:`,
          error
        );
        errors++;
      }
    }

    const result = {
      success: true,
      totalVariantsChecked: variants.length,
      synced,
      errors,
      timestamp: new Date().toISOString(),
    };

    console.log("[Cron: sync-products] Completed QikInk sync:", result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Cron: sync-products] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
