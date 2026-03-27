// =============================================================================
// WERA — Root Layout
// Provides the <html> and <body> tags for the entire application.
// Font loading and global CSS imports live here.
// =============================================================================

import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";

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

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function RootLayout({
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-brand-black text-brand-white font-body antialiased">
        {children}
      </body>
    </html>
  );
}
