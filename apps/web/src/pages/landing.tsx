/**
 * landing.tsx - Landing Page
 * 
 * Location: apps/web/src/ → Pages/ → Public Pages → landing.tsx
 * 
 * Public landing page component. Displays:
 * - Marketing content and hero section
 * - Feature highlights
 * - Pricing plans
 * - Call-to-action sections
 * 
 * Refactored to "Aurora Glass" design system (Jan 2026).
 */

import { useState, useEffect } from "react";
import PublicHeader from "@/components/layout/PublicHeader";
import { type LandingPageContent, type PricingPlan } from "@/lib/cms";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { HERO_METRIC_THEME } from "@/lib/landing-theme";
import { useLanguage } from "@/contexts/LanguageContext";

// Components
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { PricingCards } from "@/components/landing/PricingCards";
import { StatsBanner } from "@/components/landing/StatsBanner";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ICON_COMPONENTS } from "@/components/landing/icons";
import { LandingErrorBoundary } from "@/components/landing/LandingErrorBoundary";

// Default fallback content when CMS is empty
const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  id: 0,
  loadingText: "",
  heroWelcomeText: "منصة متكاملة",
  heroTitle: "منصة إدارة العقارات الذكية",
  heroSubtitle: "أداة متكاملة لإدارة عملياتك العقارية بكفاءة واحترافية",
  heroButton: "ابدأ الآن",
  heroLoginButton: "تسجيل الدخول",
  heroDashboardTitle: "نظرة سريعة على الأداء",
  heroDashboardMetrics: [
    { id: 1, value: "2,500+", label: "عقار نشط", color: "blue", order: 0 },
    { id: 2, value: "1,200+", label: "عميل راضٍ", color: "green", order: 1 },
    { id: 3, value: "98%", label: "معدل الرضا", color: "purple", order: 2 },
    { id: 4, value: "24/7", label: "دعم فني", color: "orange", order: 3 },
  ],
  featuresBadge: "مميزات النظام",
  featuresTitle: "مميزات منصتنا",
  featuresDescription: "أدوات قوية لإدارة عملياتك العقارية بكفاءة",
  features: [
    { id: 1, title: "إدارة شاملة للعقارات", description: "نظام متكامل لإدارة جميع عملياتك العقارية من مكان واحد", icon: "Building" },
    { id: 2, title: "تقارير ذكية", description: "تقارير مفصلة وتحليلات متقدمة لمساعدتك في اتخاذ القرارات", icon: "BarChart" },
    { id: 3, title: "إدارة العملاء", description: "نظام متقدم لإدارة علاقات العملاء وتتبع التفاعلات", icon: "Users" },
  ],
  solutionsBadge: "حلول متكاملة",
  solutionsTitle: "حلول متكاملة لاحتياجاتك",
  solutionsDescription: "نوفر حلولاً شاملة لجميع احتياجاتك العقارية",
  solutions: [
    { id: 1, title: "للشركات العقارية", description: "حل متكامل لإدارة الشركات العقارية الكبيرة", icon: "Building2", features: [], order: 0 },
  ],
  statsTitle: "إحصائيات منصتنا",
  stats: [
    { id: 1, number: "10,000+", label: "عقار", suffix: "" },
    { id: 2, number: "5,000+", label: "عميل نشط", suffix: "" },
    { id: 3, number: "500+", label: "شركة عقارية", suffix: "" },
    { id: 4, number: "99.9%", label: "وقت التشغيل", suffix: "" },
  ],
  pricingBadge: "خطط التسعير",
  pricingTitle: "خطط التسعير",
  pricingSubtitle: "اختر الخطة المناسبة لاحتياجاتك",
  contactBadge: "تواصل معنا",
  contactTitle: "تواصل معنا",
  contactDescription: "فريقنا جاهز للإجابة على استفساراتك",
  contactInfo: [
    { id: 1, type: "phone", label: "الهاتف", value: "+966 50 123 4567", icon: "Phone" },
    { id: 2, type: "email", label: "البريد الإلكتروني", value: "info@aqarkom.com", icon: "Mail" },
    { id: 3, type: "address", label: "العنوان", value: "الرياض، المملكة العربية السعودية", icon: "MapPin" },
  ],
  footerDescription: "منصة متكاملة لإدارة العقارات بكفاءة واحترافية",
  footerCopyright: "© 2024 عقاركم. جميع الحقوق محفوظة.",
  footerLinks: [],
  navigation: [],
};

