/**
 * icon-styles.ts - Unified icon styling
 *
 * Single source of truth for icon colors and containers.
 * Use these constants instead of ad-hoc color classes.
 */

/** Icon container for metric/stat cards (e.g. MetricCard, admin stats) */
export const ICON_CONTAINER =
  "flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600";

/** Icon size for cards */
export const ICON_SIZE = "h-5 w-5";

/** Icon size for inline/small contexts */
export const ICON_SIZE_SM = "h-4 w-4";

/** Unified icon color class - use for all icons */
export const ICON_COLOR = "text-slate-600";

/** Hover state for icon buttons - similar shade, no colorful icons */
export const ICON_HOVER = "hover:text-slate-700 hover:bg-slate-100";
