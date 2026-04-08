/**
 * saudi-regulation.validators.ts — Saudi Real Estate Regulation Validators
 *
 * Enforces REGA (الهيئة العامة للعقار) regulations:
 * - نظام الوساطة العقارية (Royal Decree M/130, 1443H)
 * - اللائحة التنفيذية لنظام الوساطة العقارية (1444H)
 * - ضوابط الإعلانات العقارية (1442H)
 * - معايير ترخيص المنصات العقارية الإلكترونية (1442H)
 *
 * References: rega.gov.sa/الأنظمة-واللوائح-والأدلة/
 */

import { z } from "zod";

// ── FAL License ────────────────────────────────────────────────────────────

/** FAL license number: 10-digit numeric issued by REGA */
export const falLicenseNumberSchema = z
  .string()
  .regex(/^\d{10}$/, "رقم رخصة فال يجب أن يتكون من 10 أرقام");

/** FAL license types per REGA classification */
export const falLicenseTypeSchema = z.enum([
  "BROKERAGE_MARKETING",   // وساطة وتسويق
  "PROPERTY_MANAGEMENT",   // إدارة أملاك
  "FACILITY_MANAGEMENT",   // إدارة مرافق
  "AUCTION",               // مزادات عقارية
  "CONSULTING",            // استشارات وتحليلات
  "ADVERTISING",           // إعلانات عقارية
]);

export const FAL_LICENSE_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  BROKERAGE_MARKETING: { ar: "وساطة وتسويق", en: "Brokerage & Marketing" },
  PROPERTY_MANAGEMENT: { ar: "إدارة أملاك", en: "Property Management" },
  FACILITY_MANAGEMENT: { ar: "إدارة مرافق", en: "Facility Management" },
  AUCTION: { ar: "مزادات عقارية", en: "Real Estate Auction" },
  CONSULTING: { ar: "استشارات وتحليلات عقارية", en: "Consulting & Analysis" },
  ADVERTISING: { ar: "إعلانات عقارية", en: "Real Estate Advertising" },
};

// ── Saudi Identity ─────────────────────────────────────────────────────────

/** Saudi National ID (starts with 1) or Iqama (starts with 2), 10 digits */
export const saudiNationalIdSchema = z
  .string()
  .regex(/^[12]\d{9}$/, "رقم الهوية يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام");

/** Saudi mobile: +966 5XXXXXXXX or 05XXXXXXXX */
export const saudiMobileSchema = z
  .string()
  .regex(/^(\+?966|0)?5[0-9]{8}$/, "رقم جوال سعودي غير صالح");

// ── REGA Advertising License ───────────────────────────────────────────────

/** Per-listing REGA advertising license — required per ضوابط الإعلانات العقارية */
export const regaAdLicenseSchema = z
  .string()
  .min(1, "رقم ترخيص الإعلان العقاري مطلوب")
  .max(50);

// ── National Address (Saudi Post) ──────────────────────────────────────────

export const nationalAddressSchema = z.object({
  buildingNo: z
    .string()
    .regex(/^\d{4}$/, "رقم المبنى يجب أن يتكون من 4 أرقام")
    .optional(),
  street: z.string().max(200).optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "الرمز البريدي يجب أن يتكون من 5 أرقام")
    .optional(),
  additionalNo: z
    .string()
    .regex(/^\d{4}$/, "الرقم الإضافي يجب أن يتكون من 4 أرقام")
    .optional(),
  shortCode: z.string().max(20).optional(),
});

// ── Commission Cap (نظام الوساطة العقارية — المادة 14) ─────────────────────

/**
 * Saudi Brokerage Law Article 14:
 * - Sale: max 2.5% of transaction value
 * - Rental: max 2.5% of first year's rent only
 * - Multi-party: total must not exceed 2.5% (split equally by default)
 * - Can be varied by written agreement of the parties
 */
export const COMMISSION_CAP_PERCENTAGE = 2.5;

/** VAT rate on brokerage services (15% per ZATCA) */
export const VAT_RATE = 0.15;

/**
 * Validates commission rate against Saudi regulatory cap.
 * Article 14: 2.5% max for both sale and rental.
 * Returns { valid, warning, rentalNote } — allows override with written agreement.
 */
export function validateCommissionCap(
  rate: number,
  transactionType: "SALE" | "RENT" = "SALE"
): { valid: boolean; warning?: string; rentalNote?: string } {
  const cap = COMMISSION_CAP_PERCENTAGE;

  const result: { valid: boolean; warning?: string; rentalNote?: string } = { valid: rate <= cap };

  if (rate > cap) {
    result.warning = `العمولة ${rate}% تتجاوز الحد النظامي (${cap}%) حسب المادة 14 من نظام الوساطة العقارية. يجب تضمينها في عقد وساطة مكتوب وموقّع.`;
  }

  if (transactionType === "RENT") {
    result.rentalNote = "عمولة الإيجار تحتسب على إيجار السنة الأولى فقط (المادة 14)";
  }

  return result;
}

