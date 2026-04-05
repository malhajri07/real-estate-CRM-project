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

const safeDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatAdminDate = (
  value?: string | Date | null,
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
export const formatNumber = (value?: number | string | null): string => {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return (value ?? 0).toLocaleString(NUMERIC_LOCALE);
  return new Intl.NumberFormat(NUMERIC_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

/**
 * Format SAR amount (number only, no symbol).
 * Use <SarPrice value={} /> component for display with the official SAMA icon.
 */
export const formatSAR = formatNumber;
export const formatPrice = (value?: number | null, _currency?: string): string => formatNumber(value);

/**
 * Safely parse any value to a number. Returns null if not parseable.
 * Use this instead of defining local toNumber() in pages.
 */
export const toNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return Number(value);
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Format currency with abbreviated suffix (e.g. 1.2M, 500K).
 * For full number display, use formatNumber() instead.
 */
export const formatCompact = (value?: number | null): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
};
