// =============================================================================
// WERA — Hero Section
// Concept 2: Full-bleed yellow background, product centred, MASSIVE headline
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const HERO_SLIDES = [
  {
    id: 1,
    headline: "WEAR YOUR\nATTITUDE",
    subtext: "The new drop is here. Bold designs for bold people.",
    cta: { label: "Shop the Drop", href: "/collections/new-arrivals" },
    image: "/images/hero/hero-1.jpg",
    bgColor: "bg-brand-yellow",
    textColor: "text-brand-black",
  },
  {
    id: 2,
    headline: "STREET\nREADY",
    subtext: "Premium streetwear, made to order. Zero waste, full attitude.",
    cta: { label: "Explore Collection", href: "/products" },
    image: "/images/hero/hero-2.jpg",
    bgColor: "bg-brand-black",
    textColor: "text-brand-white",
  },
  {
    id: 3,
    headline: "LIMITED\nEDITION",
    subtext: "Once it's gone, it's gone. Don't sleep on this.",
    cta: { label: "Get It Now", href: "/collections/limited" },
    image: "/images/hero/hero-3.jpg",
    bgColor: "bg-brand-black",
    textColor: "text-brand-yellow",
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const slide = HERO_SLIDES[current]!;

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => setCurrent(index);
  const goPrev = () => setCurrent((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);

  return (
    <section
      className={`relative overflow-hidden ${slide.bgColor} transition-colors duration-700`}
      aria-label="Hero banner"
    >
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[60vh] md:min-h-[85vh] py-12 md:py-16">
          {/* Text side */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <h1
              className={`font-heading text-display-2xl md:text-[5.5rem] lg:text-[7rem]
                         uppercase tracking-[-0.03em] leading-[0.9] mb-6 md:mb-8
                         ${slide.textColor} transition-colors duration-700 whitespace-pre-line`}
            >
              {slide.headline}
            </h1>
            <p
              className={`text-body md:text-body-lg max-w-md mx-auto lg:mx-0 mb-8 md:mb-10
                         ${slide.textColor === "text-brand-black"
                           ? "text-brand-black/70"
                           : "text-white/60"
                         }`}
            >
              {slide.subtext}
            </p>
            <Link
              href={slide.cta.href}
              className={`inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5
                         font-heading uppercase tracking-wider text-sm font-bold
                         transition-all duration-300 group
                         ${slide.bgColor === "bg-brand-yellow"
                           ? "bg-brand-black text-brand-yellow hover:bg-[#222]"
                           : "bg-brand-yellow text-brand-black hover:bg-white"
                         }`}
            >
              {slide.cta.label}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Image side */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative aspect-[4/5] md:aspect-square max-w-[280px] md:max-w-lg mx-auto lg:max-w-none">
              <Image
                src={slide.image}
                alt="WERA featured product"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 1024px) 80vw, 50vw"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.indexOf("/images/placeholder.jpg") === -1) {
                    target.src = "/images/placeholder.jpg";
                  }
                }}
              />
              {/* Decorative frame */}
              <div className="absolute inset-2 md:inset-4 border-2 border-brand-yellow/30 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="container flex items-center justify-between">
          {/* Slide indicators */}
          <div className="flex gap-3" role="tablist" aria-label="Hero slides">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === current}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 transition-all duration-500 ${
                  i === current
                    ? `w-12 ${slide.textColor === "text-brand-black" ? "bg-brand-black" : "bg-brand-yellow"}`
                    : `w-6 ${slide.textColor === "text-brand-black" ? "bg-brand-black/30" : "bg-white/20"}`
                }`}
              />
            ))}
          </div>

          {/* Arrow controls */}
          <div className="flex gap-2">
            <button
              onClick={goPrev}
              className={`p-2 border transition-colors ${
                slide.textColor === "text-brand-black"
                  ? "border-brand-black/30 text-brand-black hover:bg-brand-black hover:text-brand-yellow"
                  : "border-white/20 text-white hover:bg-brand-yellow hover:text-brand-black hover:border-brand-yellow"
              }`}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className={`p-2 border transition-colors ${
                slide.textColor === "text-brand-black"
                  ? "border-brand-black/30 text-brand-black hover:bg-brand-black hover:text-brand-yellow"
                  : "border-white/20 text-white hover:bg-brand-yellow hover:text-brand-black hover:border-brand-yellow"
              }`}
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Background text decoration — brutalist style */}
      <div
        className="absolute bottom-0 right-0 translate-x-[10%] translate-y-[20%]
                   font-heading text-[18rem] md:text-[28rem] font-extrabold
                   leading-none select-none pointer-events-none opacity-[0.03]"
        aria-hidden="true"
      >
        WERA
      </div>
    </section>
  );
}
