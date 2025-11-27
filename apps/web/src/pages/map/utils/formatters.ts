/**
 * Formatting utilities for the Map page
 */

import type { Coordinates } from '../types';

/**
 * Converts tuple-based coordinate representation into Google Maps LatLng format
 */
export const toLatLngLiteral = (point: Coordinates) => ({ lat: point[0], lng: point[1] });

/**
 * Formats currency values using SAR as the implicit currency
 */
export const formatCurrency = (value: number | null): string => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
  }).format(value);
  return `${formatted} ريال`;
};

/**
 * Formats marker price for display on map markers
 */
export const formatMarkerPrice = (value: number | null): string => {
  if (value === null || typeof value !== "number" || Number.isNaN(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

/**
 * Escapes SVG text content to prevent XSS
 */
export const escapeSvgText = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Converts square feet to square meters
 */
export const sqmFromSquareFeet = (squareFeet: number | null | undefined) =>
  squareFeet && squareFeet > 0 ? Math.round(squareFeet * 0.092903) : null;

/**
 * Map property status to Tailwind badge classes
 */
export const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case "active":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "pending":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "sold":
      return "bg-green-100 text-green-800 border border-green-200";
    case "withdrawn":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

/**
 * Attempts to sanitize and parse numeric values from different sources
 */
export const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const sanitized = value.trim().replace(/[^\d.,-]/g, "").replace(/,/g, "");
    if (!sanitized) return null;
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Applies loose parsing rules to numbers typed into filter inputs
 */
export const parseFilterNumber = (value: string) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

