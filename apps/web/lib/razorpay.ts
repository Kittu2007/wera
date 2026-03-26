// =============================================================================
// WERA — Razorpay Server-Side Utilities
// Section 15.2 — Signature verification + order creation
// NEVER import this file in client-side code
// =============================================================================

import crypto from "crypto";
import type {
  RazorpayOrderCreateParams,
  RazorpayOrderResponse,
} from "@/types";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

// ---------------------------------------------------------------------------
// Signature Verification — PRD Section 15.2
// Uses timing-safe comparison to prevent timing attacks
// ---------------------------------------------------------------------------

/**
 * Verify Razorpay payment signature after checkout.
 * Called server-side BEFORE creating the order record.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    // Buffer length mismatch → invalid signature
    return false;
  }
}

/**
 * Verify Razorpay webhook signature.
 * Called before processing any webhook event.
 */
export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Razorpay API Client
// ---------------------------------------------------------------------------

async function razorpayRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString(
    "base64"
  );

  const response = await fetch(`${RAZORPAY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Razorpay API error: ${response.status} ${JSON.stringify(error)}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Create a Razorpay order. Amount must be in paise (₹1 = 100 paise).
 * Called server-side during checkout.
 */
export async function createRazorpayOrder(
  params: RazorpayOrderCreateParams
): Promise<RazorpayOrderResponse> {
  return razorpayRequest<RazorpayOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Fetch an existing Razorpay order by ID.
 */
export async function getRazorpayOrder(
  orderId: string
): Promise<RazorpayOrderResponse> {
  return razorpayRequest<RazorpayOrderResponse>(`/orders/${orderId}`);
}

/**
 * Initiate a refund for a payment.
 */
export async function createRazorpayRefund(
  paymentId: string,
  amountInPaise?: number
): Promise<{ id: string; amount: number; status: string }> {
  return razorpayRequest(`/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify(amountInPaise ? { amount: amountInPaise } : {}),
  });
}
