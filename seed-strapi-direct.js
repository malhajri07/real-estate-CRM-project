import Strapi from '@strapi/strapi';

const seedData = async () => {
  console.log('Starting direct Strapi seeding...');
  
  // Initialize Strapi programmatically
  const strapi = await Strapi().load();
  
  try {
    // Create landing page content
    console.log('Creating landing page content...');
    const landingPage = await strapi.entityService.create('api::landing-page.landing-page', {
      data: {
        heroTitle: "منصة عقاراتي للوساطة العقارية",
        heroSubtitle: "منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة",
        heroButton: "ابدأ رحلتك المجانية",
        featuresTitle: "لماذا تختار منصة عقاراتي؟",
        pricingTitle: "خطط الأسعار",
        pricingSubtitle: "اختر الخطة المناسبة لك",
        statsTitle: "أرقامنا تتحدث",
        features: [
          {
            title: "إدارة العملاء المحتملين",
            description: "تتبع وإدارة العملاء المحتملين من الاستفسار الأولي حتى إتمام الصفقة",
            icon: "users"
          },
          {
            title: "إدارة العقارات",
            description: "أضف وأدر عقاراتك مع تفاصيل شاملة وصور ومعلومات السعر والموقع",
            icon: "building"
          },
          {
            title: "متابعة الصفقات",
            description: "تتبع مراحل الصفقات من التفاوض الأولي حتى الإغلاق النهائي",
            icon: "trending-up"
          }
        ],
        stats: [
          {
            number: "10,000",
            label: "عميل راضٍ",
            suffix: "+"
          },
          {
            number: "50,000",
            label: "عقار مُدار",
            suffix: "+"
          },
          {
            number: "95",
            label: "نسبة الرضا",
            suffix: "%"
          },
          {
            number: "24/7",
            label: "دعم فني",
            suffix: ""
          }
        ],
        publishedAt: new Date()
      }
    });
    
    console.log('Landing page created:', landingPage.id);
    
    // Create pricing plans
    console.log('Creating pricing plans...');
    const plans = [
      {
        name: "الباقة الأساسية",
        price: 99,
        period: "monthly",
        isPopular: false,
        description: "مثالية للوسطاء الجدد",
        buttonText: "ابدأ الآن",
        order: 1,
        features: [
          { text: "إدارة 100 عميل محتمل", included: true },
          { text: "إدراج 20 عقار", included: true },
          { text: "التقارير الأساسية", included: true },
          { text: "دعم فني 24/7", included: false }
        ],
        publishedAt: new Date()
      },
      {
        name: "الباقة المتقدمة",
        price: 199,
        period: "monthly",
        isPopular: true,
        description: "الأكثر شعبية للشركات المتنامية",
        buttonText: "ابدأ الآن",
        order: 2,
        features: [
          { text: "إدارة غير محدودة للعملاء", included: true },
          { text: "إدراج غير محدود للعقارات", included: true },
          { text: "التقارير المتقدمة", included: true },
          { text: "دعم فني 24/7", included: true }
        ],
        publishedAt: new Date()
      }
    ];
    
    for (const planData of plans) {
      const plan = await strapi.entityService.create('api::pricing-plan.pricing-plan', {
        data: planData
      });
      console.log(`Pricing plan "${planData.name}" created:`, plan.id);
    }
    
    console.log('✅ All content created successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await strapi.destroy();
  }
};

seedData();