import axios from 'axios';

const CMS_URL = 'http://localhost:1337/api';

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

export interface LandingPageContent {
  id: number;
  heroTitle: string;
  heroSubtitle: string;
  heroButton: string;
  featuresTitle: string;
  features: Feature[];
  pricingTitle: string;
  pricingSubtitle: string;
  statsTitle: string;
  stats: Stat[];
}

// API functions
export const cmsService = {
  // جلب محتوى صفحة الهبوط
  async getLandingPageContent(): Promise<LandingPageContent> {
    try {
      const response = await cmsApi.get('/landing-page?populate=features,stats');
      return response.data.data;
    } catch (error) {
      console.error('خطأ في جلب محتوى صفحة الهبوط من CMS:', error);
      // إرجاع محتوى افتراضي في حالة الخطأ
      return {
        id: 0,
        heroTitle: 'منصة عقاراتي للوساطة العقارية',
        heroSubtitle: 'منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة',
        heroButton: 'ابدأ رحلتك المجانية',
        featuresTitle: 'لماذا تختار منصة عقاراتي؟',
        features: [],
        pricingTitle: 'خطط الأسعار',
        pricingSubtitle: 'اختر الخطة المناسبة لك',
        statsTitle: 'أرقامنا تتحدث',
        stats: []
      };
    }
  },

  // جلب خطط التسعير
  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const response = await cmsApi.get('/pricing-plans?populate=features&sort=order:asc');
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