import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const fontSans = ["Noto Kufi Arabic", "IBM Plex Sans Arabic", "Inter", "system-ui", "sans-serif"];
const fontSerif = ["IBM Plex Serif", "serif"];
const fontMono = ["JetBrains Mono", "monospace"];
const fontDisplay = ["Noto Kufi Arabic", "IBM Plex Sans Arabic", "Plus Jakarta Sans", "sans-serif"];
const fontArabic = ["Noto Kufi Arabic", "IBM Plex Sans Arabic", "Inter", "sans-serif"];
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
        sm: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "hsl(0 0% 98%)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(var(--foreground))",
          muted: "hsl(var(--muted))",
          accent: "hsl(var(--primary))",
          "accent-foreground": "hsl(var(--primary-foreground))",
          border: "hsl(var(--border))",
        },
        success: "hsl(160 84% 39%)",
        warning: "hsl(35 92% 62%)",
        error: "hsl(0 72% 51%)",
        info: "hsl(208 92% 54%)",
        brand: {
          DEFAULT: "hsl(var(--primary))",
          light: "hsl(var(--primary) / 0.1)",
          hover: "hsl(var(--primary) / 0.85)",
          400: "hsl(var(--primary))",
          500: "hsl(var(--primary))",
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
        aurora: {
          "0%, 100%": { backgroundPosition: "50% 50%, 50% 50%" },
          "50%": { backgroundPosition: "350% 50%, 350% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        aurora: "aurora 60s linear infinite",
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
        ".icon-container": {
          "@apply flex items-center justify-center rounded-2xl bg-primary/10 text-primary p-3": {},
        },
        ".icon-container-sm": {
          "@apply flex items-center justify-center rounded-xl bg-primary/10 text-primary p-2": {},
        },
        ".status-badge-active": {
          "@apply bg-emerald-50 text-emerald-800 border-emerald-200": {},
        },
        ".status-badge-inactive": {
          "@apply bg-slate-100 text-slate-700 border-border": {},
        },
        ".status-badge-pending": {
          "@apply bg-yellow-50 text-yellow-800 border-yellow-200": {},
        },
        ".status-badge-rejected": {
          "@apply bg-red-50 text-red-800 border-red-200": {},
        },
        ".status-badge-info": {
          "@apply bg-blue-50 text-blue-800 border-blue-200": {},
        },
        ".status-badge-warning": {
          "@apply bg-orange-50 text-orange-800 border-orange-200": {},
        },
        ".ui-data-list": {
          "@apply divide-y divide-border/50": {},
        },
        ".ui-data-list__item": {
          "@apply flex items-center justify-between gap-4 py-3": {},
        },
        ".ui-overlay": {
          "@apply pointer-events-none fixed inset-0 z-overlay": {},
        },
        ".ui-overlay__content": {
          "@apply pointer-events-auto": {},
        },
        ".ui-meter": {
          "@apply relative overflow-hidden rounded-full bg-muted": {},
        },
        ".ui-meter__fill": {
          width: "var(--meter-fill, 0%)",
          transitionProperty: "width",
          transitionDuration: "400ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".ui-stack": {
          "@apply flex overflow-hidden rounded-2xl bg-muted": {},
        },
        ".ui-stack__segment": {
          flexBasis: "var(--stack-segment, 0%)",
          flexGrow: "0",
          flexShrink: "0",
          transitionProperty: "flex-basis",
          transitionDuration: "500ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
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
