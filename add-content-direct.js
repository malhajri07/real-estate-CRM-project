import axios from 'axios';

const STRAPI_URL = 'http://localhost:1337';

const addContent = async () => {
  console.log('🚀 Adding content directly to Strapi...');
  
  // Login to get token
  try {
    const loginResponse = await axios.post(`${STRAPI_URL}/admin/login`, {
      email: 'admin@example.com',
      password: 'AdminPassword123'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Authenticated successfully');

    // Create landing page content
    try {
      const landingPageData = {
        data: {
          heroTitle: 'منصة عقاراتي للوساطة العقارية',
          heroSubtitle: 'منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة',
          heroButton: 'ابدأ رحلتك المجانية',
          featuresTitle: 'لماذا تختار منصة عقاراتي؟',
          features: [
            {
              title: 'إدارة العملاء المحتملين',
              description: 'تتبع وإدارة العملاء المحتملين من الاستفسار الأولي حتى إتمام الصفقة',
              icon: 'users'
            },
            {
              title: 'إدارة العقارات',
              description: 'أضف وأدر عقاراتك مع تفاصيل شاملة وصور ومعلومات السعر والموقع',
              icon: 'building'
            },
            {
              title: 'متابعة الصفقات',
              description: 'تتبع مراحل الصفقات من التفاوض الأولي حتى الإغلاق النهائي',
              icon: 'trending-up'
            }
          ],
          statsTitle: 'أرقامنا تتحدث',
          stats: [
            { number: '10,000', label: 'عميل راضٍ', suffix: '+' },
            { number: '50,000', label: 'عقار مُدار', suffix: '+' },
            { number: '95', label: 'نسبة الرضا', suffix: '%' },
            { number: '24/7', label: 'دعم فني', suffix: '' }
          ],
          pricingTitle: 'خطط الأسعار',
          pricingSubtitle: 'اختر الخطة المناسبة لك',
          publishedAt: new Date().toISOString()
        }
      };

      const response = await axios.post(`${STRAPI_URL}/api/landing-pages`, landingPageData, { headers });
      console.log('✅ Created landing page content');
    } catch (error) {
      console.log('⚠️ Landing page creation error:', error.response?.data || error.message);
    }

    // Create pricing plans
    const pricingPlans = [
      {
        name: 'الباقة الأساسية',
        price: 99,
        period: 'monthly',
        isPopular: false,
        description: 'مثالية للوسطاء الجدد',
        buttonText: 'ابدأ الآن',
        order: 1,
        features: [
          { text: 'إدارة 100 عميل محتمل', included: true },
          { text: 'إدراج 20 عقار', included: true },
          { text: 'التقارير الأساسية', included: true },
          { text: 'دعم فني 24/7', included: false }
        ],
        publishedAt: new Date().toISOString()
      },
      {
        name: 'الباقة المتقدمة',
        price: 199,
        period: 'monthly',
        isPopular: true,
        description: 'الأكثر شعبية للشركات المتنامية',
        buttonText: 'ابدأ الآن',
        order: 2,
        features: [
          { text: 'إدارة غير محدودة للعملاء', included: true },
          { text: 'إدراج غير محدود للعقارات', included: true },
          { text: 'التقارير المتقدمة', included: true },
          { text: 'دعم فني 24/7', included: true }
        ],
        publishedAt: new Date().toISOString()
      }
    ];

    for (const plan of pricingPlans) {
      try {
        await axios.post(`${STRAPI_URL}/api/pricing-plans`, { data: plan }, { headers });
        console.log(`✅ Created pricing plan: ${plan.name}`);
      } catch (error) {
        console.log(`⚠️ Pricing plan error for ${plan.name}:`, error.response?.data || error.message);
      }
    }

    console.log('🎉 Content creation completed!');
    console.log('🌐 Visit http://localhost:5000 to see your landing page');
    console.log('📍 Visit http://localhost:1337/admin to manage content');

  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
  }
};

addContent().catch(console.error);