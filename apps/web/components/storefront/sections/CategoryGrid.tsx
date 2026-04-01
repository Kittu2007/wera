// =============================================================================
// WERA — Category Grid
// Concept 2: Bold text overlaid on high-contrast images
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    name: "T-Shirts",
    slug: "tshirts",
    image: "/images/categories/tshirts.jpg",
    count: "120+",
  },
  {
    name: "Hoodies",
    slug: "hoodies",
    image: "/images/categories/hoodies.jpg",
    count: "45+",
  },
  {
    name: "Oversized",
    slug: "oversized",
    image: "/images/categories/oversized.jpg",
    count: "80+",
  },
  {
    name: "Accessories",
    slug: "accessories",
    image: "/images/categories/accessories.jpg",
    count: "30+",
  },
  {
    name: "Crewnecks",
    slug: "crewnecks",
    image: "/images/categories/crewnecks.jpg",
    count: "25+",
  },
  {
    name: "Limited Edition",
    slug: "limited",
    image: "/images/categories/limited.jpg",
    count: "12",
  },
];

export function CategoryGrid() {
  return (
    <section className="section" aria-labelledby="categories-heading">
      <div className="container">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="badge mb-4 inline-block">Categories</span>
            <h2
              id="categories-heading"
              className="font-heading text-display-xl uppercase tracking-tight"
            >
              Shop by Category
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden md:inline-flex items-center gap-2 font-heading text-label
                       uppercase text-[#999] hover:text-brand-yellow transition-colors"
          >
            View All <span className="text-brand-yellow">→</span>
          </Link>
        </div>

        {/* Grid — brutalist asymmetric layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`group relative overflow-hidden block
                         ${i === 0 ? "md:row-span-2 aspect-[3/4] md:aspect-auto" : "aspect-[4/3]"}
                         bg-[#1a1a1a]`}
            >
              {/* Image with zoom on hover */}
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700
                           group-hover:scale-110"
                sizes={i === 0
                  ? "(max-width: 768px) 50vw, 33vw"
                  : "(max-width: 768px) 50vw, 33vw"
                }
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.indexOf("/images/placeholder.jpg") === -1) {
                    target.src = "/images/placeholder.jpg";
                  }
                }}
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
                <span className="text-label text-brand-yellow mb-2">{cat.count} styles</span>
                <h3
                  className={`font-heading uppercase tracking-tight text-white
                             ${i === 0 ? "text-h1 md:text-display-xl" : "text-h2 md:text-h1"}`}
                >
                  {cat.name}
                </h3>
                {/* Underline animation */}
                <div className="h-[2px] bg-brand-yellow w-0 group-hover:w-16
                               transition-all duration-500 mt-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
