// =============================================================================
// WERA — Featured Products (Horizontal Scroll Rail)
// =============================================================================

"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { ProductCard, ProductCardSkeleton } from "../ProductCard";

export function FeaturedProducts() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = trpc.products.list.useQuery({
    isFeatured: true,
    limit: 12,
    page: 1,
    sortBy: "best_selling",
  });

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="section border-t border-[#222]" aria-labelledby="featured-heading">
      <div className="container">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="badge mb-4 inline-block">Curated</span>
            <h2
              id="featured-heading"
              className="font-heading text-display-xl uppercase tracking-tight"
            >
              Featured
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/collections/featured"
              className="hidden md:inline-flex items-center gap-2 font-heading text-label
                         uppercase text-[#999] hover:text-brand-yellow transition-colors"
            >
              View All <span className="text-brand-yellow">→</span>
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                className="p-2 border border-[#333] hover:border-brand-yellow
                           hover:text-brand-yellow transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-2 border border-[#333] hover:border-brand-yellow
                           hover:text-brand-yellow transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal scroll rail — full bleed */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pl-4 md:pl-8 lg:pl-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))]
                   snap-x snap-mandatory"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[260px] md:w-[300px] flex-shrink-0 snap-start">
                <ProductCardSkeleton />
              </div>
            ))
          : data?.items.map((product) => (
              <div
                key={product.id}
                className="w-[260px] md:w-[300px] flex-shrink-0 snap-start"
              >
                <ProductCard {...product} />
              </div>
            ))}
        {/* Spacer for right padding */}
        <div className="w-4 md:w-8 flex-shrink-0" />
      </div>
    </section>
  );
}
