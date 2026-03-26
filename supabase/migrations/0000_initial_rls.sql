-- =============================================================================
-- WERA — Row Level Security Policies
-- Section 9.2 (PRD v2.0) + Comprehensive coverage for all tables
-- =============================================================================
-- IMPORTANT: Run this AFTER Prisma migrations have created all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: Reusable function to check if the current Supabase user is ADMIN
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User"
    WHERE "supabaseId" = auth.uid()::text
    AND "role" = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper: Get the internal User.id for the current Supabase user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT "id" FROM "User"
  WHERE "supabaseId" = auth.uid()::text
  LIMIT 1;
$$;


-- =============================================================================
-- TABLE: "User"
-- Users can read/update only their own row. Admins can read all.
-- =============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON "User"
  FOR SELECT
  USING (
    auth.uid()::text = "supabaseId"
    OR public.is_admin()
  );

CREATE POLICY "users_update_own" ON "User"
  FOR UPDATE
  USING (auth.uid()::text = "supabaseId")
  WITH CHECK (auth.uid()::text = "supabaseId");

-- Insert is handled server-side (service role) during registration.
-- Delete is not permitted via RLS.


-- =============================================================================
-- TABLE: "Product"
-- Public read for ACTIVE products. Admin full access.
-- =============================================================================
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read" ON "Product"
  FOR SELECT
  USING ("status" = 'ACTIVE' OR public.is_admin());

CREATE POLICY "products_admin_insert" ON "Product"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_update" ON "Product"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_delete" ON "Product"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "ProductVariant"
-- Public read (via product). Admin full access.
-- =============================================================================
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variants_public_read" ON "ProductVariant"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Product"
      WHERE "Product"."id" = "ProductVariant"."productId"
      AND ("Product"."status" = 'ACTIVE' OR public.is_admin())
    )
  );

CREATE POLICY "variants_admin_insert" ON "ProductVariant"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "variants_admin_update" ON "ProductVariant"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "variants_admin_delete" ON "ProductVariant"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "ProductImage"
-- Public read (via product). Admin full access.
-- =============================================================================
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "images_public_read" ON "ProductImage"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Product"
      WHERE "Product"."id" = "ProductImage"."productId"
      AND ("Product"."status" = 'ACTIVE' OR public.is_admin())
    )
  );

CREATE POLICY "images_admin_insert" ON "ProductImage"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "images_admin_update" ON "ProductImage"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "images_admin_delete" ON "ProductImage"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "Category"
-- Public read. Admin full access.
-- =============================================================================
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON "Category"
  FOR SELECT
  USING (true);

CREATE POLICY "categories_admin_insert" ON "Category"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_update" ON "Category"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_delete" ON "Category"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "Order"
-- Owners see their own orders. Admins see all.
-- =============================================================================
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own_or_admin" ON "Order"
  FOR SELECT
  USING (
    "userId" = public.current_user_id()
    OR public.is_admin()
  );

-- Orders are created server-side (after Razorpay verification).
-- No direct client INSERT/UPDATE/DELETE via RLS.
CREATE POLICY "orders_admin_update" ON "Order"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "orders_admin_insert" ON "Order"
  FOR INSERT
  WITH CHECK (public.is_admin());


-- =============================================================================
-- TABLE: "OrderItem"
-- Visible to order owner or admin.
-- =============================================================================
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select" ON "OrderItem"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order"."id" = "OrderItem"."orderId"
      AND (
        "Order"."userId" = public.current_user_id()
        OR public.is_admin()
      )
    )
  );

CREATE POLICY "order_items_admin_insert" ON "OrderItem"
  FOR INSERT
  WITH CHECK (public.is_admin());


-- =============================================================================
-- TABLE: "Address"
-- Users manage their own addresses. Admins can read all.
-- =============================================================================
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_select_own_or_admin" ON "Address"
  FOR SELECT
  USING (
    "userId" = public.current_user_id()
    OR public.is_admin()
  );

CREATE POLICY "addresses_insert_own" ON "Address"
  FOR INSERT
  WITH CHECK (
    "userId" = public.current_user_id()
  );

CREATE POLICY "addresses_update_own" ON "Address"
  FOR UPDATE
  USING ("userId" = public.current_user_id())
  WITH CHECK ("userId" = public.current_user_id());

