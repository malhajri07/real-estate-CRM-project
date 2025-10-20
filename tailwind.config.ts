/**
 * tailwind.config.ts - Tailwind CSS Configuration
 * 
 * This file configures Tailwind CSS for the real estate CRM platform.
 * It provides:
 * - Custom color palette with CSS variables for theming
 * - Typography configuration with Arabic font support
 * - Component-specific styling (sidebar, cards, charts)
 * - Animation and transition definitions
 * - RTL (Right-to-Left) layout support
 * - Dark mode configuration
 * 
 * Key Features:
 * - Brand Colors: Custom primary, secondary, success, warning, error colors
 * - Arabic Typography: Noto Kufi Arabic font for RTL text
 * - Component Theming: Sidebar, cards, and chart color schemes
 * - Responsive Design: Mobile-first responsive utilities
 * - Animation System: Custom keyframes and animations
 * 
 * Dependencies:
 * - Tailwind CSS core
 * - tailwindcss-animate plugin for animations
 * - @tailwindcss/typography plugin for rich text
 * 
 * Routes affected: All frontend routes (styling)
 * Pages affected: All frontend pages
 */

import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const fontSans = [
  "var(--font-sans)",
];

const fontSerif = [
  "var(--font-serif)",
];

const fontMono = [
  "var(--font-mono)",
];

const fontDisplay = [
  "var(--font-display)",
];

const fontArabic = [
  "var(--font-arabic)",
];

const fontPassword = [
  "var(--font-password)",
];

export default {
  // Dark mode configuration using class strategy
  darkMode: ["class"],
  
  // Content paths for Tailwind to scan for classes
  content: ["./apps/web/index.html", "./apps/web/src/**/*.{js,jsx,ts,tsx}"],
  
  theme: {
    extend: {
      // Border radius configuration using CSS variables
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      /**
       * Color Palette Configuration
       * 
       * Defines the complete color system for the application:
       * - Semantic colors (primary, secondary, success, warning, error)
       * - Component-specific colors (card, popover, sidebar)
       * - Chart colors for data visualization
       * - All colors use CSS variables for easy theming
       * 
       * Used in: All UI components, theming system
       * Pages affected: All pages with UI components
       */
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
      },
      
      /**
       * Font Family Configuration
       * 
       * Defines font families for different text types:
       * - sans: Default sans-serif font stack (Inter)
       * - serif: Serif fonts for headings
       * - mono: Monospace fonts for code
       * - arabic: Arabic-first stack powered by CSS variable token
       * 
       * Used in: All text elements, RTL layout
       * Pages affected: All pages with text content
       */
      fontFamily: {
        sans: fontSans,
        serif: fontSerif,
        mono: fontMono,
        inter: ["Inter", "sans-serif"],
        arabic: fontArabic,
        display: fontDisplay,
        password: fontPassword,
      },
      maxWidth: {
        '10xl': '96rem',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    plugin(({ addVariant, addComponents, addUtilities }) => {
      addVariant("rtl", '[dir="rtl"] &');
      addVariant("ltr", '[dir="ltr"] &');

      addComponents({
        ".page-container": {
          "@apply w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8": {},
        },
        ".page-section": {
          "@apply bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200": {},
        },
        ".page-section__header": {
          "@apply px-6 py-4 border-b border-slate-200/70 flex items-center justify-between gap-3": {},
        },
        ".page-section__body": {
          "@apply px-6 py-5 space-y-4": {},
        },
        ".stats-grid": {
          "@apply grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4": {},
        },
        ".metric-card": {
          "@apply bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg": {},
        },
        ".metric-card__label": {
          "@apply text-sm text-slate-500 font-medium": {},
        },
        ".metric-card__value": {
          "@apply text-2xl font-bold text-slate-900 font-arabic": {},
        },
        ".surface-panel": {
          "@apply bg-white rounded-3xl border border-slate-200/70 shadow-sm": {},
        },
        ".surface-panel__title": {
          "@apply text-lg font-semibold text-slate-800": {},
        },
        ".surface-panel__subtitle": {
          "@apply text-sm text-slate-500": {},
        },
        ".data-list": {
          "@apply divide-y divide-slate-200/70": {},
        },
        ".data-list__item": {
          "@apply flex items-center justify-between gap-4 py-3": {},
        },
      });

      addUtilities({
        ".shadow-soft": {
          boxShadow: "0 12px 40px rgba(15, 23, 42, 0.05)",
        },
        ".glass-surface": {
          "@apply bg-white/80 backdrop-blur-xl border border-white/70": {},
        },
      });
    }),
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
