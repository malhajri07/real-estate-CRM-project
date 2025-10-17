import { SeedContext, SeedResult } from "./types";

const CONTENT_BLOCKS = [
  {
    key: "admin.overview.header",
    locale: "en",
    value: "Welcome to the admin overview"
  },
  {
    key: "admin.overview.header",
    locale: "ar",
    value: "مرحبًا بك في لوحة التحكم"
  },
  {
    key: "admin.users.header",
    locale: "en",
    value: "User Directory"
  },
  {
    key: "admin.users.header",
    locale: "ar",
    value: "سجل المستخدمين"
  },
  {
    key: "admin.users.empty",
    locale: "en",
    value: "No users yet. Invite your first teammate to get started."
  },
  {
    key: "admin.users.empty",
    locale: "ar",
    value: "لا يوجد مستخدمون حتى الآن. ادعُ أول زميل لك للبدء."
  },
  {
    key: "admin.users.help",
    locale: "en",
    value: "Use filters to narrow by role, status, or organization."
  },
  {
    key: "admin.users.help",
    locale: "ar",
    value: "استخدم عوامل التصفية لتحديد الدور أو الحالة أو المنظمة."
  },
  {
    key: "admin.roles.header",
    locale: "en",
    value: "Roles & Permissions"
  },
  {
    key: "admin.roles.header",
    locale: "ar",
    value: "الأدوار والصلاحيات"
  },
  {
    key: "admin.roles.help",
    locale: "en",
    value: "Craft fine-grained access policies and assign them to teams."
  },
  {
    key: "admin.roles.help",
    locale: "ar",
    value: "صمّم سياسات وصول دقيقة وقم بإسنادها إلى الفرق."
  },
  {
    key: "admin.organizations.header",
    locale: "en",
    value: "Partner Organizations"
  },
  {
    key: "admin.organizations.header",
    locale: "ar",
    value: "المنظمات الشريكة"
  },
  {
    key: "admin.properties.header",
    locale: "en",
    value: "Active Property Portfolio"
  },
  {
    key: "admin.properties.header",
    locale: "ar",
    value: "ملف الممتلكات النشطة"
  },
  {
    key: "admin.properties.empty",
    locale: "en",
    value: "No properties yet. Publish your first listing to appear here."
  },
  {
    key: "admin.properties.empty",
    locale: "ar",
    value: "لا توجد عقارات بعد. انشر أول عقار ليظهر هنا."
  },
  {
    key: "admin.properties.bulkConfirm",
    locale: "en",
    value: "Bulk publish selected properties?"
  },
  {
    key: "admin.properties.bulkConfirm",
    locale: "ar",
    value: "هل تريد نشر العقارات المحددة دفعة واحدة؟"
  },
  {
    key: "admin.listings.header",
    locale: "en",
    value: "Listings Pipeline"
  },
  {
    key: "admin.listings.header",
    locale: "ar",
    value: "قائمة الإعلانات"
  },
  {
    key: "admin.listings.empty",
    locale: "en",
    value: "No listings yet. Draft your first property to start marketing."
  },
  {
    key: "admin.listings.empty",
    locale: "ar",
    value: "لا توجد إعلانات بعد. ابدأ بإنشاء أول مسودة عقار للتسويق."
  },
  {
    key: "admin.listings.help",
    locale: "en",
    value: "Monitor status transitions from draft to sold across your team."
  },
  {
    key: "admin.listings.help",
    locale: "ar",
    value: "راقب انتقال الحالات من المسودة إلى البيع عبر فريقك."
  },
  {
    key: "admin.leads.header",
    locale: "en",
    value: "Lead Inbox"
  },
  {
    key: "admin.leads.header",
    locale: "ar",
    value: "صندوق العملاء المحتملين"
  },
  {
    key: "admin.leads.empty",
    locale: "en",
    value: "No leads assigned yet. Capture inquiries from the website or WhatsApp."
  },
  {
    key: "admin.leads.empty",
    locale: "ar",
    value: "لا يوجد عملاء محتملون بعد. التقط الاستفسارات من الموقع أو واتساب."
  },
  {
    key: "admin.deals.header",
    locale: "en",
    value: "Deals Pipeline"
  },
  {
    key: "admin.deals.header",
    locale: "ar",
    value: "مسار الصفقات"
  },
  {
    key: "admin.deals.empty",
    locale: "en",
    value: "No deals in progress. Move qualified leads forward to build momentum."
  },
  {
    key: "admin.deals.empty",
    locale: "ar",
    value: "لا توجد صفقات جارية. ادفع العملاء المحتملين المؤهلين لتحقيق التقدم."
  },
  {
    key: "admin.support.header",
    locale: "en",
    value: "Support Tickets"
  },
  {
    key: "admin.support.header",
    locale: "ar",
    value: "تذاكر الدعم"
  },
  {
    key: "admin.support.empty",
    locale: "en",
    value: "No open tickets. Customers will appear here when they need help."
  },
  {
    key: "admin.support.empty",
    locale: "ar",
    value: "لا توجد تذاكر مفتوحة. سيظهر العملاء هنا عندما يحتاجون إلى المساعدة."
  },
  {
    key: "admin.analytics.header",
    locale: "en",
    value: "Performance Analytics"
  },
  {
    key: "admin.analytics.header",
    locale: "ar",
    value: "تحليلات الأداء"
  },
  {
    key: "admin.analytics.help",
    locale: "en",
    value: "Track daily GMV, conversion funnels, and revenue collections."
  },
  {
    key: "admin.analytics.help",
    locale: "ar",
    value: "تابع قيمة المبيعات اليومية ومسار التحويل والتحصيلات المالية."
  }
];

export const seedCMS = async ({ prisma, logger }: SeedContext): Promise<SeedResult> => {
  logger("Seeding CMS content blocks...");

  for (const block of CONTENT_BLOCKS) {
    await prisma.cms_content_blocks.upsert({
      where: {
        key_locale: {
          key: block.key,
          locale: block.locale
        }
      },
      update: {
        value: block.value
      },
      create: {
        key: block.key,
        locale: block.locale,
        value: block.value
      }
    });
  }

  const summary = [
    {
      model: "cms_content_blocks",
      count: await prisma.cms_content_blocks.count()
    }
  ];

  return {
    summary
  };
};

export default seedCMS;
