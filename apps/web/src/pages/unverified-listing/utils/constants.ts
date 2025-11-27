/**
 * Constants for Unverified Listing Page
 */

import type { ListingType, Step } from "../types";

export const LISTING_TYPES: ListingType[] = [
  { value: "بيع", label: "بيع" },
  { value: "إيجار", label: "إيجار" },
];

export const MAX_IMAGE_COUNT = 10;
export const MAX_IMAGE_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB total

export const STEPS: Step[] = [
  { id: 1, title: "البيانات الأساسية", description: "عنوان العقار، الفئة، النوع، والسعر" },
  { id: 2, title: "الموقع", description: "المنطقة، المدينة، والحي" },
  { id: 3, title: "المواصفات", description: "الغرف، الحمامات، المساحة، والتفاصيل" },
  { id: 4, title: "المرافق", description: "المميزات والخدمات المتاحة" },
  { id: 5, title: "الصور", description: "صور العقار" },
  { id: 6, title: "معلومات التواصل", description: "بيانات الاتصال" },
];

