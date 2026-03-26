// =============================================================================
// WERA — Zod Validation Schemas
// Aligned with Prisma schema (Section 9.1) and Security requirements (Section 15.3)
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared Primitives & Validators
// ---------------------------------------------------------------------------

/** CUID format (Prisma default ID strategy) */
const cuid = z.string().cuid();

/** Indian phone number: 10 digits, optionally prefixed with +91 */
const phoneNumber = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian phone number");

/** Indian pincode: exactly 6 digits */
const pincode = z.string().regex(/^\d{6}$/, "Invalid pincode");

/** Positive decimal for currency (string representation for Prisma Decimal) */
const currencyAmount = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid currency amount")
  .refine((val) => parseFloat(val) >= 0, "Amount must be non-negative");

/** URL slug: lowercase alphanumeric + hyphens */
const slug = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

/** Safe text input: trimmed, no leading/trailing whitespace abuse */
const safeText = (maxLen: number) =>
  z.string().trim().min(1).max(maxLen);

/** Hex color code */
const hexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
  .optional();

/** Email with max length guard */
const email = z.string().email().max(254);

// ---------------------------------------------------------------------------
// Enum Schemas (mirror Prisma enums for runtime validation)
// ---------------------------------------------------------------------------

export const roleSchema = z.enum(["CUSTOMER", "ADMIN"]);

export const orderStatusSchema = z.enum([
  "PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const couponTypeSchema = z.enum([
  "PERCENTAGE",
  "FIXED",
  "FREE_SHIPPING",
]);

// ---------------------------------------------------------------------------
// User Schemas
// ---------------------------------------------------------------------------

export const userProfileSchema = z.object({
  name: safeText(100).optional(),
  phone: phoneNumber.optional(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
});

export const userSchema = z.object({
  email,
  name: safeText(100).optional(),
  phone: phoneNumber.optional(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  role: roleSchema.default("CUSTOMER"),
});

export const updateUserProfileSchema = userProfileSchema.partial();

// ---------------------------------------------------------------------------
// Address Schemas
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  fullName: safeText(100),
  line1: safeText(200),
  line2: safeText(200).optional().nullable(),
  city: safeText(100),
  state: safeText(100),
  pincode,
  country: safeText(100).default("India"),
  phone: phoneNumber,
  isDefault: z.boolean().default(false),
});

export const createAddressSchema = addressSchema;

export const updateAddressSchema = addressSchema.partial().extend({
  id: cuid,
});

// ---------------------------------------------------------------------------
// Category Schemas
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: safeText(100),
  slug,
  description: safeText(500).optional().nullable(),
  image: z.string().url().max(2048).optional().nullable(),
  parentId: cuid.optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createCategorySchema = categorySchema;

export const updateCategorySchema = categorySchema.partial().extend({
  id: cuid,
});

// ---------------------------------------------------------------------------
// Product Schemas
// ---------------------------------------------------------------------------

export const productImageSchema = z.object({
  url: z.string().url().max(2048),
  altText: safeText(200).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const productVariantSchema = z.object({
  size: safeText(20),
  color: safeText(50),
  colorHex: hexColor,
  price: currencyAmount,
  comparePrice: currencyAmount.optional().nullable(),
  sku: safeText(100),
  stock: z.number().int().min(0).default(0),
  merchVariantId: z.string().max(255).optional().nullable(),
});

export const productSchema = z.object({
  title: safeText(200),
  slug,
  description: safeText(5000),
  categoryId: cuid,
  tags: z.array(safeText(50)).max(20).default([]),
  status: productStatusSchema.default("DRAFT"),
  metaTitle: safeText(70).optional().nullable(),
  metaDescription: safeText(160).optional().nullable(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  merchFactoryId: z.string().max(255).optional().nullable(),
  variants: z.array(productVariantSchema).min(1).max(100),
  images: z.array(productImageSchema).min(1).max(20),
});

export const createProductSchema = productSchema;

export const updateProductSchema = productSchema.partial().extend({
  id: cuid,
});

// ---------------------------------------------------------------------------
// Order Schemas (Section 15.3 — never trust client-side prices)
// ---------------------------------------------------------------------------

export const orderItemInputSchema = z.object({
  variantId: cuid,
  quantity: z.number().int().min(1).max(10),
});

/**
 * createOrderSchema — PRD Section 15.3
 * Client provides ONLY item references, address, and optional coupon.
 * Prices, subtotal, shipping, GST, and total are ALWAYS computed server-side.
 */
export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1).max(20),
  addressId: cuid,
  couponCode: z
    .string()
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Invalid coupon code format")
    .optional(),
  notes: safeText(500).optional(),
  gstInvoiceRequested: z.boolean().default(false),
  guestEmail: email.optional(),
  guestPhone: phoneNumber.optional(),
});

/** Admin-only: update order status */
export const updateOrderStatusSchema = z.object({
  id: cuid,
  status: orderStatusSchema,
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().max(2048).optional(),
  notes: safeText(500).optional(),
});

// ---------------------------------------------------------------------------
// Checkout / Payment Schemas (Section 15.2)
// ---------------------------------------------------------------------------

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1).max(100),
  razorpayPaymentId: z.string().min(1).max(100),
  razorpaySignature: z.string().min(1).max(512),
});

// ---------------------------------------------------------------------------
// Review Schemas
// ---------------------------------------------------------------------------

