import axios from 'axios';

const CMS_URL = '/api/cms'; // Use our custom CMS API instead of Strapi

// إنشاء instance من axios للـ CMS
const cmsApi = axios.create({
  baseURL: CMS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for CMS content
export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Stat {
  id: number;
  number: string;
  label: string;
  suffix?: string;
}

export interface PlanFeature {
  id: number;
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: number;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  isPopular: boolean;
  description: string;
  features: PlanFeature[];
  buttonText: string;
  order: number;
}

export interface NavigationItem {
  id: number;
  text: string;
  url: string;
  order: number;
}

export interface SolutionFeature {
  id: number;
  text: string;
  icon: string;
}

export interface Solution {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: SolutionFeature[];
  order: number;
}

export interface ContactInfo {
  id: number;
  type: string;
  label: string;
  value: string;
  icon: string;
}

export interface FooterLink {
  id: number;
  text: string;
  url: string;
  category: string;
  order: number;
}

export interface HeroDashboardMetric {
  id: number;
  value: string;
  label: string;
  color: string;
  order: number;
}

export interface LandingPageContent {
  id: number;
  // Loading text
  loadingText: string;

  // Hero Section
  heroWelcomeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButton: string;
  heroLoginButton: string;
  heroDashboardTitle: string;
  heroDashboardMetrics: HeroDashboardMetric[];

  // Features Section
  featuresTitle: string;
  featuresDescription: string;
  features: Feature[];

  // Solutions Section
  solutionsTitle: string;
  solutionsDescription: string;
  solutions: Solution[];

  // Stats Section
  statsTitle: string;
  stats: Stat[];

  // Pricing Section
  pricingTitle: string;
  pricingSubtitle: string;

  // Contact Section
  contactTitle: string;
  contactDescription: string;
  contactInfo: ContactInfo[];

  // Footer
  footerDescription: string;
  footerCopyright: string;
  footerLinks: FooterLink[];

  // Navigation
  navigation: NavigationItem[];
}

// API functions
export const cmsService = {
  // جلب محتوى صفحة الهبوط
  async getLandingPageContent(opts?: { noCache?: boolean }): Promise<LandingPageContent> {
    try {
      const response = await cmsApi.get('/landing-page', {
        params: opts?.noCache ? { t: Date.now() } : undefined,
        headers: opts?.noCache ? { 'Cache-Control': 'no-cache' } : undefined,
      });
      return response.data.data;
    } catch (error) {
      console.error('خطأ في جلب محتوى صفحة الهبوط من CMS:', error);
      // إرجاع محتوى افتراضي في حالة الخطأ
      return {
        id: 0,
        loadingText: 'جار تحميل المحتوى...',
        heroWelcomeText: 'مرحباً بك في',
        heroTitle: 'منصة عقاراتي للوساطة العقارية',
        heroSubtitle: 'منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة',
        heroButton: 'ابدأ رحلتك المجانية',
        heroLoginButton: 'تسجيل الدخول',
        heroDashboardTitle: 'منصة عقاراتي - لوحة التحكم',
        heroDashboardMetrics: [
          { id: 1, value: '1.2M ﷼', label: 'إيرادات', color: 'blue', order: 1 },
          { id: 2, value: '3,847', label: 'عملاء', color: 'green', order: 2 },
          { id: 3, value: '89', label: 'عقارات', color: 'orange', order: 3 },
          { id: 4, value: '45', label: 'صفقات', color: 'purple', order: 4 }
        ],
        featuresTitle: 'لماذا تختار منصة عقاراتي؟',
        featuresDescription: 'عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة',
        features: [],
        solutionsTitle: 'حلول شاملة لإدارة العقارات',
        solutionsDescription: 'أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية',
        solutions: [],
        pricingTitle: 'خطط الأسعار',
        pricingSubtitle: 'اختر الخطة المناسبة لك',
        statsTitle: 'أرقامنا تتحدث',
        stats: [],
        contactTitle: 'تواصل معنا',
        contactDescription: 'نحن هنا لمساعدتك في رحلتك العقارية',
        contactInfo: [],
        footerDescription: 'منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية',
        footerCopyright: '© 2024 منصة عقاراتي. جميع الحقوق محفوظة.',
        footerLinks: [],
        navigation: [
          { id: 1, text: 'الرئيسية', url: '#home', order: 1 },
          { id: 2, text: 'ابحث عن عقار', url: '/map', order: 2 },
          { id: 3, text: 'المميزات', url: '#features', order: 3 },
          { id: 4, text: 'الحلول', url: '#solutions', order: 4 },
          { id: 5, text: 'الأسعار', url: '#pricing', order: 5 },
          { id: 6, text: 'اتصل بنا', url: '#contact', order: 6 }
        ]
      };
    }
  },

  // جلب خطط التسعير
  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const response = await cmsApi.get('/pricing-plans');
      return response.data.data;
    } catch (error) {
      console.error('خطأ في جلب خطط التسعير من CMS:', error);
      // إرجاع خطط افتراضية في حالة الخطأ
      return [
        {
          id: 1,
          name: 'الباقة الأساسية',
          price: 99,
          period: 'monthly',
          isPopular: false,
          description: 'مثالية للوسطاء الجدد',
          features: [
            { id: 1, text: 'إدارة 100 عميل محتمل', included: true },
            { id: 2, text: 'إدراج 20 عقار', included: true },
            { id: 3, text: 'التقارير الأساسية', included: true },
            { id: 4, text: 'دعم فني 24/7', included: false }
          ],
          buttonText: 'ابدأ الآن',
          order: 1
        },
        {
          id: 2,
          name: 'الباقة المتقدمة',
          price: 199,
          period: 'monthly',
          isPopular: true,
          description: 'الأكثر شعبية للشركات المتنامية',
          features: [
            { id: 5, text: 'إدارة غير محدودة للعملاء', included: true },
            { id: 6, text: 'إدراج غير محدود للعقارات', included: true },
            { id: 7, text: 'التقارير المتقدمة', included: true },
            { id: 8, text: 'دعم فني 24/7', included: true }
          ],
          buttonText: 'ابدأ الآن',
          order: 2
        }
      ];
    }
  },

  // تحديث محتوى صفحة الهبوط
  async updateLandingPageContent(content: Partial<LandingPageContent>): Promise<LandingPageContent> {
    try {
      const response = await cmsApi.put('/landing-page', { data: content });
      return response.data.data;
    } catch (error) {
      console.error('خطأ في تحديث محتوى صفحة الهبوط:', error);
      throw error;
    }
  },

  // إضافة خطة تسعير جديدة
  async createPricingPlan(plan: Omit<PricingPlan, 'id'>): Promise<PricingPlan> {
    try {
      const response = await cmsApi.post('/pricing-plans', { data: plan });
      return response.data.data;
    } catch (error) {
      console.error('خطأ في إضافة خطة التسعير:', error);
      throw error;
    }
  },

  // تحديث خطة تسعير
  async updatePricingPlan(id: number, plan: Partial<PricingPlan>): Promise<PricingPlan> {
    try {
      const response = await cmsApi.put(`/pricing-plans/${id}`, { data: plan });
      return response.data.data;
    } catch (error) {
      console.error('خطأ في تحديث خطة التسعير:', error);
      throw error;
    }
  },

  // حذف خطة تسعير
  async deletePricingPlan(id: number): Promise<void> {
    try {
      await cmsApi.delete(`/pricing-plans/${id}`);
    } catch (error) {
      console.error('خطأ في حذف خطة التسعير:', error);
      throw error;
    }
  }
};
