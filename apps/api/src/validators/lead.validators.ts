/**
 * lead.validators.ts — Comprehensive Zod Schemas for Lead CRUD
 *
 * Location: apps/api/src/validators/lead.validators.ts
 *
 * Provides granular validation schemas with Arabic error messages for:
 * - Lead creation (full and quick-add)
 * - Lead updates (partial)
 * - Lead search/filter with pagination
 * - Lead assignment and transfer
 * - Lead bulk operations
 * - Lead activity creation
 * - Lead import validation
 *
 * All error messages are in Arabic for the Saudi market.
 *
 * Usage:
 *   import { leadValidators } from '../validators/lead.validators';
 *   const parsed = leadValidators.create.parse(req.body);
 */

import { z } from "zod";

// ─── Shared Patterns ────────────────────────────────────────────────────────

const saudiPhoneRegex = /^(\+?966|0)?5[0-9]{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Enums ──────────────────────────────────────────────────────────────────

const leadStatusEnum = z.enum(
  ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "DORMANT"],
  { errorMap: () => ({ message: "حالة العميل المحتمل غير صالحة — القيم المسموحة: جديد، تم التواصل، مؤهل، عرض، تفاوض، مكسب، خسارة، خامل" }) }
);

const leadSourceEnum = z.enum(
  ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "PHONE", "WALK_IN", "EXHIBITION", "PARTNER", "ADVERTISING", "OTHER"],
  { errorMap: () => ({ message: "مصدر العميل المحتمل غير صالح" }) }
);

const leadPriorityEnum = z.enum(
  ["LOW", "MEDIUM", "HIGH", "URGENT"],
  { errorMap: () => ({ message: "أولوية العميل المحتمل غير صالحة — القيم المسموحة: منخفض، متوسط، مرتفع، عاجل" }) }
);

const interestTypeEnum = z.enum(
  ["BUY", "RENT", "SELL", "INVEST"],
  { errorMap: () => ({ message: "نوع الاهتمام غير صالح — القيم المسموحة: شراء، إيجار، بيع، استثمار" }) }
);

const propertyTypeEnum = z.enum(
  ["APARTMENT", "VILLA", "LAND", "OFFICE", "SHOP", "BUILDING", "WAREHOUSE", "FARM", "OTHER"],
  { errorMap: () => ({ message: "نوع العقار غير صالح" }) }
);

const activityTypeEnum = z.enum(
  ["CALL", "EMAIL", "MEETING", "VIEWING", "NOTE", "STATUS_CHANGE", "MESSAGE", "DOCUMENT"],
  { errorMap: () => ({ message: "نوع النشاط غير صالح" }) }
);

// ─── Shared Field Schemas ───────────────────────────────────────────────────

const nameField = z
  .string()
  .min(1, "الاسم مطلوب")
  .max(100, "الاسم لا يمكن أن يتجاوز ١٠٠ حرف")
  .trim();

const phoneField = z
  .string()
  .regex(saudiPhoneRegex, "رقم الهاتف يجب أن يكون رقم سعودي صالح يبدأ بـ 05")
  .optional()
  .nullable();

const emailField = z
  .union([
    z.string().email("البريد الإلكتروني غير صالح"),
    z.literal(""),
  ])
  .optional()
  .nullable()
  .transform((val) => (val === "" ? null : val));

const notesField = z
  .string()
  .max(5000, "الملاحظات لا يمكن أن تتجاوز ٥٠٠٠ حرف")
  .optional()
  .nullable();

const budgetRangeSchema = z.object({
  min: z.coerce
    .number()
    .nonnegative("الحد الأدنى للميزانية يجب أن يكون موجباً")
    .optional()
    .nullable(),
  max: z.coerce
    .number()
    .nonnegative("الحد الأقصى للميزانية يجب أن يكون موجباً")
    .optional()
    .nullable(),
  currency: z.string().default("SAR"),
}).refine(
  (data) => {
    if (data.min !== null && data.min !== undefined && data.max !== null && data.max !== undefined) {
      return data.min <= data.max;
    }
    return true;
  },
  { message: "الحد الأدنى للميزانية يجب أن يكون أقل من الحد الأقصى", path: ["min"] }
).optional().nullable();

