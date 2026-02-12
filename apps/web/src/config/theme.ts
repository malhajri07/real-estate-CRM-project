/**
 * theme.ts - Theme Configuration
 * 
 * Location: apps/web/src/ → Config/ → theme.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Unified theme configuration for platform pages. Defines:
 * - Consistent styling patterns
 * - Color palette
 * - Spacing and typography
 * - Component styling
 * 
 * Related Files:
 * - apps/web/src/config/platform-theme.ts - Platform-specific theme
 */

/**
 * Unified Theme Configuration for Platform Pages
 * 
 * This file defines consistent styling patterns, colors, spacing, and components
 * to ensure a uniform look and feel across all platform pages.
 */

export const PLATFORM_THEME = {
  // Color Palette
  colors: {
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5', 
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Emerald 500
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
    }
  },

  // Spacing Scale
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
  },

  // Border Radius
  borderRadius: {
    sm: '0.5rem',     // 8px (Updated for softer look)
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgba(16, 185, 129, 0.15)', // Custom glow
  },

  // Typography
  typography: {
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900', // Added for headers
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.6', // Increased for better readability
      relaxed: '1.8',
    }
  }
} as const;

// Common Component Styles
export const COMPONENT_STYLES = {
  // Page Container
  // Adjusted to avoid double padding if PlatformShell already provides it, but kept robust
  pageContainer: 'w-full space-y-6',
  
  // Page Header
  pageHeader: 'mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
  pageTitle: 'text-3xl font-black text-slate-900 tracking-tight',
  pageSubtitle: 'text-lg text-slate-600 mt-2 leading-relaxed',
  
  // Card Styles
  card: 'bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300',
  cardHeader: 'px-6 py-5 border-b border-slate-100/60',
  cardTitle: 'text-xl font-bold text-slate-900',
  cardContent: 'px-6 py-5',
  
  // Button Styles
  buttonPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200',
  buttonSecondary: 'bg-white border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
  buttonDanger: 'bg-red-50 hover:bg-red-100 text-red-600 font-bold px-5 py-2.5 rounded-xl transition-all duration-200',
  
  // Input Styles
  input: 'w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200',
  
  // Table Styles
  table: 'min-w-full divide-y divide-slate-100',
  tableHeader: 'bg-slate-50/50',
  tableHeaderCell: 'px-6 py-4 text-start text-xs font-bold text-slate-500 uppercase tracking-wider',
  tableBody: 'bg-transparent divide-y divide-slate-100',
  tableCell: 'px-6 py-4 whitespace-nowrap text-sm text-slate-700',
  
  // Badge Styles
  badge: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm',
  badgeSuccess: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  badgeWarning: 'bg-amber-50 text-amber-700 border border-amber-100',
  badgeError: 'bg-red-50 text-red-700 border border-red-100',
  badgeInfo: 'bg-blue-50 text-blue-700 border border-blue-100',
  
  // Loading States
  loadingSpinner: 'animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600',
  loadingText: 'text-sm font-medium text-slate-500',
  
  // Empty States
  emptyState: 'text-center py-16 px-4 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200',
  emptyStateIcon: 'mx-auto h-16 w-16 text-slate-300 mb-4',
  emptyStateTitle: 'text-xl font-bold text-slate-900 mb-2',
  emptyStateDescription: 'text-base text-slate-500 max-w-sm mx-auto leading-relaxed',
  
  // Filter Bar
  filterBar: 'bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-5 mb-8 shadow-sm',
  filterGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5',
  
  // Search Bar
  searchBar: 'relative',
  searchInput: 'w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white/80 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200',
  searchIcon: 'absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400',
  
  // Action Bar
  actionBar: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/40',
  actionButtons: 'flex flex-wrap gap-3',
  
  // Stats Cards
  statsCard: 'bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 p-6 shadow-lg hover:shadow-xl transition-all duration-300',
  statsValue: 'text-3xl font-black text-slate-900 my-1',
  statsLabel: 'text-sm font-bold text-slate-500 uppercase tracking-wider',
  statsChange: 'text-sm font-bold flex items-center gap-1',
  statsChangePositive: 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full',
  statsChangeNegative: 'text-red-600 bg-red-50 px-2 py-0.5 rounded-full',
} as const;

// RTL Support Classes
export const RTL_CLASSES = {
  textAlign: {
    left: 'text-left',
    right: 'text-right',
  },
  margin: {
    left: 'ml-',
    right: 'mr-',
  },
  padding: {
    left: 'pl-',
    right: 'pr-',
  },
  border: {
    left: 'border-l',
    right: 'border-r',
  }
} as const;

// Responsive Breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
