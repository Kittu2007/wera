// =============================================================================
// WERA — Static Pages Layout
// Section 15.3: Container for text-heavy pages
// =============================================================================

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function StaticPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container min-h-[60vh] py-16">
      <div className="max-w-3xl mx-auto px-4 md:px-0">
        
        {/* Dynamic Breadcrumbs would go here, omitting for simplicity since pages will be flat */}
        <nav className="flex items-center gap-2 text-caption text-[#666] mb-12 uppercase tracking-widest font-heading">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-brand-yellow">Information</span>
        </nav>

        {/* Prose Content Container */}
        <article className="prose prose-invert prose-brand max-w-none">
          {children}
        </article>
      </div>
    </div>
  );
}