// ─── Location Preferences ───────────────────────────────────────────────────

const locationPreferencesSchema = z.object({
  cities: z
    .array(z.string().min(1, "اسم المدينة مطلوب"))
    .max(20, "لا يمكن تحديد أكثر من ٢٠ مدينة")
    .optional(),
  districts: z
    .array(z.string().min(1, "اسم الحي مطلوب"))
    .max(30, "لا يمكن تحديد أكثر من ٣٠ حي")
    .optional(),
  regions: z
    .array(z.string().min(1, "اسم المنطقة مطلوب"))
    .max(13, "لا يمكن تحديد أكثر من ١٣ منطقة")
    .optional(),
}).optional().nullable();

// ─── Property Requirements ──────────────────────────────────────────────────

const propertyRequirementsSchema = z.object({
  propertyTypes: z
    .array(propertyTypeEnum)
    .max(5, "لا يمكن تحديد أكثر من ٥ أنواع عقارات")
    .optional(),
  minBedrooms: z.coerce
    .number()
    .int("عدد غرف النوم يجب أن يكون عدداً صحيحاً")
    .nonnegative("عدد غرف النوم يجب أن يكون موجباً")
    .max(20, "عدد غرف النوم لا يمكن أن يتجاوز ٢٠")
    .optional()
    .nullable(),
  maxBedrooms: z.coerce.number().int().nonnegative().max(20).optional().nullable(),
  minArea: z.coerce
    .number()
    .nonnegative("المساحة يجب أن تكون موجبة")
    .optional()
    .nullable(),
  maxArea: z.coerce.number().nonnegative().optional().nullable(),
  amenities: z
    .array(z.string().min(1))
    .max(30, "لا يمكن تحديد أكثر من ٣٠ ميزة")
    .optional(),
}).optional().nullable();

// ─── Create Schema ──────────────────────────────────────────────────────────

const createLeadSchema = z.object({
  // Customer info
  firstName: nameField,
  lastName: nameField,
  email: emailField,
  phone: phoneField,
  secondaryPhone: phoneField,
  city: z.string().max(100, "اسم المدينة لا يمكن أن يتجاوز ١٠٠ حرف").optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  nationalId: z
    .string()
    .regex(/^[12]\d{9}$/, "رقم الهوية الوطنية يجب أن يكون ١٠ أرقام ويبدأ بـ 1 أو 2")
    .optional()
    .nullable(),

  // Lead classification
  status: leadStatusEnum.default("NEW"),
  source: leadSourceEnum.optional().nullable(),
  leadSource: z.string().max(100).optional().nullable(),
  priority: z.union([leadPriorityEnum, z.coerce.number().min(1).max(4)]).optional().nullable(),
  interestType: interestTypeEnum.optional().nullable(),

  // Budget & preferences
  budgetRange: z.union([
    budgetRangeSchema,
    z.coerce.number().nonnegative("الميزانية يجب أن تكون موجبة"),
    z.string(),
  ]).optional().nullable(),
  locationPreferences: locationPreferencesSchema,
  propertyRequirements: propertyRequirementsSchema,

  // Relationships
  customerId: z.string().uuid("معرف العميل غير صالح").optional().nullable(),
  buyerRequestId: z.string().uuid("معرف طلب الشراء غير صالح").optional().nullable(),
  sellerSubmissionId: z.string().uuid("معرف عرض البيع غير صالح").optional().nullable(),
  assignedAgentId: z.string().uuid("معرف الوكيل غير صالح").optional().nullable(),

  // Notes & tags
  notes: notesField,
  tags: z
    .array(z.string().min(1, "الوسم مطلوب").max(50, "الوسم لا يمكن أن يتجاوز ٥٠ حرف"))
    .max(20, "لا يمكن إضافة أكثر من ٢٠ وسم")
    .optional(),

  // Score override
  score: z.coerce
    .number()
    .min(0, "التقييم يجب أن يكون بين ٠ و ١٠٠")
    .max(100, "التقييم يجب أن يكون بين ٠ و ١٠٠")
    .optional()
    .nullable(),
}).passthrough();

// ─── Quick Add Schema (minimal) ─────────────────────────────────────────────

const quickAddLeadSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  phone: phoneField,
  source: leadSourceEnum.optional(),
  interestType: interestTypeEnum.optional(),
  notes: z.string().max(500, "الملاحظات السريعة لا يمكن أن تتجاوز ٥٠٠ حرف").optional(),
});

// ─── Update Schema ──────────────────────────────────────────────────────────

const updateLeadSchema = z.object({
  firstName: nameField.optional(),
  lastName: nameField.optional(),
  email: emailField,
  phone: phoneField,
  secondaryPhone: phoneField,
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  nationalId: z.string().regex(/^[12]\d{9}$/, "رقم الهوية الوطنية غير صالح").optional().nullable(),

  status: leadStatusEnum.optional(),
  source: leadSourceEnum.optional().nullable(),
  leadSource: z.string().max(100).optional().nullable(),
  priority: z.union([leadPriorityEnum, z.coerce.number().min(1).max(4)]).optional().nullable(),
  interestType: interestTypeEnum.optional().nullable(),

  budgetRange: z.union([budgetRangeSchema, z.coerce.number(), z.string()]).optional().nullable(),
  locationPreferences: locationPreferencesSchema,
  propertyRequirements: propertyRequirementsSchema,

  assignedAgentId: z.string().uuid("معرف الوكيل غير صالح").optional().nullable(),
  notes: notesField,
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  score: z.coerce.number().min(0).max(100).optional().nullable(),

  lostReason: z.string().max(500, "سبب الخسارة لا يمكن أن يتجاوز ٥٠٠ حرف").optional().nullable(),
  nextFollowUpDate: z.string().datetime({ message: "تاريخ المتابعة القادمة غير صالح" }).optional().nullable(),
}).passthrough();

// ─── Search / Filter Schema ─────────────────────────────────────────────────

const searchLeadsSchema = z.object({
  search: z.string().max(200, "نص البحث لا يمكن أن يتجاوز ٢٠٠ حرف").optional(),
  status: z.union([leadStatusEnum, z.array(leadStatusEnum)]).optional(),
  source: z.union([leadSourceEnum, z.array(leadSourceEnum)]).optional(),
  priority: z.union([leadPriorityEnum, z.array(leadPriorityEnum)]).optional(),
  interestType: z.union([interestTypeEnum, z.array(interestTypeEnum)]).optional(),
  city: z.string().optional(),
  assignedAgentId: z.string().uuid().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  minBudget: z.coerce.number().nonnegative().optional(),
  maxBudget: z.coerce.number().nonnegative().optional(),
  startDate: z.string().datetime({ message: "تاريخ البداية غير صالح" }).optional(),
  endDate: z.string().datetime({ message: "تاريخ النهاية غير صالح" }).optional(),
  hasPhone: z.coerce.boolean().optional(),
  hasEmail: z.coerce.boolean().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),

  // Pagination
  page: z.coerce.number().int().min(1, "رقم الصفحة يجب أن يكون ١ أو أكثر").default(1),
  pageSize: z.coerce.number().int().min(1).max(500, "حجم الصفحة لا يمكن أن يتجاوز ٥٠٠").default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية", path: ["startDate"] }
);

// ─── Assignment Schema ──────────────────────────────────────────────────────

const assignLeadSchema = z.object({
  leadId: z.string().uuid("معرف العميل المحتمل غير صالح"),
  agentId: z.string().uuid("معرف الوكيل غير صالح"),
  reason: z.string().max(500, "سبب التعيين لا يمكن أن يتجاوز ٥٠٠ حرف").optional(),
  notifyAgent: z.boolean().default(true),
});

const transferLeadSchema = z.object({
  leadId: z.string().uuid("معرف العميل المحتمل غير صالح"),
  fromAgentId: z.string().uuid("معرف الوكيل المرسل غير صالح"),
  toAgentId: z.string().uuid("معرف الوكيل المستلم غير صالح"),
  reason: z.string().min(1, "سبب النقل مطلوب").max(500, "سبب النقل لا يمكن أن يتجاوز ٥٠٠ حرف"),
  transferActivities: z.boolean().default(true),
  notifyBoth: z.boolean().default(true),
});

