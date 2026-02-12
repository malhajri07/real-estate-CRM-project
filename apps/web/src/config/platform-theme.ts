/**
 * platform-theme.ts - Platform Theme Configuration
 *
 * Location: apps/web/src/ → Config/ → platform-theme.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * Unified platform theme configuration. Aligned with dashboard design:
 * - Gradient cards, rounded-3xl, emerald accents
 * - Logical properties (border-s-4, ps-, pe-) for RTL
 * - Typography: font-black headers, slate palette
 *
 * Related Files:
 * - apps/web/src/config/theme.ts - General theme configuration
 * - apps/web/src/config/platform-page-structure.ts - Page structure configuration
 */

// Primary button - emerald gradient (matches dashboard)
export const BUTTON_PRIMARY = 'rgb(128 193 165)';
export const BUTTON_PRIMARY_CLASSES =
  'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200';

// Button variants
export const BUTTON_STYLES = {
  primary: `${BUTTON_PRIMARY_CLASSES}`,
  secondary: 'bg-white border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
  outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-xl transition-all',
  ghost: 'hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 rounded-xl transition-all',
  danger: 'bg-red-50 hover:bg-red-100 text-red-600 font-bold px-5 py-2.5 rounded-xl transition-all duration-200',
} as const;

// Typography - matches dashboard (font-black, slate-900)
export const TYPOGRAPHY = {
  pageTitle: 'text-2xl lg:text-3xl font-black text-slate-900 tracking-tight',
  pageSubtitle: 'text-sm font-bold text-slate-500 uppercase tracking-widest',
  sectionTitle: 'text-lg font-bold text-slate-900 tracking-tight',
  cardTitle: 'text-lg font-bold text-slate-900 tracking-tight',
  cardDescription: 'text-xs font-bold text-slate-500 uppercase tracking-widest',
  body: 'text-sm font-medium text-slate-700 leading-relaxed',
  label: 'text-xs font-bold text-slate-500 uppercase tracking-wider',
  caption: 'text-[10px] font-bold text-slate-400',
  button: 'text-sm font-bold',
} as const;

// Spacing - consistent spacing scale
export const SPACING = {
  section: 'space-y-6',
  cardPadding: 'p-6',
  headerPadding: 'px-6 py-5',
  contentPadding: 'px-6 py-5',
} as const;

// Card styles - clean, minimal, apple-style
export const CARD_STYLES = {
  container:
    'bg-white border-0 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300',
  header: 'px-6 pt-6 pb-2',
  title: 'text-lg font-bold text-slate-900 tracking-tight',
  description: 'text-sm font-medium text-slate-500',
  content: 'px-6 pb-6 pt-2',
} as const;

// Accent card variants (for section emphasis) - simplified
export const CARD_ACCENTS = {
  emerald: 'bg-white border-l-4 border-emerald-500',
  indigo: 'bg-white border-l-4 border-indigo-500',
  blue: 'bg-white border-l-4 border-blue-500',
} as const;

// Table styles - logical text-start, slate palette
export const TABLE_STYLES = {
  container: 'w-full border-collapse',
  header: 'bg-slate-50/80',
  headerCell: 'px-6 py-4 text-start text-xs font-bold text-slate-500 uppercase tracking-wider',
  body: 'bg-transparent divide-y divide-slate-100',
  cell: 'px-6 py-4 text-sm text-slate-700',
} as const;

// Badge styles - matches theme.ts (emerald, amber, red, blue)
export const BADGE_STYLES = {
  base: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  error: 'bg-red-50 text-red-700 border border-red-100',
  info: 'bg-blue-50 text-blue-700 border border-blue-100',
  secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
  orange: 'bg-orange-50 text-orange-700 border border-orange-100',
  purple: 'bg-purple-50 text-purple-700 border border-purple-100',
} as const;

