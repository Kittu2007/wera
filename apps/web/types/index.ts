// =============================================================================
// WERA — TypeScript Types
// Inferred from Zod schemas + Prisma payload types
// =============================================================================

import type { z } from "zod";
import type { Prisma } from "@prisma/client";

import type {
  // Enums
  roleSchema,
  orderStatusSchema,
  productStatusSchema,
  couponTypeSchema,
  // User
  userSchema,
  userProfileSchema,
  updateUserProfileSchema,
  // Address
  addressSchema,
  createAddressSchema,
  updateAddressSchema,
  // Category
  categorySchema,
  createCategorySchema,
  updateCategorySchema,
  // Product
  productSchema,
  createProductSchema,
  updateProductSchema,
  productVariantSchema,
  productImageSchema,
  // Order
  createOrderSchema,
  orderItemInputSchema,
  updateOrderStatusSchema,
  // Payment
  verifyPaymentSchema,
  // Review
  createReviewSchema,
  moderateReviewSchema,
  // Wishlist
  toggleWishlistSchema,
  // Coupon
  couponSchema,
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
  // Banner
  bannerSchema,
  createBannerSchema,
  updateBannerSchema,
  // Collection
  collectionSchema,
  createCollectionSchema,
  updateCollectionSchema,
  // Newsletter
  newsletterSubscribeSchema,
  // SiteContent
  updateSiteContentSchema,
  // Search & Filter
  productSearchSchema,
  orderSearchSchema,
  // Shipping
  shippingRateRequestSchema,
  // Webhooks
  razorpayWebhookEventSchema,
  merchFactoryWebhookSchema,
  // Auth
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  // Contact
  contactFormSchema,
  // Blog
  blogPostSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  // Pincode
  pincodeCheckSchema,
} from "../lib/validations";

// ---------------------------------------------------------------------------
// Zod-Inferred Types (Runtime-validated input shapes)
// ---------------------------------------------------------------------------

// Enums
export type Role = z.infer<typeof roleSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type CouponType = z.infer<typeof couponTypeSchema>;

// User
export type UserInput = z.infer<typeof userSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

// Address
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

// Category
export type CategoryInput = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Product
export type ProductInput = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;

// Order
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// Payment
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// Review
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

// Wishlist
export type ToggleWishlistInput = z.infer<typeof toggleWishlistSchema>;

// Coupon
export type CouponInput = z.infer<typeof couponSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

// Banner
export type BannerInput = z.infer<typeof bannerSchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

// Collection
export type CollectionInput = z.infer<typeof collectionSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

// Newsletter
export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

// SiteContent
export type UpdateSiteContentInput = z.infer<typeof updateSiteContentSchema>;

// Search & Filter
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type OrderSearchInput = z.infer<typeof orderSearchSchema>;

// Shipping
export type ShippingRateRequestInput = z.infer<typeof shippingRateRequestSchema>;

// Webhooks
export type RazorpayWebhookEvent = z.infer<typeof razorpayWebhookEventSchema>;
export type MerchFactoryWebhookEvent = z.infer<typeof merchFactoryWebhookSchema>;

// Auth
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

// Contact
export type ContactFormInput = z.infer<typeof contactFormSchema>;

// Blog
export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

// Pincode
export type PincodeCheckInput = z.infer<typeof pincodeCheckSchema>;

// ---------------------------------------------------------------------------
// Prisma Payload Types (Full DB record shapes with relations)
// ---------------------------------------------------------------------------

/** Full User with all relations */
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    orders: true;
    reviews: true;
    wishlist: true;
    addresses: true;
  };
}>;

/** User for display (no sensitive relations) */
export type UserSummary = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    phone: true;
    avatarUrl: true;
    role: true;
    createdAt: true;
  };
}>;

/** Product with all relations (PDP) */
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
    images: true;
    reviews: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            avatarUrl: true;
          };
        };
      };
    };
  };
}>;

/** Product card (PLP — lightweight) */
export type ProductCard = Prisma.ProductGetPayload<{
  select: {
    id: true;
    slug: true;
    title: true;
    avgRating: true;
    reviewCount: true;
    salesCount: true;
    isFeatured: true;
    isNewArrival: true;
    status: true;
    variants: {
      select: {
        id: true;
        price: true;
        comparePrice: true;
        size: true;
        color: true;
        colorHex: true;
        stock: true;
      };
    };
    images: {
      select: {
        url: true;
        altText: true;
        isPrimary: true;
        sortOrder: true;
      };
    };
    category: {
      select: {
        name: true;
        slug: true;
      };
    };
  };
}>;

/** Product for admin table listing */
export type ProductAdminRow = Prisma.ProductGetPayload<{
  select: {
    id: true;
    title: true;
    slug: true;
    status: true;
    categoryId: true;
    salesCount: true;
    isFeatured: true;
    createdAt: true;
    updatedAt: true;
    _count: {
      select: {
        variants: true;
        reviews: true;
      };
    };
  };
}>;

