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
 * - Arabic Typography: Noto Sans Arabic font for RTL text
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

export default {
  // Dark mode configuration using class strategy
  darkMode: ["class"],
  
  // Content paths for Tailwind to scan for classes
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  
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
        // Base colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // Card component colors
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        
        // Popover component colors
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        
        // Primary brand colors
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        
        // Secondary brand colors
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        
        // Muted/subtle colors
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        
        // Accent colors
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        
        // Destructive/error colors
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        
        // Border and input colors
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        
        // Chart colors for data visualization
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        
        // Sidebar component colors
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        
        // Status colors
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
      },
      
      /**
       * Font Family Configuration
       * 
       * Defines font families for different text types:
       * - sans: Default sans-serif fonts
       * - serif: Serif fonts for headings
       * - mono: Monospace fonts for code
       * - inter: Inter font for English text
       * - arabic: Noto Sans Arabic for Arabic text (RTL support)
       * 
       * Used in: All text elements, RTL layout
       * Pages affected: All pages with text content
       */
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        inter: ["Inter", "sans-serif"],
        arabic: ["Noto Sans Arabic", "sans-serif"],
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
