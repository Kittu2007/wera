// =============================================================================
// WERA — Root tRPC Router
// Section 10.1 — Exact router structure from PRD
// =============================================================================

import { createTRPCRouter, createCallerFactory } from "../trpc";
import { productsRouter } from "./products";
import { categoriesRouter } from "./categories";
import { collectionsRouter } from "./collections";
import { reviewsRouter } from "./reviews";
import { bannersRouter } from "./banners";
import { cartRouter } from "./cart";
import { accountRouter } from "./account";
import { checkoutRouter } from "./checkout";
import { adminRouter } from "./admin";

// ---------------------------------------------------------------------------
// Root Router — matches PRD Section 10.1 exactly
// ---------------------------------------------------------------------------

export const appRouter = createTRPCRouter({
  // Public
  products: productsRouter,       // list, bySlug, search, related
  categories: categoriesRouter,   // list, bySlug
  collections: collectionsRouter, // list, bySlug
  reviews: reviewsRouter,         // list, create
  banners: bannersRouter,         // list
  cart: cartRouter,               // validate, shippingRates, applyCoupon

  // Auth-gated
  account: accountRouter,         // orders, wishlist, addresses, profile
  checkout: checkoutRouter,       // createOrder (Razorpay), verify, trackOrder

  // Admin-only
  admin: adminRouter,             // all admin operations
});

// ---------------------------------------------------------------------------
// Type export for client-side usage
// ---------------------------------------------------------------------------

export type AppRouter = typeof appRouter;

// ---------------------------------------------------------------------------
// Server-side caller factory (for RSC, webhooks, cron jobs)
// ---------------------------------------------------------------------------

export const createCaller = createCallerFactory(appRouter);
