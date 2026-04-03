/**
 * appointment.validators.ts — Comprehensive Zod Schemas for Appointment CRUD
 *
 * Location: apps/api/src/validators/appointment.validators.ts
 *
 * Provides validation schemas with Arabic error messages for:
 * - Appointment creation
 * - Appointment updates (partial)
 * - Appointment search/filter with pagination
 * - Appointment rescheduling
 * - Appointment cancellation
 * - Recurring appointment configuration
 *
 * All error messages are in Arabic for the Saudi market.
 *
 * Usage:
 *   import { appointmentValidators } from '../validators/appointment.validators';
 *   const parsed = appointmentValidators.create.parse(req.body);
 */

import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────────────

const appointmentTypeEnum = z.enum(
  ["PROPERTY_VIEWING", "CLIENT_MEETING", "FOLLOW_UP", "PHONE_CALL", "VIDEO_CALL", "SITE_INSPECTION", "CONTRACT_SIGNING", "HANDOVER", "APPRAISAL", "OTHER"],
  { errorMap: () => ({ message: "نوع الموعد غير صالح — القيم المسموحة: معاينة عقار، اجتماع عميل، متابعة، مكالمة هاتفية، مكالمة فيديو، فحص الموقع، توقيع عقد، تسليم، تقييم، أخرى" }) }
);

const appointmentStatusEnum = z.enum(
  ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
  { errorMap: () => ({ message: "حالة الموعد غير صالحة — القيم المسموحة: مجدول، مؤكد، جاري، مكتمل، ملغي، لم يحضر، معاد جدولته" }) }
);

const appointmentPriorityEnum = z.enum(
  ["LOW", "NORMAL", "HIGH", "URGENT"],
  { errorMap: () => ({ message: "أولوية الموعد غير صالحة" }) }
);