/** Category with children and product count */
export type CategoryWithChildren = Prisma.CategoryGetPayload<{
  include: {
    children: true;
    _count: {
      select: {
        products: true;
      };
    };
  };
}>;

/** Order with all relations (order detail page) */
export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
      };
    };
    items: {
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true;
                title: true;
                slug: true;
                images: {
                  where: { isPrimary: true };
                  take: 1;
                };
              };
            };
          };
        };
      };
    };
    shippingAddress: true;
    coupon: true;
  };
}>;

/** Order summary for list views */
export type OrderSummary = Prisma.OrderGetPayload<{
  select: {
    id: true;
    orderNumber: true;
    status: true;
    total: true;
    createdAt: true;
    _count: {
      select: {
        items: true;
      };
    };
  };
}>;

/** Review with user info */
export type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
    product: {
      select: {
        id: true;
        title: true;
        slug: true;
      };
    };
  };
}>;

/** Coupon for admin management */
export type CouponWithUsage = Prisma.CouponGetPayload<{
  include: {
    _count: {
      select: {
        orders: true;
      };
    };
  };
}>;

/** Banner (full record) */
export type BannerRecord = Prisma.BannerGetPayload<{}>;

/** Collection (full record) */
export type CollectionRecord = Prisma.CollectionGetPayload<{}>;

/** Newsletter subscriber */
export type NewsletterSubscriberRecord =
  Prisma.NewsletterSubscriberGetPayload<{}>;

/** Site content entry */
export type SiteContentRecord = Prisma.SiteContentGetPayload<{}>;

/** Address record */
export type AddressRecord = Prisma.AddressGetPayload<{}>;

/** Wishlist item with product data for the wishlist page */
export type WishlistItemWithProduct = Prisma.WishlistItemGetPayload<{
  include: {
    // Note: WishlistItem doesn't have a product relation in schema,
    // so we manually type this for the API layer to join.
  };
}> & {
  product?: ProductCard;
};

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Standard API success response */
export interface ApiSuccessResponse<T = void> {
  success: true;
  data: T;
  message?: string;
}

/** Standard API error response */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/** Unified API response */
export type ApiResponse<T = void> = ApiSuccessResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Cart Types (client-side state + server validation)
// ---------------------------------------------------------------------------

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  slug: string;
  size: string;
  color: string;
  colorHex: string | null;
  price: string; // Decimal as string
  comparePrice: string | null;
  quantity: number;
  maxStock: number;
  imageUrl: string;
  imageAlt: string | null;
}

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
}

export interface CartSummary {
  subtotal: string;
  discount: string;
  shipping: string;
  gst: string;
  total: string;
  itemCount: number;
  freeShippingThreshold: string | null;
  freeShippingProgress: number; // 0 to 1
}

// ---------------------------------------------------------------------------
// Shipping Types
// ---------------------------------------------------------------------------

export interface ShippingRate {
  id: string;
  name: string; // e.g., "Standard", "Express"
  estimatedDays: string; // e.g., "5-7 business days"
  price: string; // Decimal as string
}

export interface ShippingRateResponse {
  rates: ShippingRate[];
  serviceable: boolean;
}

// ---------------------------------------------------------------------------
// Dashboard Analytics Types (Admin)
// ---------------------------------------------------------------------------

export interface DashboardKPIs {
  totalRevenue: string;
  totalOrders: number;
  averageOrderValue: string;
  newCustomers: number;
  returningCustomers: number;
  pendingFulfillment: number;
  lowStockCount: number;
}

export interface RevenueDataPoint {
  date: string; // ISO date string
  revenue: string;
  orders: number;
}

export interface TopProduct {
  productId: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  totalRevenue: string;
  totalUnits: number;
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}

// ---------------------------------------------------------------------------
// Merch Factory Types
// ---------------------------------------------------------------------------

export interface MerchFactoryProduct {
  id: string;
  name: string;
  description: string;
  variants: MerchFactoryVariant[];
  images: string[];
  updatedAt: string;
}

export interface MerchFactoryVariant {
  id: string;
  size: string;
  color: string;
  price: number;
  sku: string;
  inStock: boolean;
}

export interface MerchFactoryOrderPayload {
  externalOrderId: string;
  items: {
    variantId: string;
    quantity: number;
    designUrl?: string;
  }[];
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
  };
}

export interface MerchFactoryOrderResponse {
  orderId: string;
  status: string;
  estimatedDelivery?: string;
}

// ---------------------------------------------------------------------------
// Razorpay Types
// ---------------------------------------------------------------------------

export interface RazorpayOrderCreateParams {
  amount: number; // in paise
  currency: "INR";
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPaymentSuccessData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
