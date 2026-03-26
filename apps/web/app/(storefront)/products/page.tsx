// =============================================================================
// WERA — Product Listing Page (PLP)
// Section 6.2: Filters, sort, grid/list toggle, infinite scroll, quick add
// =============================================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Grid3X3, List, X, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { ProductCard, ProductCardSkeleton } from "@/components/storefront/ProductCard";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortOption = "newest" | "price_asc" | "price_desc" | "best_selling" | "top_rated";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "top_rated", label: "Top Rated" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const COLOR_OPTIONS = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1a237e" },
  { name: "Grey", hex: "#9e9e9e" },
  { name: "Red", hex: "#e53935" },
  { name: "Green", hex: "#2e7d32" },
  { name: "Yellow", hex: "#FFE600" },
  { name: "Blue", hex: "#1e88e5" },
];

const PRICE_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 — ₹999", min: 500, max: 999 },
  { label: "₹1000 — ₹1999", min: 1000, max: 1999 },
  { label: "₹2000 — ₹3000", min: 2000, max: 3000 },
  { label: "Above ₹3000", min: 3000, max: undefined },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters from URL
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) ?? "newest"
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get("sizes")?.split(",").filter(Boolean) ?? []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get("colors")?.split(",").filter(Boolean) ?? []
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(
    searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // tRPC query
  const { data, isLoading, isFetching } = trpc.products.list.useQuery({
    query: query || undefined,
    sortBy,
    sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    colors: selectedColors.length > 0 ? selectedColors : undefined,
    minPrice,
    maxPrice,
    page,
    limit: 20,
  });

  // Accumulated products for infinite scroll
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    if (data?.items) {
      if (page === 1) {
        setAllProducts(data.items);
      } else {
        setAllProducts((prev) => [...prev, ...data.items]);
      }
    }
  }, [data, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [sortBy, selectedSizes, selectedColors, minPrice, maxPrice, query]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !data?.hasNext) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching && data.hasNext) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [data?.hasNext, isFetching]);

  // URL sync
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (selectedSizes.length) params.set("sizes", selectedSizes.join(","));
    if (selectedColors.length) params.set("colors", selectedColors.join(","));
    if (minPrice !== undefined) params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [query, sortBy, selectedSizes, selectedColors, minPrice, maxPrice, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Active filter chips
  const activeFilters: { label: string; onRemove: () => void }[] = [
    ...selectedSizes.map((s) => ({
      label: `Size: ${s}`,
      onRemove: () => setSelectedSizes((prev) => prev.filter((x) => x !== s)),
    })),
    ...selectedColors.map((c) => ({
      label: `Color: ${c}`,
      onRemove: () => setSelectedColors((prev) => prev.filter((x) => x !== c)),
    })),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? [
          {
            label: `₹${minPrice ?? 0} — ${maxPrice ? `₹${maxPrice}` : "∞"}`,
            onRemove: () => {
              setMinPrice(undefined);
              setMaxPrice(undefined);
            },
          },
        ]
      : []),
  ];

  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setQuery("");
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="border-b border-[#222] py-12 md:py-16">
        <div className="container">
          <h1 className="font-heading text-display-xl md:text-display-2xl uppercase tracking-tight">
            {query ? `Results for "${query}"` : "All Products"}
          </h1>
          {data && (
            <p className="text-body text-[#666] mt-3">
              {data.total} product{data.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="container section">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Filter toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 border
                         font-heading text-label uppercase transition-colors
                         ${isFilterOpen
                           ? "border-brand-yellow text-brand-yellow"
                           : "border-[#333] text-[#999] hover:border-brand-yellow hover:text-brand-yellow"
                         }`}
              aria-expanded={isFilterOpen}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="bg-brand-yellow text-brand-black text-[10px] font-bold
                               w-5 h-5 flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* View mode toggle */}
            <div className="hidden md:flex border border-[#333]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${
                  viewMode === "grid" ? "bg-brand-yellow text-brand-black" : "hover:bg-[#222]"
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${
                  viewMode === "list" ? "bg-brand-yellow text-brand-black" : "hover:bg-[#222]"
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-transparent border border-[#333] px-5 py-2.5
                         pr-10 font-heading text-label uppercase text-white
                         cursor-pointer focus:outline-none focus:border-brand-yellow"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-brand-black">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666] pointer-events-none" />
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {activeFilters.map((filter, i) => (
              <button
                key={i}
                onClick={filter.onRemove}
                className="inline-flex items-center gap-2 px-3 py-1.5
                           border border-brand-yellow text-brand-yellow
                           font-heading text-[10px] uppercase tracking-wider
                           hover:bg-brand-yellow hover:text-brand-black transition-colors"
              >
                {filter.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[10px] uppercase tracking-wider text-[#666]
                         hover:text-white transition-colors px-3 py-1.5 font-heading"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filter Panel */}
          {isFilterOpen && (
            <aside className="w-64 flex-shrink-0 hidden md:block space-y-8" aria-label="Filters">
              {/* Size Filter */}
              <div>
                <h3 className="font-heading text-label uppercase text-brand-yellow mb-4">
                  Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSizes((prev) =>
                          prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                        )
                      }
                      className={`px-4 py-2 border font-heading text-xs uppercase
                                 transition-colors ${
                                   selectedSizes.includes(size)
                                     ? "border-brand-yellow bg-brand-yellow text-brand-black"
                                     : "border-[#333] text-[#999] hover:border-brand-yellow"
                                 }`}
                      aria-pressed={selectedSizes.includes(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div>
                <h3 className="font-heading text-label uppercase text-brand-yellow mb-4">
                  Color
                </h3>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        setSelectedColors((prev) =>
                          prev.includes(color.name)
                            ? prev.filter((c) => c !== color.name)
                            : [...prev, color.name]
                        )
                      }
                      className={`w-8 h-8 border-2 transition-all ${
                        selectedColors.includes(color.name)
                          ? "border-brand-yellow scale-110"
                          : "border-[#333] hover:border-[#555]"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                      aria-pressed={selectedColors.includes(color.name)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-heading text-label uppercase text-brand-yellow mb-4">
                  Price
                </h3>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        setMinPrice(range.min);
                        setMaxPrice(range.max);
                      }}
                      className={`block w-full text-left px-4 py-2.5 text-body-sm
                                 transition-colors ${
                                   minPrice === range.min && maxPrice === range.max
                                     ? "bg-brand-yellow text-brand-black font-bold"
                                     : "text-[#999] hover:text-white hover:bg-[#1a1a1a]"
                                 }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
                  : "space-y-4"
              }
            >
              {isLoading && page === 1
                ? Array.from({ length: 12 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))
                : allProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
            </div>

            {/* Loading more indicator */}
            {isFetching && page > 1 && (
              <div className="py-12 text-center">
                <div className="inline-flex items-center gap-3 text-[#666]">
                  <div className="w-5 h-5 border-2 border-brand-yellow border-t-transparent
                                 animate-spin" />
                  <span className="font-heading text-label uppercase">Loading more...</span>
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {/* No results */}
            {!isLoading && allProducts.length === 0 && (
              <div className="py-24 text-center">
                <p className="font-heading text-h2 uppercase tracking-tight text-[#333] mb-4">
                  No products found
                </p>
                <p className="text-body text-[#666] mb-8">
                  Try adjusting your filters or search terms.
                </p>
                <button onClick={clearAllFilters} className="btn-primary">
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
