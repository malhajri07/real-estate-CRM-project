import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCMS() {
  console.log('🌱 Seeding CMS data...');

  try {
    // Create initial sections
    const heroSection = await prisma.landingSection.create({
      data: {
        slug: 'hero',
        title: 'منصة عقاراتي للوساطة العقارية',
        subtitle: 'منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة',
        layoutVariant: 'hero',
        orderIndex: 1,
        visible: true,
        status: 'published',
        draftJson: {
          title: 'منصة عقاراتي للوساطة العقارية',
          subtitle: 'منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة',
          body: 'اكتشف العقارات المناسبة لك بسهولة وسرعة مع منصة عقاراتي المتطورة',
          cta: {
            label: 'ابدأ رحلتك المجانية',
            href: '/signup',
            style: 'primary'
          },
          media: {
            url: '/images/hero-bg.jpg',
            alt: 'منصة عقاراتي'
          },
          layoutVariant: 'hero',
          visibility: true
        },
        publishedJson: {
          title: 'منصة عقاراتي للوساطة العقارية',
          subtitle: 'منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة',
          body: 'اكتشف العقارات المناسبة لك بسهولة وسرعة مع منصة عقاراتي المتطورة',
          cta: {
            label: 'ابدأ رحلتك المجانية',
            href: '/signup',
            style: 'primary'
          },
          media: {
            url: '/images/hero-bg.jpg',
            alt: 'منصة عقاراتي'
          },
          layoutVariant: 'hero',
          visibility: true
        },
        version: 1,
        updatedBy: 'system',
        publishedBy: 'system',
        publishedAt: new Date()
      }
    });

    const featuresSection = await prisma.landingSection.create({
      data: {
        slug: 'features',
        title: 'لماذا تختار منصة عقاراتي؟',
        subtitle: 'عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة',
        layoutVariant: 'grid',
        orderIndex: 2,
        visible: true,
        status: 'published',
        draftJson: {
          title: 'لماذا تختار منصة عقاراتي؟',
          subtitle: 'عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة',
          body: 'نقدم لك مجموعة شاملة من الأدوات والميزات التي تساعدك في إدارة أعمالك العقارية بكفاءة عالية',
          layoutVariant: 'grid',
          visibility: true
        },
        publishedJson: {
          title: 'لماذا تختار منصة عقاراتي؟',
          subtitle: 'عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة',
          body: 'نقدم لك مجموعة شاملة من الأدوات والميزات التي تساعدك في إدارة أعمالك العقارية بكفاءة عالية',
          layoutVariant: 'grid',
          visibility: true
        },
        version: 1,
        updatedBy: 'system',
        publishedBy: 'system',
        publishedAt: new Date()
      }
    });

    const pricingSection = await prisma.landingSection.create({
      data: {
        slug: 'pricing',
        title: 'خطط الأسعار',
        subtitle: 'اختر الخطة المناسبة لك',
        layoutVariant: 'pricing',
        orderIndex: 3,
        visible: true,
        status: 'published',
        draftJson: {
          title: 'خطط الأسعار',
          subtitle: 'اختر الخطة المناسبة لك',
          body: 'خطط مرنة تناسب جميع احتياجاتك العقارية',
          layoutVariant: 'pricing',
          visibility: true
        },
        publishedJson: {
          title: 'خطط الأسعار',
          subtitle: 'اختر الخطة المناسبة لك',
          body: 'خطط مرنة تناسب جميع احتياجاتك العقارية',
          layoutVariant: 'pricing',
          visibility: true
        },
        version: 1,
        updatedBy: 'system',
        publishedBy: 'system',
        publishedAt: new Date()
      }
    });

    // Create cards for features section
    const featureCards = [
      {
        title: 'إدارة شاملة للعقارات',
        body: 'أدوات متطورة لإدارة جميع جوانب أعمالك العقارية من عرض العقارات إلى متابعة العملاء',
        icon: '🏠',
        ctaLabel: 'تعرف على المزيد',
        ctaHref: '/features/property-management'
      },
      {
        title: 'تسويق ذكي',
        body: 'أدوات تسويق متقدمة تساعدك في الوصول إلى العملاء المناسبين في الوقت المناسب',
        icon: '📈',
        ctaLabel: 'اكتشف الأدوات',
        ctaHref: '/features/marketing'
      },
      {
        title: 'تقارير وتحليلات',
        body: 'تقارير مفصلة وتحليلات ذكية تساعدك في اتخاذ قرارات مدروسة',
        icon: '📊',
        ctaLabel: 'عرض التقارير',
        ctaHref: '/features/analytics'
      },
      {
        title: 'دعم فني متميز',
        body: 'فريق دعم فني متخصص جاهز لمساعدتك في أي وقت',
        icon: '🎧',
        ctaLabel: 'تواصل معنا',
        ctaHref: '/contact'
      }
    ];

    for (let i = 0; i < featureCards.length; i++) {
      const card = featureCards[i];
      await prisma.landingCard.create({
        data: {
          sectionId: featuresSection.id,
          orderIndex: i + 1,
          title: card.title,
          body: card.body,
          icon: card.icon,
          ctaLabel: card.ctaLabel,
          ctaHref: card.ctaHref,
          visible: true,
          status: 'published',
          draftJson: {
            title: card.title,
            body: card.body,
            icon: card.icon,
            cta: {
              label: card.ctaLabel,
              href: card.ctaHref
            },
            visibility: true
          },
          publishedJson: {
            title: card.title,
            body: card.body,
            icon: card.icon,
            cta: {
              label: card.ctaLabel,
              href: card.ctaHref
            },
            visibility: true
          },
          version: 1,
          updatedBy: 'system',
          publishedBy: 'system',
          publishedAt: new Date()
        }
      });
    }

    // Create cards for pricing section
    const pricingCards = [
      {
        title: 'الخطة الأساسية',
        body: 'مناسبة للوكلاء المستقلين والمبتدئين',
        ctaLabel: 'ابدأ الآن',
        ctaHref: '/signup?plan=basic'
      },
      {
        title: 'الخطة المتقدمة',
        body: 'مثالية للوكالات العقارية المتوسطة',
        ctaLabel: 'اختر هذه الخطة',
        ctaHref: '/signup?plan=advanced'
      },
      {
        title: 'الخطة المؤسسية',
        body: 'للوكالات العقارية الكبيرة والمؤسسات',
        ctaLabel: 'تواصل معنا',
        ctaHref: '/contact?plan=enterprise'
      }
    ];

    for (let i = 0; i < pricingCards.length; i++) {
      const card = pricingCards[i];
      await prisma.landingCard.create({
        data: {
          sectionId: pricingSection.id,
          orderIndex: i + 1,
          title: card.title,
          body: card.body,
          ctaLabel: card.ctaLabel,
          ctaHref: card.ctaHref,
          visible: true,
          status: 'published',
          draftJson: {
            title: card.title,
            body: card.body,
            cta: {
              label: card.ctaLabel,
              href: card.ctaHref
            },
            visibility: true
          },
          publishedJson: {
            title: card.title,
            body: card.body,
            cta: {
              label: card.ctaLabel,
              href: card.ctaHref
            },
            visibility: true
          },
          version: 1,
          updatedBy: 'system',
          publishedBy: 'system',
          publishedAt: new Date()
        }
      });
    }

    // Create a CTA section
    const ctaSection = await prisma.landingSection.create({
      data: {
        slug: 'cta',
        title: 'ابدأ رحلتك العقارية اليوم',
        subtitle: 'انضم إلى آلاف الوكلاء العقاريين الذين يثقون بمنصة عقاراتي',
        layoutVariant: 'cta',
        orderIndex: 4,
        visible: true,
        status: 'published',
        draftJson: {
          title: 'ابدأ رحلتك العقارية اليوم',
          subtitle: 'انضم إلى آلاف الوكلاء العقاريين الذين يثقون بمنصة عقاراتي',
          body: 'سجل الآن واحصل على تجربة مجانية لمدة 30 يوم',
          cta: {
            label: 'سجل مجاناً الآن',
            href: '/signup',
            style: 'primary'
          },
          layoutVariant: 'cta',
          visibility: true
        },
        publishedJson: {
          title: 'ابدأ رحلتك العقارية اليوم',
          subtitle: 'انضم إلى آلاف الوكلاء العقاريين الذين يثقون بمنصة عقاراتي',
          body: 'سجل الآن واحصل على تجربة مجانية لمدة 30 يوم',
          cta: {
            label: 'سجل مجاناً الآن',
            href: '/signup',
            style: 'primary'
          },
          layoutVariant: 'cta',
          visibility: true
        },
        version: 1,
        updatedBy: 'system',
        publishedBy: 'system',
        publishedAt: new Date()
      }
    });

    console.log('✅ CMS data seeded successfully!');
    console.log(`📊 Created ${4} sections and ${7} cards`);

  } catch (error) {
    console.error('❌ Error seeding CMS data:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedCMS();
  } catch (error) {
    console.error('Failed to seed CMS data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main();

export { seedCMS };
