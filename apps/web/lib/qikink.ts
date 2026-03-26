// =============================================================================
// WERA — QikInk API Client
// Handles order creation, product syncing, and webhook verification for QikInk.
// =============================================================================

import crypto from "crypto";

const QIKINK_API_KEY = process.env.QIKINK_API_KEY || "";
const QIKINK_API_URL = process.env.QIKINK_API_URL || "https://api.qikink.com/api/v1";
const QIKINK_WEBHOOK_SECRET = process.env.QIKINK_WEBHOOK_SECRET || "";

interface QikInkOrderPayload {
  externalOrderId: string;
  items: {
    variantId: string;
    quantity: number;
    printDesignIds?: string[]; // Assuming qikink requires mapping designs
  }[];
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone?: string;
  };
}

export async function createOrder(payload: QikInkOrderPayload) {
  if (!QIKINK_API_KEY) {
    console.warn("QIKINK_API_KEY is not set. Simulating order creation.");
    return { orderId: `QK-${Date.now()}` };
  }

  const response = await fetch(`${QIKINK_API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${QIKINK_API_KEY}`,
      "Accept": "application/json"
    },
    body: JSON.stringify({
      order_number: payload.externalOrderId,
      payment_mode: "prepaid", // Forced prepaid since Razorpay processes all WERA orders
      shipping_address: {
        first_name: payload.shippingAddress.name.split(' ')[0],
        last_name: payload.shippingAddress.name.split(' ').slice(1).join(' ') || "Customer",
        address1: payload.shippingAddress.line1,
        address2: payload.shippingAddress.line2 || "",
        city: payload.shippingAddress.city,
        state: payload.shippingAddress.state,
        zip: payload.shippingAddress.pincode,
        country: payload.shippingAddress.country || "IN",
        phone: payload.shippingAddress.phone || "0000000000",
      },
      line_items: payload.items.map((item) => ({
        sku: item.variantId, // We use QikInk 'SKU' as variantId mapping 
        quantity: item.quantity,
      })),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QikInk API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return { orderId: data.order_id || `QK-${Date.now()}` };
}

export async function getProduct(sku: string) {
  if (!QIKINK_API_KEY) {
    console.warn("QIKINK_API_KEY not set. Returning mock product sync.");
    return {
      sku,
      stockStatus: "in_stock",
      price: 1000,
    };
  }

  const response = await fetch(`${QIKINK_API_URL}/products/${sku}`, {
    headers: {
      "Authorization": `Bearer ${QIKINK_API_KEY}`,
      "Accept": "application/json"
    },
  });

  if (!response.ok) {
    throw new Error(`QikInk API error (${response.status}) when fetching product ${sku}`);
  }

  const data = await response.json();
  return {
    sku: data.sku,
    stockStatus: data.quantity > 0 ? "in_stock" : "out_of_stock",
    price: data.price,
  };
}

/**
 * Verify QikInk Webhook HMAC Signature
 */
export function verifyQikInkWebhook(rawBody: string, signature: string): boolean {
  if (!QIKINK_WEBHOOK_SECRET) return true; // Bypass in dev if secret not set

  const expectedSignature = crypto
    .createHmac("sha256", QIKINK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}
