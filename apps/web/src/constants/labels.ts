/**
 * constants/labels.ts — Centralized Arabic label maps
 *
 * Single source of truth for all user-facing Arabic status labels.
 * Import from here instead of duplicating switch statements across pages.
 */

// ─── Lead / pipeline status ───────────────────────────────────────────────────
export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  qualified: "مؤهل",
  viewing: "معاينة",
  negotiation: "تفاوض",
  closed: "مغلق",
  lost: "مفقود",
};

export const LEAD_STATUS_BADGE_CLASS: Record<string, string> = {
  new: "status-badge-info",
  qualified: "status-badge-active",
  viewing: "status-badge-warning",
  negotiation: "status-badge-warning",
  closed: "status-badge-active",
  lost: "status-badge-inactive",
};

// ─── Property listing status ───────────────────────────────────────────────────
export const LISTING_STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  active: "نشط",
  inactive: "غير نشط",
  under_review: "قيد المراجعة",
  needs_info: "مطلوب معلومات",
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

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
export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

export const TICKET_STATUS_BADGE_CLASS: Record<string, string> = {
  open: "status-badge-info",
  in_progress: "status-badge-warning",
  resolved: "status-badge-active",
  closed: "status-badge-inactive",
};

// ─── User approval status ──────────────────────────────────────────────────────
export const USER_STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  pending: "قيد المراجعة",
  needsInfo: "مطلوب معلومات",
  rejected: "مرفوض",
  unknown: "غير محدد",
};

export const USER_STATUS_BADGE_CLASS: Record<string, string> = {
  active: "status-badge-active",
  inactive: "status-badge-inactive",
  pending: "status-badge-pending",
  needsInfo: "status-badge-warning",
  rejected: "status-badge-rejected",
  unknown: "status-badge-inactive",
};

// ─── Interest / deal type ──────────────────────────────────────────────────────
export const INTEREST_TYPE_LABELS: Record<string, string> = {
  buying: "شراء",
  selling: "بيع",
  renting: "تأجير",
  buy: "شراء",
  sell: "بيع",
  rent: "تأجير",
};

// ─── Marital status ────────────────────────────────────────────────────────────
export const MARITAL_STATUS_LABELS: Record<string, string> = {
  single: "أعزب",
  married: "متزوج",
  divorced: "مطلق",
  widowed: "أرمل",
};

// ─── Property type ─────────────────────────────────────────────────────────────
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  villa: "فيلا",
  land: "أرض",
  commercial: "تجاري",
  office: "مكتب",
  warehouse: "مستودع",
  building: "مبنى",
  farm: "مزرعة",
  chalet: "شاليه",
};

// ─── Listing type ──────────────────────────────────────────────────────────────
export const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع",
  rent: "للإيجار",
  both: "بيع وإيجار",
};

// ─── Time period labels (charts/metrics) ───────────────────────────────────────
export const TIME_PERIOD_LABELS = {
  today: "اليوم",
  week7: "٧ أيام",
  month30: "٣٠ يوم",
} as const;

export type TimePeriod = keyof typeof TIME_PERIOD_LABELS;

// ─── Role labels ───────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  agent: "وكيل عقارات",
  buyer: "مشتري",
  seller: "بائع",
  moderator: "مشرف",
  org_admin: "مدير المنظمة",
};

// ─── Helper — safe label lookup with fallback ──────────────────────────────────
export function getLabel(map: Record<string, string>, key: string | undefined | null): string {
  if (!key) return "—";
  return map[key] ?? map[key.toLowerCase()] ?? key;
}
