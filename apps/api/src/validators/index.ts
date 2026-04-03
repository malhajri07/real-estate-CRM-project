/**
 * validators/index.ts — Central Zod Validation Schemas
 *
 * Location: apps/api/src/validators/index.ts
 *
 * Exports ALL API validation schemas with Arabic error messages.
 * Re-exports entity schemas from dedicated files and adds schemas
 * for deals, appointments, campaigns, support, users, and organizations.
 *
 * Usage:
 *   import { dealSchemas, appointmentSchemas, sharedValidators } from '../validators';
 */

import { z } from 'zod';

// Re-export existing per-entity schemas
export { authSchemas } from './auth.schema';
export { leadSchemas } from './leads.schema';
export { listingSchemas } from './listings.schema';

// ─── Shared Validators ────────────────────────────────────────────────────────

const saudiPhoneRegex = /^(\+?966|0)?5[0-9]{8}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
const arabicNameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;

/** Reusable field-level validators */
export const sharedValidators = {
  saudiPhone: z
    .string()
    .regex(saudiPhoneRegex, 'رقم هاتف سعودي غير صالح — يجب أن يبدأ بـ 05'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  uuid: z.string().uuid('معرف UUID غير صالح'),
  price: z.coerce.number().nonnegative('السعر يجب أن يكون موجباً'),
  percentage: z.coerce.number().min(0, 'النسبة لا يمكن أن تكون سالبة').max(100, 'النسبة لا يمكن أن تتجاوز ١٠٠'),
  positiveInt: z.coerce.number().int('يجب أن يكون عدداً صحيحاً').positive('يجب أن يكون أكبر من صفر'),
  nonNegativeInt: z.coerce.number().int('يجب أن يكون عدداً صحيحاً').nonnegative('يجب أن يكون صفراً أو أكبر'),
  arabicOrEnglishName: z.string().regex(arabicNameRegex, 'الاسم يجب أن يكون بالعربية أو الإنجليزية فقط'),
  strongPassword: z
    .string()
    .regex(passwordRegex, 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل وتحتوي حرف كبير وصغير ورقم'),
  optionalString: z.string().optional(),
  requiredString: (fieldName: string) => z.string().min(1, `${fieldName} مطلوب`),
  dateString: z.string().datetime({ message: 'صيغة التاريخ غير صالحة — استخدم ISO 8601' }),
  optionalDate: z.string().datetime({ message: 'صيغة التاريخ غير صالحة' }).optional().nullable(),
} as const;

/** Pagination query parameters */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'رقم الصفحة يجب أن يكون ١ أو أكثر').default(1),
  pageSize: z.coerce.number().int().min(1, 'حجم الصفحة يجب أن يكون ١ أو أكثر').max(500, 'حجم الصفحة لا يمكن أن يتجاوز ٥٠٠').default(20),
});

/** Sort query parameters */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc'], { errorMap: () => ({ message: 'ترتيب الفرز يجب أن يكون asc أو desc' }) }).default('desc'),
});

/** Date range filter */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime({ message: 'تاريخ البداية غير صالح' }).optional(),
  endDate: z.string().datetime({ message: 'تاريخ النهاية غير صالح' }).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية', path: ['startDate'] }
);

// ─── Deal Schemas ─────────────────────────────────────────────────────────────

const dealStageEnum = z.enum(
  ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'],
  { errorMap: () => ({ message: 'مرحلة الصفقة غير صالحة' }) }
);

const dealStatusEnum = z.enum(
  ['ACTIVE', 'ON_HOLD', 'CANCELLED', 'COMPLETED'],
  { errorMap: () => ({ message: 'حالة الصفقة غير صالحة' }) }
);

