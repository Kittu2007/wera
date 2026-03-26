// =============================================================================
// WERA — Rate Limiting via Upstash Redis
// Section 15.4 — Applied to auth, checkout, review, and search routes
// =============================================================================

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis client
// ---------------------------------------------------------------------------

const redis = Redis.fromEnv();

// ---------------------------------------------------------------------------
// Rate limiters per route category — Section 15.4
// ---------------------------------------------------------------------------

/** Auth routes: 5 requests per 10 seconds per IP */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  prefix: "ratelimit:auth",
  analytics: true,
});

/** Checkout routes: 3 requests per 60 seconds per IP */
export const checkoutRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  prefix: "ratelimit:checkout",
  analytics: true,
});

/** Review submission: 2 requests per 60 seconds per user */
export const reviewRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "60 s"),
  prefix: "ratelimit:review",
  analytics: true,
});

/** Search/product listing: 30 requests per 10 seconds per IP */
export const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
  prefix: "ratelimit:search",
  analytics: true,
});

/** General API: 60 requests per 10 seconds per IP */
export const generalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "10 s"),
  prefix: "ratelimit:general",
  analytics: true,
});

// ---------------------------------------------------------------------------
// Helper to check rate limit and throw if exceeded
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<void> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    const error = new Error("Rate limit exceeded. Please try again later.");
    (error as any).code = "TOO_MANY_REQUESTS";
    (error as any).meta = { limit, remaining, reset };
    throw error;
  }
}
