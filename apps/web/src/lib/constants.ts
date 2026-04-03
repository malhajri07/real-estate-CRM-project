/**
 * constants.ts — Application-wide constants
 *
 * Central location for all magic numbers, configuration values,
 * and static data used across the application.
 */

/** Default pagination settings */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 500,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
} as const;

/** API request timeouts (ms) */
export const TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 120000,
  EXPORT: 60000,
  SEARCH: 10000,
} as const;

/** Saudi Arabian cities */
export const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة",
  "الدمام", "الخبر", "الظهران", "أبها", "تبوك",
  "بريدة", "حائل", "الطائف", "نجران", "جازان",
  "ينبع", "الأحساء", "القطيف", "خميس مشيط",
] as const;

/** Currency settings */
export const CURRENCY = {
  DEFAULT: "SAR",
  SYMBOL: "ر.س",
  LOCALE: "en-US",
} as const;

/** File upload limits */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 20,
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
  ACCEPTED_DOC_TYPES: ["application/pdf", "application/msword"] as const,
} as const;

/** Animation durations (ms) */
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SKELETON_MIN: 2000,
} as const;