/** Commission amount with optional VAT */
export function calculateCommission(
  price: number,
  rate: number,
  includeVat: boolean = true
): { commission: number; vat: number; total: number } {
  const commission = price * (rate / 100);
  const vat = includeVat ? commission * VAT_RATE : 0;
  return {
    commission: Math.round(commission * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round((commission + vat) * 100) / 100,
  };
}

// ── Earnest Money / العربون (اللائحة التنفيذية — المادة 21) ──────────────────

/**
 * Earnest money (عربون) cap per Implementing Regulations Article 21:
 * - Max 5% of transaction value
 * - Beyond 5%, it becomes a price down-payment
 * - If deal fails and seller keeps earnest, broker receives 25% of earnest
 */
export const EARNEST_MONEY_CAP_PERCENTAGE = 5;
export const BROKER_EARNEST_SHARE = 0.25;

export function validateEarnestMoney(
  earnestAmount: number,
  transactionValue: number
): { valid: boolean; warning?: string; brokerShare: number } {
  const cap = transactionValue * (EARNEST_MONEY_CAP_PERCENTAGE / 100);
  const brokerShare = Math.round(earnestAmount * BROKER_EARNEST_SHARE * 100) / 100;

  if (earnestAmount <= cap) {
    return { valid: true, brokerShare };
  }

  return {
    valid: false,
    warning: `العربون ${earnestAmount.toLocaleString()} ر.س يتجاوز الحد النظامي (5% = ${cap.toLocaleString()} ر.س). المبلغ الزائد يعتبر دفعة من الثمن.`,
    brokerShare,
  };
}

// ── RETT — Real Estate Transaction Tax (ضريبة التصرفات العقارية) ───────────

/** RETT rate: 5% of property value, paid by seller (ZATCA) */
export const RETT_RATE = 0.05;

/** First-home exemption cap under Sakani program */
export const FIRST_HOME_EXEMPTION_CAP = 1_000_000;

export function calculateRETT(
  salePrice: number,
  isFirstHome: boolean = false
): { rettAmount: number; exemptionAmount: number; netRett: number } {
  const rettAmount = Math.round(salePrice * RETT_RATE * 100) / 100;

  if (!isFirstHome) {
    return { rettAmount, exemptionAmount: 0, netRett: rettAmount };
  }

  const exemptableBase = Math.min(salePrice, FIRST_HOME_EXEMPTION_CAP);
  const exemptionAmount = Math.round(exemptableBase * RETT_RATE * 100) / 100;
  const netRett = Math.max(0, rettAmount - exemptionAmount);

  return {
    rettAmount,
    exemptionAmount,
    netRett: Math.round(netRett * 100) / 100,
  };
}

// ── Property Legal Status Labels ───────────────────────────────────────────

export const LEGAL_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  FREE: { ar: "صك حر", en: "Free Title" },
  MORTGAGED: { ar: "مرهون", en: "Mortgaged" },
  UNDER_DISPUTE: { ar: "تحت النزاع", en: "Under Dispute" },
  ENDOWMENT: { ar: "وقف", en: "Endowment (Waqf)" },
};

export const FACADE_DIRECTION_LABELS: Record<string, { ar: string; en: string }> = {
  NORTH: { ar: "شمال", en: "North" },
  SOUTH: { ar: "جنوب", en: "South" },
  EAST: { ar: "شرق", en: "East" },
  WEST: { ar: "غرب", en: "West" },
  NORTH_EAST: { ar: "شمال شرق", en: "North East" },
  NORTH_WEST: { ar: "شمال غرب", en: "North West" },
  SOUTH_EAST: { ar: "جنوب شرق", en: "South East" },
  SOUTH_WEST: { ar: "جنوب غرب", en: "South West" },
};

export const PROPERTY_SERVICES = [
  { key: "electricity", ar: "كهرباء", en: "Electricity" },
  { key: "water", ar: "مياه", en: "Water" },
  { key: "sewage", ar: "صرف صحي", en: "Sewage" },
  { key: "gas", ar: "غاز", en: "Gas" },
  { key: "fiber", ar: "ألياف بصرية", en: "Fiber Optic" },
] as const;

// ── Mandatory Listing Fields per REGA ──────────────────────────────────────

/**
 * ضوابط الإعلانات العقارية (1442H):
 * Every real estate ad must include: purpose, property type, advertiser name,
 * FAL license number, REGA ad license, location (city + district min),
 * area, price, active contact method, property description.
 *
 * Returns array of missing field names (Arabic labels).
 */
export function checkListingRegaCompliance(listing: Record<string, unknown>): string[] {
  const required: { field: string; label: string }[] = [
    { field: "falLicenseNumber", label: "رقم رخصة فال" },
    { field: "regaAdLicenseNumber", label: "رقم ترخيص الإعلان" },
    { field: "city", label: "المدينة" },
    { field: "district", label: "الحي" },
    { field: "areaSqm", label: "المساحة" },
    { field: "price", label: "السعر" },
    { field: "type", label: "نوع العقار" },
    { field: "description", label: "وصف العقار" },
  ];

  return required
    .filter(({ field }) => !listing[field])
    .map(({ label }) => label);
}

/**
 * Listing auto-expiry per ضوابط الإعلانات العقارية:
 * "يجب حذف الإعلان خلال يومين من إتمام الغرض منه"
 * Ads must be removed within 2 days of purpose completion (sale/lease).
 */
export const AD_REMOVAL_DEADLINE_DAYS = 2;

/**
 * Validates that a FAL license is not expired.
 * Returns { valid, daysRemaining, warning }
 */
export function validateFalExpiry(expiresAt: Date | string | null): {
  valid: boolean;
  daysRemaining: number | null;
  warning?: string;
} {
  if (!expiresAt) return { valid: true, daysRemaining: null };

  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { valid: false, daysRemaining, warning: "رخصة فال منتهية الصلاحية. يجب تجديدها قبل ممارسة النشاط." };
  }

  if (daysRemaining <= 60) {
    return { valid: true, daysRemaining, warning: `رخصة فال تنتهي خلال ${daysRemaining} يوم. يجب تقديم طلب التجديد قبل 60 يوم من الانتهاء.` };
  }

  return { valid: true, daysRemaining };
}