const recurrenceEnum = z.enum(
  ["NONE", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"],
  { errorMap: () => ({ message: "نمط التكرار غير صالح" }) }
);

// ─── Attendee Schema ────────────────────────────────────────────────────────

const attendeeSchema = z.object({
  userId: z.string().uuid("معرف الحضور غير صالح"),
  role: z.enum(["HOST", "GUEST", "OBSERVER"], {
    errorMap: () => ({ message: "دور الحضور غير صالح — القيم المسموحة: مستضيف، ضيف، مراقب" }),
  }).default("GUEST"),
  isRequired: z.boolean().default(true),
  responseStatus: z.enum(["PENDING", "ACCEPTED", "DECLINED", "TENTATIVE"], {
    errorMap: () => ({ message: "حالة الرد غير صالحة" }),
  }).default("PENDING"),
});

// ─── Reminder Schema ────────────────────────────────────────────────────────

const reminderSchema = z.object({
  minutes: z.coerce
    .number()
    .int("دقائق التذكير يجب أن تكون عدداً صحيحاً")
    .min(0, "دقائق التذكير لا يمكن أن تكون سالبة")
    .max(10080, "التذكير لا يمكن أن يكون قبل أكثر من أسبوع"),
  method: z.enum(["EMAIL", "SMS", "PUSH", "WHATSAPP"], {
    errorMap: () => ({ message: "طريقة التذكير غير صالحة" }),
  }).default("PUSH"),
});

// ─── Location Schema ────────────────────────────────────────────────────────

const meetingLocationSchema = z.object({
  type: z.enum(["PROPERTY", "OFFICE", "VIRTUAL", "CLIENT_LOCATION", "OTHER"], {
    errorMap: () => ({ message: "نوع مكان الاجتماع غير صالح" }),
  }),
  address: z.string().max(500, "العنوان لا يمكن أن يتجاوز ٥٠٠ حرف").optional().nullable(),
  propertyId: z.string().uuid("معرف العقار غير صالح").optional().nullable(),
  virtualMeetingUrl: z.string().url("رابط الاجتماع الافتراضي غير صالح").optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  notes: z.string().max(300, "ملاحظات المكان لا يمكن أن تتجاوز ٣٠٠ حرف").optional().nullable(),
}).optional().nullable();

// ─── Recurrence Schema ──────────────────────────────────────────────────────

const recurrenceConfigSchema = z.object({
  pattern: recurrenceEnum,
  interval: z.coerce.number().int().min(1, "فترة التكرار يجب أن تكون ١ أو أكثر").max(12, "فترة التكرار لا يمكن أن تتجاوز ١٢").default(1),
  endDate: z.string().datetime({ message: "تاريخ نهاية التكرار غير صالح" }).optional().nullable(),
  maxOccurrences: z.coerce.number().int().min(1).max(52, "عدد التكرارات لا يمكن أن يتجاوز ٥٢").optional().nullable(),
  daysOfWeek: z.array(
    z.coerce.number().int().min(0, "يوم الأسبوع يجب أن يكون بين ٠ و ٦").max(6)
  ).max(7).optional(),
}).optional().nullable();

// ─── Create Schema ──────────────────────────────────────────────────────────

const createAppointmentSchema = z.object({
  // Core
  title: z.string()
    .min(1, "عنوان الموعد مطلوب")
    .max(200, "عنوان الموعد لا يمكن أن يتجاوز ٢٠٠ حرف")
    .trim(),
  description: z.string().max(2000, "الوصف لا يمكن أن يتجاوز ٢٠٠٠ حرف").optional().nullable(),
  type: appointmentTypeEnum.default("CLIENT_MEETING"),
  status: appointmentStatusEnum.default("SCHEDULED"),
  priority: appointmentPriorityEnum.default("NORMAL"),

  // Timing
  scheduledAt: z.string().datetime("تاريخ ووقت الموعد مطلوب — استخدم صيغة ISO 8601"),
  endAt: z.string().datetime("وقت انتهاء الموعد غير صالح").optional().nullable(),
  durationMinutes: z.coerce
    .number()
    .int("المدة يجب أن تكون بالدقائق (عدد صحيح)")
    .min(5, "مدة الموعد يجب أن تكون ٥ دقائق على الأقل")
    .max(480, "مدة الموعد لا يمكن أن تتجاوز ٨ ساعات")
    .optional()
    .nullable(),
  allDay: z.boolean().default(false),

  // Location
  location: z.string().max(500, "العنوان لا يمكن أن يتجاوز ٥٠٠ حرف").optional().nullable(),
  meetingLocation: meetingLocationSchema,

  // Relationships
  leadId: z.string().uuid("معرف العميل المحتمل غير صالح").optional().nullable(),
  propertyId: z.string().uuid("معرف العقار غير صالح").optional().nullable(),
  dealId: z.string().uuid("معرف الصفقة غير صالح").optional().nullable(),
  clientId: z.string().uuid("معرف العميل غير صالح").optional().nullable(),

  // Notes & documents
  notes: z.string().max(5000, "الملاحظات لا يمكن أن تتجاوز ٥٠٠٠ حرف").optional().nullable(),
  agenda: z.string().max(3000, "جدول الأعمال لا يمكن أن يتجاوز ٣٠٠٠ حرف").optional().nullable(),
  internalNotes: z.string().max(2000, "الملاحظات الداخلية لا يمكن أن تتجاوز ٢٠٠٠ حرف").optional().nullable(),

  // Attendees
  attendees: z.array(z.union([
    z.string().uuid("معرف الحضور غير صالح"),
    attendeeSchema,
  ])).max(20, "لا يمكن إضافة أكثر من ٢٠ مشاركاً").optional(),

  // Reminders
  reminderMinutes: z.coerce
    .number()
    .int()
    .min(0)
    .max(10080, "التذكير لا يمكن أن يتجاوز أسبوعاً")
    .optional()
    .nullable(),
  reminders: z.array(reminderSchema).max(5, "لا يمكن إضافة أكثر من ٥ تذكيرات").optional(),

  // Recurrence
  recurrence: recurrenceConfigSchema,

  // Tags
  tags: z.array(z.string().min(1).max(50)).max(10, "لا يمكن إضافة أكثر من ١٠ وسوم").optional(),

  // Color (for calendar display)
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح — استخدم صيغة hex مثل #FF5733").optional().nullable(),
}).refine(
  (data) => {
    if (data.endAt) return new Date(data.scheduledAt) < new Date(data.endAt);
    return true;
  },
  { message: "وقت البداية يجب أن يكون قبل وقت النهاية", path: ["endAt"] }
);

// ─── Update Schema ──────────────────────────────────────────────────────────

const updateAppointmentSchema = z.object({
  title: z.string().min(1, "عنوان الموعد مطلوب").max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: appointmentTypeEnum.optional(),
  status: appointmentStatusEnum.optional(),
  priority: appointmentPriorityEnum.optional(),

  scheduledAt: z.string().datetime("تاريخ ووقت الموعد غير صالح").optional(),
  endAt: z.string().datetime("وقت انتهاء الموعد غير صالح").optional().nullable(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional().nullable(),
  allDay: z.boolean().optional(),

  location: z.string().max(500).optional().nullable(),
  meetingLocation: meetingLocationSchema,

  leadId: z.string().uuid().optional().nullable(),
  propertyId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),

  notes: z.string().max(5000).optional().nullable(),
  agenda: z.string().max(3000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),

  attendees: z.array(z.union([z.string().uuid(), attendeeSchema])).max(20).optional(),
  reminderMinutes: z.coerce.number().int().min(0).max(10080).optional().nullable(),
  reminders: z.array(reminderSchema).max(5).optional(),

  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),

  // Completion fields
  outcome: z.string().max(1000, "نتيجة الموعد لا يمكن أن تتجاوز ١٠٠٠ حرف").optional().nullable(),
  cancelReason: z.string().max(1000, "سبب الإلغاء لا يمكن أن يتجاوز ١٠٠٠ حرف").optional().nullable(),
  noShowReason: z.string().max(500, "سبب عدم الحضور لا يمكن أن يتجاوز ٥٠٠ حرف").optional().nullable(),
  followUpRequired: z.boolean().optional(),
  nextAppointmentDate: z.string().datetime({ message: "تاريخ الموعد القادم غير صالح" }).optional().nullable(),
});

