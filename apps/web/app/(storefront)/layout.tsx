// =============================================================================
// WERA — Storefront Layout
// Concept 2: Matte black navbar, white WERA logo, electric yellow accents
// Provides navigation chrome (AnnouncementBar, Navbar, Footer, CartDrawer)
// =============================================================================

import { TRPCProvider } from "@/lib/trpc-provider";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { CartDrawer } from "@/components/storefront/CartDrawer";

// ---------------------------------------------------------------------------
// Layout — content wrapper (html/body/fonts are in root layout)
// ---------------------------------------------------------------------------

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="min-h-screen flex flex-col">
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
      </div>
    </TRPCProvider>
  );
}
