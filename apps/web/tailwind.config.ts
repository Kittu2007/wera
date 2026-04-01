// =============================================================================
// WERA — Tailwind Configuration
// Concept 2: "Current" (Streetwear Bold)
// Palette: Matte black (#111), Electric yellow (#FFE600), White (#FFF)
// Typography: Barlow Condensed ExtraBold headings, DM Sans body
// =============================================================================

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1rem",
        md: "2rem",
        lg: "1.5rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Concept 2 — "Current" brand palette
        brand: {
          black: "#111111",
          yellow: "#FFE600",
          white: "#FFFFFF",
        },
        // Semantic color system with CSS variables for dark mode
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "#888888", // Improved contrast on black
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      fontFamily: {
        heading: ["var(--font-barlow)", "Barlow Condensed", "sans-serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["2.75rem", { lineHeight: "1", fontWeight: "800", letterSpacing: "-0.02em" }], // Mobile default
        "display-xl": ["2.25rem", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.01em" }], // Mobile default
        "h1": ["2rem", { lineHeight: "1.1", fontWeight: "700" }],
        "h2": ["1.75rem", { lineHeight: "1.15", fontWeight: "600" }],
        "h3": ["1.25rem", { lineHeight: "1.2", fontWeight: "600" }],
        "h4": ["1.125rem", { lineHeight: "1.3", fontWeight: "500" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "400" }],
        "label": ["0.6875rem", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        none: "0px", // Brutalist: sharp edges only
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-in",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-in",
        "scale-in": "scale-in 0.2s ease-out",
        marquee: "marquee 30s linear infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
      },
      spacing: {
        "section": "5rem",
        "section-mobile": "3rem",
      },
    },
  },
  plugins: [],
};

export default config;
