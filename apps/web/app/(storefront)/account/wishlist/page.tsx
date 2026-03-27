// =============================================================================
// WERA — Wishlist Page
// Section 6.6: Wishlist with Move to Cart
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { useCartStore } from "@/lib/cart-store";

export default function WishlistPage() {
  const utils = trpc.useUtils();
  const { data: wishlist, isLoading } = trpc.account.wishlist.useQuery();
  const toggleMutation = trpc.account.toggleWishlist.useMutation({
    onSuccess: () => utils.account.wishlist.invalidate(),
  });
  const addItem = useCartStore((s) => s.addItem);

  const handleMoveToCart = (item: any) => {
    const product = item.product;
    if (!product) return;
    const variant = product.variants[0];
    const image = product.images.find((i: any) => i.isPrimary) ?? product.images[0];
    if (!variant || !image) return;

    addItem({
      variantId: variant.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      price: String(variant.price),
      comparePrice: variant.comparePrice ? String(variant.comparePrice) : null,
      quantity: 1,
      maxStock: variant.stock,
      imageUrl: image.url,
      imageAlt: image.altText,
    });

    // Remove from wishlist
    toggleMutation.mutate({ productId: item.id });
  };

  return (
    <div>
      <h2 className="font-heading text-h2 uppercase tracking-tight mb-8">
        Wishlist
        {wishlist && <span className="text-[#666] ml-3">({wishlist.length})</span>}
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 skeleton" />
                <div className="h-4 w-1/3 skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlist && wishlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wishlist.map((item) => {
            const product = item.product;
            if (!product) return null;

            const image = product.images.find((i: any) => i.isPrimary) ?? product.images[0];
            const variant = product.variants[0];
            const inStock = product.variants.some((v: any) => v.stock > 0);

            return (
              <div key={item.id} className="group border border-[#222] hover:border-brand-yellow
                                           transition-colors">
                {/* Image */}
                <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4]
                            bg-[#1a1a1a] overflow-hidden">
                  {image && (
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  )}
                  {!inStock && (
                    <div className="absolute inset-0 bg-brand-black/60 flex items-center
                                   justify-center">
                      <span className="font-heading text-sm uppercase text-[#666]">Sold Out</span>
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-heading text-sm uppercase tracking-tight text-white
                                  line-clamp-2 hover:text-brand-yellow transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  {variant && (
                    <p className="font-heading text-brand-yellow mt-2">
                      ₹{String(variant.price)}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {inStock && (
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="flex-1 flex items-center justify-center gap-2
                                   bg-brand-yellow text-brand-black py-2.5
                                   font-heading text-[10px] uppercase tracking-wider font-bold
                                   hover:bg-white transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                      </button>
                    )}
                    <button
                      onClick={() => toggleMutation.mutate({ productId: item.id })}
                      className="p-2.5 border border-[#333] text-[#666]
                                 hover:border-red-500 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${product.title} from wishlist`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border border-[#222]">
          <Heart className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="font-heading text-h3 uppercase tracking-tight text-[#555] mb-2">
            Wishlist is empty
          </p>
          <p className="text-body-sm text-[#666] mb-6">
            Save items you love for later.
          </p>
          <Link href="/products" className="btn-primary">Explore Products</Link>
        </div>
      )}
    </div>
  );
}
