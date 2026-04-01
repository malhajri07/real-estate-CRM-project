/**
 * constants/labels.ts — Centralized bilingual label maps
 *
 * Single source of truth for all user-facing status labels in Arabic & English.
 * Import from here instead of duplicating switch statements across pages.
 *
 * Usage:
 *   import { LEAD_STATUS, getLocalizedLabel } from "@/constants/labels";
 *   const label = getLocalizedLabel(LEAD_STATUS, status, language);
 */

export type SupportedLanguage = "ar" | "en";

interface BilingualMap {
  ar: Record<string, string>;
  en: Record<string, string>;
}

// ─── Helper — safe bilingual label lookup with fallback ────────────────────
export function getLocalizedLabel(
  map: BilingualMap,
  key: string | undefined | null,
  language: SupportedLanguage = "ar",
): string {
  if (!key) return "—";
  const langMap = map[language] ?? map.ar;
  return langMap[key] ?? langMap[key.toLowerCase()] ?? key;
}

/** Legacy helper for backward compat — uses Arabic map only */
export function getLabel(map: Record<string, string>, key: string | undefined | null): string {
  if (!key) return "—";
  return map[key] ?? map[key.toLowerCase()] ?? key;
}

// ─── Lead / pipeline status ───────────────────────────────────────────────────
export const LEAD_STATUS: BilingualMap = {
  ar: { new: "جديد", qualified: "مؤهل", viewing: "معاينة", negotiation: "تفاوض", closed: "مغلق", lost: "مفقود" },
  en: { new: "New", qualified: "Qualified", viewing: "Viewing", negotiation: "Negotiation", closed: "Closed", lost: "Lost" },
};
/** @deprecated Use LEAD_STATUS with getLocalizedLabel() instead */
export const LEAD_STATUS_LABELS: Record<string, string> = LEAD_STATUS.ar;

export const LEAD_STATUS_BADGE_CLASS: Record<string, string> = {
  new: "status-badge-info",
  qualified: "status-badge-active",
  viewing: "status-badge-warning",
  negotiation: "status-badge-warning",
  closed: "status-badge-active",
  lost: "status-badge-inactive",
};

// ─── Property listing status ───────────────────────────────────────────────────
export const LISTING_STATUS: BilingualMap = {
  ar: {
    pending: "بانتظار المراجعة", approved: "معتمد", rejected: "مرفوض",
    active: "نشط", inactive: "غير نشط", under_review: "قيد المراجعة",
    needs_info: "مطلوب معلومات", draft: "مسودة", published: "منشور", archived: "مؤرشف",
  },
  en: {
    pending: "Pending Review", approved: "Approved", rejected: "Rejected",
    active: "Active", inactive: "Inactive", under_review: "Under Review",
    needs_info: "Needs Info", draft: "Draft", published: "Published", archived: "Archived",
  },
};
/** @deprecated Use LISTING_STATUS with getLocalizedLabel() instead */
export const LISTING_STATUS_LABELS: Record<string, string> = LISTING_STATUS.ar;

export const LISTING_STATUS_BADGE_CLASS: Record<string, string> = {
  pending: "status-badge-pending",
  approved: "status-badge-active",
  rejected: "status-badge-rejected",
  active: "status-badge-active",
  inactive: "status-badge-inactive",
  under_review: "status-badge-pending",
  needs_info: "status-badge-warning",
  draft: "status-badge-inactive",
  published: "status-badge-active",
  archived: "status-badge-inactive",
};

