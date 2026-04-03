/**
 * deal.validators.ts — Comprehensive Zod Schemas for Deal CRUD
 *
 * Location: apps/api/src/validators/deal.validators.ts
 *
 * Provides validation schemas with Arabic error messages for:
 * - Deal creation
 * - Deal updates (partial)
 * - Deal search/filter with pagination
 * - Deal stage transitions
 * - Deal commission calculations
 * - Deal bulk operations
 *
 * All error messages are in Arabic for the Saudi market.
 *
 * Usage:
 *   import { dealValidators } from '../validators/deal.validators';
 *   const parsed = dealValidators.create.parse(req.body);
 */

import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────────────

const dealStageEnum = z.enum(
  ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSING", "CLOSED_WON", "CLOSED_LOST"],
  { errorMap: () => ({ message: "مرحلة الصفقة غير صالحة — القيم المسموحة: استكشاف، تأهيل، عرض، تفاوض، إغلاق، مكسب، خسارة" }) }
);

const dealStatusEnum = z.enum(
  ["ACTIVE", "ON_HOLD", "CANCELLED", "COMPLETED"],
  { errorMap: () => ({ message: "حالة الصفقة غير صالحة — القيم المسموحة: نشط، معلق، ملغي، مكتمل" }) }
);

const dealTypeEnum = z.enum(
  ["SALE", "RENT", "LEASE", "INVESTMENT"],
  { errorMap: () => ({ message: "نوع الصفقة غير صالح" }) }
);

const lostReasonEnum = z.enum(
  ["PRICE_TOO_HIGH", "COMPETITOR", "BUDGET_ISSUE", "LOCATION", "TIMING", "NO_RESPONSE", "CHANGED_MIND", "OTHER"],
  { errorMap: () => ({ message: "سبب الخسارة غير صالح" }) }
);

// ─── Commission Schema ──────────────────────────────────────────────────────

const commissionSchema = z.object({
  rate: z.coerce
    .number()
    .min(0, "نسبة العمولة لا يمكن أن تكون سالبة")
    .max(100, "نسبة العمولة لا يمكن أن تتجاوز ١٠٠٪"),
  amount: z.coerce
    .number()
    .nonnegative("مبلغ العمولة يجب أن يكون موجباً")
    .optional()
    .nullable(),
  splitPercentage: z.coerce
    .number()
    .min(0)
    .max(100, "نسبة التقسيم لا يمكن أن تتجاوز ١٠٠٪")
    .optional()
    .nullable(),
  notes: z.string().max(500, "ملاحظات العمولة لا يمكن أن تتجاوز ٥٠٠ حرف").optional().nullable(),
}).optional().nullable();

// ─── Stakeholder Schema ─────────────────────────────────────────────────────

const stakeholderSchema = z.object({
  userId: z.string().uuid("معرف المستخدم غير صالح"),
  role: z.enum(["PRIMARY_AGENT", "SECONDARY_AGENT", "SUPERVISOR", "OBSERVER"], {
    errorMap: () => ({ message: "دور المشترك غير صالح" }),
  }),
  commissionSplit: z.coerce.number().min(0).max(100).optional().nullable(),
});

// ─── Create Schema ──────────────────────────────────────────────────────────

const createDealSchema = z.object({
  // Relationships
  leadId: z.string().uuid("معرف العميل المحتمل غير صالح").optional().nullable(),
  propertyId: z.string().uuid("معرف العقار غير صالح").optional().nullable(),
  customerId: z.string().uuid("معرف العميل غير صالح").optional().nullable(),

  // Classification
  dealType: dealTypeEnum.optional().nullable(),
  stage: dealStageEnum.default("PROSPECTING"),
  status: dealStatusEnum.default("ACTIVE"),

  // Financial
  value: z.coerce
    .number()
    .nonnegative("قيمة الصفقة يجب أن تكون موجبة")
    .max(999999999, "قيمة الصفقة لا يمكن أن تتجاوز ٩٩٩٬٩٩٩٬٩٩٩")
    .optional()
    .nullable(),
  dealValue: z.coerce.number().nonnegative("قيمة الصفقة يجب أن تكون موجبة").optional().nullable(),
  agreedPrice: z.coerce.number().nonnegative("السعر المتفق عليه يجب أن يكون موجباً").optional().nullable(),
  commission: z.coerce
    .number()
    .min(0, "العمولة لا يمكن أن تكون سالبة")
    .max(100, "العمولة لا يمكن أن تتجاوز ١٠٠٪")
    .optional()
    .nullable(),
  commissionDetails: commissionSchema,

  // Dates
  expectedCloseDate: z.string().datetime({ message: "تاريخ الإغلاق المتوقع غير صالح — استخدم ISO 8601" }).optional().nullable(),

  // Probability
  winProbability: z.coerce
    .number()
    .min(0, "احتمالية الفوز يجب أن تكون بين ٠ و ١٠٠")
    .max(100, "احتمالية الفوز يجب أن تكون بين ٠ و ١٠٠")
    .optional()
    .nullable(),

  // Content
  notes: z.string().max(5000, "الملاحظات لا يمكن أن تتجاوز ٥٠٠٠ حرف").optional().nullable(),
  source: z.string().max(100, "المصدر لا يمكن أن يتجاوز ١٠٠ حرف").optional().nullable(),
  tags: z.array(z.string().min(1).max(50)).max(20, "لا يمكن إضافة أكثر من ٢٠ وسم").optional(),

  // Team
  stakeholders: z.array(stakeholderSchema).max(10, "لا يمكن إضافة أكثر من ١٠ مشتركين").optional(),
});

