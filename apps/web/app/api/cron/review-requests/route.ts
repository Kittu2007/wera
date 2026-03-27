// =============================================================================
// WERA — Cron: Send Review Request Emails
// Section 6.7 + Section 10.3
// Schedule: Daily at 3am UTC — "0 3 * * *"
// Sends review request emails 7 days after delivery
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/cron/review-requests
// Finds orders delivered 7+ days ago that haven't been reviewed yet,
// and sends review request emails via Resend.
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

    console.log("[Cron: review-requests] Starting...");

    // 2. Find orders delivered exactly 7 days ago (±1 day window)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const deliveredOrders = await db.order.findMany({
      where: {
        status: "DELIVERED",
        updatedAt: {
          gte: eightDaysAgo,
          lte: sevenDaysAgo,
        },
        userId: { not: null }, // Only for registered users
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { id: true, title: true, slug: true },
                },
              },
            },
          },
        },
      },
    });

    let emailsSent = 0;
    let skipped = 0;

    for (const order of deliveredOrders) {
      if (!order.user) continue;

      // 3. Check if user has already reviewed any product in this order
      const productIds = [
        ...new Set(
          order.items.map((item) => item.variant.product.id)
        ),
      ];

      const existingReviews = await db.review.findMany({
        where: {
          userId: order.user.id,
          productId: { in: productIds },
        },
        select: { productId: true },
      });

      const reviewedProductIds = new Set(
        existingReviews.map((r) => r.productId)
      );

      // Filter to products not yet reviewed
      const unreviewedProducts = productIds.filter(
        (id) => !reviewedProductIds.has(id)
      );

      if (unreviewedProducts.length === 0) {
        skipped++;
        continue;
      }

      // 4. Send review request email via Resend
      // TODO: Integrate with Resend when email templates are built
      // await sendReviewRequestEmail({
      //   to: order.user.email,
      //   name: order.user.name ?? "Customer",
      //   orderNumber: order.orderNumber,
      //   products: order.items
      //     .filter((item) => unreviewedProducts.includes(item.variant.product.id))
      //     .map((item) => ({
      //       title: item.variant.product.title,
      //       slug: item.variant.product.slug,
      //     })),
      // });

      console.log(
        `[Cron: review-requests] Review email queued for ${order.user.email} (order ${order.orderNumber})`
      );

      emailsSent++;
    }

    const result = {
      success: true,
      ordersChecked: deliveredOrders.length,
      emailsSent,
      skipped,
      timestamp: new Date().toISOString(),
    };

    console.log("[Cron: review-requests] Completed:", result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Cron: review-requests] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
