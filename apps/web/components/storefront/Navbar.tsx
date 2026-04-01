// =============================================================================
// WERA — Navbar
// Concept 2: White WERA wordmark on black navbar, sharp edges
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useIsHydrated } from "@/lib/use-is-hydrated";

const NAV_LINKS = [
  { href: "/products", label: "Shop All" },
  { href: "/category/tshirts", label: "T-Shirts" },
  { href: "/category/hoodies", label: "Hoodies" },
  { href: "/collections/new-arrivals", label: "New Drops" },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openCart = useCartStore((s) => s.openCart);
  const itemCount = useCartStore((s) => s.itemCount);
  const isHydrated = useIsHydrated();
  const count = isHydrated ? itemCount() : 0;

  return (
    <header className="sticky top-0 z-40 bg-brand-black border-b border-[#222]">
      <nav
        className="container flex items-center justify-between h-16 md:h-[72px]"
        aria-label="Main navigation"
      >
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden touch-target hover:bg-[#222] transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* WERA Logo — White wordmark */}
          <Link
            href="/"
            className="flex items-center"
            aria-label="WERA - Home"
          >
            <span className="font-heading text-h2 md:text-[32px] font-extrabold
                           tracking-[-0.03em] text-white leading-none">
              WERA
            </span>
          </Link>
        </div>

        {/* Center: Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-heading text-label uppercase text-[#999]
                         hover:text-brand-yellow transition-colors duration-200
                         relative after:absolute after:bottom-[-4px] after:left-0
                         after:w-0 after:h-[2px] after:bg-brand-yellow
                         after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-0.5 md:gap-1">
          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="touch-target hover:bg-[#222] transition-colors relative"
            aria-label="Search products"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <Link
            href="/account/wishlist"
            className="touch-target hover:bg-[#222] transition-colors hidden sm:flex"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
          </Link>

          {/* Account */}
          <Link
            href="/account"
            className="touch-target hover:bg-[#222] transition-colors hidden sm:flex"
            aria-label="Account"
          >
            <User className="w-5 h-5" />
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            className="touch-target hover:bg-[#222] transition-colors relative"
            aria-label={`Cart — ${count} items`}
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-4 h-4
                           bg-brand-yellow text-brand-black
                           text-[9px] font-bold flex items-center justify-center"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-brand-black border-b border-[#222]
                        animate-fade-in p-4">
          <div className="container">
            <div className="flex items-center gap-3 border-2 border-brand-yellow">
              <Search className="w-5 h-5 ml-4 text-[#666]" />
              <input
                type="search"
                placeholder="SEARCH WERA..."
                className="flex-1 bg-transparent py-3 pr-4 text-white
                           font-heading uppercase tracking-wider text-sm
                           placeholder:text-[#555] focus:outline-none"
                autoFocus
                aria-label="Search products"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-3 hover:bg-[#222] transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-black border-t border-[#222] animate-fade-in">
          <div className="container py-6 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 font-heading text-h3 uppercase tracking-tight
                           text-white hover:text-brand-yellow transition-colors
                           border-b border-[#222]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex gap-4">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-ghost flex-1 text-center py-3 text-xs"
              >
                Account
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-ghost flex-1 text-center py-3 text-xs"
              >
                Wishlist
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
