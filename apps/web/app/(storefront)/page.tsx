// =============================================================================
// WERA — Homepage
// Concept 2: "Current" (Streetwear Bold)
// Full-bleed hero, brutalist grid, massive typography
// All sections from PRD Section 6.1
// =============================================================================

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Truck, RotateCcw, Shield } from "lucide-react";
import { HeroSection } from "@/components/storefront/sections/HeroSection";
import { CategoryGrid } from "@/components/storefront/sections/CategoryGrid";
import { FeaturedProducts } from "@/components/storefront/sections/FeaturedProducts";
import { NewArrivals } from "@/components/storefront/sections/NewArrivals";
import { CollectionsSpotlight } from "@/components/storefront/sections/CollectionsSpotlight";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "WERA — Streetwear That Speaks",
  description:
    "Bold streetwear for the culture. Shop the latest drops: tees, hoodies, and more. Print-on-demand, zero waste. Free shipping on orders over ₹999.",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <>
      {/* ============================================================
          HERO — Full-bleed yellow background, product centred, MASSIVE headline
          ============================================================ */}
      <HeroSection />

      {/* ============================================================
          CATEGORY GRID — 4-6 categories, bold text overlaid
          ============================================================ */}
      <CategoryGrid />

      {/* ============================================================
          FEATURED PRODUCTS — Horizontal scroll rail
          ============================================================ */}
      <FeaturedProducts />

      {/* ============================================================
          PROMOTIONAL BANNER — Full-width mid-page offer
          ============================================================ */}
      <section className="relative overflow-hidden bg-brand-yellow text-brand-black">
        <div className="container py-16 md:py-24 relative z-10">
          <div className="max-w-3xl">
            <span className="badge-dark mb-4 inline-block">Limited Time</span>
            <h2 className="font-heading text-display-2xl md:text-[6rem] uppercase tracking-tight leading-none mb-6">
              FLAT 20%
              <br />
              <span className="text-brand-black/40">OFF</span> EVERYTHING
            </h2>
            <p className="text-body-lg text-brand-black/70 mb-8 max-w-lg">
              Use code <span className="font-bold">WERA20</span> at checkout. First order only.
              No cap on savings.
            </p>
            <Link href="/products" className="btn-primary bg-brand-black text-brand-yellow
                                              hover:bg-[#222] inline-flex items-center gap-2">
              Shop the Sale <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        {/* Background text decoration */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4
                        font-heading text-[20rem] md:text-[30rem] font-extrabold
                        text-brand-black/[0.04] leading-none select-none pointer-events-none"
             aria-hidden="true">
          20%
        </div>
      </section>

      {/* ============================================================
          NEW ARRIVALS — 8-product grid
          ============================================================ */}
      <NewArrivals />

      {/* ============================================================
          COLLECTIONS SPOTLIGHT — 2-3 editorial collection cards
          ============================================================ */}
      <CollectionsSpotlight />

      {/* ============================================================
          SOCIAL PROOF — Review excerpts + star rating
          ============================================================ */}
      <section className="section border-t border-[#222]">
        <div className="container">
          <div className="text-center mb-16">
            <span className="badge mb-4 inline-block">Real Reviews</span>
            <h2 className="font-heading text-display-xl uppercase tracking-tight">
              What They&apos;re Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Arjun K.",
                rating: 5,
                text: "The quality is insane for the price. Fabric is thick, print is crisp. Copped 3 more after my first order.",
                product: "Midnight Oversized Tee",
              },
              {
                name: "Priya S.",
                rating: 5,
                text: "Finally, a brand that gets streetwear in India. The fit is perfect and the designs are fire. 10/10 would recommend.",
                product: "Neon Grid Hoodie",
              },
              {
                name: "Vikram R.",
                rating: 4,
                text: "Ordered on Monday, got it by Thursday. Print hasn't faded after 5 washes. Building my WERA collection slowly.",
                product: "Classic Logo Crewneck",
              },
            ].map((review, i) => (
              <div
                key={i}
                className="border border-[#222] p-8 hover:border-brand-yellow
                           transition-colors duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "text-brand-yellow fill-brand-yellow"
                          : "text-[#333]"
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-body text-[#ccc] mb-6 leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </p>

                {/* Author */}
                <div>
                  <p className="font-heading text-sm uppercase tracking-wider text-white">
                    {review.name}
                  </p>
                  <p className="text-caption text-[#666] mt-1">
                    on {review.product}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TRUST BADGES — Free shipping / Easy returns / Secure checkout
          ============================================================ */}
      <section className="border-t border-[#222] py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: Truck,
                title: "Free Shipping",
                description: "On all orders above ₹999. No hidden charges.",
              },
              {
                icon: RotateCcw,
                title: "Easy 7-Day Returns",
                description: "Don't love it? Return it hassle-free within 7 days.",
              },
              {
                icon: Shield,
                title: "Secure Checkout",
                description: "256-bit SSL encryption. Your data stays safe.",
              },
            ].map((badge, i) => (
              <div key={i} className="flex items-start gap-5 group">
                <div className="p-4 border border-[#333] group-hover:border-brand-yellow
                               group-hover:bg-brand-yellow/10 transition-all duration-300">
                  <badge.icon className="w-6 h-6 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="font-heading text-h4 uppercase tracking-tight text-white mb-1">
                    {badge.title}
                  </h3>
                  <p className="text-body-sm text-[#999]">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
