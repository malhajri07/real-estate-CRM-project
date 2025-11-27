/**
 * constants.ts - CMS Landing Page Constants
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → cms-landing/ → utils/ → constants.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Constants for CMS landing page editor. Defines:
 * - Section labels
 * - Configuration constants
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/index.tsx - CMS landing editor
 */

/**
 * Constants for CMS Landing Page
 */

export const SECTION_LABELS: Record<string, string> = {
  hero: "قسم البطل",
  navigation: "القائمة العلوية",
  features: "المميزات",
  solutions: "الحلول",
  stats: "الإحصائيات",
  pricing: "خطط الأسعار",
  contact: "التواصل",
  footer: "تذييل الصفحة",
  cta: "نداء الإجراء",
};

export const FEATURE_ICON_OPTIONS = [
  { value: "users", label: "المستخدمون" },
  { value: "building", label: "المباني" },
  { value: "trending-up", label: "النمو" },
  { value: "bar-chart", label: "الرسوم البيانية" },
  { value: "message-square", label: "المراسلة" },
  { value: "shield", label: "الحماية" },
  { value: "camera", label: "التصوير" },
  { value: "file-text", label: "المستندات" },
  { value: "dollar-sign", label: "السعر" },
  { value: "git-branch", label: "التكامل" },
  { value: "check-circle", label: "التحقق" },
  { value: "circle-check-big", label: "التحقق الكبير" },
  { value: "user-plus", label: "إضافة مستخدم" },
  { value: "eye", label: "الرؤية" },
  { value: "notebook-pen", label: "الملاحظات" },
];

export const CONTACT_ICON_OPTIONS = [
  { value: "phone", label: "الهاتف" },
  { value: "mail", label: "البريد" },
  { value: "map-pin", label: "الموقع" },
  { value: "clock", label: "الوقت" },
];

export const HERO_METRIC_COLORS = ["blue", "green", "orange", "purple", "pink", "emerald"];

