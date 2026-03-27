// =============================================================================
// WERA — QikInk Webhook Handler
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyQikInkWebhook, getProduct } from "@/lib/qikink";
import { qikinkWebhookSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import { sendOrderShipped, sendOrderDelivered } from "@/lib/email";

// ---------------------------------------------------------------------------
// POST /api/webhooks/qikink
// Events: order.shipped, order.delivered, order.failed, product.updated, etc.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-qikink-signature") || req.headers.get("x-webhook-signature") || "";

    if (!signature) {
      console.error("[QikInk Webhook] Missing signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = verifyQikInkWebhook(rawBody, signature);
    if (!isValid) {
      console.error("[QikInk Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const parseResult = qikinkWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("[QikInk Webhook] Invalid payload:", parseResult.error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { event, payload } = parseResult.data;

    switch (event) {
      case "order.in_production": {
        const orderId = (payload as any).order_id as string;
        await db.order.updateMany({
          where: { merchOrderId: orderId },
          data: { status: "IN_PRODUCTION" },
        });
        console.log(`[QikInk Webhook] Order in production: ${orderId}`);
        break;
      }

      case "order.shipped": {
        const data = payload as any;
        const orderId = data.order_id as string;
        const trackingNumber = data.tracking_number as string | undefined;
        const trackingUrl = data.tracking_url as string | undefined;

        const order = await db.order.findFirst({
          where: { merchOrderId: orderId },
          include: { user: { select: { email: true, name: true } } },
        });

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "SHIPPED",
              trackingNumber: trackingNumber ?? null,
              trackingUrl: trackingUrl ?? null,
            },
          });

          try {
            await sendOrderShipped(order.user?.email ?? order.guestEmail!, {
              orderNumber: order.orderNumber,
              customerName: order.user?.name ?? (order.user?.email ?? order.guestEmail!).split("@")[0],
              trackingUrl: trackingUrl ?? "https://wera.in/track",
            });
          } catch (e) {
            console.error("[QikInk Webhook] Failed to send shipped email:", e);
          }
          console.log(`[QikInk Webhook] Order shipped: ${order.orderNumber}, tracking: ${trackingNumber}`);
        }
        break;
      }

      case "order.delivered": {
        const orderId = (payload as any).order_id as string;
        const order = await db.order.findFirst({
          where: { merchOrderId: orderId },
        });

        if (order) {
          const updatedOrder = await db.order.update({
            where: { id: order.id },
            data: { status: "DELIVERED" },
            include: { user: { select: { email: true, name: true } } }
          });

          try {
            await sendOrderDelivered(updatedOrder.user?.email ?? updatedOrder.guestEmail!, {
              orderNumber: updatedOrder.orderNumber,
              customerName: updatedOrder.user?.name ?? (updatedOrder.user?.email ?? updatedOrder.guestEmail!).split("@")[0],
            });
          } catch (e) {
            console.error("[QikInk Webhook] Failed to send delivered email:", e);
          }
          console.log(`[QikInk Webhook] Order delivered: ${order.orderNumber}`);
        }
        break;
      }

      case "order.failed": {
        const data = payload as any;
        const orderId = data.order_id as string;
        const reason = data.reason as string | undefined;

        const order = await db.order.findFirst({
          where: { merchOrderId: orderId },
        });

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "CANCELLED",
              notes: `QikInk fulfillment failed: ${reason ?? "Unknown reason"}`,
            },
          });
          console.error(`[QikInk Webhook] Order failed: ${order.orderNumber}, reason: ${reason}`);
        }
        break;
      }

      case "order.cancelled": {
        const orderId = (payload as any).order_id as string;
        await db.order.updateMany({
          where: { merchOrderId: orderId },
          data: { status: "CANCELLED" },
        });
        console.log(`[QikInk Webhook] Order cancelled: ${orderId}`);
        break;
      }

      case "product.updated": {
        const sku = (payload as any).sku as string;
        if (sku) {
          try {
            const existing = await db.productVariant.findFirst({
              where: { merchVariantId: sku },
              include: { product: true }
            });

            if (existing) {
              const qikProduct = await getProduct(sku);
              // Basic sync logic depending on stock status from QikInk
              const newStock = qikProduct.stockStatus === 'in_stock' ? 100 : 0;
              await db.productVariant.update({
                where: { id: existing.id },
                data: { stock: newStock }
              });
              await db.product.update({
                where: { id: existing.product.id },
                data: { updatedAt: new Date() }
              });

              console.log(`[QikInk Webhook] Product variant synced: ${sku}`);
            }
          } catch (error) {
            console.error(`[QikInk Webhook] Product sync failed for ${sku}:`, error);
          }
        }
        break;
      }

      default:
        console.log(`[QikInk Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[QikInk Webhook] Unhandled error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
