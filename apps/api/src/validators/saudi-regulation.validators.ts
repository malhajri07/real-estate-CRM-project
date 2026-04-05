/**
 * saudi-regulation.validators.ts — Saudi Real Estate Regulation Validators
 *
 * Shared validation rules for FAL license, REGA, National Address,
 * commission caps, and RETT (Real Estate Transaction Tax).
 *
 * References:
 * - REGA (الهيئة العامة للعقار): rega.gov.sa
 * - FAL License: 10-digit numeric
 * - Commission cap: 2.5% sale, 2.5% first-year rent
 * - RETT: 5% of transaction value (ZATCA)
 * - National Address: Saudi Post (SPL)
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

/** Per-listing REGA advertising license (SAR 50 each) */
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
  shortCode: z.string().max(20).optional(), // Alphanumeric short address
});

// ── Commission Cap (نظام الوساطة العقارية) ──────────────────────────────────

/** Saudi law: max 2.5% commission for both sale and rental */
export const COMMISSION_CAP_PERCENTAGE = 2.5;

/** VAT rate on brokerage services */
export const VAT_RATE = 0.15;

/**
 * Validates commission rate against Saudi regulatory cap.
 * Returns { valid, warning } — allows override but warns.
 */
export function validateCommissionCap(
  rate: number,
  transactionType: "SALE" | "RENT" = "SALE"
): { valid: boolean; warning?: string } {
  const cap = COMMISSION_CAP_PERCENTAGE;

  if (rate <= cap) {
    return { valid: true };
  }

  return {
    valid: false,
    warning: `العمولة ${rate}% تتجاوز الحد النظامي (${cap}%) حسب نظام الوساطة العقارية. يجب تضمينها في عقد الوساطة.`,
  };
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

// ── RETT — Real Estate Transaction Tax (ضريبة التصرفات العقارية) ───────────

/** RETT rate: 5% of property value, paid by seller */
export const RETT_RATE = 0.05;

/** First-home exemption cap under Sakani program */
export const FIRST_HOME_EXEMPTION_CAP = 1_000_000; // SAR

/**
 * Calculates RETT for a transaction.
 * - Standard: 5% of sale price
 * - First home: government bears tax up to SAR 1M (Sakani program)
 */
export function calculateRETT(
  salePrice: number,
  isFirstHome: boolean = false
): { rettAmount: number; exemptionAmount: number; netRett: number } {
  const rettAmount = Math.round(salePrice * RETT_RATE * 100) / 100;

  if (!isFirstHome) {
    return { rettAmount, exemptionAmount: 0, netRett: rettAmount };
  }

  // First-home: government covers RETT on first SAR 1M
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

// ── Facade Direction Labels ────────────────────────────────────────────────

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

// ── Available Services ─────────────────────────────────────────────────────

export const PROPERTY_SERVICES = [
  { key: "electricity", ar: "كهرباء", en: "Electricity" },
  { key: "water", ar: "مياه", en: "Water" },
  { key: "sewage", ar: "صرف صحي", en: "Sewage" },
  { key: "gas", ar: "غاز", en: "Gas" },
  { key: "fiber", ar: "ألياف بصرية", en: "Fiber Optic" },
] as const;

// ── Mandatory Listing Fields per REGA ──────────────────────────────────────

/**
 * Checks if a listing has all REGA-mandated fields.
 * Returns array of missing field names.
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
    { field: "facadeDirection", label: "واجهة العقار" },
  ];

  return required
    .filter(({ field }) => !listing[field])
    .map(({ label }) => label);
}
