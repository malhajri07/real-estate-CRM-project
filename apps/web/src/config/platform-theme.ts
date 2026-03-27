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
  "rounded-2xl border border-border bg-card shadow-sm overflow-hidden";

/** Card with hover elevation */
export const CARD_HOVER = "hover:shadow-md transition-all duration-300";

/** Typography */
export const TYPOGRAPHY = {
  pageTitle: "text-2xl lg:text-3xl font-black text-foreground tracking-tight",
  pageSubtitle: "text-sm font-bold text-muted-foreground uppercase tracking-widest",
  sectionTitle: "text-xl font-bold text-foreground",
  body: "text-sm text-foreground leading-relaxed",
  muted: "text-sm text-muted-foreground",
} as const;

/** Primary action button */
export const BUTTON_PRIMARY_CLASSES =
  "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all duration-200";

/** Badge variants for status display */
export const BADGE_STYLES = {
  default: "border-border bg-muted text-muted-foreground",
  success: "status-badge-active",
  warning: "status-badge-pending",
  destructive: "status-badge-rejected",
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
  "flex flex-col items-center justify-center py-16 px-4 text-center min-h-[200px] text-muted-foreground";

/** Metrics card (dashboard) */
export const METRICS_CARD_STYLES =
  "rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-300 bg-card text-center";

/** Platform background - matches --background CSS variable */
export const PLATFORM_BG = "bg-background";
