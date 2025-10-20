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
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        arabic: ["var(--font-arabic)"],
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
    plugin(({ addVariant }) => {
      addVariant("rtl", '[dir="rtl"] &');
      addVariant("ltr", '[dir="ltr"] &');
    }),
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
