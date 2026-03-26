// =============================================================================
// WERA — New Arrivals Section (8-product grid)
// =============================================================================

"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc-client";
import { ProductCard, ProductCardSkeleton } from "../ProductCard";

export function NewArrivals() {
  const { data, isLoading } = trpc.products.list.useQuery({
    isNewArrival: true,
    limit: 8,
    page: 1,
    sortBy: "newest",
  });

  return (
    <section className="section border-t border-[#222]" aria-labelledby="new-arrivals-heading">
      <div className="container">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="badge mb-4 inline-block">Fresh Out</span>
            <h2
              id="new-arrivals-heading"
              className="font-heading text-display-xl uppercase tracking-tight"
            >
              New Arrivals
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="hidden md:inline-flex items-center gap-2 font-heading text-label
                       uppercase text-[#999] hover:text-brand-yellow transition-colors"
          >
            View All <span className="text-brand-yellow">→</span>
          </Link>
        </div>

        {/* Product grid — 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : data?.items.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-10 text-center md:hidden">
          <Link href="/products?sort=newest" className="btn-ghost text-xs">
            View All New Arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
