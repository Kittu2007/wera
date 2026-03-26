// =============================================================================
// WERA — Storefront Layout
// Concept 2: Matte black navbar, white WERA logo, electric yellow accents
// =============================================================================

import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "../globals.css";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Fonts — Concept 2 "Current"
// ---------------------------------------------------------------------------

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: "WERA — Streetwear That Speaks",
    template: "%s | WERA",
  },
  description:
    "Bold streetwear for the culture. Print-on-demand fashion that hits different. Shop tees, hoodies, and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://wera.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "WERA",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-brand-black text-brand-white font-body">
        <TRPCProvider>
          {/* Announcement Bar */}
          <AnnouncementBar />

          {/* Navigation */}
          <Navbar />

          {/* Main Content */}
          <main className="flex-1" id="main-content">
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* Cart Drawer (portal-like overlay) */}
          <CartDrawer />
        </TRPCProvider>
      </body>
    </html>
  );
}