export const createReviewSchema = z.object({
  productId: cuid,
  rating: z.number().int().min(1).max(5),
  title: safeText(200).optional(),
  body: safeText(2000),
  images: z.array(z.string().url().max(2048)).max(5).default([]),
});

export const moderateReviewSchema = z.object({
  id: cuid,
  approved: z.boolean(),
});

// ---------------------------------------------------------------------------
// Wishlist Schemas
// ---------------------------------------------------------------------------

export const toggleWishlistSchema = z.object({
  productId: cuid,
});

// ---------------------------------------------------------------------------
// Coupon Schemas
// ---------------------------------------------------------------------------

export const couponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Coupon code: uppercase, numbers, hyphens, underscores only"),
  type: couponTypeSchema,
  value: currencyAmount,
  minOrderValue: currencyAmount.optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  perUserLimit: z.number().int().min(1).max(100).default(1),
  firstOrderOnly: z.boolean().default(false),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const createCouponSchema = couponSchema;

export const updateCouponSchema = couponSchema.partial().extend({
  id: cuid,
});

export const applyCouponSchema = z.object({
  code: z.string().max(50),
});

// ---------------------------------------------------------------------------
// Banner Schemas
// ---------------------------------------------------------------------------

export const bannerSchema = z.object({
  title: safeText(200),
  image: z.string().url().max(2048),
  mobileImage: z.string().url().max(2048).optional().nullable(),
  link: z.string().url().max(2048).optional().nullable(),
  ctaText: safeText(100).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

export const createBannerSchema = bannerSchema;

export const updateBannerSchema = bannerSchema.partial().extend({
  id: cuid,
});

// ---------------------------------------------------------------------------
// Collection Schemas
// ---------------------------------------------------------------------------

export const collectionSchema = z.object({
  name: safeText(100),
  slug,
  description: safeText(500).optional().nullable(),
  image: z.string().url().max(2048).optional().nullable(),
  productIds: z.array(cuid).max(200).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const createCollectionSchema = collectionSchema;

export const updateCollectionSchema = collectionSchema.partial().extend({
  id: cuid,
});

// ---------------------------------------------------------------------------
// Newsletter Schemas
// ---------------------------------------------------------------------------

export const newsletterSubscribeSchema = z.object({
  email,
});

// ---------------------------------------------------------------------------
// SiteContent Schemas
// ---------------------------------------------------------------------------

export const updateSiteContentSchema = z.object({
  key: safeText(100),
  value: z.any(),
});

// ---------------------------------------------------------------------------
// Search & Filter Schemas
// ---------------------------------------------------------------------------

export const productSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  categorySlug: slug.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sizes: z.array(z.string().max(20)).max(20).optional(),
  colors: z.array(z.string().max(50)).max(20).optional(),
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  sortBy: z
    .enum(["newest", "price_asc", "price_desc", "best_selling", "top_rated"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const orderSearchSchema = z.object({
  status: orderStatusSchema.optional(),
  userId: cuid.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  query: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------------------------------------------------------------------------
// Shipping Rate Schemas
// ---------------------------------------------------------------------------

export const shippingRateRequestSchema = z.object({
  pincode,
  items: z.array(
    z.object({
      variantId: cuid,
      quantity: z.number().int().min(1).max(10),
    })
  ).min(1).max(20),
});

// ---------------------------------------------------------------------------
// Razorpay Webhook Schema (raw body validation)
// ---------------------------------------------------------------------------

export const razorpayWebhookEventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z
      .object({
        entity: z.record(z.unknown()),
      })
      .optional(),
    order: z
      .object({
        entity: z.record(z.unknown()),
      })
      .optional(),
    refund: z
      .object({
        entity: z.record(z.unknown()),
      })
      .optional(),
  }),
});

// ---------------------------------------------------------------------------
// QikInk Webhook Schema
// ---------------------------------------------------------------------------

export const qikinkWebhookSchema = z.object({
  event: z.enum([
    "order.shipped",
    "order.delivered",
    "order.in_production",
    "order.failed",
    "order.cancelled",
    "product.updated"
  ]),
  payload: z.record(z.unknown()),
});

// ---------------------------------------------------------------------------
// Auth Schemas (for registration / login flows)
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
  name: safeText(100),
  phone: phoneNumber.optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const resetPasswordSchema = z.object({
  email,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
});

// ---------------------------------------------------------------------------
// Contact Form Schema
// ---------------------------------------------------------------------------

export const contactFormSchema = z.object({
  name: safeText(100),
  email,
  subject: safeText(200),
  message: safeText(2000),
});

// ---------------------------------------------------------------------------
// Blog Schemas (Admin CMS)
// ---------------------------------------------------------------------------

export const blogPostSchema = z.object({
  title: safeText(200),
  slug,
  content: z.string().min(1).max(50000),
  excerpt: safeText(300).optional().nullable(),
  coverImage: z.string().url().max(2048).optional().nullable(),
  isPublished: z.boolean().default(false),
  metaTitle: safeText(70).optional().nullable(),
  metaDescription: safeText(160).optional().nullable(),
});

export const createBlogPostSchema = blogPostSchema;

export const updateBlogPostSchema = blogPostSchema.partial().extend({
  id: cuid,
});

// ---------------------------------------------------------------------------
// Pincode Serviceability Schema
// ---------------------------------------------------------------------------

export const pincodeCheckSchema = z.object({
  pincode,
});
