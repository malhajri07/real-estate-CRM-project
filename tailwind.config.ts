import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const fontSans = ["Inter", "Noto Kufi Arabic", "system-ui", "sans-serif"];
const fontSerif = ["IBM Plex Serif", "serif"];
const fontMono = ["JetBrains Mono", "monospace"];
const fontDisplay = ["Plus Jakarta Sans", "Noto Kufi Arabic", "sans-serif"];
const fontArabic = ["Noto Kufi Arabic", "Inter", "sans-serif"];
const fontPassword = ["JetBrains Mono", "monospace"];

const config: Config = {
  content: ["./apps/web/index.html", "./apps/web/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      borderRadius: {
        lg: "1rem",
        md: "0.875rem",
        sm: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      colors: {
        background: "hsl(215 45% 97%)",
        foreground: "hsl(220 50% 12%)",
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(220 50% 14%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(220 50% 14%)",
        },
        primary: {
          DEFAULT: "hsl(164 72% 40%)",
          foreground: "hsl(155 86% 95%)",
        },
        secondary: {
          DEFAULT: "hsl(222 62% 45%)",
          foreground: "hsl(210 40% 98%)",
        },
        muted: {
          DEFAULT: "hsl(210 38% 96%)",
          foreground: "hsl(215 18% 38%)",
        },
        accent: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(220 50% 18%)",
        },
        destructive: {
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "hsl(0 0% 98%)",
        },
        border: "hsl(214 32% 88%)",
        input: "hsl(214 32% 92%)",
        ring: "hsl(164 72% 40%)",
        sidebar: {
          DEFAULT: "hsl(210 28% 98%)",
          foreground: "hsl(222 47% 16%)",
          muted: "hsl(214 30% 92%)",
          accent: "hsl(164 72% 40%)",
          "accent-foreground": "hsl(155 86% 95%)",
        },
        success: "hsl(160 84% 39%)",
        warning: "hsl(35 92% 62%)",
        error: "hsl(0 72% 51%)",
        info: "hsl(208 92% 54%)",
        brand: {
          25: "#f7f9ff",
          50: "#f5f8ff",
          100: "#e8efff",
          200: "#cddcff",
          300: "#a1baff",
          400: "#7292ff",
          500: "#4b6bff",
          600: "#3a54db",
          700: "#2f43ad",
          800: "#283885",
          900: "#222f69",
        },
      },
      fontFamily: {
        sans: fontSans,
        serif: fontSerif,
        mono: fontMono,
        inter: ["Inter", "sans-serif"],
        arabic: fontArabic,
        display: fontDisplay,
        password: fontPassword,
      },
      fontSize: {
        xxs: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "-0.01em" }],
        "title-small": ["0.95rem", { lineHeight: "1.35rem", fontWeight: "600" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08)",
        elevated: "0 28px 55px -35px rgba(15, 23, 42, 0.45)",
        floating: "0 20px 45px -28px rgba(15, 23, 42, 0.55)",
        outline: "0 0 0 1px rgba(148, 163, 184, 0.12)",
      },
      backgroundImage: {
        "subtle-grid":
          "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
      zIndex: {
        base: "0",
        sticky: "10",
        dropdown: "20",
        overlay: "30",
        modal: "40",
        toast: "50",
        tooltip: "60",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      transitionTimingFunction: {
        "in-out-soft": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      maxWidth: {
        "10xl": "96rem",
      },
    },
  },
  plugins: [
    plugin(({ addVariant, addUtilities, addComponents }) => {
      addVariant("rtl", '[dir="rtl"] &');
      addVariant("ltr", '[dir="ltr"] &');

      addComponents({
        ".ui-surface": {
          "@apply rounded-3xl border border-border/60 bg-card/80 shadow-outline backdrop-blur-xl transition-colors duration-300": {},
        },
        ".ui-surface-interactive": {
          "@apply rounded-3xl border border-border/60 bg-card/80 shadow-outline backdrop-blur-xl transition-transform duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-floating": {},
        },
        ".ui-section": {
          "@apply rounded-3xl border border-border/60 bg-card/80 shadow-outline backdrop-blur-xl overflow-hidden": {},
        },
        ".ui-section__header": {
          "@apply flex flex-col gap-3 border-b border-border/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between": {},
        },
        ".ui-section__body": {
          "@apply px-6 py-6 space-y-5": {},
        },
        ".ui-metric-card": {
          "@apply flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-6 shadow-outline backdrop-blur-xl transition-transform duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-floating": {},
        },
        ".ui-metric-card__value": {
          "@apply text-3xl font-semibold text-foreground": {},
        },
        ".ui-metric-card__label": {
          "@apply text-sm font-medium text-muted-foreground": {},
        },
        ".ui-stat-grid": {
          "@apply grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4": {},
        },
        ".ui-data-list": {
          "@apply divide-y divide-border/50": {},
        },
        ".ui-data-list__item": {
          "@apply flex items-center justify-between gap-4 py-3": {},
        },
      });

      addUtilities({
        ".shadow-soft": {
          boxShadow: "0 24px 60px -32px rgba(15, 23, 42, 0.45)",
        },
        ".focus-ring": {
          "@apply outline-none ring-2 ring-primary/40 ring-offset-2 ring-offset-background": {},
        },
        ".ui-transition": {
          "@apply transition-all duration-300 ease-in-out": {},
        },
        ".ui-stable": {
          "@apply transform-gpu will-change-transform": {},
        },
        ".text-subtle": {
          "@apply text-muted-foreground": {},
        },
      });
    }),
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