// ─── Reschedule Schema ──────────────────────────────────────────────────────

const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid("معرف الموعد غير صالح"),
  newScheduledAt: z.string().datetime("تاريخ ووقت الموعد الجديد مطلوب"),
  newEndAt: z.string().datetime("وقت الانتهاء الجديد غير صالح").optional().nullable(),
  reason: z.string()
    .min(1, "سبب إعادة الجدولة مطلوب")
    .max(500, "سبب إعادة الجدولة لا يمكن أن يتجاوز ٥٠٠ حرف"),
  notifyAttendees: z.boolean().default(true),
}).refine(
  (data) => new Date(data.newScheduledAt) > new Date(),
  { message: "تاريخ الموعد الجديد يجب أن يكون في المستقبل", path: ["newScheduledAt"] }
);

// ─── Cancel Schema ──────────────────────────────────────────────────────────

const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid("معرف الموعد غير صالح"),
  reason: z.string()
    .min(1, "سبب الإلغاء مطلوب")
    .max(1000, "سبب الإلغاء لا يمكن أن يتجاوز ١٠٠٠ حرف"),
  notifyAttendees: z.boolean().default(true),
  cancelFutureOccurrences: z.boolean().default(false),
});

// ─── Search Schema ──────────────────────────────────────────────────────────

const searchAppointmentsSchema = z.object({
  search: z.string().max(200, "نص البحث لا يمكن أن يتجاوز ٢٠٠ حرف").optional(),
  type: z.union([appointmentTypeEnum, z.array(appointmentTypeEnum)]).optional(),
  status: z.union([appointmentStatusEnum, z.array(appointmentStatusEnum)]).optional(),
  priority: z.union([appointmentPriorityEnum, z.array(appointmentPriorityEnum)]).optional(),

  leadId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),

  fromDate: z.string().datetime("تاريخ البداية غير صالح").optional(),
  toDate: z.string().datetime("تاريخ النهاية غير صالح").optional(),

  // Calendar view helpers
  calendarDate: z.string().datetime().optional(),
  calendarView: z.enum(["day", "week", "month"], {
    errorMap: () => ({ message: "عرض التقويم غير صالح — القيم المسموحة: day, week, month" }),
  }).optional(),

  tags: z.union([z.string(), z.array(z.string())]).optional(),

  // Pagination
  page: z.coerce.number().int().min(1, "رقم الصفحة يجب أن يكون ١ أو أكثر").default(1),
  pageSize: z.coerce.number().int().min(1).max(500, "حجم الصفحة لا يمكن أن يتجاوز ٥٠٠").default(20),
  sortBy: z.enum(["scheduledAt", "createdAt", "updatedAt", "priority", "type"], {
    errorMap: () => ({ message: "حقل الترتيب غير صالح" }),
  }).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
}).refine(
  (data) => {
    if (data.fromDate && data.toDate) {
      return new Date(data.fromDate) <= new Date(data.toDate);
    }
    return true;
  },
  { message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية", path: ["fromDate"] }
);

// ─── Exports ────────────────────────────────────────────────────────────────

export const appointmentValidators = {
  create: createAppointmentSchema,
  update: updateAppointmentSchema,
  search: searchAppointmentsSchema,
  reschedule: rescheduleAppointmentSchema,
  cancel: cancelAppointmentSchema,
} as const;

/** Inferred TypeScript types from Zod schemas */
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type SearchAppointmentsInput = z.infer<typeof searchAppointmentsSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
