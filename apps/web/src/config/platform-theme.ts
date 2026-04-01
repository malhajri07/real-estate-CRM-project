/**
 * platform-theme.ts - Design System Tokens
 *
 * Single source of truth for platform UI styling. Use these constants
 * across all platform pages for consistent look and feel.
 *
 * Shared constants (border-radius, shadows, spacing, chart colors) are
 * defined in design-tokens.ts — import from there for cross-cutting values.
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
  container: "rounded-2xl border border-border bg-card shadow-sm overflow-hidden",
  wrapper: "min-w-[900px]",
  header: "bg-muted/50",
  headerCell: "text-end h-12 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
  cell: "py-4 text-sm",
  row: "border-b border-border hover:bg-muted/30 transition-colors",
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

// ── Grid helpers (shared by admin + platform pages) ──────────────────────────
/** 4-column metrics row: 1 col → 2 col (sm) → 4 col (lg) */
export const GRID_METRICS = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4";
/** 2-column split: 1 col → 2 col (lg) */
export const GRID_TWO_COL = "grid grid-cols-1 gap-6 lg:grid-cols-2";
/** 3-column split: 1 col → 3 col (lg) */
export const GRID_THREE_COL = "grid grid-cols-1 gap-6 lg:grid-cols-3";
/** 2-column form fields: 1 col → 2 col (md) */
export const GRID_FORM = "grid grid-cols-1 gap-4 md:grid-cols-2";

// ── Form Styles ────────────────────────────────────────────────────────────
export const FORM_STYLES = {
  label: "text-xs font-bold text-muted-foreground uppercase tracking-wider ps-1",
  inputWrapper: "relative group",
  helperText: "text-xs text-muted-foreground ps-1",
  errorText: "text-xs text-destructive ps-1",
  fieldGroup: "space-y-2",
  sectionGroup: "space-y-6",
  input: "h-11 bg-card/50 border-border focus:bg-card focus:border-primary/20 focus:ring-4 focus:ring-primary/10 rounded-xl",
} as const;

// ── Dialog / Sheet Defaults ────────────────────────────────────────────────
export const DIALOG_DEFAULTS = {
  sheetSide: "start" as const,
  sheetWidth: "w-full sm:max-w-xl",
  sheetPadding: "space-y-6 py-6",
  dialogMaxWidth: "max-w-2xl",
  footerGap: "gap-2",
} as const;

// ── Search Input ───────────────────────────────────────────────────────────
export const SEARCH_INPUT_STYLES = {
  wrapper: "relative flex-1 max-w-sm",
  icon: "absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
  input: "pe-10",
} as const;

// ── Card Header ────────────────────────────────────────────────────────────
export const CARD_HEADER_STYLES = {
  wrapper: "flex items-center gap-3",
  iconWrapper: "flex items-center justify-center rounded-xl bg-primary/10 p-2",
  icon: "h-5 w-5 text-primary",
  titleGroup: "flex-1",
} as const;

// ── Section Divider ────────────────────────────────────────────────────────
export const SECTION_DIVIDER =
  "w-full h-px bg-gradient-to-r from-transparent via-border to-transparent";

// ── Pagination ─────────────────────────────────────────────────────────────
export const PAGINATION_STYLES = {
  wrapper: "flex items-center justify-between",
  info: "text-sm text-muted-foreground",
  buttons: "flex items-center gap-2",
  pageButton: "w-8 h-8 p-0",
} as const;
