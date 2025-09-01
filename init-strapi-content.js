import axios from 'axios';

const STRAPI_URL = 'http://localhost:1337/api';

// Wait for Strapi to be ready
const waitForStrapi = async () => {
  let attempts = 0;
  while (attempts < 30) {
    try {
      await axios.get('http://localhost:1337/_health');
      console.log('Strapi is ready!');
      return true;
    } catch (error) {
      console.log(`Waiting for Strapi... (attempt ${attempts + 1}/30)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
  }
  return false;
};

// Create landing page content
const createLandingPageContent = async () => {
  try {
    const landingPageData = {
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
        publishedAt: new Date().toISOString()
      }
    };

    const response = await axios.post(`${STRAPI_URL}/landing-page`, landingPageData);
    console.log('Landing page content created successfully!');
    return response.data;
  } catch (error) {
    console.error('Error creating landing page content:', error.response?.data || error.message);
  }
};

// Create pricing plans
const createPricingPlans = async () => {
  const plans = [
    {
      data: {
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
        publishedAt: new Date().toISOString()
      }
    },
    {
      data: {
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
        publishedAt: new Date().toISOString()
      }
    },
    {
      data: {
        name: "الباقة الاحترافية",
        price: 299,
        period: "monthly",
        isPopular: false,
        description: "للشركات الكبيرة والمؤسسات",
        buttonText: "ابدأ الآن",
        order: 3,
        features: [
          { text: "جميع ميزات الباقة المتقدمة", included: true },
          { text: "تكامل مع الأنظمة الخارجية", included: true },
          { text: "تقارير مخصصة", included: true },
          { text: "مدير حساب مخصص", included: true }
        ],
        publishedAt: new Date().toISOString()
      }
    }
  ];

  for (const plan of plans) {
    try {
      const response = await axios.post(`${STRAPI_URL}/pricing-plans`, plan);
      console.log(`Pricing plan "${plan.data.name}" created successfully!`);
    } catch (error) {
      console.error(`Error creating pricing plan "${plan.data.name}":`, error.response?.data || error.message);
    }
  }
};

// Main initialization function
const initializeContent = async () => {
  console.log('Starting Strapi content initialization...');

  const isReady = await waitForStrapi();
  if (!isReady) {
    console.error('Strapi is not responding. Please check if it\'s running properly.');
    return;
  }

  await createLandingPageContent();
  await createPricingPlans();

  console.log('Content initialization completed!');
  console.log('You can now visit http://localhost:5000 to see the landing page with CMS content.');
  console.log('Admin panel: http://localhost:1337/admin');
};

initializeContent().catch(console.error);
