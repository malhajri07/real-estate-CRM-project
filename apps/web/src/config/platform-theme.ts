/**
 * platform-theme.ts - Design System Tokens
 *
 * Single source of truth for platform UI styling. Use these constants
 * across all platform pages for consistent look and feel.
 */

/** Page wrapper - use as outer div for all platform pages */
export const PAGE_WRAPPER = "w-full space-y-6";

/** Standard card container */
export const CARD_STYLES =
  "rounded-2xl border border-border bg-white shadow-sm overflow-hidden";

/** Card with hover elevation */
export const CARD_HOVER = "hover:shadow-md transition-all duration-300";

/** Typography */
export const TYPOGRAPHY = {
  pageTitle: "text-2xl lg:text-3xl font-black text-slate-900 tracking-tight",
  pageSubtitle: "text-sm font-bold text-slate-500 uppercase tracking-widest",
  sectionTitle: "text-xl font-bold text-slate-800",
  body: "text-sm text-slate-700 leading-relaxed",
  muted: "text-sm text-slate-500",
} as const;

/** Primary action button (emerald gradient) */
export const BUTTON_PRIMARY_CLASSES =
  "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200";

/** Badge variants for status display */
export const BADGE_STYLES = {
  default: "border-border bg-muted text-muted-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  destructive: "border-red-200 bg-red-50 text-red-700",
} as const;

/** Table styling */
export const TABLE_STYLES = {
  wrapper: "min-w-[900px]",
  header: "text-end bg-muted/50",
  cell: "text-end",
} as const;

/** Loading skeleton */
export const LOADING_STYLES = "animate-pulse bg-muted rounded-lg";

/** Empty state container */
export const EMPTY_STYLES =
  "flex flex-col items-center justify-center py-16 px-4 text-center min-h-[200px] text-slate-500";

/** Metrics card (dashboard) */
export const METRICS_CARD_STYLES =
  "rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white text-center";

/** Platform background - matches --background CSS variable */
export const PLATFORM_BG = "bg-[rgb(245,245,247)]";
