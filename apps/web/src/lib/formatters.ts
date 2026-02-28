/**
 * formatters.ts - Formatting Utilities
 * 
 * Location: apps/web/src/ → Lib/ → formatters.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Formatting utilities for dates, numbers, and other data. Provides:
 * - Date formatting functions
 * - Number formatting
 * - Currency formatting
 * 
 * Related Files:
 * - Used throughout the application for data formatting
 */

const DEFAULT_LOCALE = "ar-SA";

/** Use en-US for all numeric values (0-9) across the application */
export const NUMERIC_LOCALE = "en-US";

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DEFAULT_DATE_OPTIONS,
  hour: "2-digit",
  minute: "2-digit",
};

const safeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatAdminDate = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
): string => {
  const date = safeDate(value);
  return date
    ? new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(date)
    : "—";
};

export const formatAdminDateTime = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_OPTIONS,
): string => formatAdminDate(value, options);

/** Format number with en-US locale (Western digits 0-9) */
export const formatNumber = (value?: number | null): string =>
  (value ?? 0).toLocaleString(NUMERIC_LOCALE);

/** Format price/currency with en-US locale */
export const formatPrice = (
  value?: number | null,
  currency: string = "SAR",
  options?: Intl.NumberFormatOptions
): string => {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(NUMERIC_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};
