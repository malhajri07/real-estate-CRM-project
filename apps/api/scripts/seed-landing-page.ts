/**
 * seed-landing-page.ts - Seed Landing Page Content
 * 
 * Creates default landing page sections with sample content
 * Run with: npx tsx apps/api/scripts/seed-landing-page.ts
 */

import { prisma } from '../prismaClient';

async function seedLandingPage() {
  console.log('🌱 Seeding landing page content...');

  try {
    // Check existing sections
    const existing = await prisma.landingSection.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((s) => s.slug));
    console.log('Existing sections:', Array.from(existingSlugs));

    // Get the highest orderIndex
    const lastSection = await prisma.landingSection.findFirst({
      orderBy: { orderIndex: 'desc' },
    });
    let orderIndex = (lastSection?.orderIndex ?? 0) + 1;

    const actorId = 'system-seed';

    // 1. Hero Section
    if (!existingSlugs.has('hero')) {
      console.log('Creating hero section...');
      const heroSection = await prisma.landingSection.create({
        data: {
          slug: 'hero',
          title: 'منصة إدارة العقارات الذكية',
          subtitle: 'أداة متكاملة لإدارة عملياتك العقارية بكفاءة واحترافية',
          layoutVariant: 'hero',
          orderIndex: orderIndex++,
          visible: true,
          status: 'published',
          draftJson: {
            badge: 'منصة متكاملة',
            title: 'منصة إدارة العقارات الذكية',
            subtitle: 'أداة متكاملة لإدارة عملياتك العقارية بكفاءة واحترافية',
            cta: {
              label: 'ابدأ الآن',
              href: '/signup',
            },
            secondaryCta: {
              label: 'تسجيل الدخول',
              href: '/rbac-login',
            },
            dashboardTitle: 'نظرة سريعة على الأداء',
          },
          publishedJson: {
            badge: 'منصة متكاملة',
            title: 'منصة إدارة العقارات الذكية',
            subtitle: 'أداة متكاملة لإدارة عملياتك العقارية بكفاءة واحترافية',
            cta: {
              label: 'ابدأ الآن',
              href: '/signup',
            },
            secondaryCta: {
              label: 'تسجيل الدخول',
              href: '/rbac-login',
            },
            dashboardTitle: 'نظرة سريعة على الأداء',
          },
          version: 1,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
        },
      });

      // Create hero metrics cards
      const heroMetrics = [
        { value: '2,500+', label: 'عقار نشط', color: 'blue' },
        { value: '1,200+', label: 'عميل راضٍ', color: 'green' },
        { value: '98%', label: 'معدل الرضا', color: 'purple' },
        { value: '24/7', label: 'دعم فني', color: 'orange' },
      ];

      for (let i = 0; i < heroMetrics.length; i++) {
        await prisma.landingCard.create({
          data: {
            sectionId: heroSection.id,
            orderIndex: i,
            title: heroMetrics[i].value,
            body: heroMetrics[i].label,
            visible: true,
            status: 'published',
            draftJson: {
              value: heroMetrics[i].value,
              label: heroMetrics[i].label,
              color: heroMetrics[i].color,
            },
            publishedJson: {
              value: heroMetrics[i].value,
              label: heroMetrics[i].label,
              color: heroMetrics[i].color,
            },
            version: 1,
            updatedBy: actorId,
            publishedBy: actorId,
            publishedAt: new Date(),
          },
        });
      }
      console.log('✅ Hero section created');
    }

    // 2. Stats Section
    if (!existingSlugs.has('stats')) {
      console.log('Creating stats section...');
      const statsSection = await prisma.landingSection.create({
        data: {
          slug: 'stats',
          title: 'إحصائيات منصتنا',
          layoutVariant: 'custom',
          orderIndex: orderIndex++,
          visible: true,
          status: 'published',
          draftJson: {
            title: 'إحصائيات منصتنا',
          },
          publishedJson: {
            title: 'إحصائيات منصتنا',
          },
          version: 1,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
        },
      });

      const stats = [
        { value: '10,000+', label: 'عقار', suffix: '' },
        { value: '5,000+', label: 'عميل نشط', suffix: '' },
        { value: '500+', label: 'شركة عقارية', suffix: '' },
        { value: '99.9%', label: 'وقت التشغيل', suffix: '' },
      ];

      for (let i = 0; i < stats.length; i++) {
        await prisma.landingCard.create({
          data: {
            sectionId: statsSection.id,
            orderIndex: i,
            title: stats[i].value,
            body: stats[i].label,
            visible: true,
            status: 'published',
            draftJson: {
              value: stats[i].value,
              label: stats[i].label,
              suffix: stats[i].suffix,
            },
            publishedJson: {
              value: stats[i].value,
              label: stats[i].label,
              suffix: stats[i].suffix,
            },
            version: 1,
            updatedBy: actorId,
            publishedBy: actorId,
            publishedAt: new Date(),
          },
        });
      }
      console.log('✅ Stats section created');
    }

    // 3. Features Section
    if (!existingSlugs.has('features')) {
      console.log('Creating features section...');
      const featuresSection = await prisma.landingSection.create({
        data: {
          slug: 'features',
          title: 'مميزات منصتنا',
          subtitle: 'أدوات قوية لإدارة عملياتك العقارية بكفاءة',
          layoutVariant: 'grid',
          orderIndex: orderIndex++,
          visible: true,
          status: 'published',
          draftJson: {
            badge: 'مميزات النظام',
            title: 'مميزات منصتنا',
            subtitle: 'أدوات قوية لإدارة عملياتك العقارية بكفاءة',
          },
          publishedJson: {
            badge: 'مميزات النظام',
            title: 'مميزات منصتنا',
            subtitle: 'أدوات قوية لإدارة عملياتك العقارية بكفاءة',
          },
          version: 1,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
        },
      });

      const features = [
        {
          title: 'إدارة شاملة للعقارات',
          body: 'نظام متكامل لإدارة جميع عملياتك العقارية من مكان واحد',
          icon: 'Building',
        },
        {
          title: 'تقارير ذكية',
          body: 'تقارير مفصلة وتحليلات متقدمة لمساعدتك في اتخاذ القرارات',
          icon: 'BarChart',
        },
        {
          title: 'إدارة العملاء',
          body: 'نظام متقدم لإدارة علاقات العملاء وتتبع التفاعلات',
          icon: 'Users',
        },
        {
          title: 'أمان عالي',
          body: 'حماية متقدمة لبياناتك مع تشفير SSL ونسخ احتياطي تلقائي',
          icon: 'Shield',
        },
        {
          title: 'واجهة سهلة',
          body: 'واجهة مستخدم حديثة وسهلة الاستخدام باللغة العربية',
          icon: 'Smartphone',
        },
        {
          title: 'دعم فني 24/7',
          body: 'فريق دعم فني متاح على مدار الساعة لمساعدتك',
          icon: 'Headphones',
        },
      ];

      for (let i = 0; i < features.length; i++) {
        await prisma.landingCard.create({
          data: {
            sectionId: featuresSection.id,
            orderIndex: i,
            title: features[i].title,
            body: features[i].body,
            icon: features[i].icon,
            visible: true,
            status: 'published',
            draftJson: {
              title: features[i].title,
              body: features[i].body,
              icon: features[i].icon,
            },
            publishedJson: {
              title: features[i].title,
              body: features[i].body,
              icon: features[i].icon,
            },
            version: 1,
            updatedBy: actorId,
            publishedBy: actorId,
            publishedAt: new Date(),
          },
        });
      }
      console.log('✅ Features section created');
    }

    // 4. Solutions Section
    if (!existingSlugs.has('solutions')) {
      console.log('Creating solutions section...');
      const solutionsSection = await prisma.landingSection.create({
        data: {
          slug: 'solutions',
          title: 'حلول متكاملة لاحتياجاتك',
          subtitle: 'نوفر حلولاً شاملة لجميع احتياجاتك العقارية',
          layoutVariant: 'grid',
          orderIndex: orderIndex++,
          visible: true,
          status: 'published',
          draftJson: {
            badge: 'حلول متكاملة',
            title: 'حلول متكاملة لاحتياجاتك',
            subtitle: 'نوفر حلولاً شاملة لجميع احتياجاتك العقارية',
          },
          publishedJson: {
            badge: 'حلول متكاملة',
            title: 'حلول متكاملة لاحتياجاتك',
            subtitle: 'نوفر حلولاً شاملة لجميع احتياجاتك العقارية',
          },
          version: 1,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
        },
      });

      const solutions = [
        {
          title: 'للشركات العقارية',
          body: 'حل متكامل لإدارة الشركات العقارية الكبيرة',
          icon: 'Building2',
          features: ['إدارة متعددة الفروع', 'تقارير موحدة', 'إدارة الفريق'],
        },
        {
          title: 'للوسطاء العقاريين',
          body: 'أداة مثالية للوسطاء العقاريين المستقلين',
          icon: 'User',
          features: ['إدارة العملاء', 'تتبع المبيعات', 'تقارير شخصية'],
        },
        {
          title: 'للمطورين العقاريين',
          body: 'نظام متخصص لإدارة مشاريع التطوير العقاري',
          icon: 'Hammer',
          features: ['إدارة المشاريع', 'تتبع التقدم', 'إدارة الميزانية'],
        },
      ];

      for (let i = 0; i < solutions.length; i++) {
        await prisma.landingCard.create({
          data: {
            sectionId: solutionsSection.id,
            orderIndex: i,
            title: solutions[i].title,
            body: solutions[i].body,
            icon: solutions[i].icon,
            visible: true,
            status: 'published',
            draftJson: {
              title: solutions[i].title,
              body: solutions[i].body,
              icon: solutions[i].icon,
              features: solutions[i].features.map((f) => ({ text: f })),
            },
            publishedJson: {
              title: solutions[i].title,
              body: solutions[i].body,
              icon: solutions[i].icon,
              features: solutions[i].features.map((f) => ({ text: f })),
            },
            version: 1,
            updatedBy: actorId,
            publishedBy: actorId,
            publishedAt: new Date(),
          },
        });
      }
      console.log('✅ Solutions section created');
    }

    // 5. Pricing Section
    if (!existingSlugs.has('pricing')) {
      console.log('Creating pricing section...');
      const pricingSection = await prisma.landingSection.create({
        data: {
          slug: 'pricing',
          title: 'خطط التسعير',
          subtitle: 'اختر الخطة المناسبة لاحتياجاتك',
          layoutVariant: 'pricing',
          orderIndex: orderIndex++,
          visible: true,
          status: 'published',
          draftJson: {
            badge: 'خطط التسعير',
            title: 'خطط التسعير',
            subtitle: 'اختر الخطة المناسبة لاحتياجاتك',
          },
          publishedJson: {
            badge: 'خطط التسعير',
            title: 'خطط التسعير',
            subtitle: 'اختر الخطة المناسبة لاحتياجاتك',
          },
          version: 1,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
        },
      });

      const plans = [
        {
          title: 'الخطة الأساسية',
          body: 'مثالية للبدء',
          price: '299',
          period: 'monthly',
          isPopular: false,
          features: ['حتى 50 عقار', 'دعم عبر البريد', 'تقارير أساسية'],
          cta: { label: 'ابدأ الآن', href: '/signup' },
        },
        {
          title: 'الخطة المتقدمة',
          body: 'الأكثر شعبية',
          price: '599',
          period: 'monthly',
          isPopular: true,
          features: ['حتى 500 عقار', 'دعم فني 24/7', 'تقارير متقدمة', 'API مخصص'],
          cta: { label: 'ابدأ الآن', href: '/signup' },
        },
        {
          title: 'الخطة المؤسسية',
          body: 'للشركات الكبيرة',
          price: '1,299',
          period: 'monthly',
          isPopular: false,
          features: ['عقارات غير محدودة', 'دعم مخصص', 'تقارير مخصصة', 'API كامل', 'تدريب الفريق'],
          cta: { label: 'اتصل بنا', href: '/contact' },
        },
      ];

      for (let i = 0; i < plans.length; i++) {
        await prisma.landingCard.create({
          data: {
            sectionId: pricingSection.id,
            orderIndex: i,
            title: plans[i].title,
            body: plans[i].body,
            ctaLabel: plans[i].cta.label,
            ctaHref: plans[i].cta.href,
            visible: true,
            status: 'published',
            draftJson: {
              title: plans[i].title,
              body: plans[i].body,
              price: plans[i].price,
              period: plans[i].period,
              isPopular: plans[i].isPopular,
              features: plans[i].features.map((f) => ({ text: f, included: true })),
              cta: plans[i].cta,
            },
            publishedJson: {
              title: plans[i].title,
              body: plans[i].body,
              price: plans[i].price,
              period: plans[i].period,
              isPopular: plans[i].isPopular,
              features: plans[i].features.map((f) => ({ text: f, included: true })),
              cta: plans[i].cta,
            },
            version: 1,
            updatedBy: actorId,
            publishedBy: actorId,
            publishedAt: new Date(),
          },
        });
      }
      console.log('✅ Pricing section created');
    }

    // 6. Contact Section
    if (!existingSlugs.has('contact')) {
      console.log('Creating contact section...');
      const contactSection = await prisma.landingSection.create({
        data: {
          slug: 'contact',
          title: 'تواصل معنا',
          subtitle: 'فريقنا جاهز للإجابة على استفساراتك',
          layoutVariant: 'custom',
          orderIndex: orderIndex++,
          visible: true,
          status: 'published',
          draftJson: {
            badge: 'تواصل معنا',
            title: 'تواصل معنا',
            subtitle: 'فريقنا جاهز للإجابة على استفساراتك',
          },
          publishedJson: {
            badge: 'تواصل معنا',
            title: 'تواصل معنا',
            subtitle: 'فريقنا جاهز للإجابة على استفساراتك',
          },
          version: 1,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
        },
      });

      const contactInfo = [
        {
          title: 'الهاتف',
          body: '+966 50 123 4567',
          icon: 'Phone',
          type: 'phone',
        },
        {
          title: 'البريد الإلكتروني',
          body: 'info@aqarkom.com',
          icon: 'Mail',
          type: 'email',
        },
        {
          title: 'العنوان',
          body: 'الرياض، المملكة العربية السعودية',
          icon: 'MapPin',
          type: 'address',
        },
      ];

      for (let i = 0; i < contactInfo.length; i++) {
        await prisma.landingCard.create({
          data: {
            sectionId: contactSection.id,
            orderIndex: i,
            title: contactInfo[i].title,
            body: contactInfo[i].body,
            icon: contactInfo[i].icon,
            visible: true,
            status: 'published',
            draftJson: {
              title: contactInfo[i].title,
              body: contactInfo[i].body,
              icon: contactInfo[i].icon,
              type: contactInfo[i].type,
            },
            publishedJson: {
              title: contactInfo[i].title,
              body: contactInfo[i].body,
              icon: contactInfo[i].icon,
              type: contactInfo[i].type,
            },
            version: 1,
            updatedBy: actorId,
            publishedBy: actorId,
            publishedAt: new Date(),
          },
        });
      }
      console.log('✅ Contact section created');
    }

    // 7. Footer Section
    if (!existingSlugs.has('footer')) {
      console.log('Creating footer section...');
      await prisma.landingSection.create({
        data: {
          slug: 'footer',
          title: 'Footer',
          layoutVariant: 'custom',
          orderIndex: orderIndex++,
          visible: true,
          status: 'published',
          draftJson: {
            body: 'منصة متكاملة لإدارة العقارات بكفاءة واحترافية',
            copyright: '© 2024 عقاركم. جميع الحقوق محفوظة.',
          },
          publishedJson: {
            body: 'منصة متكاملة لإدارة العقارات بكفاءة واحترافية',
            copyright: '© 2024 عقاركم. جميع الحقوق محفوظة.',
          },
          version: 1,
          updatedBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
        },
      });
      console.log('✅ Footer section created');
    }

    console.log('✅ Landing page seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding landing page:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLandingPage()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
