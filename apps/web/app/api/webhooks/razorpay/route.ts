// =============================================================================
// WERA — Razorpay Webhook Handler
// Section 10.2 + Section 15.2
// Verifies X-Razorpay-Signature BEFORE processing any event
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { razorpayWebhookEventSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import { sendOrderConfirmed } from "@/lib/email";

// ---------------------------------------------------------------------------
// POST /api/webhooks/razorpay
// Events: payment.captured, refund.processed, order.paid
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("[Razorpay Webhook] Missing signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // 2. Verify webhook signature — PRD Section 15.2
    const isValid = verifyRazorpayWebhook(rawBody, signature);

    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 3. Parse and validate the event payload
    const body = JSON.parse(rawBody);
    const parseResult = razorpayWebhookEventSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("[Razorpay Webhook] Invalid payload:", parseResult.error);
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const event = parseResult.data;

    // 4. Handle each event type
    switch (event.event) {
      // -----------------------------------------------------------------
      // payment.captured — Payment was successfully captured
      // -----------------------------------------------------------------
      case "payment.captured": {
        const payment = event.payload.payment?.entity as Record<string, any> | undefined;
        if (!payment) break;

        const razorpayOrderId = payment.order_id as string;
        const razorpayPaymentId = payment.id as string;

        // Find the pending order and confirm it
        const order = await db.order.findFirst({
          where: {
            razorpayOrderId,
            status: "PENDING",
          },
        });

        if (order) {
          const updatedOrder = await db.order.update({
            where: { id: order.id },
            data: {
              status: "PAYMENT_CONFIRMED",
              razorpayPaymentId,
            },
            include: {
              user: true,
              items: { include: { variant: { include: { product: true } } } }
            }
          });

          console.log(
            `[Razorpay Webhook] Payment captured for order ${updatedOrder.orderNumber}`
          );

          // Trigger confirmation email asynchronously
          try {
            const orderEmail = updatedOrder.user?.email ?? updatedOrder.guestEmail;
            if (orderEmail) {
              await sendOrderConfirmed(orderEmail, {
                orderNumber: updatedOrder.orderNumber,
                customerName: updatedOrder.user?.name ?? orderEmail.split("@")[0],
                total: Number(updatedOrder.total),
                items: updatedOrder.items.map(i => ({
                  title: i.variant.product.title,
                  quantity: i.quantity,
                  price: Number(i.price)
                }))
              });
            }
          } catch (e) {
            console.error("[Razorpay Webhook] Failed to send email:", e);
          }
        }
        break;
      }

      // -----------------------------------------------------------------
      // order.paid — Alternative event for order payment confirmation
      // -----------------------------------------------------------------
      case "order.paid": {
        const orderEntity = event.payload.order?.entity as Record<string, any> | undefined;
        if (!orderEntity) break;

        const razorpayOrderId = orderEntity.id as string;

        const order = await db.order.findFirst({
          where: {
            razorpayOrderId,
            status: "PENDING",
          },
        });

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { status: "PAYMENT_CONFIRMED" },
          });

          console.log(
            `[Razorpay Webhook] Order paid: ${order.orderNumber}`
          );
        }
        break;
      }

      // -----------------------------------------------------------------
      // refund.processed — Refund was processed successfully
      // -----------------------------------------------------------------
      case "refund.processed": {
        const refund = event.payload.refund?.entity as Record<string, any> | undefined;
        if (!refund) break;

        const paymentId = refund.payment_id as string;

        // Find the order by payment ID and mark as refunded
        const order = await db.order.findFirst({
          where: { razorpayPaymentId: paymentId },
        });

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { status: "REFUNDED" },
          });

          console.log(
            `[Razorpay Webhook] Refund processed for order ${order.orderNumber}`
          );
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event.event}`);
    }

    // 5. Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Razorpay Webhook] Unhandled error:", error);
    // Return 200 to prevent Razorpay retries on server errors
    // Log the error for investigation via Sentry
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
