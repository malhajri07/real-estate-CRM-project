/**
 * cms.ts - CMS Utilities
 * 
 * Location: apps/web/src/ → Lib/ → cms.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * CMS content utilities and API client. Provides:
 * - CMS API client configuration
 * - Landing page content types and utilities
 * - CMS content fetching functions
 * 
 * Related Files:
 * - apps/web/src/lib/cms-utils.ts - CMS helper utilities
 * - apps/api/routes/cms-landing.ts - CMS landing API routes
 */

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
  footerLogoUrl?: string;
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('خطأ في جلب محتوى صفحة الهبوط من CMS:', errorMessage);
      // إرجاع محتوى فارغ - لا يوجد محتوى ثابت
      return {
        id: 0,
        loadingText: '',
        heroWelcomeText: '',
        heroTitle: '',
        heroSubtitle: '',
        heroButton: '',
        heroLoginButton: '',
        heroDashboardTitle: '',
        heroDashboardMetrics: [],
        featuresTitle: '',
        featuresDescription: '',
        features: [],
        solutionsTitle: '',
        solutionsDescription: '',
        solutions: [],
        pricingTitle: '',
        pricingSubtitle: '',
        statsTitle: '',
        stats: [],
        contactTitle: '',
        contactDescription: '',
        contactInfo: [],
        footerDescription: '',
        footerCopyright: '',
        footerLinks: [],
        navigation: []
      };
    }
  },

  // جلب خطط التسعير
  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const response = await cmsApi.get('/pricing-plans');
      return response.data.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('خطأ في جلب خطط التسعير من CMS:', errorMessage);
      // إرجاع قائمة فارغة - لا يوجد محتوى ثابت
      return [];
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
