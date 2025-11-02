/**
 * Unified Platform Theme Configuration
 * 
 * Defines consistent styling for all platform pages:
 * - Button colors (mapped consistently)
 * - Font sizes (matched across pages)
 * - Spacing and layout
 * - RTL support
 * 
 * All styles use Tailwind CSS only (no global CSS)
 */

// Primary button color (rgb(128 193 165)) - emerald-400
export const BUTTON_PRIMARY = 'rgb(128 193 165)';
export const BUTTON_PRIMARY_CLASSES = 'bg-[rgb(128_193_165)] hover:opacity-90 text-white';

// Button variants
export const BUTTON_STYLES = {
  primary: `${BUTTON_PRIMARY_CLASSES} font-medium px-4 py-2 rounded-lg transition-all`,
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors',
  ghost: 'hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
} as const;

// Typography - unified font sizes
export const TYPOGRAPHY = {
  pageTitle: 'text-2xl font-bold text-gray-900',
  pageSubtitle: 'text-sm text-gray-600',
  sectionTitle: 'text-lg font-semibold text-gray-900',
  cardTitle: 'text-lg font-medium text-gray-900',
  body: 'text-sm text-gray-700',
  label: 'text-sm font-medium text-gray-700',
  caption: 'text-xs text-gray-500',
  button: 'text-sm font-medium',
} as const;

// Spacing - consistent spacing scale
export const SPACING = {
  section: 'space-y-6',
  cardPadding: 'p-6',
  headerPadding: 'px-6 py-4',
  contentPadding: 'px-6 py-4',
} as const;

// Card styles
export const CARD_STYLES = {
  container: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  header: 'border-b border-gray-200',
  title: TYPOGRAPHY.cardTitle,
  content: 'space-y-4',
} as const;

// Table styles
export const TABLE_STYLES = {
  container: 'w-full border-collapse',
  header: 'bg-gray-50 text-right',
  headerCell: 'px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider text-right',
  body: 'bg-white divide-y divide-gray-200',
  cell: 'px-6 py-4 text-sm text-gray-900 text-right',
} as const;

// Badge styles
export const BADGE_STYLES = {
  base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
} as const;

// Input styles
export const INPUT_STYLES = {
  base: 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(128_193_165)] focus:border-[rgb(128_193_165)] transition-colors text-right',
  search: 'w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(128_193_165)] focus:border-[rgb(128_193_165)] transition-colors text-right',
} as const;

// Loading states
export const LOADING_STYLES = {
  container: 'flex-1 flex items-center justify-center min-h-[400px]',
  text: 'text-sm text-gray-600',
  spinner: 'animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(128_193_165)]',
} as const;

// Empty states
export const EMPTY_STYLES = {
  container: 'text-center py-12',
  title: 'text-lg font-medium text-gray-900 mt-2',
  description: 'text-sm text-gray-600 mt-1',
} as const;

// Filter/action bar styles
export const ACTION_BAR_STYLES = {
  container: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6',
  buttons: 'flex flex-wrap gap-2',
} as const;

// Stats/metrics cards
export const METRICS_CARD_STYLES = {
  container: 'bg-white rounded-lg border border-gray-200 p-6 shadow-sm',
  value: 'text-2xl font-bold text-gray-900',
  label: 'text-sm font-medium text-gray-600',
} as const;

// RTL utility classes
export const RTL_UTILITIES = {
  text: 'text-right',
  margin: 'ml-2',
  padding: 'pr-4',
  spaceX: 'space-x-4 rtl:space-x-reverse',
  spaceY: 'space-y-4',
  flexRow: 'flex-row-reverse',
} as const;

// Combined page wrapper
export const PAGE_WRAPPER = 'w-full space-y-6 dir-rtl';

// Combined page container
export const PAGE_CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6';

