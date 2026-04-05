/**
 * saudi-data.ts — Shared static data constants for Saudi Arabia
 *
 * Single source of truth for cities, property types, facade directions,
 * legal statuses, and other Saudi-specific data used across frontend and backend.
 */

export const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الظهران", "تبوك", "الطائف", "بريدة", "خميس مشيط",
  "حائل", "نجران", "جازان", "ينبع", "أبها", "الجبيل", "الأحساء",
  "القطيف", "عنيزة", "سكاكا", "الباحة", "عرعر",
] as const;

export const SAUDI_REGIONS = [
  "الرياض", "مكة المكرمة", "المدينة المنورة", "المنطقة الشرقية", "عسير",
  "تبوك", "القصيم", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف",
] as const;

export const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة" },
  { value: "villa", label: "فيلا" },
  { value: "duplex", label: "دوبلكس" },
  { value: "land", label: "أرض" },
  { value: "commercial", label: "تجاري" },
  { value: "office", label: "مكتب" },
  { value: "warehouse", label: "مستودع" },
  { value: "building", label: "عمارة" },
  { value: "chalet", label: "شاليه" },
  { value: "farm", label: "مزرعة" },
] as const;

export const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
] as const;

export const PROPERTY_CATEGORIES = [
  { value: "residential", label: "سكني" },
  { value: "commercial", label: "تجاري" },
  { value: "industrial", label: "صناعي" },
  { value: "agricultural", label: "زراعي" },
  { value: "mixed_use", label: "متعدد الاستخدام" },
] as const;

export const FACADE_DIRECTIONS = [
  { value: "NORTH", label: "شمال" },
  { value: "SOUTH", label: "جنوب" },
  { value: "EAST", label: "شرق" },
  { value: "WEST", label: "غرب" },
  { value: "NORTH_EAST", label: "شمال شرق" },
  { value: "NORTH_WEST", label: "شمال غرب" },
  { value: "SOUTH_EAST", label: "جنوب شرق" },
  { value: "SOUTH_WEST", label: "جنوب غرب" },
  { value: "THREE_STREETS", label: "ثلاث شوارع" },
  { value: "FOUR_STREETS", label: "أربع شوارع" },
] as const;

export const LEGAL_STATUSES = [
  { value: "FREE", label: "صك حر" },
  { value: "MORTGAGED", label: "مرهون" },
  { value: "UNDER_DISPUTE", label: "تحت النزاع" },
  { value: "ENDOWMENT", label: "وقف" },
] as const;

export const FURNISHED_OPTIONS = [
  { value: "furnished", label: "مفروش" },
  { value: "semi_furnished", label: "مفروش جزئياً" },
  { value: "unfurnished", label: "بدون أثاث" },
] as const;

export const RENTAL_PERIODS = [
  { value: "monthly", label: "شهري" },
  { value: "quarterly", label: "ربع سنوي" },
  { value: "semi_annual", label: "نصف سنوي" },
  { value: "annual", label: "سنوي" },
] as const;

export const AVAILABLE_SERVICES = [
  { key: "electricity", label: "كهرباء" },
  { key: "water", label: "مياه" },
  { key: "sewage", label: "صرف صحي" },
  { key: "gas", label: "غاز" },
  { key: "fiber", label: "ألياف بصرية" },
] as const;

/** Facade direction label lookup */
export const FACADE_LABELS: Record<string, string> = Object.fromEntries(
  FACADE_DIRECTIONS.map(d => [d.value, d.label])
);

/** Legal status label lookup */
export const LEGAL_LABELS: Record<string, string> = Object.fromEntries(
  LEGAL_STATUSES.map(s => [s.value, s.label])
);

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 10000,
  MIN_TOKEN_LENGTH: 32,
} as const;
