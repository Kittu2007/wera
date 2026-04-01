// =============================================================================
// WERA — Collections Spotlight (editorial cards)
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

export function CollectionsSpotlight() {
  const { data } = trpc.collections.list.useQuery();

  // Show up to 3 collections
  const collections = data?.slice(0, 3) ?? [];

  // Fallback static data while loading
  const fallback = [
    {
      id: "1",
      name: "Street Essentials",
      slug: "street-essentials",
      description: "The foundation of every fit. Basics that hit different.",
      imageUrl: "/images/collections/street-essentials.jpg",
    },
    {
      id: "2",
      name: "After Hours",
      slug: "after-hours",
      description: "Night-ready pieces. Dark palettes, bold silhouettes.",
      imageUrl: "/images/collections/after-hours.jpg",
    },
    {
      id: "3",
      name: "Weekend Warrior",
      slug: "weekend-warrior",
      description: "Casual comfort with an edge. Made for doing nothing — in style.",
      imageUrl: "/images/collections/weekend-warrior.jpg",
    },
  ];

  const items = collections.length > 0
    ? collections.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.image || "/images/placeholder.jpg",
      }))
    : fallback;

  return (
    <section className="section border-t border-[#222]" aria-labelledby="collections-heading">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="badge mb-4 inline-block">Editorial</span>
          <h2
            id="collections-heading"
            className="font-heading text-display-xl uppercase tracking-tight"
          >
            Collections
          </h2>
        </div>

        {/* Collection cards — asymmetric grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Large card */}
          {items[0] && (
            <Link
              href={`/collections/${items[0].slug}`}
              className="group relative aspect-[4/5] md:row-span-2 overflow-hidden block bg-[#1a1a1a]"
            >
              <Image
                src={items[0].imageUrl}
                alt={items[0].name}
                fill
                className="object-cover transition-transform duration-700
                           group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.indexOf("/images/placeholder.jpg") === -1) {
                    target.src = "/images/placeholder.jpg";
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                <span className="badge mb-4 w-fit">Collection</span>
                <h3 className="font-heading text-h1 md:text-display-xl uppercase tracking-tight text-white mb-3">
                  {items[0].name}
                </h3>
                <p className="text-body text-white/60 mb-6 max-w-sm">
                  {items[0].description}
                </p>
                <span className="inline-flex items-center gap-2 font-heading text-label
                               uppercase text-brand-yellow group-hover:gap-4 transition-all">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          )}

          {/* Smaller cards */}
          {items.slice(1).map((item) => (
            <Link
              key={item.id}
              href={`/collections/${item.slug}`}
              className="group relative aspect-[16/9] md:aspect-auto overflow-hidden block bg-[#1a1a1a]"
            >
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-700
                           group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.indexOf("/images/placeholder.jpg") === -1) {
                    target.src = "/images/placeholder.jpg";
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                <h3 className="font-heading text-h2 uppercase tracking-tight text-white mb-2">
                  {item.name}
                </h3>
                <p className="text-body-sm text-white/60 mb-4 max-w-xs">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-2 font-heading text-label
                               uppercase text-brand-yellow group-hover:gap-4 transition-all">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
