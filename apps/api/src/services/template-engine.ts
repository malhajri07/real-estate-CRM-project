/**
 * template-engine.ts — Document Template Engine (Session 5.1)
 *
 * Merge-field templates for contracts, receipts, brochures.
 * {{buyer.name}}, {{property.address}}, {{deal.price}} etc.
 */

export interface TemplateContext {
  buyer?: { name?: string; phone?: string; email?: string; nationalId?: string };
  seller?: { name?: string; phone?: string };
  agent?: { name?: string; phone?: string; falNumber?: string; organization?: string };
  property?: { title?: string; city?: string; district?: string; address?: string; type?: string; area?: string; price?: string; deedNumber?: string };
  deal?: { price?: string; commission?: string; date?: string; stage?: string };
  tenancy?: { startDate?: string; endDate?: string; monthlyRent?: string; contractNumber?: string };
}

/**
 * Replace {{field.subfield}} merge tags with values from context.
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, field) => {
    const section = context[obj as keyof TemplateContext];
    if (!section) return match;
    const value = (section as Record<string, string | undefined>)[field];
    return value ?? match;
  });
}

/**
 * Built-in templates for common documents.
 */
export const BUILT_IN_TEMPLATES = {
  BROKERAGE_CONTRACT: `عقد وساطة عقارية

الطرف الأول (المالك): {{seller.name}}
الطرف الثاني (الوسيط): {{agent.name}}
رخصة فال رقم: {{agent.falNumber}}
المنشأة: {{agent.organization}}

العقار: {{property.title}}
الموقع: {{property.city}} - {{property.district}}
المساحة: {{property.area}} م²
السعر: {{deal.price}} ريال سعودي

التاريخ: {{deal.date}}
`,

  RENTAL_CONTRACT: `عقد إيجار

المؤجر: {{seller.name}}
المستأجر: {{buyer.name}}
رقم الهوية: {{buyer.nationalId}}

العقار: {{property.title}}
العنوان: {{property.address}}

بداية العقد: {{tenancy.startDate}}
نهاية العقد: {{tenancy.endDate}}
الإيجار الشهري: {{tenancy.monthlyRent}} ريال سعودي
رقم عقد إيجار: {{tenancy.contractNumber}}
`,

  VIEWING_INVITATION: `دعوة معاينة عقارية

عزيزي/عزيزتي {{buyer.name}}،

يسعدنا دعوتك لمعاينة العقار التالي:

🏠 {{property.title}}
📍 {{property.city}} - {{property.district}}
💰 {{deal.price}} ريال سعودي

الوسيط: {{agent.name}}
هاتف: {{agent.phone}}

مع تحيات منصة عقاركم
`,

  RECEIPT: `إيصال دفع

رقم المرجع: {{deal.date}}
المبلغ: {{deal.price}} ريال سعودي
العمولة: {{deal.commission}} ريال سعودي

العميل: {{buyer.name}}
العقار: {{property.title}}
الوسيط: {{agent.name}}
`,
};

export type TemplateName = keyof typeof BUILT_IN_TEMPLATES;