// ─── Update Schema ──────────────────────────────────────────────────────────

const updateDealSchema = z.object({
  leadId: z.string().uuid("معرف العميل المحتمل غير صالح").optional().nullable(),
  propertyId: z.string().uuid("معرف العقار غير صالح").optional().nullable(),
  customerId: z.string().uuid("معرف العميل غير صالح").optional().nullable(),

  dealType: dealTypeEnum.optional().nullable(),
  stage: dealStageEnum.optional(),
  status: dealStatusEnum.optional(),

  value: z.coerce.number().nonnegative("قيمة الصفقة يجب أن تكون موجبة").optional().nullable(),
  dealValue: z.coerce.number().nonnegative().optional().nullable(),
  agreedPrice: z.coerce.number().nonnegative().optional().nullable(),
  commission: z.coerce.number().min(0).max(100).optional().nullable(),
  commissionDetails: commissionSchema,

  expectedCloseDate: z.string().datetime({ message: "تاريخ الإغلاق المتوقع غير صالح" }).optional().nullable(),
  closedAt: z.string().datetime({ message: "تاريخ الإغلاق غير صالح" }).optional().nullable(),
  wonAt: z.string().datetime({ message: "تاريخ الفوز غير صالح" }).optional().nullable(),
  lostAt: z.string().datetime({ message: "تاريخ الخسارة غير صالح" }).optional().nullable(),

  winProbability: z.coerce.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  stakeholders: z.array(stakeholderSchema).max(10).optional(),

  lostReason: lostReasonEnum.optional().nullable(),
  lostReasonDetails: z.string().max(1000, "تفاصيل سبب الخسارة لا يمكن أن تتجاوز ١٠٠٠ حرف").optional().nullable(),
});

// ─── Stage Transition Schema ────────────────────────────────────────────────

const stageTransitionSchema = z.object({
  dealId: z.string().uuid("معرف الصفقة غير صالح"),
  fromStage: dealStageEnum,
  toStage: dealStageEnum,
  reason: z.string().max(500, "سبب التحويل لا يمكن أن يتجاوز ٥٠٠ حرف").optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => data.fromStage !== data.toStage,
  { message: "المرحلة الجديدة يجب أن تكون مختلفة عن المرحلة الحالية", path: ["toStage"] }
);

// ─── Search Schema ──────────────────────────────────────────────────────────

const searchDealsSchema = z.object({
  search: z.string().max(200, "نص البحث لا يمكن أن يتجاوز ٢٠٠ حرف").optional(),
  stage: z.union([dealStageEnum, z.array(dealStageEnum)]).optional(),
  status: z.union([dealStatusEnum, z.array(dealStatusEnum)]).optional(),
  dealType: z.union([dealTypeEnum, z.array(dealTypeEnum)]).optional(),

  agentId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),

  minValue: z.coerce.number().nonnegative("الحد الأدنى للقيمة يجب أن يكون موجباً").optional(),
  maxValue: z.coerce.number().nonnegative("الحد الأقصى للقيمة يجب أن يكون موجباً").optional(),
  minProbability: z.coerce.number().min(0).max(100).optional(),
  maxProbability: z.coerce.number().min(0).max(100).optional(),

  expectedCloseFrom: z.string().datetime().optional(),
  expectedCloseTo: z.string().datetime().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),

  tags: z.union([z.string(), z.array(z.string())]).optional(),

  // Pagination
  page: z.coerce.number().int().min(1, "رقم الصفحة يجب أن يكون ١ أو أكثر").default(1),
  pageSize: z.coerce.number().int().min(1).max(500, "حجم الصفحة لا يمكن أن يتجاوز ٥٠٠").default(20),
  sortBy: z.enum(["value", "createdAt", "updatedAt", "expectedCloseDate", "stage", "winProbability"], {
    errorMap: () => ({ message: "حقل الترتيب غير صالح" }),
  }).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(
  (data) => {
    if (data.minValue !== undefined && data.maxValue !== undefined) {
      return data.minValue <= data.maxValue;
    }
    return true;
  },
  { message: "الحد الأدنى للقيمة يجب أن يكون أقل من الحد الأقصى", path: ["minValue"] }
);

// ─── Bulk Operations ────────────────────────────────────────────────────────

const bulkUpdateDealsSchema = z.object({
  dealIds: z
    .array(z.string().uuid("معرف الصفقة غير صالح"))
    .min(1, "يجب تحديد صفقة واحدة على الأقل")
    .max(50, "لا يمكن تحديث أكثر من ٥٠ صفقة في المرة الواحدة"),
  updates: z.object({
    stage: dealStageEnum.optional(),
    status: dealStatusEnum.optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// ─── Exports ────────────────────────────────────────────────────────────────

export const dealValidators = {
  create: createDealSchema,
  update: updateDealSchema,
  search: searchDealsSchema,
  stageTransition: stageTransitionSchema,
  bulkUpdate: bulkUpdateDealsSchema,
} as const;

/** Inferred TypeScript types from Zod schemas */
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type SearchDealsInput = z.infer<typeof searchDealsSchema>;
export type StageTransitionInput = z.infer<typeof stageTransitionSchema>;
export type BulkUpdateDealsInput = z.infer<typeof bulkUpdateDealsSchema>;