type FooterLinkGroup = { category: string; links: { text: string; url: string }[] };

export default function Landing() {
  const [landingContent, setLandingContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  useSEO("/", landingContent?.heroTitle, landingContent?.heroSubtitle);

  // Debug logging
  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Landing] Component mounted, content:', {
      hasTitle: !!landingContent.heroTitle,
      hasFeatures: landingContent.features.length,
      hasStats: landingContent.stats.length,
      isLoading
    });
  }, [landingContent, isLoading]);

  // CMS Loading Logic (Preserved)
  useEffect(() => {
    const loadCMSContent = async (noCache = false) => {
      try {
        const landingRes = await fetch(`/api/landing${noCache ? `?t=${Date.now()}` : ""}`, {
          credentials: "include",
          headers: noCache ? { 'Cache-Control': 'no-cache' } : {},
        });
        type LandingSection = { slug?: string; content?: Record<string, unknown>; draftJson?: Record<string, unknown>; title?: string; subtitle?: string; cards?: unknown[] };
        type LandingPayload = { data: LandingSection[] } | null;
        let landingPayload: LandingPayload = null;

        if (landingRes.ok) {
          landingPayload = await landingRes.json();
        }

        // Always use default content as base, then override with CMS data if available
        let updatedContent = { ...DEFAULT_LANDING_CONTENT };

        if (landingPayload?.data?.length) {
          const sections = landingPayload.data;
          const findSection = (slug: string) => sections.find((s: LandingSection) => s.slug === slug);

          const hero = findSection("hero");
          const heroContent = (hero?.content ?? hero?.draftJson ?? {}) as Record<string, unknown>;
          const toStr = (v: unknown, fallback: string | undefined) => (v != null && v !== "" ? String(v) : (fallback ?? ""));
          const features = findSection("features");
          const solutions = findSection("solutions");
          const stats = findSection("stats");
          const navigation = findSection("navigation");
          const pricing = findSection("pricing");
          const contact = findSection("contact");
          const footer = findSection("footer");

          updatedContent = {
            ...updatedContent,
            heroWelcomeText: toStr(heroContent?.badge, updatedContent.heroWelcomeText),
            heroTitle: toStr(heroContent?.title ?? hero?.title, updatedContent.heroTitle),
            heroSubtitle: toStr(heroContent?.subtitle ?? hero?.subtitle, updatedContent.heroSubtitle),
            heroButton: toStr((heroContent?.cta as Record<string, unknown>)?.label, updatedContent.heroButton),
            heroLoginButton: toStr((heroContent?.secondaryCta as Record<string, unknown>)?.label, updatedContent.heroLoginButton),
            heroDashboardTitle: toStr(heroContent?.dashboardTitle, updatedContent.heroDashboardTitle),
            heroDashboardMetrics: Array.isArray(hero?.cards) && hero.cards.length > 0
              ? (hero.cards as Record<string, unknown>[]).map((card, index) => {
                const c = card.content as Record<string, unknown> | undefined;
                return { id: index, value: toStr(c?.value ?? c?.title, ""), label: toStr(c?.label ?? c?.body, ""), color: toStr(c?.color, "blue"), order: Number(card.orderIndex ?? index) };
              })
              : updatedContent.heroDashboardMetrics,
            featuresBadge: toStr(features?.content?.badge, updatedContent.featuresBadge),
            featuresTitle: toStr(features?.content?.title ?? features?.title, updatedContent.featuresTitle),
            featuresDescription: toStr(features?.content?.subtitle ?? features?.subtitle, updatedContent.featuresDescription),
            features: Array.isArray(features?.cards) && features.cards.length > 0
              ? (features.cards as Record<string, unknown>[]).map((card, index) => {
                const c = card.content as Record<string, unknown> | undefined;
                return { id: index, title: toStr(c?.title ?? card.title, ""), description: toStr(c?.body ?? card.body, ""), icon: toStr(c?.icon, "Sparkles") };
              })
              : updatedContent.features,
            solutionsBadge: toStr(solutions?.content?.badge, updatedContent.solutionsBadge),
            solutionsTitle: toStr(solutions?.content?.title ?? solutions?.title, updatedContent.solutionsTitle),
            solutionsDescription: toStr(solutions?.content?.subtitle ?? solutions?.subtitle, updatedContent.solutionsDescription),
            solutions: Array.isArray(solutions?.cards) && solutions.cards.length > 0
              ? (solutions.cards as Record<string, unknown>[]).map((card, index) => {
                const content = card.content as Record<string, unknown> | undefined;
                return {
                  id: index,
                  title: toStr(content?.title ?? card.title, ""),
                  description: toStr(content?.body ?? card.body, ""),
                  icon: toStr(content?.icon, "Target"),
                  features: Array.isArray(content?.features)
                    ? (content.features as unknown[]).map((feature, idx) => ({
                      id: idx,
                      text: toStr((feature as Record<string, unknown>)?.text ?? feature, ""),
                      icon: toStr((feature as Record<string, unknown>)?.icon, "Check"),
                    }))
                    : [],
                  order: Number(card.orderIndex ?? index),
                };
              })
              : updatedContent.solutions,
            statsTitle: toStr(stats?.content?.title ?? stats?.title, updatedContent.statsTitle),
            stats: Array.isArray(stats?.cards) && stats.cards.length > 0
              ? (stats.cards as Record<string, unknown>[]).map((card, index) => {
                const c = card.content as Record<string, unknown> | undefined;
                return { id: index, number: toStr(c?.value, ""), label: toStr(c?.label, ""), suffix: toStr(c?.suffix, "") };
              })
              : updatedContent.stats,
            pricingBadge: toStr(pricing?.content?.badge, updatedContent.pricingBadge),
            pricingTitle: toStr(pricing?.content?.title ?? pricing?.title, updatedContent.pricingTitle),
            pricingSubtitle: toStr(pricing?.content?.subtitle ?? pricing?.subtitle, updatedContent.pricingSubtitle),
            contactBadge: toStr(contact?.content?.badge, updatedContent.contactBadge),
            contactTitle: toStr(contact?.content?.title ?? contact?.title, updatedContent.contactTitle),
            contactDescription: toStr(contact?.content?.subtitle ?? contact?.subtitle, updatedContent.contactDescription),
            contactInfo: Array.isArray(contact?.cards) && contact.cards.length > 0
              ? (contact.cards as Record<string, unknown>[]).map((card, index) => {
                const c = card.content as Record<string, unknown> | undefined;
                return { id: index, type: toStr(c?.type, "info"), label: toStr(c?.title ?? card.title, ""), value: toStr(c?.body ?? card.body, ""), icon: toStr(c?.icon, "Mail") };
              })
              : updatedContent.contactInfo,
            footerDescription: toStr(footer?.content?.body, updatedContent.footerDescription),
            footerCopyright: toStr(footer?.content?.copyright, updatedContent.footerCopyright),
            footerLogoUrl: toStr(footer?.content?.logoUrl, updatedContent.footerLogoUrl),
            footerLinks: Array.isArray(footer?.cards) && footer.cards.length > 0
              ? (footer.cards as Record<string, unknown>[]).flatMap((card, cardIndex) => {
                const content = card.content as Record<string, unknown> | undefined;
                const category = toStr(content?.category ?? card.title, `group-${cardIndex}`);
                const links = Array.isArray(content?.links) ? (content.links as unknown[]) : [];
                return links.map((link, linkIndex) => ({
                  id: cardIndex * 1000 + linkIndex,
                  text: toStr((link as Record<string, unknown>)?.text, ""),
                  url: toStr((link as Record<string, unknown>)?.href ?? (link as Record<string, unknown>)?.url, "#"),
                  category,
                  order: Number((link as Record<string, unknown>)?.order ?? linkIndex),
                }));
              })
              : updatedContent.footerLinks,
          };

          if (Array.isArray(pricing?.cards) && pricing.cards.length > 0) {
            const pricingPlans = (pricing.cards as Record<string, unknown>[]).map((card, index) => {
              const c = card.content as Record<string, unknown> | undefined;
              return {
                id: index,
                name: toStr(c?.title ?? card.title, ""),
                price: Number(c?.price ?? 0),
                period: (toStr(c?.period, "monthly") || "monthly") as "monthly" | "yearly",
                isPopular: Boolean(c?.isPopular),
                description: toStr(c?.body, ""),
                features: Array.isArray(c?.features)
                  ? (c.features as unknown[]).map((feature, idx) => ({
                    id: idx,
                    text: toStr((feature as Record<string, unknown>)?.text ?? feature, ""),
                    included: (feature as Record<string, unknown>)?.included !== false,
                  }))
                  : [],
                buttonText: toStr((c?.cta as Record<string, unknown>)?.label, "ابدأ الآن"),
                order: Number(card.orderIndex ?? index),
              };
            });
            setPricingPlans(pricingPlans);
          }
        }

        setLandingContent(updatedContent);
        if (import.meta.env.DEV) console.log('[Landing] CMS content loaded:', {
          sectionsFound: landingPayload?.data?.length || 0,
          hasHero: !!updatedContent.heroTitle,
          hasFeatures: updatedContent.features.length,
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error('[Landing] Error loading CMS content:', error);
        // On error, use default content
        setLandingContent(DEFAULT_LANDING_CONTENT);
        if (import.meta.env.DEV) console.log('[Landing] Using default content due to error');
      } finally {
        setIsLoading(false);
        if (import.meta.env.DEV) console.log('[Landing] Loading complete');
      }
    };
    loadCMSContent(true);
    const handleCmsUpdated = () => loadCMSContent(true);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cmsLandingUpdatedAt') handleCmsUpdated();
    };
    window.addEventListener('cms:landing-updated', handleCmsUpdated as EventListener);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('cms:landing-updated', handleCmsUpdated as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleLogin = () => setLocation("/rbac-login");
  const handleSignUp = () => setLocation("/signup");

  const footerGroups: FooterLinkGroup[] =
    landingContent?.footerLinks && landingContent.footerLinks.length > 0
      ? [...landingContent.footerLinks]
        .sort((a, b) => {
          const categoryCompare = (a.category || "").localeCompare(b.category || "");
          if (categoryCompare !== 0) return categoryCompare;
          return (a.order ?? 0) - (b.order ?? 0);
        })
        .reduce((groups: FooterLinkGroup[], link) => {
          const category = link.category || "روابط";
          const existing = groups.find((group) => group.category === category);
          if (existing) {
            existing.links.push({ text: link.text, url: link.url });
          } else {
            groups.push({ category, links: [{ text: link.text, url: link.url }] });
          }
          return groups;
        }, [])
      : [];

  const handlePlanSelect = (plan: PricingPlan) => {
    handleSignUp();
  };

  // Always render content, even during loading
  return (
    <LandingErrorBoundary>
      <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased" dir={dir}>
        {/* Debug: Ensure page is rendering */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 start-4 z-[9999] bg-red-500 text-white px-2 py-1 text-xs rounded">
            Landing Page Rendered
          </div>
        )}

        {/* Global Loader */}
        {isLoading && (
          <div className="fixed inset-x-0 top-0 z-50">
            <div className="h-1 bg-primary/10">
              <div className="h-full w-full animate-pulse bg-gradient-to-r from-primary to-primary/70"></div>
            </div>
          </div>
        )}

        {/* Always show header */}
        <PublicHeader />

        <main className="relative min-h-[calc(100vh-80px)]">
          <HeroSection
            content={landingContent}
            onLogin={handleLogin}
            onSignUp={handleSignUp}
          />

          <StatsBanner content={landingContent} />

          <FeatureGrid
            content={landingContent}
            iconMap={ICON_COMPONENTS}
          />

          <SolutionsSection
            content={landingContent}
            iconMap={ICON_COMPONENTS}
          />

          <PricingCards
            content={landingContent}
            pricingPlans={pricingPlans}
            onSelectPlan={handlePlanSelect}
          />

          <ContactSection
            content={landingContent}
            iconMap={ICON_COMPONENTS}
          />
        </main>

        <LandingFooter
          content={landingContent}
          footerGroups={footerGroups}
        />
      </div>
    </LandingErrorBoundary>
  );
}
