// =============================================================================
// WERA — Announcement Bar
// Sticky top strip with marquee scrolling offer text
// =============================================================================

"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className="bg-brand-yellow text-brand-black overflow-hidden relative"
      role="banner"
      aria-label="Promotional announcements"
    >
      <div className="flex items-center h-9">
        {/* Marquee track */}
        <div className="marquee-track">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              <span className="font-heading text-label uppercase whitespace-nowrap">
                🔥 FREE SHIPPING ON ORDERS ABOVE ₹999
              </span>
              <span className="text-brand-black/60">●</span>
              <span className="font-heading text-label uppercase whitespace-nowrap">
                NEW DROP EVERY FRIDAY
              </span>
              <span className="text-brand-black/60">●</span>
              <span className="font-heading text-label uppercase whitespace-nowrap">
                EASY 7-DAY RETURNS
              </span>
              <span className="text-brand-black/60">●</span>
              <span className="font-heading text-label uppercase whitespace-nowrap">
                100% PRINT-ON-DEMAND — ZERO WASTE
              </span>
              <span className="text-brand-black/60">●</span>
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1
                     hover:bg-brand-black/10 transition-colors z-10"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