// ─── Support ticket / complaint status ─────────────────────────────────────────
export const TICKET_STATUS: BilingualMap = {
  ar: { open: "مفتوحة", in_progress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلقة" },
  en: { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" },
};
/** @deprecated Use TICKET_STATUS with getLocalizedLabel() instead */
export const TICKET_STATUS_LABELS: Record<string, string> = TICKET_STATUS.ar;

export const TICKET_STATUS_BADGE_CLASS: Record<string, string> = {
  open: "status-badge-info",
  in_progress: "status-badge-warning",
  resolved: "status-badge-active",
  closed: "status-badge-inactive",
};

// ─── User approval status ──────────────────────────────────────────────────────
export const USER_STATUS: BilingualMap = {
  ar: { active: "نشط", inactive: "غير نشط", pending: "قيد المراجعة", needsInfo: "مطلوب معلومات", rejected: "مرفوض", unknown: "غير محدد" },
  en: { active: "Active", inactive: "Inactive", pending: "Pending", needsInfo: "Needs Info", rejected: "Rejected", unknown: "Unknown" },
};
/** @deprecated Use USER_STATUS with getLocalizedLabel() instead */
export const USER_STATUS_LABELS: Record<string, string> = USER_STATUS.ar;

export const USER_STATUS_BADGE_CLASS: Record<string, string> = {
  active: "status-badge-active",
  inactive: "status-badge-inactive",
  pending: "status-badge-pending",
  needsInfo: "status-badge-warning",
  rejected: "status-badge-rejected",
  unknown: "status-badge-inactive",
};

// ─── Interest / deal type ──────────────────────────────────────────────────────
export const INTEREST_TYPE: BilingualMap = {
  ar: { buying: "شراء", selling: "بيع", renting: "تأجير", buy: "شراء", sell: "بيع", rent: "تأجير" },
  en: { buying: "Buying", selling: "Selling", renting: "Renting", buy: "Buy", sell: "Sell", rent: "Rent" },
};
/** @deprecated Use INTEREST_TYPE with getLocalizedLabel() instead */
export const INTEREST_TYPE_LABELS: Record<string, string> = INTEREST_TYPE.ar;

// ─── Marital status ────────────────────────────────────────────────────────────
export const MARITAL_STATUS: BilingualMap = {
  ar: { single: "أعزب", married: "متزوج", divorced: "مطلق", widowed: "أرمل" },
  en: { single: "Single", married: "Married", divorced: "Divorced", widowed: "Widowed" },
};
/** @deprecated Use MARITAL_STATUS with getLocalizedLabel() instead */
export const MARITAL_STATUS_LABELS: Record<string, string> = MARITAL_STATUS.ar;

// ─── Property type ─────────────────────────────────────────────────────────────
export const PROPERTY_TYPE: BilingualMap = {
  ar: { apartment: "شقة", villa: "فيلا", land: "أرض", commercial: "تجاري", office: "مكتب", warehouse: "مستودع", building: "مبنى", farm: "مزرعة", chalet: "شاليه" },
  en: { apartment: "Apartment", villa: "Villa", land: "Land", commercial: "Commercial", office: "Office", warehouse: "Warehouse", building: "Building", farm: "Farm", chalet: "Chalet" },
};
/** @deprecated Use PROPERTY_TYPE with getLocalizedLabel() instead */
export const PROPERTY_TYPE_LABELS: Record<string, string> = PROPERTY_TYPE.ar;

// ─── Listing type ──────────────────────────────────────────────────────────────
export const LISTING_TYPE: BilingualMap = {
  ar: { sale: "للبيع", rent: "للإيجار", both: "بيع وإيجار" },
  en: { sale: "For Sale", rent: "For Rent", both: "Sale & Rent" },
};
/** @deprecated Use LISTING_TYPE with getLocalizedLabel() instead */
export const LISTING_TYPE_LABELS: Record<string, string> = LISTING_TYPE.ar;

// ─── Time period labels (charts/metrics) ───────────────────────────────────────
export const TIME_PERIOD: BilingualMap = {
  ar: { today: "اليوم", week7: "٧ أيام", month30: "٣٠ يوم" },
  en: { today: "Today", week7: "7 Days", month30: "30 Days" },
};
/** @deprecated Use TIME_PERIOD with getLocalizedLabel() instead */
export const TIME_PERIOD_LABELS = {
  today: "اليوم",
  week7: "٧ أيام",
  month30: "٣٠ يوم",
} as const;

export type TimePeriod = keyof typeof TIME_PERIOD_LABELS;

// ─── Role labels ───────────────────────────────────────────────────────────────
export const ROLE: BilingualMap = {
  ar: { admin: "مدير النظام", agent: "وكيل عقارات", buyer: "مشتري", seller: "بائع", moderator: "مشرف", org_admin: "مدير المنظمة" },
  en: { admin: "System Admin", agent: "Real Estate Agent", buyer: "Buyer", seller: "Seller", moderator: "Moderator", org_admin: "Org Admin" },
};
/** @deprecated Use ROLE with getLocalizedLabel() instead */
export const ROLE_LABELS: Record<string, string> = ROLE.ar;

// ─── Pipeline stage labels ────────────────────────────────────────────────────
export const PIPELINE_STAGE: BilingualMap = {
  ar: { lead: "عميل محتمل", qualified: "مؤهل", viewing: "معاينة", negotiation: "تفاوض", offer: "عرض", closed: "مغلق" },
  en: { lead: "Lead", qualified: "Qualified", viewing: "Viewing", negotiation: "Negotiation", offer: "Offer", closed: "Closed" },
};

// ─── Common UI labels ─────────────────────────────────────────────────────────
export const COMMON_UI: BilingualMap = {
  ar: {
    search: "البحث...",
    no_data: "لا توجد بيانات",
    no_results: "لم يتم العثور على أي سجلات",
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    add: "إضافة",
    close: "إغلاق",
    confirm: "تأكيد",
    previous: "السابق",
    next: "التالي",
    showing: "عرض",
    of: "من",
    to: "إلى",
    actions: "الإجراءات",
    status: "الحالة",
    date: "التاريخ",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    export: "تصدير",
    import: "استيراد",
    filter: "تصفية",
    refresh: "تحديث",
    back: "رجوع",
    not_specified: "غير محدد",
  },
  en: {
    search: "Search...",
    no_data: "No data available",
    no_results: "No records found",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    add: "Add",
    close: "Close",
    confirm: "Confirm",
    previous: "Previous",
    next: "Next",
    showing: "Showing",
    of: "of",
    to: "to",
    actions: "Actions",
    status: "Status",
    date: "Date",
    name: "Name",
    email: "Email",
    phone: "Phone",
    export: "Export",
    import: "Import",
    filter: "Filter",
    refresh: "Refresh",
    back: "Back",
    not_specified: "Not Specified",
  },
};
