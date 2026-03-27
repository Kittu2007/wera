"use client";

import Link from "next/link";
import { Instagram, Youtube, Twitter } from "lucide-react";

const FOOTER_LINKS = {
  shop: [
    { href: "/products", label: "All Products" },
    { href: "/category/tshirts", label: "T-Shirts" },
    { href: "/category/hoodies", label: "Hoodies" },
    { href: "/collections/new-arrivals", label: "New Arrivals" },
    { href: "/collections/bestsellers", label: "Bestsellers" },
  ],
  help: [
    { href: "/track-order", label: "Track Order" },
    { href: "/shipping", label: "Shipping Info" },
    { href: "/returns", label: "Returns & Exchanges" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact Us" },
  ],
  company: [
    { href: "/about", label: "About WERA" },
    { href: "/blog", label: "Blog" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-brand-black border-t-2 border-brand-yellow" role="contentinfo">
      {/* Newsletter Section */}
      <div className="bg-brand-yellow text-brand-black section">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-display-xl uppercase tracking-tight mb-4">
              Join the Drop
            </h2>
            <p className="text-body-lg mb-8 text-brand-black/80">
              Get 10% off your first order + early access to new drops.
            </p>
            <form className="flex max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="YOUR EMAIL"
                className="flex-1 px-6 py-4 bg-brand-black text-white
                           font-heading uppercase tracking-wider text-sm
                           placeholder:text-[#555] focus:outline-none
                           border-2 border-brand-black"
                aria-label="Email address for newsletter"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-brand-black text-brand-yellow
                           font-heading uppercase tracking-wider text-sm font-bold
                           hover:bg-[#222] transition-colors
                           border-2 border-brand-black"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links Grid */}
      <div className="container section">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="WERA - Home">
              <span className="font-heading text-[40px] font-extrabold tracking-[-0.03em]
                             text-white leading-none">
                WERA
              </span>
            </Link>
            <p className="text-body-sm text-[#666] mt-4 max-w-[240px]">
              Bold streetwear for the culture. Made-to-order, zero-waste,
              100% attitude.
            </p>

            {/* Social links */}
            <div className="flex gap-3 mt-6">
              <a
                href="https://instagram.com/wera"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-[#333] hover:border-brand-yellow
                           hover:text-brand-yellow transition-colors"
                aria-label="Follow WERA on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@wera"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-[#333] hover:border-brand-yellow
                           hover:text-brand-yellow transition-colors"
                aria-label="Watch WERA on YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/wera"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-[#333] hover:border-brand-yellow
                           hover:text-brand-yellow transition-colors"
                aria-label="Follow WERA on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="font-heading text-label uppercase text-brand-yellow mb-6">
              Shop
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-[#999] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help links */}
          <div>
            <h3 className="font-heading text-label uppercase text-brand-yellow mb-6">
              Help
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-[#999] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-heading text-label uppercase text-brand-yellow mb-6">
              Company
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-[#999] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#222]">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-caption text-[#555]">
            © {new Date().getFullYear()} WERA. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-caption text-[#555]">
              <span>✓ Secure Checkout</span>
              <span className="text-[#333]">|</span>
              <span>✓ Free Returns</span>
              <span className="text-[#333]">|</span>
              <span>✓ Made in India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
