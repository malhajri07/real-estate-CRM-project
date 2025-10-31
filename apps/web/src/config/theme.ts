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
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
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
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
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
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  }
} as const;

// Common Component Styles
export const COMPONENT_STYLES = {
  // Page Container
  pageContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6',
  
  // Page Header
  pageHeader: 'mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
  pageTitle: 'text-2xl font-bold text-gray-900',
  pageSubtitle: 'text-sm text-gray-600 mt-1',
  
  // Card Styles
  card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  cardHeader: 'px-6 py-4 border-b border-gray-200',
  cardTitle: 'text-lg font-semibold text-gray-900',
  cardContent: 'px-6 py-4',
  
  // Button Styles
  buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
  buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors',
  buttonDanger: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
  
  // Input Styles
  input: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  
  // Table Styles
  table: 'min-w-full divide-y divide-gray-200',
  tableHeader: 'bg-gray-50',
  tableHeaderCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  tableBody: 'bg-white divide-y divide-gray-200',
  tableCell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
  
  // Badge Styles
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  badgeSuccess: 'bg-green-100 text-green-800',
  badgeWarning: 'bg-yellow-100 text-yellow-800',
  badgeError: 'bg-red-100 text-red-800',
  badgeInfo: 'bg-blue-100 text-blue-800',
  
  // Loading States
  loadingSpinner: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600',
  loadingText: 'text-sm text-gray-600',
  
  // Empty States
  emptyState: 'text-center py-12',
  emptyStateIcon: 'mx-auto h-12 w-12 text-gray-400',
  emptyStateTitle: 'text-lg font-medium text-gray-900 mt-2',
  emptyStateDescription: 'text-sm text-gray-600 mt-1',
  
  // Filter Bar
  filterBar: 'bg-white border border-gray-200 rounded-lg p-4 mb-6',
  filterGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  
  // Search Bar
  searchBar: 'relative',
  searchInput: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  searchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400',
  
  // Action Bar
  actionBar: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6',
  actionButtons: 'flex flex-wrap gap-2',
  
  // Stats Cards
  statsCard: 'bg-white rounded-lg border border-gray-200 p-6 shadow-sm',
  statsValue: 'text-2xl font-bold text-gray-900',
  statsLabel: 'text-sm font-medium text-gray-600',
  statsChange: 'text-sm font-medium',
  statsChangePositive: 'text-green-600',
  statsChangeNegative: 'text-red-600',
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
