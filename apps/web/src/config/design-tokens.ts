/**
 * design-tokens.ts — Single source of truth for design system constants
 *
 * Border Radius Scale:
 *   rounded-lg  = small elements (badges, tags, inline buttons)
 *   rounded-xl  = inputs, selects, textareas, alerts, tabs, toggles, tooltips, popovers
 *   rounded-2xl = cards, dialogs, sheets, metric cards, table containers
 *   rounded-full = avatars, pills
 */

// ── Border Radius ───────────────────────────────────────────────────────────
export const BORDER_RADIUS = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  pill: "rounded-full",
} as const;

// ── Shadows ─────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
} as const;

// ── Spacing ─────────────────────────────────────────────────────────────────
export const SPACING = {
  cardPadding: "p-6",
  cardGap: "gap-6",
  sectionGap: "space-y-6",
  innerGap: "space-y-4",
  fieldGap: "space-y-2",
  gap4: "gap-4",
  gap6: "gap-6",
} as const;

// ── Chart Colors (centralized palette for all recharts usage) ───────────────
export const CHART_COLORS = {
  primary: "hsl(164, 72%, 40%)",
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  red: "#ef4444",
  cyan: "#06b6d4",
  pink: "#ec4899",
} as const;

export const CHART_COLOR_ARRAY = Object.values(CHART_COLORS);

// ── Chart Tooltip & Height ──────────────────────────────────────────────────
export const CHART_TOOLTIP_CLASSES =
  "bg-card border border-border rounded-xl shadow-lg p-3 text-sm text-end";

export const CHART_HEIGHT = 320;

// ── Admin Button Primary ────────────────────────────────────────────────────
export const ADMIN_BUTTON_PRIMARY =
  "premium-gradient text-white border-0 shadow-lg shadow-primary/10 h-12 px-8 rounded-2xl font-bold";

// ── Admin Page Header ───────────────────────────────────────────────────────
export const ADMIN_PAGE_HEADER_CARD =
  "rounded-2xl border border-border bg-card shadow-sm p-6 relative overflow-hidden";

export const ADMIN_PAGE_TITLE =
  "text-2xl lg:text-3xl font-black text-foreground tracking-tight";

// ── Status Colors ───────────────────────────────────────────────────────────
/** Centralized status color map — use instead of per-page hardcoded statusMaps */
export const STATUS_COLORS = {
  success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "status-badge-active" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "status-badge-warning" },
  error: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", badge: "status-badge-rejected" },
  info: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", badge: "status-badge-info" },
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", badge: "status-badge-pending" },
  inactive: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", badge: "status-badge-inactive" },
  primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", badge: "bg-primary/10 text-primary" },
} as const;

// ── Action Buttons ──────────────────────────────────────────────────────────
export const ACTION_BUTTON_ICON = "h-8 w-8 p-0 rounded-lg";
export const ICON_SPACING = "me-2";

// ── Delete / Destructive Button ─────────────────────────────────────────────
export const DELETE_BUTTON_STYLES =
  "text-destructive hover:bg-destructive/10 hover:text-destructive";

// ── Metric Card Icon Container ──────────────────────────────────────────────
export const METRIC_CARD_ICON = {
  container: "flex items-center justify-center rounded-2xl bg-primary/10 p-3",
  containerSm: "flex items-center justify-center rounded-xl bg-primary/10 p-2",
  icon: "h-5 w-5 text-primary",
  iconLg: "h-6 w-6 text-primary",
} as const;
