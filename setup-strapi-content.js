import axios from 'axios';

const STRAPI_URL = 'http://localhost:1337';

// Create admin user and get JWT token
const getAuthToken = async () => {
  try {
    // Try to login with default credentials
    const loginResponse = await axios.post(`${STRAPI_URL}/admin/login`, {
      email: 'admin@example.com',
      password: 'AdminPassword123'
    });
    return loginResponse.data.data.token;
  } catch (error) {
    console.error('❌ Could not authenticate. Please make sure you have an admin user created.');
    console.log('Go to http://localhost:1337/admin and create an admin user first.');
    return null;
  }
};

// Create components
const createComponents = async (token) => {
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('🔧 Creating components...');

  // Component 1: shared.feature
  try {
    await axios.post(`${STRAPI_URL}/content-type-builder/components`, {
      component: {
        displayName: 'Feature',
        category: 'shared',
        icon: 'star',
        attributes: {
          title: {
            type: 'string',
            required: true
          },
          description: {
            type: 'text',
            required: true
          },
          icon: {
            type: 'string',
            required: true
          }
        }
      }
    }, { headers });
    console.log('✅ Created shared.feature component');
  } catch (error) {
    console.log('⚠️ shared.feature component may already exist');
  }

  // Component 2: shared.stat
  try {
    await axios.post(`${STRAPI_URL}/content-type-builder/components`, {
      component: {
        displayName: 'Stat',
        category: 'shared',
        icon: 'chartLine',
        attributes: {
          number: {
            type: 'string',
            required: true
          },
          label: {
            type: 'string',
            required: true
          },
          suffix: {
            type: 'string'
          }
        }
      }
    }, { headers });
    console.log('✅ Created shared.stat component');
  } catch (error) {
    console.log('⚠️ shared.stat component may already exist');
  }

  // Component 3: shared.plan-feature
  try {
    await axios.post(`${STRAPI_URL}/content-type-builder/components`, {
      component: {
        displayName: 'Plan Feature',
        category: 'shared',
        icon: 'check',
        attributes: {
          text: {
            type: 'string',
            required: true
          },
          included: {
            type: 'boolean',
            required: true,
            default: true
          }
        }
      }
    }, { headers });
    console.log('✅ Created shared.plan-feature component');
  } catch (error) {
    console.log('⚠️ shared.plan-feature component may already exist');
  }
};

// Create content types
const createContentTypes = async (token) => {
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('📄 Creating content types...');

  // Landing Page (Single Type)
  try {
    await axios.post(`${STRAPI_URL}/content-type-builder/content-types`, {
      contentType: {
        displayName: 'Landing Page',
        singularName: 'landing-page',
        pluralName: 'landing-pages',
        kind: 'singleType',
        attributes: {
          heroTitle: {
            type: 'string',
            required: true
          },
          heroSubtitle: {
            type: 'text',
            required: true
          },
          heroButton: {
            type: 'string',
            required: true
          },
          featuresTitle: {
            type: 'string',
            required: true
          },
          features: {
            type: 'component',
            repeatable: true,
            component: 'shared.feature'
          },
          statsTitle: {
            type: 'string',
            required: true
          },
          stats: {
            type: 'component',
            repeatable: true,
            component: 'shared.stat'
          },
          pricingTitle: {
            type: 'string',
            required: true
          },
          pricingSubtitle: {
            type: 'text',
            required: true
          }
        }
      }
    }, { headers });
    console.log('✅ Created Landing Page content type');
  } catch (error) {
    console.log('⚠️ Landing Page content type may already exist');
  }

  // Pricing Plan (Collection Type)
  try {
    await axios.post(`${STRAPI_URL}/content-type-builder/content-types`, {
      contentType: {
        displayName: 'Pricing Plan',
        singularName: 'pricing-plan',
        pluralName: 'pricing-plans',
        kind: 'collectionType',
        attributes: {
          name: {
            type: 'string',
            required: true
          },
          price: {
            type: 'decimal',
            required: true
          },
          period: {
            type: 'enumeration',
            enum: ['monthly', 'yearly'],
            required: true
          },
          isPopular: {
            type: 'boolean',
            default: false
          },
          description: {
            type: 'text',
            required: true
          },
          buttonText: {
            type: 'string',
            required: true
          },
          order: {
            type: 'integer',
            required: true
          },
          features: {
            type: 'component',
            repeatable: true,
            component: 'shared.plan-feature'
          }
        }
      }
    }, { headers });
    console.log('✅ Created Pricing Plan content type');
  } catch (error) {
    console.log('⚠️ Pricing Plan content type may already exist');
  }
};

// Set permissions
const setPermissions = async (token) => {
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('🔐 Setting permissions...');

  try {
    // Get public role
    const rolesResponse = await axios.get(`${STRAPI_URL}/admin/roles`, { headers });
    const publicRole = rolesResponse.data.data.find(role => role.code === 'strapi-author');
    
    if (publicRole) {
      // Set permissions for landing-page
      await axios.put(`${STRAPI_URL}/admin/roles/${publicRole.id}/permissions`, {
        permissions: {
          'api::landing-page.landing-page': {
            controllers: {
              'landing-page': {
                find: {
                  enabled: true,
                  policy: '',
                  role: publicRole.id
                }
              }
            }
          },
          'api::pricing-plan.pricing-plan': {
            controllers: {
              'pricing-plan': {
                find: {
                  enabled: true,
                  policy: '',
                  role: publicRole.id
                }
              }
            }
          }
        }
      }, { headers });
      console.log('✅ Set permissions for public access');
    }
  } catch (error) {
    console.log('⚠️ Could not set permissions automatically. Please set them manually.');
  }
};

// Add sample content
const addSampleContent = async (token) => {
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('📝 Adding sample content...');

  // Add Landing Page content
  try {
    await axios.post(`${STRAPI_URL}/api/landing-pages`, {
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
          },
          {
            title: 'تقارير مفصلة',
            description: 'احصل على تقارير شاملة حول أداء المبيعات والعملاء والعقارات',
            icon: 'bar-chart'
          },
          {
            title: 'تواصل واتساب',
            description: 'تواصل مع العملاء مباشرة عبر واتساب من داخل المنصة',
            icon: 'message-square'
          },
          {
            title: 'أمان البيانات',
            description: 'بيانات آمنة ومحمية بأعلى معايير الأمن والحماية',
            icon: 'shield'
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
    }, { headers });
    console.log('✅ Added Landing Page content');
  } catch (error) {
    console.log('⚠️ Could not add Landing Page content:', error.response?.data?.error?.message || error.message);
  }

  // Add Pricing Plans
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
      console.log(`✅ Added pricing plan: ${plan.name}`);
    } catch (error) {
      console.log(`⚠️ Could not add pricing plan: ${plan.name}`);
    }
  }
};

// Main setup function
const setupStrapi = async () => {
  console.log('🚀 Starting Strapi setup...');
  
  const token = await getAuthToken();
  if (!token) {
    return;
  }

  await createComponents(token);
  await createContentTypes(token);
  await setPermissions(token);
  
  // Wait a bit for Strapi to process the content types
  console.log('⏳ Waiting for Strapi to process content types...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await addSampleContent(token);
  
  console.log('🎉 Strapi setup completed!');
  console.log('📍 Visit http://localhost:1337/admin to see your content types');
  console.log('🌐 Visit http://localhost:5000 to see your landing page with dynamic content');
};

setupStrapi().catch(console.error);