export const dealSchemas = {
  create: z.object({
    leadId: z.string().uuid('معرف العميل المحتمل غير صالح').optional().nullable(),
    propertyId: z.string().uuid('معرف العقار غير صالح').optional().nullable(),
    customerId: z.string().uuid('معرف العميل غير صالح').optional().nullable(),
    stage: dealStageEnum.default('PROSPECTING'),
    status: dealStatusEnum.default('ACTIVE'),
    value: z.coerce.number().nonnegative('قيمة الصفقة يجب أن تكون موجبة').optional().nullable(),
    dealValue: z.coerce.number().nonnegative('قيمة الصفقة يجب أن تكون موجبة').optional().nullable(),
    agreedPrice: z.coerce.number().nonnegative('السعر المتفق عليه يجب أن يكون موجباً').optional().nullable(),
    commission: z.coerce
      .number()
      .min(0, 'العمولة لا يمكن أن تكون سالبة')
      .max(100, 'العمولة لا يمكن أن تتجاوز ١٠٠٪')
      .optional()
      .nullable(),
    expectedCloseDate: z.string().datetime({ message: 'تاريخ الإغلاق المتوقع غير صالح' }).optional().nullable(),
    notes: z.string().max(5000, 'الملاحظات لا يمكن أن تتجاوز ٥٠٠٠ حرف').optional().nullable(),
    source: z.string().optional().nullable(),
  }),

  update: z.object({
    stage: dealStageEnum.optional(),
    status: dealStatusEnum.optional(),
    value: z.coerce.number().nonnegative('قيمة الصفقة يجب أن تكون موجبة').optional().nullable(),
    dealValue: z.coerce.number().nonnegative('قيمة الصفقة يجب أن تكون موجبة').optional().nullable(),
    agreedPrice: z.coerce.number().nonnegative('السعر المتفق عليه يجب أن يكون موجباً').optional().nullable(),
    commission: z.coerce
      .number()
      .min(0, 'العمولة لا يمكن أن تكون سالبة')
      .max(100, 'العمولة لا يمكن أن تتجاوز ١٠٠٪')
      .optional()
      .nullable(),
    expectedCloseDate: z.string().datetime({ message: 'تاريخ الإغلاق المتوقع غير صالح' }).optional().nullable(),
    notes: z.string().max(5000, 'الملاحظات لا يمكن أن تتجاوز ٥٠٠٠ حرف').optional().nullable(),
    source: z.string().optional().nullable(),
    leadId: z.string().uuid('معرف العميل المحتمل غير صالح').optional().nullable(),
    propertyId: z.string().uuid('معرف العقار غير صالح').optional().nullable(),
    customerId: z.string().uuid('معرف العميل غير صالح').optional().nullable(),
    closedAt: z.string().datetime({ message: 'تاريخ الإغلاق غير صالح' }).optional().nullable(),
    wonAt: z.string().datetime({ message: 'تاريخ الفوز غير صالح' }).optional().nullable(),
    lostAt: z.string().datetime({ message: 'تاريخ الخسارة غير صالح' }).optional().nullable(),
  }),

  search: z.object({
    stage: dealStageEnum.optional(),
    status: dealStatusEnum.optional(),
    agentId: z.string().uuid().optional(),
    minValue: z.coerce.number().nonnegative().optional(),
    maxValue: z.coerce.number().nonnegative().optional(),
    search: z.string().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── Appointment Schemas ──────────────────────────────────────────────────────

const appointmentTypeEnum = z.enum(
  ['PROPERTY_VIEWING', 'CLIENT_MEETING', 'FOLLOW_UP', 'PHONE_CALL', 'VIDEO_CALL', 'SITE_INSPECTION', 'CONTRACT_SIGNING', 'OTHER'],
  { errorMap: () => ({ message: 'نوع الموعد غير صالح' }) }
);

const appointmentStatusEnum = z.enum(
  ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
  { errorMap: () => ({ message: 'حالة الموعد غير صالحة' }) }
);

export const appointmentSchemas = {
  create: z.object({
    title: z.string().min(1, 'عنوان الموعد مطلوب').max(200, 'عنوان الموعد لا يمكن أن يتجاوز ٢٠٠ حرف'),
    description: z.string().max(2000, 'الوصف لا يمكن أن يتجاوز ٢٠٠٠ حرف').optional().nullable(),
    type: appointmentTypeEnum.default('CLIENT_MEETING'),
    status: appointmentStatusEnum.default('SCHEDULED'),
    scheduledAt: z.string().datetime('تاريخ ووقت الموعد مطلوب'),
    endAt: z.string().datetime('وقت انتهاء الموعد غير صالح').optional().nullable(),
    location: z.string().max(500, 'العنوان لا يمكن أن يتجاوز ٥٠٠ حرف').optional().nullable(),
    leadId: z.string().uuid('معرف العميل المحتمل غير صالح').optional().nullable(),
    propertyId: z.string().uuid('معرف العقار غير صالح').optional().nullable(),
    dealId: z.string().uuid('معرف الصفقة غير صالح').optional().nullable(),
    notes: z.string().max(5000, 'الملاحظات لا يمكن أن تتجاوز ٥٠٠٠ حرف').optional().nullable(),
    reminderMinutes: z.coerce.number().int().min(0).max(10080, 'التذكير لا يمكن أن يتجاوز أسبوعاً').optional().nullable(),
    attendees: z.array(z.string().uuid('معرف الحضور غير صالح')).optional(),
  }).refine(
    (data) => {
      if (data.endAt) return new Date(data.scheduledAt) < new Date(data.endAt);
      return true;
    },
    { message: 'وقت البداية يجب أن يكون قبل وقت النهاية', path: ['endAt'] }
  ),

  update: z.object({
    title: z.string().min(1, 'عنوان الموعد مطلوب').max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    type: appointmentTypeEnum.optional(),
    status: appointmentStatusEnum.optional(),
    scheduledAt: z.string().datetime('تاريخ ووقت الموعد غير صالح').optional(),
    endAt: z.string().datetime('وقت انتهاء الموعد غير صالح').optional().nullable(),
    location: z.string().max(500).optional().nullable(),
    leadId: z.string().uuid().optional().nullable(),
    propertyId: z.string().uuid().optional().nullable(),
    dealId: z.string().uuid().optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    reminderMinutes: z.coerce.number().int().min(0).max(10080).optional().nullable(),
    attendees: z.array(z.string().uuid()).optional(),
    cancelReason: z.string().max(1000, 'سبب الإلغاء لا يمكن أن يتجاوز ١٠٠٠ حرف').optional().nullable(),
  }),

  search: z.object({
    type: appointmentTypeEnum.optional(),
    status: appointmentStatusEnum.optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    leadId: z.string().uuid().optional(),
    search: z.string().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── Campaign Schemas ─────────────────────────────────────────────────────────

const campaignTypeEnum = z.enum(
  ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION', 'SOCIAL_MEDIA'],
  { errorMap: () => ({ message: 'نوع الحملة غير صالح' }) }
);

const campaignStatusEnum = z.enum(
  ['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'],
  { errorMap: () => ({ message: 'حالة الحملة غير صالحة' }) }
);

export const campaignSchemas = {
  create: z.object({
    name: z.string().min(1, 'اسم الحملة مطلوب').max(200, 'اسم الحملة لا يمكن أن يتجاوز ٢٠٠ حرف'),
    description: z.string().max(5000, 'وصف الحملة لا يمكن أن يتجاوز ٥٠٠٠ حرف').optional().nullable(),
    type: campaignTypeEnum,
    status: campaignStatusEnum.default('DRAFT'),
    subject: z.string().max(500, 'عنوان الرسالة لا يمكن أن يتجاوز ٥٠٠ حرف').optional().nullable(),
    content: z.string().min(1, 'محتوى الحملة مطلوب'),
    templateId: z.string().uuid('معرف القالب غير صالح').optional().nullable(),
    scheduledAt: z.string().datetime('تاريخ الإرسال المجدول غير صالح').optional().nullable(),
    targetAudience: z.object({
      cities: z.array(z.string()).optional(),
      leadStatuses: z.array(z.string()).optional(),
      propertyTypes: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      customFilter: z.record(z.any()).optional(),
    }).optional().nullable(),
    budget: z.coerce.number().nonnegative('ميزانية الحملة يجب أن تكون موجبة').optional().nullable(),
    recipientIds: z.array(z.string().uuid('معرف المستلم غير صالح')).optional(),
  }),

  update: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    type: campaignTypeEnum.optional(),
    status: campaignStatusEnum.optional(),
    subject: z.string().max(500).optional().nullable(),
    content: z.string().optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    targetAudience: z.object({
      cities: z.array(z.string()).optional(),
      leadStatuses: z.array(z.string()).optional(),
      propertyTypes: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      customFilter: z.record(z.any()).optional(),
    }).optional().nullable(),
    budget: z.coerce.number().nonnegative().optional().nullable(),
  }),

  search: z.object({
    type: campaignTypeEnum.optional(),
    status: campaignStatusEnum.optional(),
    search: z.string().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── Support Ticket Schemas ───────────────────────────────────────────────────

const ticketPriorityEnum = z.enum(
  ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  { errorMap: () => ({ message: 'أولوية التذكرة غير صالحة' }) }
);

const ticketStatusEnum = z.enum(
  ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'],
  { errorMap: () => ({ message: 'حالة التذكرة غير صالحة' }) }
);

const ticketChannelEnum = z.enum(
  ['WEB', 'EMAIL', 'PHONE', 'WHATSAPP', 'IN_APP'],
  { errorMap: () => ({ message: 'قناة التذكرة غير صالحة' }) }
);

const ticketCategoryEnum = z.enum(
  ['GENERAL', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'LISTING', 'COMPLAINT', 'FEATURE_REQUEST', 'OTHER'],
  { errorMap: () => ({ message: 'تصنيف التذكرة غير صالح' }) }
);

export const supportSchemas = {
  create: z.object({
    subject: z.string().min(1, 'عنوان التذكرة مطلوب').max(300, 'عنوان التذكرة لا يمكن أن يتجاوز ٣٠٠ حرف'),
    description: z.string().min(1, 'وصف المشكلة مطلوب').max(10000, 'وصف المشكلة لا يمكن أن يتجاوز ١٠٠٠٠ حرف'),
    priority: ticketPriorityEnum.default('MEDIUM'),
    category: ticketCategoryEnum.default('GENERAL'),
    channel: ticketChannelEnum.default('WEB'),
    customerName: z.string().min(1, 'اسم العميل مطلوب').max(200).optional(),
    customerEmail: z.string().email('بريد العميل غير صالح').optional().nullable(),
    customerPhone: z.string().regex(saudiPhoneRegex, 'رقم هاتف العميل غير صالح').optional().nullable(),
    relatedEntityType: z.enum(['LISTING', 'DEAL', 'LEAD', 'ORDER', 'OTHER']).optional().nullable(),
    relatedEntityId: z.string().uuid('معرف الكيان المرتبط غير صالح').optional().nullable(),
    attachments: z.array(z.string().url('رابط المرفق غير صالح')).max(10, 'لا يمكن إرفاق أكثر من ١٠ ملفات').optional(),
    assignedToId: z.string().uuid('معرف المسؤول غير صالح').optional().nullable(),
    tags: z.array(z.string().max(50)).max(20, 'لا يمكن إضافة أكثر من ٢٠ وسماً').optional(),
  }),

  update: z.object({
    subject: z.string().min(1).max(300).optional(),
    description: z.string().max(10000).optional(),
    priority: ticketPriorityEnum.optional(),
    status: ticketStatusEnum.optional(),
    category: ticketCategoryEnum.optional(),
    assignedToId: z.string().uuid('معرف المسؤول غير صالح').optional().nullable(),
    resolution: z.string().max(5000, 'نص الحل لا يمكن أن يتجاوز ٥٠٠٠ حرف').optional().nullable(),
    internalNotes: z.string().max(5000, 'الملاحظات الداخلية لا يمكن أن تتجاوز ٥٠٠٠ حرف').optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  }),

  addReply: z.object({
    content: z.string().min(1, 'نص الرد مطلوب').max(10000, 'نص الرد لا يمكن أن يتجاوز ١٠٠٠٠ حرف'),
    isInternal: z.boolean().default(false),
    attachments: z.array(z.string().url()).max(10).optional(),
  }),

  search: z.object({
    status: ticketStatusEnum.optional(),
    priority: ticketPriorityEnum.optional(),
    category: ticketCategoryEnum.optional(),
    channel: ticketChannelEnum.optional(),
    assignedToId: z.string().uuid().optional(),
    search: z.string().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── User Schemas ─────────────────────────────────────────────────────────────

const userRoleEnum = z.enum(
  ['WEBSITE_ADMIN', 'CORP_OWNER', 'CORP_AGENT', 'INDIV_AGENT', 'SELLER', 'BUYER'],
  { errorMap: () => ({ message: 'دور المستخدم غير صالح' }) }
);

export const userSchemas = {
  update: z.object({
    firstName: z.string().regex(arabicNameRegex, 'الاسم يجب أن يكون بالعربية أو الإنجليزية').min(1).optional(),
    lastName: z.string().regex(arabicNameRegex, 'الاسم يجب أن يكون بالعربية أو الإنجليزية').min(1).optional(),
    email: z.string().email('بريد إلكتروني غير صالح').optional(),
    phone: z.string().regex(saudiPhoneRegex, 'رقم هاتف سعودي غير صالح').optional().nullable(),
    roles: z.string().optional(),
    isActive: z.boolean().optional(),
    organizationId: z.string().uuid('معرف المنظمة غير صالح').optional().nullable(),
    bio: z.string().max(2000, 'النبذة لا يمكن أن تتجاوز ٢٠٠٠ حرف').optional().nullable(),
    avatarUrl: z.string().url('رابط الصورة غير صالح').optional().nullable(),
    language: z.enum(['ar', 'en']).optional(),
    timezone: z.string().optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z
      .string()
      .regex(passwordRegex, 'كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل وتحتوي حرف كبير وصغير ورقم'),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين',
    path: ['confirmPassword'],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية',
    path: ['newPassword'],
  }),

  adminCreate: z.object({
    email: z.string().email('بريد إلكتروني غير صالح'),
    username: z.string().min(3, 'اسم المستخدم يجب أن يكون ٣ أحرف على الأقل').max(50).optional(),
    password: z.string().regex(passwordRegex, 'كلمة المرور ضعيفة'),
    firstName: z.string().regex(arabicNameRegex, 'الاسم الأول غير صالح').min(1, 'الاسم الأول مطلوب'),
    lastName: z.string().regex(arabicNameRegex, 'الاسم الأخير غير صالح').min(1, 'الاسم الأخير مطلوب'),
    phone: z.string().regex(saudiPhoneRegex, 'رقم هاتف سعودي غير صالح').optional(),
    roles: z.string().min(1, 'الدور مطلوب'),
    organizationId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().default(true),
  }),

  search: z.object({
    role: userRoleEnum.optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
    organizationId: z.string().uuid().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── Organization Schemas ─────────────────────────────────────────────────────

const organizationStatusEnum = z.enum(
  ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
  { errorMap: () => ({ message: 'حالة المنظمة غير صالحة' }) }
);

export const organizationSchemas = {
  create: z.object({
    legalName: z.string().min(1, 'الاسم القانوني مطلوب').max(300, 'الاسم القانوني لا يمكن أن يتجاوز ٣٠٠ حرف'),
    tradeName: z.string().min(1, 'الاسم التجاري مطلوب').max(300, 'الاسم التجاري لا يمكن أن يتجاوز ٣٠٠ حرف'),
    licenseNo: z.string().min(1, 'رقم الترخيص مطلوب').max(50, 'رقم الترخيص لا يمكن أن يتجاوز ٥٠ حرفاً'),
    status: organizationStatusEnum.default('PENDING_VERIFICATION'),
    address: z.string().max(500, 'العنوان لا يمكن أن يتجاوز ٥٠٠ حرف').optional().nullable(),
    phone: z.string().regex(saudiPhoneRegex, 'رقم الهاتف غير صالح').optional().nullable(),
    email: z.string().email('البريد الإلكتروني غير صالح').optional().nullable(),
    website: z.string().url('رابط الموقع غير صالح').optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    region: z.string().max(100).optional().nullable(),
    crNumber: z.string().max(50, 'رقم السجل التجاري لا يمكن أن يتجاوز ٥٠ حرفاً').optional().nullable(),
    vatNumber: z.string().max(50, 'الرقم الضريبي لا يمكن أن يتجاوز ٥٠ حرفاً').optional().nullable(),
    logoUrl: z.string().url('رابط الشعار غير صالح').optional().nullable(),
    maxAgents: z.coerce.number().int().min(1, 'الحد الأقصى للوكلاء يجب أن يكون ١ أو أكثر').max(10000).optional(),
    subscriptionPlan: z.string().optional().nullable(),
  }),

  update: z.object({
    legalName: z.string().min(1).max(300).optional(),
    tradeName: z.string().min(1).max(300).optional(),
    licenseNo: z.string().min(1).max(50).optional(),
    status: organizationStatusEnum.optional(),
    address: z.string().max(500).optional().nullable(),
    phone: z.string().regex(saudiPhoneRegex, 'رقم الهاتف غير صالح').optional().nullable(),
    email: z.string().email('البريد الإلكتروني غير صالح').optional().nullable(),
    website: z.string().url('رابط الموقع غير صالح').optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    region: z.string().max(100).optional().nullable(),
    crNumber: z.string().max(50).optional().nullable(),
    vatNumber: z.string().max(50).optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    maxAgents: z.coerce.number().int().min(1).max(10000).optional(),
    subscriptionPlan: z.string().optional().nullable(),
  }),

  search: z.object({
    status: organizationStatusEnum.optional(),
    search: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── Activity Schemas ─────────────────────────────────────────────────────────

const activityTypeEnum = z.enum(
  ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'WHATSAPP', 'SITE_VISIT', 'FOLLOW_UP', 'OTHER'],
  { errorMap: () => ({ message: 'نوع النشاط غير صالح' }) }
);

const activityStatusEnum = z.enum(
  ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  { errorMap: () => ({ message: 'حالة النشاط غير صالحة' }) }
);

export const activitySchemas = {
  create: z.object({
    title: z.string().min(1, 'عنوان النشاط مطلوب').max(200, 'عنوان النشاط لا يمكن أن يتجاوز ٢٠٠ حرف'),
    description: z.string().max(5000, 'الوصف لا يمكن أن يتجاوز ٥٠٠٠ حرف').optional().nullable(),
    type: activityTypeEnum,
    status: activityStatusEnum.default('PENDING'),
    leadId: z.string().uuid('معرف العميل المحتمل غير صالح').optional().nullable(),
    dealId: z.string().uuid('معرف الصفقة غير صالح').optional().nullable(),
    scheduledAt: z.string().datetime('تاريخ الجدولة غير صالح').optional().nullable(),
    completedAt: z.string().datetime('تاريخ الإنجاز غير صالح').optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    outcome: z.string().max(2000, 'النتيجة لا يمكن أن تتجاوز ٢٠٠٠ حرف').optional().nullable(),
    durationMinutes: z.coerce.number().int().min(0).max(1440, 'المدة لا يمكن أن تتجاوز يوماً واحداً').optional().nullable(),
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    type: activityTypeEnum.optional(),
    status: activityStatusEnum.optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    completedAt: z.string().datetime().optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    outcome: z.string().max(2000).optional().nullable(),
    durationMinutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  }),

  search: z.object({
    type: activityTypeEnum.optional(),
    status: activityStatusEnum.optional(),
    leadId: z.string().uuid().optional(),
    dealId: z.string().uuid().optional(),
    search: z.string().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── Message / Contact Schemas ────────────────────────────────────────────────

const messageChannelEnum = z.enum(
  ['SMS', 'WHATSAPP', 'EMAIL', 'PHONE', 'IN_APP'],
  { errorMap: () => ({ message: 'قناة الرسالة غير صالحة' }) }
);

const messageDirectionEnum = z.enum(
  ['INBOUND', 'OUTBOUND'],
  { errorMap: () => ({ message: 'اتجاه الرسالة غير صالح' }) }
);

export const messageSchemas = {
  create: z.object({
    leadId: z.string().uuid('معرف العميل المحتمل غير صالح'),
    content: z.string().min(1, 'نص الرسالة مطلوب').max(10000, 'نص الرسالة لا يمكن أن يتجاوز ١٠٠٠٠ حرف'),
    channel: messageChannelEnum.default('IN_APP'),
    direction: messageDirectionEnum.default('OUTBOUND'),
    metadata: z.record(z.any()).optional(),
  }),

  search: z.object({
    leadId: z.string().uuid().optional(),
    channel: messageChannelEnum.optional(),
    direction: messageDirectionEnum.optional(),
    search: z.string().optional(),
  }).merge(paginationSchema),
};

// ─── Marketing Request Schemas ────────────────────────────────────────────────

const marketingTierEnum = z.enum(
  ['STANDARD', 'SERIOUS', 'ENTERPRISE'],
  { errorMap: () => ({ message: 'مستوى الطلب غير صالح' }) }
);

const marketingStatusEnum = z.enum(
  ['DRAFT', 'PENDING_REVIEW', 'OPEN', 'AWARDED', 'CLOSED', 'REJECTED'],
  { errorMap: () => ({ message: 'حالة الطلب غير صالحة' }) }
);

export const marketingRequestSchemas = {
  create: z.object({
    title: z.string().min(1, 'عنوان الطلب مطلوب').max(300, 'العنوان لا يمكن أن يتجاوز ٣٠٠ حرف'),
    summary: z.string().min(1, 'ملخص الطلب مطلوب').max(5000, 'الملخص لا يمكن أن يتجاوز ٥٠٠٠ حرف'),
    requirements: z.string().max(10000, 'المتطلبات لا يمكن أن تتجاوز ١٠٠٠٠ حرف').optional().nullable(),
    propertyType: z.string().min(1, 'نوع العقار مطلوب'),
    listingType: z.string().optional().nullable(),
    city: z.string().min(1, 'المدينة مطلوبة'),
    district: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    budgetMin: z.coerce.number().nonnegative('الحد الأدنى للميزانية يجب أن يكون موجباً').optional().nullable(),
    budgetMax: z.coerce.number().nonnegative('الحد الأقصى للميزانية يجب أن يكون موجباً').optional().nullable(),
    preferredStartDate: z.string().datetime('تاريخ البداية المفضل غير صالح').optional().nullable(),
    preferredEndDate: z.string().datetime('تاريخ النهاية المفضل غير صالح').optional().nullable(),
    commissionExpectation: z.coerce.number().min(0).max(100, 'نسبة العمولة لا يمكن أن تتجاوز ١٠٠٪').optional().nullable(),
    seriousnessTier: marketingTierEnum.default('STANDARD'),
    contactName: z.string().min(1, 'اسم جهة الاتصال مطلوب'),
    contactPhone: z.string().regex(saudiPhoneRegex, 'رقم هاتف جهة الاتصال غير صالح').optional().nullable(),
    contactEmail: z.string().email('بريد جهة الاتصال غير صالح').optional().nullable(),
    propertyId: z.string().uuid('معرف العقار غير صالح').optional().nullable(),
  }).refine(
    (data) => {
      if (data.budgetMin != null && data.budgetMax != null) return data.budgetMin <= data.budgetMax;
      return true;
    },
    { message: 'الحد الأدنى للميزانية يجب أن يكون أقل من أو يساوي الحد الأقصى', path: ['budgetMin'] }
  ),

  update: z.object({
    title: z.string().min(1).max(300).optional(),
    summary: z.string().max(5000).optional(),
    requirements: z.string().max(10000).optional().nullable(),
    status: marketingStatusEnum.optional(),
    moderationNotes: z.string().max(5000).optional().nullable(),
    city: z.string().optional(),
    district: z.string().optional().nullable(),
    budgetMin: z.coerce.number().nonnegative().optional().nullable(),
    budgetMax: z.coerce.number().nonnegative().optional().nullable(),
    commissionExpectation: z.coerce.number().min(0).max(100).optional().nullable(),
    seriousnessTier: marketingTierEnum.optional(),
  }),

  search: z.object({
    status: marketingStatusEnum.optional(),
    seriousnessTier: marketingTierEnum.optional(),
    city: z.string().optional(),
    propertyType: z.string().optional(),
    search: z.string().optional(),
  }).merge(paginationSchema).merge(sortSchema),
};

// ─── Marketing Proposal Schemas ───────────────────────────────────────────────

const proposalStatusEnum = z.enum(
  ['PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'],
  { errorMap: () => ({ message: 'حالة العرض غير صالحة' }) }
);

export const marketingProposalSchemas = {
  create: z.object({
    requestId: z.string().uuid('معرف الطلب غير صالح'),
    message: z.string().max(5000, 'رسالة العرض لا يمكن أن تتجاوز ٥٠٠٠ حرف').optional().nullable(),
    commissionRate: z.coerce.number().min(0).max(100, 'نسبة العمولة لا يمكن أن تتجاوز ١٠٠٪').optional().nullable(),
    marketingBudget: z.coerce.number().nonnegative('ميزانية التسويق يجب أن تكون موجبة').optional().nullable(),
    estimatedTimeline: z.string().max(200).optional().nullable(),
    attachments: z.string().optional().nullable(),
  }),

  update: z.object({
    status: proposalStatusEnum.optional(),
    message: z.string().max(5000).optional().nullable(),
    commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
    marketingBudget: z.coerce.number().nonnegative().optional().nullable(),
    estimatedTimeline: z.string().max(200).optional().nullable(),
  }),
};

// ─── File Upload Schema ───────────────────────────────────────────────────────

export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'اسم الملف مطلوب').max(255, 'اسم الملف لا يمكن أن يتجاوز ٢٥٥ حرفاً'),
  mimeType: z.string().min(1, 'نوع الملف مطلوب'),
  size: z.coerce.number().positive('حجم الملف يجب أن يكون أكبر من صفر').max(
    50 * 1024 * 1024,
    'حجم الملف لا يمكن أن يتجاوز ٥٠ ميجابايت'
  ),
  folder: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// ─── Bulk Action Schema ───────────────────────────────────────────────────────

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid('معرف غير صالح')).min(1, 'يجب تحديد عنصر واحد على الأقل').max(100, 'لا يمكن تنفيذ العملية على أكثر من ١٠٠ عنصر'),
  action: z.string().min(1, 'الإجراء مطلوب'),
  params: z.record(z.any()).optional(),
});

// ─── ID Parameter Schema ──────────────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().uuid('المعرف غير صالح'),
});