CREATE POLICY "addresses_delete_own" ON "Address"
  FOR DELETE
  USING ("userId" = public.current_user_id());


-- =============================================================================
-- TABLE: "Review"
-- Public read (approved only). Own write. Admin full access.
-- =============================================================================
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON "Review"
  FOR SELECT
  USING (
    "approved" = true
    OR "userId" = public.current_user_id()
    OR public.is_admin()
  );

CREATE POLICY "reviews_own_insert" ON "Review"
  FOR INSERT
  WITH CHECK (
    "userId" = public.current_user_id()
  );

CREATE POLICY "reviews_own_update" ON "Review"
  FOR UPDATE
  USING ("userId" = public.current_user_id())
  WITH CHECK ("userId" = public.current_user_id());

CREATE POLICY "reviews_admin_update" ON "Review"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "reviews_admin_delete" ON "Review"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "WishlistItem"
-- Users manage their own wishlist only.
-- =============================================================================
ALTER TABLE "WishlistItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_select_own" ON "WishlistItem"
  FOR SELECT
  USING ("userId" = public.current_user_id());

CREATE POLICY "wishlist_insert_own" ON "WishlistItem"
  FOR INSERT
  WITH CHECK ("userId" = public.current_user_id());

CREATE POLICY "wishlist_delete_own" ON "WishlistItem"
  FOR DELETE
  USING ("userId" = public.current_user_id());


-- =============================================================================
-- TABLE: "Coupon"
-- Public read (active coupons for validation). Admin full access.
-- =============================================================================
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_public_read" ON "Coupon"
  FOR SELECT
  USING (
    ("isActive" = true AND ("expiresAt" IS NULL OR "expiresAt" > now()))
    OR public.is_admin()
  );

CREATE POLICY "coupons_admin_insert" ON "Coupon"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "coupons_admin_update" ON "Coupon"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "coupons_admin_delete" ON "Coupon"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "Banner"
-- Public read (active banners). Admin full access.
-- =============================================================================
ALTER TABLE "Banner" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners_public_read" ON "Banner"
  FOR SELECT
  USING (
    (
      "isActive" = true
      AND ("startsAt" IS NULL OR "startsAt" <= now())
      AND ("endsAt" IS NULL OR "endsAt" > now())
    )
    OR public.is_admin()
  );

CREATE POLICY "banners_admin_insert" ON "Banner"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "banners_admin_update" ON "Banner"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "banners_admin_delete" ON "Banner"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "Collection"
-- Public read (active). Admin full access.
-- =============================================================================
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_public_read" ON "Collection"
  FOR SELECT
  USING ("isActive" = true OR public.is_admin());

CREATE POLICY "collections_admin_insert" ON "Collection"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "collections_admin_update" ON "Collection"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "collections_admin_delete" ON "Collection"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "NewsletterSubscriber"
-- Public insert (anyone can subscribe). Admin read.
-- =============================================================================
ALTER TABLE "NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_public_insert" ON "NewsletterSubscriber"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "newsletter_admin_read" ON "NewsletterSubscriber"
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "newsletter_admin_delete" ON "NewsletterSubscriber"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- TABLE: "SiteContent"
-- Public read. Admin full access.
-- =============================================================================
ALTER TABLE "SiteContent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content_public_read" ON "SiteContent"
  FOR SELECT
  USING (true);

CREATE POLICY "site_content_admin_insert" ON "SiteContent"
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "site_content_admin_update" ON "SiteContent"
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "site_content_admin_delete" ON "SiteContent"
  FOR DELETE
  USING (public.is_admin());


-- =============================================================================
-- Supabase Storage Policies (product-images bucket)
-- =============================================================================
-- NOTE: These are applied via Supabase Dashboard or supabase CLI storage policies.
-- Included here as reference SQL for documentation.
--
-- INSERT (upload):  Only admins can upload product images
-- SELECT (download): Public access (all product images are public)
-- DELETE:           Only admins can delete images
--
-- Example (run in Supabase SQL editor after creating the bucket):
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
--
-- CREATE POLICY "product_images_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'product-images');
--
-- CREATE POLICY "product_images_admin_upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
--
-- CREATE POLICY "product_images_admin_delete" ON storage.objects
--   FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());