/** Lead/Client status badge mapping */
export const getLeadStatusBadge = (status: string) => {
  switch (status) {
    case 'new': return BADGE_STYLES.warning;
    case 'qualified': return BADGE_STYLES.info;
    case 'showing': return BADGE_STYLES.orange;
    case 'negotiating': return BADGE_STYLES.purple;
    case 'negotiation': return BADGE_STYLES.purple;
    case 'closed': return BADGE_STYLES.success;
    case 'lost': return BADGE_STYLES.error;
    case 'contacted': return BADGE_STYLES.warning;
    default: return BADGE_STYLES.secondary;
  }
};

/** Property status badge mapping */
export const getPropertyStatusBadge = (status: string) => {
  switch (status) {
    case 'available': return BADGE_STYLES.success;
    case 'active': return BADGE_STYLES.warning;
    case 'sold': return BADGE_STYLES.error;
    case 'withdrawn': return BADGE_STYLES.secondary;
    case 'pending': return BADGE_STYLES.info;
    default: return BADGE_STYLES.secondary;
  }
};

/** Notification/campaign lead status badge mapping */
export const getNotificationStatusBadge = (status: string) => {
  switch (status) {
    case 'new': return BADGE_STYLES.info;
    case 'contacted': return BADGE_STYLES.warning;
    case 'qualified': return BADGE_STYLES.success;
    case 'lost': return BADGE_STYLES.error;
    default: return BADGE_STYLES.secondary;
  }
};

// Input styles - emerald focus, rounded-xl
export const INPUT_STYLES = {
  base: 'w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white/80 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-start',
  search: 'w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white/80 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-start',
} as const;

// Loading states
export const LOADING_STYLES = {
  container: 'flex-1 flex items-center justify-center min-h-[400px]',
  text: 'text-sm font-medium text-slate-500',
  spinner: 'animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600',
} as const;

// Empty states - baseline (slate-50, no backdrop-blur)
export const EMPTY_STYLES = {
  container: 'text-center py-16 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200',
  title: 'text-xl font-bold text-slate-900 mb-2',
  description: 'text-base text-slate-500 max-w-sm mx-auto leading-relaxed',
} as const;

// Filter/action bar styles
export const ACTION_BAR_STYLES = {
  container: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/40',
  buttons: 'flex flex-wrap gap-3',
} as const;

// Stats/metrics cards - clean apple style
export const METRICS_CARD_STYLES = {
  container:
    'bg-white border-0 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6',
  value: 'text-3xl font-bold text-slate-900',
  label: 'text-xs font-bold text-slate-500 uppercase tracking-wider',
  icon: 'flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600',
} as const;

// Icon containers - baseline (dashboard)
export const ICON_CONTAINER = 'flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600';
export const ICON_CONTAINER_SM = 'flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600';

// Empty state - baseline (dashboard)
export const EMPTY_STATE_BASELINE = 'flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center';

// RTL utility classes - use logical properties
export const RTL_UTILITIES = {
  text: 'text-start',
  margin: 'ms-2',
  padding: 'ps-4',
  spaceX: 'gap-4',
  spaceY: 'space-y-4',
  flexRow: 'flex-row',
} as const;

/** Icon spacing for RTL: ms-2 (LTR) or me-2 (RTL) */
export const getIconSpacing = (dir: 'ltr' | 'rtl') => (dir === 'rtl' ? 'ms-2' : 'me-2');

// Combined page wrapper
export const PAGE_WRAPPER = 'w-full space-y-6';

// Combined page container
export const PAGE_CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6';

// Header styles - unified across all platform pages
export const HEADER_STYLES = {
  height: 'h-[4.5rem]',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  title: 'text-xl font-black text-slate-900 tracking-tight truncate lg:text-2xl',
  subtitle: 'text-xs font-bold uppercase tracking-[0.2em] text-emerald-600/80',
  searchHeight: 'h-11',
  searchMaxWidth: 'max-w-2xl',
  searchRounded: 'rounded-xl',
  buttonIcon: 'rounded-xl',
} as const;

