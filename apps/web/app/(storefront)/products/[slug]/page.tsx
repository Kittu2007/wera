// =============================================================================
// WERA — Product Detail Page (PDP)
// Section 6.3: Gallery, size selector, variants, accordions, reviews,
// related products, JSON-LD, OG metadata
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Heart, Share2, Minus, Plus, ChevronDown, ChevronUp,
  Star, Check, AlertTriangle, Truck, RotateCcw, Shield,
  Copy, MessageCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { useCartStore } from "@/lib/cart-store";
import { ProductCard, ProductCardSkeleton } from "@/components/storefront/ProductCard";

// ---------------------------------------------------------------------------
// Accordion component (no dependencies needed)
// ---------------------------------------------------------------------------

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#222]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="font-heading text-h4 uppercase tracking-tight
                        group-hover:text-brand-yellow transition-colors">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#666]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#666]" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 text-body text-[#ccc] leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDP Page
// ---------------------------------------------------------------------------

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  // Fetch product data
  const { data: product, isLoading } = trpc.products.bySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState<{ serviceable: boolean } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Computed values
  const uniqueColors = useMemo(() => {
    if (!product) return [];
    const map = new Map<string, { color: string; colorHex: string | null }>();
    product.variants.forEach((v) => {
      if (!map.has(v.color)) map.set(v.color, { color: v.color, colorHex: v.colorHex });
    });
    return Array.from(map.values());
  }, [product]);

  const uniqueSizes = useMemo(() => {
    if (!product || !selectedColor) return [];
    return [...new Set(
      product.variants
        .filter((v) => v.color === selectedColor)
        .map((v) => v.size)
    )];
  }, [product, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedSize || !selectedColor) return null;
    return product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    ) ?? null;
  }, [product, selectedSize, selectedColor]);

  // Auto-select first color
  useMemo(() => {
    if (uniqueColors.length > 0 && !selectedColor) {
      setSelectedColor(uniqueColors[0]!.color);
    }
  }, [uniqueColors, selectedColor]);

  // Related products
  const { data: relatedProducts } = trpc.products.related.useQuery(
    {
      productId: product?.id ?? "",
      categoryId: product?.categoryId ?? "",
      limit: 8,
    },
    { enabled: !!product?.id && !!product?.categoryId }
  );

  // Pincode check
  const pincodeQuery = trpc.products.checkPincode.useQuery(
    { pincode },
    { enabled: pincode.length === 6 }
  );

  // Handlers
  const handleAddToCart = () => {
    if (!selectedVariant || !product) return;

    const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      size: selectedVariant.size,
      color: selectedVariant.color,
      colorHex: selectedVariant.colorHex,
      price: String(selectedVariant.price),
      comparePrice: selectedVariant.comparePrice
        ? String(selectedVariant.comparePrice)
        : null,
      quantity,
      maxStock: selectedVariant.stock,
      imageUrl: primaryImage?.url ?? "",
      imageAlt: primaryImage?.altText ?? null,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Navigate to checkout
    window.location.href = "/checkout";
  };

  const handleShare = (platform: "whatsapp" | "copy") => {
    const url = window.location.href;
    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this: ${product?.title} — ${url}`)}`, "_blank");
    } else {
      navigator.clipboard.writeText(url);
    }
    setShareOpen(false);
  };

  // =========================================================================
  // Loading skeleton
  // =========================================================================
  if (isLoading || !product) {
    return (
      <div className="container section">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-[3/4] skeleton" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-24 skeleton" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-4 w-24 skeleton" />
            <div className="h-10 w-3/4 skeleton" />
            <div className="h-6 w-32 skeleton" />
            <div className="h-[200px] skeleton" />
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = product.images[selectedImageIndex] ?? product.images[0];
  const isOutOfStock = product.variants.every((v) => v.stock === 0);

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.description,
            image: product.images.map((img) => img.url),
            brand: { "@type": "Brand", name: "WERA" },
            offers: product.variants.map((v) => ({
              "@type": "Offer",
              price: String(v.price),
              priceCurrency: "INR",
              availability: v.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            })),
            aggregateRating: product.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: product.avgRating,
                  reviewCount: product.reviewCount,
                }
              : undefined,
          }),
        }}
      />

      <div className="container section">
        {/* Breadcrumb */}
        <nav className="mb-8 text-body-sm" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[#666]">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-white transition-colors">Products</Link></li>
            <li>/</li>
            {product.category && (
              <>
                <li>
                  <Link
                    href={`/category/${product.category.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {product.category.name}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-white truncate">{product.title}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* ============================================================
              LEFT COLUMN — Image Gallery
              ============================================================ */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-[#1a1a1a] overflow-hidden mb-4">
              {primaryImage && (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`relative w-20 h-24 flex-shrink-0 transition-all
                             ${i === selectedImageIndex
                               ? "border-2 border-brand-yellow"
                               : "border border-[#333] hover:border-[#555]"
                             }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? `${product.title} view ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ============================================================
              RIGHT COLUMN — Product Info
              ============================================================ */}
          <div>
            {/* Category */}
            {product.category && (
              <Link
                href={`/category/${product.category.slug}`}
                className="text-label text-[#666] uppercase hover:text-brand-yellow transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="font-heading text-h1 md:text-display-xl uppercase tracking-tight mt-2 mb-4">
              {product.title}
            </h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(product.avgRating)
                          ? "text-brand-yellow fill-brand-yellow"
                          : "text-[#333]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-body-sm text-[#666]">
                  {product.avgRating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-4 mb-8">
              <span className="font-heading text-h1 text-brand-yellow">
                ₹{selectedVariant
                  ? String(selectedVariant.price)
                  : String(product.variants[0]?.price ?? "0")}
              </span>
              {selectedVariant?.comparePrice && (
                <>
                  <span className="text-h3 text-[#666] line-through">
                    ₹{String(selectedVariant.comparePrice)}
                  </span>
                  <span className="badge bg-red-600 text-white">
                    {Math.round(
                      (1 - Number(selectedVariant.price) / Number(selectedVariant.comparePrice)) * 100
                    )}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
              <div className="mb-6">
                <label className="font-heading text-label uppercase text-[#999] mb-3 block">
                  Color: <span className="text-white">{selectedColor}</span>
                </label>
                <div className="flex gap-3">
                  {uniqueColors.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => {
                        setSelectedColor(c.color);
                        setSelectedSize(null);
                      }}
                      className={`w-10 h-10 border-2 transition-all relative
                                 ${selectedColor === c.color
                                   ? "border-brand-yellow scale-110"
                                   : "border-[#333] hover:border-[#555]"
                                 }`}
                      style={{ backgroundColor: c.colorHex ?? "#333" }}
                      aria-label={c.color}
                      aria-pressed={selectedColor === c.color}
                      title={c.color}
                    >
                      {selectedColor === c.color && (
                        <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2
                                         -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector — per-size stock validation */}
            {uniqueSizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-heading text-label uppercase text-[#999]">
                    Size: <span className="text-white">{selectedSize ?? "Select"}</span>
                  </label>
                  <button className="text-caption text-brand-yellow hover:underline">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => {
                    const variant = product.variants.find(
                      (v) => v.size === size && v.color === selectedColor
                    );
                    const inStock = variant ? variant.stock > 0 : false;

                    return (
                      <button
                        key={size}
                        onClick={() => inStock && setSelectedSize(size)}
                        disabled={!inStock}
                        className={`min-w-[52px] px-4 py-3 border font-heading text-xs uppercase
                                   transition-colors ${
                                     selectedSize === size
                                       ? "border-brand-yellow bg-brand-yellow text-brand-black"
                                       : inStock
                                         ? "border-[#333] text-white hover:border-brand-yellow"
                                         : "border-[#222] text-[#555] line-through cursor-not-allowed"
                                   }`}
                        aria-pressed={selectedSize === size}
                        aria-disabled={!inStock}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scarcity indicator */}
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
              <div className="flex items-center gap-2 text-orange-400 mb-6">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-body-sm font-bold">
                  Only {selectedVariant.stock} left in stock!
                </span>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <label className="font-heading text-label uppercase text-[#999] mb-3 block">
                Quantity
              </label>
              <div className="flex items-center border border-[#333] w-fit">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-[#222] disabled:opacity-30 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 text-body font-bold min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(selectedVariant?.stock ?? 10, q + 1))
                  }
                  disabled={quantity >= (selectedVariant?.stock ?? 10)}
                  className="p-3 hover:bg-[#222] disabled:opacity-30 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || isOutOfStock}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isOutOfStock ? "Sold Out" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!selectedVariant || isOutOfStock}
                className="btn-ghost flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Wishlist + Share */}
            <div className="flex gap-4 mb-8">
              <button className="flex items-center gap-2 text-body-sm text-[#999]
                               hover:text-brand-yellow transition-colors">
                <Heart className="w-4 h-4" /> Add to Wishlist
              </button>
              <div className="relative">
                <button
                  onClick={() => setShareOpen(!shareOpen)}
                  className="flex items-center gap-2 text-body-sm text-[#999]
                             hover:text-brand-yellow transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                {shareOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-[#333]
                                 py-2 w-48 z-20 animate-fade-in">
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                                 text-[#999] hover:text-white hover:bg-[#222] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare("copy")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                                 text-[#999] hover:text-white hover:bg-[#222] transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pincode Check */}
            <div className="border border-[#222] p-5 mb-8">
              <label className="font-heading text-label uppercase text-[#999] mb-3 block">
                Check Delivery
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setPincode(value);
                    setPincodeResult(null);
                  }}
                  className="flex-1 bg-transparent border border-[#333] px-4 py-2.5
                             text-body-sm text-white placeholder:text-[#555]
                             focus:outline-none focus:border-brand-yellow"
                  aria-label="Pincode for delivery check"
                />
                <button
                  onClick={() => {
                    if (pincodeQuery.data) setPincodeResult(pincodeQuery.data);
                  }}
                  disabled={pincode.length !== 6}
                  className="px-6 py-2.5 bg-[#222] text-white font-heading text-xs uppercase
                             hover:bg-[#333] transition-colors disabled:opacity-30"
                >
                  Check
                </button>
              </div>
              {pincodeResult && (
                <p className={`text-body-sm mt-3 ${
                  pincodeResult.serviceable ? "text-green-400" : "text-red-400"
                }`}>
                  {pincodeResult.serviceable
                    ? "✓ Delivery available to this pincode"
                    : "✗ Sorry, delivery not available to this pincode"}
                </p>
              )}
            </div>

            {/* Trust badges inline */}
            <div className="grid grid-cols-3 gap-4 mb-8 py-6 border-y border-[#222]">
              {[
                { icon: Truck, text: "Free Delivery\nabove ₹999" },
                { icon: RotateCcw, text: "7-Day Easy\nReturns" },
                { icon: Shield, text: "Secure\nCheckout" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <item.icon className="w-5 h-5 text-brand-yellow" />
                  <span className="text-caption text-[#999] whitespace-pre-line">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Description Accordion */}
            <Accordion title="Description" defaultOpen>
              <p>{product.description}</p>
            </Accordion>

            {/* Materials & Care */}
            <Accordion title="Materials & Care">
              <ul className="space-y-2 text-[#999]">
                <li>• 100% Premium Cotton (220 GSM)</li>
                <li>• DTG (Direct-to-Garment) printed</li>
                <li>• Machine wash cold, inside out</li>
                <li>• Do not bleach or iron on print</li>
                <li>• Tumble dry low</li>
              </ul>
            </Accordion>

            {/* Shipping & Returns */}
            <Accordion title="Shipping & Returns">
              <ul className="space-y-2 text-[#999]">
                <li>• Free shipping on orders above ₹999</li>
                <li>• Standard delivery: 5-7 business days</li>
                <li>• Express delivery: 2-3 business days</li>
                <li>• Easy 7-day return policy</li>
                <li>• Made to order — please allow 1-2 days for production</li>
              </ul>
            </Accordion>
          </div>
        </div>

        {/* ============================================================
            CUSTOMER REVIEWS
            ============================================================ */}
        {product.reviews && product.reviews.length > 0 && (
          <section className="mt-20 pt-16 border-t border-[#222]" aria-labelledby="reviews-heading">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="badge mb-4 inline-block">Reviews</span>
                <h2
                  id="reviews-heading"
                  className="font-heading text-display-xl uppercase tracking-tight"
                >
                  Customer Reviews
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(product.avgRating)
                          ? "text-brand-yellow fill-brand-yellow"
                          : "text-[#333]"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-heading text-h3 text-brand-yellow">
                  {product.avgRating.toFixed(1)}
                </span>
                <span className="text-body-sm text-[#666]">
                  ({product.reviewCount})
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-[#222] p-6 hover:border-brand-yellow/30
                             transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? "text-brand-yellow fill-brand-yellow"
                              : "text-[#333]"
                          }`}
                        />
                      ))}
                    </div>
                    {review.verified && (
                      <span className="badge text-[8px] py-0.5">Verified</span>
                    )}
                  </div>

                  {review.title && (
                    <h4 className="font-heading text-sm uppercase tracking-tight text-white mb-2">
                      {review.title}
                    </h4>
                  )}

                  <p className="text-body-sm text-[#ccc] mb-4">{review.body}</p>

                  <div className="flex items-center justify-between">
                    <p className="text-caption text-[#666]">
                      {review.user.name} •{" "}
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================
            RELATED PRODUCTS
            ============================================================ */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-20 pt-16 border-t border-[#222]" aria-labelledby="related-heading">
            <div className="mb-12">
              <span className="badge mb-4 inline-block">You May Also Like</span>
              <h2
                id="related-heading"
                className="font-heading text-display-xl uppercase tracking-tight"
              >
                Related Products
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
