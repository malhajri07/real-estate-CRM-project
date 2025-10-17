import { prisma } from "./prismaClient";

type CreateSectionInput = {
  slug: string;
  title: string;
  subtitle?: string;
  layoutVariant?: string;
  orderIndex: number;
  body?: string;
  visibility?: boolean;
};

function buildSectionPayload(input: CreateSectionInput) {
  return {
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle ?? "",
    layoutVariant: input.layoutVariant ?? "custom",
    orderIndex: input.orderIndex,
    visible: input.visibility ?? true,
    status: "published" as const,
    draftJson: {
      title: input.title,
      subtitle: input.subtitle ?? "",
      body: input.body ?? "",
      layoutVariant: input.layoutVariant ?? "custom",
      visibility: input.visibility ?? true,
    },
    publishedJson: {
      title: input.title,
      subtitle: input.subtitle ?? "",
      body: input.body ?? "",
      layoutVariant: input.layoutVariant ?? "custom",
      visibility: input.visibility ?? true,
    },
    version: 1,
    updatedBy: "system",
    publishedBy: "system",
    publishedAt: new Date(),
  };
}

async function seedCMS() {
  console.log("🌱 Seeding CMS data...");

  try {
    // Reset landing sections for a clean seed
    await prisma.landingCard.deleteMany({});
    await prisma.landingSection.deleteMany({});

    // Navigation
    const navigationSection = await prisma.landingSection.create({
      data: buildSectionPayload({
        slug: "navigation",
        title: "روابط التنقل",
        orderIndex: 1,
        layoutVariant: "navigation",
      }),
    });

    const navigationLinks = [
      { label: "الرئيسية", href: "#home" },
      { label: "المميزات", href: "#features" },
      { label: "الحلول", href: "#solutions" },
      { label: "الأسعار", href: "#pricing" },
      { label: "اتصل بنا", href: "#contact" },
    ];

    for (let i = 0; i < navigationLinks.length; i++) {
      const link = navigationLinks[i];
      await prisma.landingCard.create({
        data: {
          sectionId: navigationSection.id,
          orderIndex: i,
          title: link.label,
          visible: true,
          status: "published",
          draftJson: {
            label: link.label,
            href: link.href,
            visibility: true,
          },
          publishedJson: {
            label: link.label,
            href: link.href,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // Hero
    const heroSection = await prisma.landingSection.create({
      data: {
        ...buildSectionPayload({
          slug: "hero",
          title: "منصة عقاراتي للوساطة العقارية",
          subtitle:
            "منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة",
          orderIndex: 2,
          layoutVariant: "hero",
          body:
            "اكتشف العقارات المناسبة لك بسهولة وسرعة مع منصة عقاراتي المتطورة، الداعمة لفرق التسويق والمبيعات.",
        }),
        draftJson: {
          badge: "مرحباً بك في",
          title: "منصة عقاراتي للوساطة العقارية",
          subtitle:
            "منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة",
          body:
            "استخدم أدواتنا الذكية لتعزيز أداء فريقك وتحقيق صفقات أسرع وأكثر شفافية.",
          cta: {
            label: "ابدأ رحلتك المجانية",
            href: "/signup",
            style: "primary",
          },
          secondaryCta: {
            label: "تسجيل الدخول",
            href: "/login",
          },
          dashboardTitle: "لوحة مؤشرات الأداء",
          layoutVariant: "hero",
          visibility: true,
        },
        publishedJson: {
          badge: "مرحباً بك في",
          title: "منصة عقاراتي للوساطة العقارية",
          subtitle:
            "منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة",
          body:
            "استخدم أدواتنا الذكية لتعزيز أداء فريقك وتحقيق صفقات أسرع وأكثر شفافية.",
          cta: {
            label: "ابدأ رحلتك المجانية",
            href: "/signup",
            style: "primary",
          },
          secondaryCta: {
            label: "تسجيل الدخول",
            href: "/login",
          },
          dashboardTitle: "لوحة مؤشرات الأداء",
          layoutVariant: "hero",
          visibility: true,
        },
      },
    });

    const heroMetrics = [
      { value: "1.2M ﷼", label: "إيرادات محققة", color: "blue" },
      { value: "3,847", label: "عملاء نشطون", color: "green" },
      { value: "89", label: "عقارات مميزة", color: "orange" },
      { value: "45", label: "صفقات منجزة", color: "purple" },
    ];

    for (let i = 0; i < heroMetrics.length; i++) {
      const metric = heroMetrics[i];
      await prisma.landingCard.create({
        data: {
          sectionId: heroSection.id,
          orderIndex: i,
          title: metric.value,
          body: metric.label,
          visible: true,
          status: "published",
          draftJson: {
            value: metric.value,
            label: metric.label,
            color: metric.color,
            visibility: true,
          },
          publishedJson: {
            value: metric.value,
            label: metric.label,
            color: metric.color,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // Features
    const featuresSection = await prisma.landingSection.create({
      data: buildSectionPayload({
        slug: "features",
        title: "لماذا تختار منصة عقاراتي؟",
        subtitle:
          "حل متكامل لإدارة العملاء، العقارات، والصفقات في لوحة واحدة.",
        orderIndex: 3,
        layoutVariant: "grid",
      }),
    });

    const featureCards = [
      {
        title: "إدارة شاملة للعقارات",
        body: "تتبّع دقيق للعقارات مع إدارة الوسائط والوثائق والتسعير.",
        icon: "building",
      },
      {
        title: "منصة لتسويق الوساطة العقارية",
        body: "أطلق حملات تسويقية مؤتمتة وحدد الجمهور المناسب لكل عقار.",
        icon: "trending-up",
      },
      {
        title: "تحليلات فورية",
        body: "لوحات تحكم تفاعلية تعرض أداء المبيعات والتسويق لحظياً.",
        icon: "bar-chart",
      },
      {
        title: "دعم متكامل للفِرق",
        body: "تابع مهام الفريق وتعاون مع الأعضاء بخطوات واضحة وسريعة.",
        icon: "headset",
      },
      {
        title: "إدارة العملاء المحتملين",
        body: "احفظ تفاعلات العملاء وحدد أولويات المتابعة تلقائياً.",
        icon: "users",
      },
      {
        title: "أتمتة التواصل",
        body: "أرسل رسائل بريد وواتساب مخصّصة بناءً على سلوك العملاء.",
        icon: "message-square",
      },
    ];

    for (let i = 0; i < featureCards.length; i++) {
      const card = featureCards[i];
      await prisma.landingCard.create({
        data: {
          sectionId: featuresSection.id,
          orderIndex: i,
          title: card.title,
          body: card.body,
          icon: card.icon,
          visible: true,
          status: "published",
          draftJson: {
            title: card.title,
            body: card.body,
            icon: card.icon,
            visibility: true,
          },
          publishedJson: {
            title: card.title,
            body: card.body,
            icon: card.icon,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // Solutions
    const solutionsSection = await prisma.landingSection.create({
      data: buildSectionPayload({
        slug: "solutions",
        title: "حلول لجميع فرق الوساطة العقارية",
        subtitle:
          "من متابعة العملاء إلى إغلاق الصفقات، نوفر لك الأدوات الذكية في كل خطوة.",
        orderIndex: 4,
        layoutVariant: "grid",
      }),
    });

    const solutions = [
      {
        title: "إدارة العملاء",
        description:
          "قواعد بيانات محدثة، تصنيف العملاء آلياً، وسجلات اتصال كاملة.",
        icon: "users",
        features: [
          { text: "تصنيف العملاء حسب الاهتمامات" },
          { text: "تنبيهات ذكية للمتابعة" },
          { text: "قوالب رسائل جاهزة" },
        ],
      },
      {
        title: "إدارة العقارات",
        description:
          "ملفات عقارية ثرية، مقارنة عروض، وتكامل مع بوابات الإعلان.",
        icon: "building",
        features: [
          { text: "إدارة الوسائط والوثائق" },
          { text: "تتبع حالة كل عقار" },
          { text: "مشاركات آمنة مع الشركاء" },
        ],
      },
      {
        title: "مركز الصفقات",
        description:
          "لوحات متابعة للصفقات مع مهام الفريق والتنبيهات الزمنية.",
        icon: "git-branch",
        features: [
          { text: "التقدم عبر مراحل الصفقة" },
          { text: "تقارير الربحية المتوقعة" },
          { text: "ربط المستندات القانونية" },
        ],
      },
    ];

    for (let i = 0; i < solutions.length; i++) {
      const card = solutions[i];
      await prisma.landingCard.create({
        data: {
          sectionId: solutionsSection.id,
          orderIndex: i,
          title: card.title,
          body: card.description,
          icon: card.icon,
          visible: true,
          status: "published",
          draftJson: {
            title: card.title,
            body: card.description,
            icon: card.icon,
            features: card.features,
            visibility: true,
          },
          publishedJson: {
            title: card.title,
            body: card.description,
            icon: card.icon,
            features: card.features,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // Stats
    const statsSection = await prisma.landingSection.create({
      data: buildSectionPayload({
        slug: "stats",
        title: "أرقامنا تتحدث",
        orderIndex: 5,
        layoutVariant: "stats",
      }),
    });

    const stats = [
      { value: "10,000+", label: "عملاء راضون", suffix: "" },
      { value: "50,000+", label: "عقار تم تسويقه", suffix: "" },
      { value: "98%", label: "نسبة الرضا عن الدعم", suffix: "" },
      { value: "24/7", label: "دعم فني متواصل", suffix: "" },
    ];

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      await prisma.landingCard.create({
        data: {
          sectionId: statsSection.id,
          orderIndex: i,
          title: stat.label,
          body: stat.value,
          visible: true,
          status: "published",
          draftJson: {
            value: stat.value,
            label: stat.label,
            suffix: stat.suffix,
            visibility: true,
          },
          publishedJson: {
            value: stat.value,
            label: stat.label,
            suffix: stat.suffix,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // Pricing
    const pricingSection = await prisma.landingSection.create({
      data: buildSectionPayload({
        slug: "pricing",
        title: "خطط الأسعار",
        subtitle: "خطط مرنة تناسب جميع أحجام مكاتب الوساطة العقارية",
        orderIndex: 6,
        layoutVariant: "pricing",
      }),
    });

    const pricingPlans = [
      {
        title: "الباقة الأساسية",
        body: "مثالية للفرق الناشئة التي تحتاج إلى أساس متين.",
        price: 0,
        period: "monthly",
        isPopular: false,
        cta: { label: "ابدأ مجاناً", href: "/signup?plan=starter" },
        features: [
          { text: "حتى 50 عقاراً", included: true },
          { text: "قاعدة بيانات العملاء المحتملين", included: true },
          { text: "تقارير دورية أساسية", included: true },
          { text: "دعم عبر البريد", included: true },
          { text: "حملات تسويق متقدمة", included: false },
        ],
      },
      {
        title: "الباقة الاحترافية",
        body: "الخيار الأمثل لفرق المبيعات المتوسطة والمتنامية.",
        price: 299,
        period: "monthly",
        isPopular: true,
        cta: { label: "اختر هذه الباقة", href: "/signup?plan=pro" },
        features: [
          { text: "إدارة عقارات غير محدودة", included: true },
          { text: "أتمتة حملات التسويق", included: true },
          { text: "تقارير متقدمة وتحليلات", included: true },
          { text: "دعم متعدد القنوات 24/7", included: true },
          { text: "تكاملات API متقدمة", included: true },
        ],
      },
      {
        title: "باقة الشركات",
        body: "حل مخصص للمؤسسات الكبيرة والجهات متعددة الفروع.",
        price: 899,
        period: "monthly",
        isPopular: false,
        cta: { label: "تواصل مع المبيعات", href: "/contact?plan=enterprise" },
        features: [
          { text: "حسابات مستخدمين غير محدودة", included: true },
          { text: "مدير نجاح مخصص", included: true },
          { text: "تكاملات مخصصة مع الأنظمة", included: true },
          { text: "تدريب على مستوى المؤسسة", included: true },
          { text: "خطة استمرارية الأعمال", included: true },
        ],
      },
    ];

    for (let i = 0; i < pricingPlans.length; i++) {
      const plan = pricingPlans[i];
      await prisma.landingCard.create({
        data: {
          sectionId: pricingSection.id,
          orderIndex: i,
          title: plan.title,
          body: plan.body,
          visible: true,
          status: "published",
          draftJson: {
            title: plan.title,
            body: plan.body,
            price: plan.price,
            period: plan.period,
            isPopular: plan.isPopular,
            cta: plan.cta,
            features: plan.features,
            visibility: true,
          },
          publishedJson: {
            title: plan.title,
            body: plan.body,
            price: plan.price,
            period: plan.period,
            isPopular: plan.isPopular,
            cta: plan.cta,
            features: plan.features,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // Contact
    const contactSection = await prisma.landingSection.create({
      data: buildSectionPayload({
        slug: "contact",
        title: "تواصل معنا",
        subtitle: "فريقنا جاهز لدعم احتياجاتك العقارية على مدار الساعة.",
        orderIndex: 7,
        layoutVariant: "grid",
      }),
    });

    const contactItems = [
      { label: "الهاتف", value: "+966 50 123 4567", type: "phone", icon: "phone" },
      { label: "البريد الإلكتروني", value: "support@aqaraty.sa", type: "email", icon: "mail" },
      { label: "العنوان", value: "الرياض، المملكة العربية السعودية", type: "location", icon: "map-pin" },
    ];

    for (let i = 0; i < contactItems.length; i++) {
      const item = contactItems[i];
      await prisma.landingCard.create({
        data: {
          sectionId: contactSection.id,
          orderIndex: i,
          title: item.label,
          body: item.value,
          icon: item.icon,
          visible: true,
          status: "published",
          draftJson: {
            type: item.type,
            title: item.label,
            body: item.value,
            icon: item.icon,
            visibility: true,
          },
          publishedJson: {
            type: item.type,
            title: item.label,
            body: item.value,
            icon: item.icon,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // Footer
    const footerSection = await prisma.landingSection.create({
      data: {
        ...buildSectionPayload({
          slug: "footer",
          title: "تذييل الصفحة",
          body: "منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية.",
          orderIndex: 8,
          layoutVariant: "footer",
        }),
        draftJson: {
          body: "منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية.",
          copyright:
            "© 2024 منصة عقاراتي. جميع الحقوق محفوظة.",
          visibility: true,
        },
        publishedJson: {
          body: "منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية.",
          copyright:
            "© 2024 منصة عقاراتي. جميع الحقوق محفوظة.",
          visibility: true,
        },
      },
    });

    const footerGroups = [
      {
        category: "روابط سريعة",
        links: [
          { text: "الرئيسية", href: "#home" },
          { text: "المميزات", href: "#features" },
          { text: "الحلول", href: "#solutions" },
          { text: "الأسعار", href: "#pricing" },
          { text: "اتصل بنا", href: "#contact" },
        ],
      },
      {
        category: "الدعم والمساعدة",
        links: [
          { text: "الدعم الفني", href: "mailto:support@aqaraty.sa" },
          { text: "مركز المعرفة", href: "/help-center" },
          { text: "سياسة الخصوصية", href: "/privacy" },
          { text: "الشروط والأحكام", href: "/terms" },
        ],
      },
    ];

    for (let i = 0; i < footerGroups.length; i++) {
      const group = footerGroups[i];
      await prisma.landingCard.create({
        data: {
          sectionId: footerSection.id,
          orderIndex: i,
          title: group.category,
          visible: true,
          status: "published",
          draftJson: {
            category: group.category,
            links: group.links,
            visibility: true,
          },
          publishedJson: {
            category: group.category,
            links: group.links,
            visibility: true,
          },
          version: 1,
          updatedBy: "system",
          publishedBy: "system",
          publishedAt: new Date(),
        },
      });
    }

    // CTA Section
    await prisma.landingSection.create({
      data: {
        ...buildSectionPayload({
          slug: "cta",
          title: "ابدأ رحلتك العقارية اليوم",
          subtitle:
            "انضم إلى آلاف الوسطاء الذين يعتمدون على منصة عقاراتي لتحقيق أهدافهم.",
          orderIndex: 9,
          layoutVariant: "cta",
        }),
        draftJson: {
          title: "ابدأ رحلتك العقارية اليوم",
          subtitle:
            "انضم إلى آلاف الوسطاء الذين يعتمدون على منصة عقاراتي لتحقيق أهدافهم.",
          body: "سجل الآن واحصل على فترة تجريبية مجانية لمدة 30 يوماً بجميع المزايا.",
          cta: {
            label: "سجل مجاناً الآن",
            href: "/signup",
            style: "primary",
          },
          visibility: true,
        },
        publishedJson: {
          title: "ابدأ رحلتك العقارية اليوم",
          subtitle:
            "انضم إلى آلاف الوسطاء الذين يعتمدون على منصة عقاراتي لتحقيق أهدافهم.",
          body: "سجل الآن واحصل على فترة تجريبية مجانية لمدة 30 يوماً بجميع المزايا.",
          cta: {
            label: "سجل مجاناً الآن",
            href: "/signup",
            style: "primary",
          },
          visibility: true,
        },
      },
    });

    console.log("✅ CMS data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding CMS data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await seedCMS();
  } catch (error) {
    console.error("Failed to seed CMS data:", error);
    process.exit(1);
  }
}

main();

export { seedCMS };
