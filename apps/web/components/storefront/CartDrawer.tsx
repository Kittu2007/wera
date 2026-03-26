// =============================================================================
// WERA — Cart Drawer (Slide-over)
// Section 6.4 — Full cart management with Zustand
// =============================================================================

"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    couponCode,
  } = useCartStore();

  const count = itemCount();
  const total = subtotal();
  const FREE_SHIPPING_THRESHOLD = 999;
  const freeShippingProgress = Math.min(total / FREE_SHIPPING_THRESHOLD, 1);
  const amountToFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-brand-black
                   border-l-2 border-brand-yellow z-50 flex flex-col
                   animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-brand-yellow" />
            <h2 className="font-heading text-h3 uppercase tracking-tight text-white">
              Your Cart
            </h2>
            <span className="badge">{count}</span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-[#222] transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {count > 0 && (
          <div className="px-6 py-4 border-b border-[#222]">
            {freeShippingProgress >= 1 ? (
              <p className="text-body-sm text-brand-yellow font-bold flex items-center gap-2">
                <span>🎉</span> You&apos;ve unlocked FREE SHIPPING!
              </p>
            ) : (
              <div>
                <p className="text-body-sm text-[#999] mb-2">
                  Add{" "}
                  <span className="text-brand-yellow font-bold">
                    ₹{amountToFreeShipping.toFixed(0)}
                  </span>{" "}
                  more for free shipping
                </p>
                <div className="h-1.5 bg-[#222] w-full">
                  <div
                    className="h-full bg-brand-yellow transition-all duration-500"
                    style={{ width: `${freeShippingProgress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <ShoppingBag className="w-16 h-16 text-[#333] mb-6" />
              <p className="font-heading text-h3 uppercase tracking-tight text-[#555] mb-2">
                Cart is empty
              </p>
              <p className="text-body-sm text-[#666] mb-8">
                Your cart is waiting. Add something bold.
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="btn-primary"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#222]">
              {items.map((item) => (
                <div key={item.variantId} className="p-6 flex gap-4">
                  {/* Item Image */}
                  <div className="relative w-20 h-24 flex-shrink-0 bg-[#1a1a1a]">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt ?? item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="font-heading text-sm uppercase tracking-tight text-white
                                 hover:text-brand-yellow transition-colors line-clamp-2"
                    >
                      {item.title}
                    </Link>

                    <p className="text-caption text-[#666] mt-1">
                      {item.size} / {item.color}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity adjuster */}
                      <div className="flex items-center border border-[#333]">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-[#222] disabled:opacity-30 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-body-sm font-bold min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          className="p-1.5 hover:bg-[#222] disabled:opacity-30 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="font-heading text-brand-yellow text-sm">
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="self-start p-1.5 text-[#555] hover:text-red-500 transition-colors"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — Order Summary */}
        {count > 0 && (
          <div className="border-t-2 border-brand-yellow p-6 space-y-4">
            {/* Summary rows */}
            <div className="space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-[#999]">Subtotal</span>
                <span className="text-white font-bold">₹{total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-[#999]">Shipping</span>
                <span className="text-white">
                  {freeShippingProgress >= 1 ? (
                    <span className="text-brand-yellow">FREE</span>
                  ) : (
                    "Calculated at checkout"
                  )}
                </span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-[#999]">GST (18%)</span>
                <span className="text-white">₹{(total * 0.18).toFixed(0)}</span>
              </div>
            </div>

            <div className="h-[1px] bg-[#333]" />

            <div className="flex justify-between">
              <span className="font-heading text-lg uppercase tracking-tight">
                Estimated Total
              </span>
              <span className="font-heading text-xl text-brand-yellow">
                ₹{(total * 1.18).toFixed(0)}
              </span>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Continue shopping */}
            <button
              onClick={closeCart}
              className="w-full text-center text-body-sm text-[#666]
                         hover:text-brand-yellow transition-colors py-2"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
