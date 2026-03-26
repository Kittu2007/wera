// =============================================================================
// WERA — Product Card Component
// Concept 2: Yellow badge on black card, image dominant, scale 1.03 hover
// =============================================================================

"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  avgRating: number;
  reviewCount: number;
  salesCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  variants: {
    id: string;
    price: any;
    comparePrice: any;
    size: string;
    color: string;
    colorHex: string | null;
    stock: number;
  }[];
  images: {
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
  category: {
    name: string;
    slug: string;
  } | null;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
}

export function ProductCard({
  id,
  slug,
  title,
  avgRating,
  reviewCount,
  salesCount,
  isFeatured,
  isNewArrival,
  variants,
  images,
  category,
  onWishlistToggle,
  isWishlisted = false,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  // Get primary image or first image
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];
  const secondaryImage = images.find((img) => !img.isPrimary && img !== primaryImage);

  // Price range
  const prices = variants.map((v) => parseFloat(String(v.price)));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasComparePrice = variants.some((v) => v.comparePrice);
  const comparePrice = hasComparePrice
    ? Math.max(...variants.filter((v) => v.comparePrice).map((v) => parseFloat(String(v.comparePrice))))
    : null;

  // Stock status
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const isOutOfStock = totalStock === 0;

  // Badge logic
  const badge = isOutOfStock
    ? "OUT OF STOCK"
    : isNewArrival
      ? "NEW"
      : comparePrice && comparePrice > maxPrice
        ? "SALE"
        : salesCount > 50
          ? "BESTSELLER"
          : isFeatured
            ? "LIMITED"
            : null;

  // Quick add (first available variant)
  const firstAvailableVariant = variants.find((v) => v.stock > 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstAvailableVariant || !primaryImage) return;

    addItem({
      variantId: firstAvailableVariant.id,
      productId: id,
      title,
      slug,
      size: firstAvailableVariant.size,
      color: firstAvailableVariant.color,
      colorHex: firstAvailableVariant.colorHex,
      price: String(firstAvailableVariant.price),
      comparePrice: firstAvailableVariant.comparePrice
        ? String(firstAvailableVariant.comparePrice)
        : null,
      quantity: 1,
      maxStock: firstAvailableVariant.stock,
      imageUrl: primaryImage.url,
      imageAlt: primaryImage.altText,
    });
  };

  return (
    <Link
      href={`/products/${slug}`}
      className="product-card group block relative"
      aria-label={`View ${title}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
        {primaryImage && (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText ?? title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-500 ${
              secondaryImage ? "group-hover:opacity-0" : ""
            }`}
          />
        )}

        {/* Second image on hover */}
        {secondaryImage && (
          <Image
            src={secondaryImage.url}
            alt={secondaryImage.altText ?? `${title} alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`badge ${
                badge === "OUT OF STOCK"
                  ? "bg-[#333] text-[#999]"
                  : badge === "SALE"
                    ? "bg-red-600 text-white"
                    : ""
              }`}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Wishlist button */}
        {onWishlistToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle(id);
            }}
            className="absolute top-3 right-3 z-10 p-2 bg-brand-black/60 backdrop-blur-sm
                       transition-colors hover:bg-brand-yellow group/wish"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted
                  ? "fill-brand-yellow text-brand-yellow"
                  : "text-white group-hover/wish:text-brand-black"
              }`}
            />
          </button>
        )}

        {/* Quick Add overlay */}
        {!isOutOfStock && firstAvailableVariant && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full
                          group-hover:translate-y-0 transition-transform duration-300 z-10">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-brand-yellow text-brand-black py-3
                         font-heading uppercase text-xs tracking-widest font-bold
                         hover:bg-white transition-colors"
              aria-label={`Quick add ${title} to cart`}
            >
              Quick Add
            </button>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-brand-black/60 flex items-center justify-center">
            <span className="font-heading text-lg uppercase tracking-wider text-[#666]">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Category */}
        {category && (
          <p className="text-label text-[#666] uppercase">{category.name}</p>
        )}

        {/* Title */}
        <h3 className="font-heading text-h4 uppercase tracking-tight text-white
                       line-clamp-2 group-hover:text-brand-yellow transition-colors">
          {title}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg text-brand-yellow">
            {minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} — ₹${maxPrice}`}
          </span>
          {comparePrice && comparePrice > maxPrice && (
            <span className="text-body-sm text-[#666] line-through">
              ₹{comparePrice}
            </span>
          )}
        </div>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex" aria-label={`${avgRating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(avgRating)
                      ? "text-brand-yellow"
                      : "text-[#333]"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-caption text-[#666]">({reviewCount})</span>
          </div>
        )}

        {/* Color swatches preview */}
        {variants.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {[...new Map(variants.map((v) => [v.color, v])).values()]
              .slice(0, 5)
              .map((variant) => (
                <div
                  key={variant.color}
                  className="w-4 h-4 border border-[#333]"
                  style={{
                    backgroundColor: variant.colorHex ?? "#333",
                  }}
                  title={variant.color}
                />
              ))}
            {new Set(variants.map((v) => v.color)).size > 5 && (
              <span className="text-caption text-[#666] self-center">
                +{new Set(variants.map((v) => v.color)).size - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton" />
        <div className="h-5 w-3/4 skeleton" />
        <div className="h-5 w-1/3 skeleton" />
        <div className="h-3 w-1/2 skeleton" />
      </div>
    </div>
  );
}