// ─── Bulk Operations ────────────────────────────────────────────────────────

const bulkUpdateLeadsSchema = z.object({
  leadIds: z
    .array(z.string().uuid("معرف العميل المحتمل غير صالح"))
    .min(1, "يجب تحديد عميل محتمل واحد على الأقل")
    .max(100, "لا يمكن تحديث أكثر من ١٠٠ عميل محتمل في المرة الواحدة"),
  updates: z.object({
    status: leadStatusEnum.optional(),
    priority: leadPriorityEnum.optional(),
    assignedAgentId: z.string().uuid().optional().nullable(),
    tags: z.array(z.string()).optional(),
  }),
});

const bulkDeleteLeadsSchema = z.object({
  leadIds: z
    .array(z.string().uuid("معرف العميل المحتمل غير صالح"))
    .min(1, "يجب تحديد عميل محتمل واحد على الأقل")
    .max(50, "لا يمكن حذف أكثر من ٥٠ عميل محتمل في المرة الواحدة"),
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: "يجب تأكيد الحذف" }),
  }),
});

// ─── Activity Schema ────────────────────────────────────────────────────────

const addActivitySchema = z.object({
  leadId: z.string().uuid("معرف العميل المحتمل غير صالح"),
  type: activityTypeEnum,
  title: z.string().min(1, "عنوان النشاط مطلوب").max(200, "العنوان لا يمكن أن يتجاوز ٢٠٠ حرف"),
  description: z.string().max(2000, "الوصف لا يمكن أن يتجاوز ٢٠٠٠ حرف").optional().nullable(),
  notes: z.string().max(5000, "الملاحظات لا يمكن أن تتجاوز ٥٠٠٠ حرف").optional().nullable(),
  duration: z.string().max(50, "المدة غير صالحة").optional().nullable(),
  outcome: z.string().max(200, "النتيجة لا يمكن أن تتجاوز ٢٠٠ حرف").optional().nullable(),
  scheduledAt: z.string().datetime({ message: "تاريخ النشاط غير صالح" }).optional().nullable(),
});

// ─── Import Schema ──────────────────────────────────────────────────────────

const importLeadRowSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب في الصف ${row}"),
  lastName: z.string().min(1, "الاسم الأخير مطلوب في الصف ${row}"),
  email: z.union([z.string().email("البريد الإلكتروني غير صالح"), z.literal("")]).optional(),
  phone: z.string().regex(saudiPhoneRegex, "رقم الهاتف غير صالح").optional(),
  source: z.string().optional(),
  interestType: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

const importLeadsSchema = z.object({
  rows: z
    .array(importLeadRowSchema)
    .min(1, "يجب أن يحتوي الملف على سجل واحد على الأقل")
    .max(1000, "لا يمكن استيراد أكثر من ١٠٠٠ سجل في المرة الواحدة"),
  skipDuplicates: z.boolean().default(true),
  defaultSource: leadSourceEnum.optional(),
  assignToAgentId: z.string().uuid().optional(),
});

// ─── Exports ────────────────────────────────────────────────────────────────

export const leadValidators = {
  create: createLeadSchema,
  quickAdd: quickAddLeadSchema,
  update: updateLeadSchema,
  search: searchLeadsSchema,
  assign: assignLeadSchema,
  transfer: transferLeadSchema,
  bulkUpdate: bulkUpdateLeadsSchema,
  bulkDelete: bulkDeleteLeadsSchema,
  addActivity: addActivitySchema,
  import: importLeadsSchema,
  importRow: importLeadRowSchema,
} as const;

/** Inferred TypeScript types from Zod schemas */
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type QuickAddLeadInput = z.infer<typeof quickAddLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type SearchLeadsInput = z.infer<typeof searchLeadsSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type TransferLeadInput = z.infer<typeof transferLeadSchema>;
export type BulkUpdateLeadsInput = z.infer<typeof bulkUpdateLeadsSchema>;
export type BulkDeleteLeadsInput = z.infer<typeof bulkDeleteLeadsSchema>;
export type AddActivityInput = z.infer<typeof addActivitySchema>;
export type ImportLeadsInput = z.infer<typeof importLeadsSchema>;
