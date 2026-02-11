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

  useSEO("/", landingContent?.heroTitle, landingContent?.heroSubtitle);

  // Debug logging
  useEffect(() => {
    console.log('[Landing] Component mounted, content:', {
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
        let landingPayload: { data: any[] } | null = null;

        if (landingRes.ok) {
          landingPayload = await landingRes.json();
        }

        // Always use default content as base, then override with CMS data if available
        let updatedContent = { ...DEFAULT_LANDING_CONTENT };

        if (landingPayload?.data?.length) {
          const sections = landingPayload.data;
          const findSection = (slug: string) => sections.find((section: any) => section.slug === slug);

          const hero = findSection("hero");
          const heroContent = (hero?.content ?? hero?.draftJson ?? {}) as any;
          const features = findSection("features");
          const solutions = findSection("solutions");
          const stats = findSection("stats");
          const navigation = findSection("navigation");
          const pricing = findSection("pricing");
          const contact = findSection("contact");
          const footer = findSection("footer");

          updatedContent = {
            ...updatedContent,
            heroWelcomeText: heroContent?.badge ?? updatedContent.heroWelcomeText,
            heroTitle: heroContent?.title ?? hero?.title ?? updatedContent.heroTitle,
            heroSubtitle: heroContent?.subtitle ?? hero?.subtitle ?? updatedContent.heroSubtitle,
            heroButton: heroContent?.cta?.label ?? updatedContent.heroButton,
            heroLoginButton: heroContent?.secondaryCta?.label ?? updatedContent.heroLoginButton,
            heroDashboardTitle: heroContent?.dashboardTitle ?? updatedContent.heroDashboardTitle,
            heroDashboardMetrics: Array.isArray(hero?.cards) && hero.cards.length > 0
              ? hero.cards.map((card: any, index: number) => ({
                id: index,
                value: card.content?.value ?? card.content?.title ?? "",
                label: card.content?.label ?? card.content?.body ?? "",
                color: card.content?.color ?? "blue",
                order: card.orderIndex ?? index,
              }))
              : updatedContent.heroDashboardMetrics,
            featuresBadge: features?.content?.badge ?? updatedContent.featuresBadge,
            featuresTitle: features?.content?.title ?? features?.title ?? updatedContent.featuresTitle,
            featuresDescription: features?.content?.subtitle ?? features?.subtitle ?? updatedContent.featuresDescription,
            features: Array.isArray(features?.cards) && features.cards.length > 0
              ? features.cards.map((card: any, index: number) => ({
                id: index,
                title: card.content?.title ?? card.title ?? "",
                description: card.content?.body ?? card.body ?? "",
                icon: card.content?.icon ?? "Sparkles",
              }))
              : updatedContent.features,
            solutionsBadge: solutions?.content?.badge ?? updatedContent.solutionsBadge,
            solutionsTitle: solutions?.content?.title ?? solutions?.title ?? updatedContent.solutionsTitle,
            solutionsDescription: solutions?.content?.subtitle ?? solutions?.subtitle ?? updatedContent.solutionsDescription,
            solutions: Array.isArray(solutions?.cards) && solutions.cards.length > 0
              ? solutions.cards.map((card: any, index: number) => ({
                id: index,
                title: card.content?.title ?? card.title ?? "",
                description: card.content?.body ?? card.body ?? "",
                icon: card.content?.icon ?? "Target",
                features: Array.isArray(card.content?.features)
                  ? card.content.features.map((feature: any, idx: number) => ({
                    id: idx,
                    text: feature?.text ?? feature ?? "",
                    icon: feature?.icon ?? "Check",
                  }))
                  : [],
                order: card.orderIndex ?? index,
              }))
              : updatedContent.solutions,
            statsTitle: stats?.content?.title ?? stats?.title ?? updatedContent.statsTitle,
            stats: Array.isArray(stats?.cards) && stats.cards.length > 0
              ? stats.cards.map((card: any, index: number) => ({
                id: index,
                number: card.content?.value ?? "",
                label: card.content?.label ?? "",
                suffix: card.content?.suffix ?? "",
              }))
              : updatedContent.stats,
            pricingBadge: pricing?.content?.badge ?? updatedContent.pricingBadge,
            pricingTitle: pricing?.content?.title ?? pricing?.title ?? updatedContent.pricingTitle,
            pricingSubtitle: pricing?.content?.subtitle ?? pricing?.subtitle ?? updatedContent.pricingSubtitle,
            contactBadge: contact?.content?.badge ?? updatedContent.contactBadge,
            contactTitle: contact?.content?.title ?? contact?.title ?? updatedContent.contactTitle,
            contactDescription: contact?.content?.subtitle ?? contact?.subtitle ?? updatedContent.contactDescription,
            contactInfo: Array.isArray(contact?.cards) && contact.cards.length > 0
              ? contact.cards.map((card: any, index: number) => ({
                id: index,
                type: card.content?.type ?? "info",
                label: card.content?.title ?? card.title ?? "",
                value: card.content?.body ?? card.body ?? "",
                icon: card.content?.icon ?? "Mail",
              }))
              : updatedContent.contactInfo,
            footerDescription: footer?.content?.body ?? updatedContent.footerDescription,
            footerCopyright: footer?.content?.copyright ?? updatedContent.footerCopyright,
            footerLogoUrl: footer?.content?.logoUrl ?? updatedContent.footerLogoUrl,
            footerLinks: Array.isArray(footer?.cards) && footer.cards.length > 0
              ? footer.cards.flatMap((card: any, cardIndex: number) => {
                const category = card.content?.category ?? card.title ?? `group-${cardIndex}`;
                const links = Array.isArray(card.content?.links) ? card.content.links : [];
                return links.map((link: any, linkIndex: number) => ({
                  id: `${card.id ?? cardIndex}-${linkIndex}`,
                  text: link?.text ?? "",
                  url: link?.href ?? link?.url ?? "#",
                  category,
                  order: link?.order ?? linkIndex,
                }));
              })
              : updatedContent.footerLinks,
          };

          if (Array.isArray(pricing?.cards) && pricing.cards.length > 0) {
            const pricingPlans = pricing.cards.map((card: any, index: number) => ({
              id: index,
              name: card.content?.title ?? card.title ?? "",
              price: Number(card.content?.price ?? 0),
              period: (card.content?.period ?? "monthly") as "monthly" | "yearly",
              isPopular: Boolean(card.content?.isPopular),
              description: card.content?.body ?? "",
              features: Array.isArray(card.content?.features)
                ? card.content.features.map((feature: any, idx: number) => ({
                  id: idx,
                  text: feature?.text ?? feature ?? "",
                  included: feature?.included ?? true,
                }))
                : [],
              buttonText: card.content?.cta?.label ?? "ابدأ الآن",
              order: card.orderIndex ?? index,
            }));
            setPricingPlans(pricingPlans);
          }
        }

        setLandingContent(updatedContent);
        console.log('[Landing] CMS content loaded:', {
          sectionsFound: landingPayload?.data?.length || 0,
          hasHero: !!updatedContent.heroTitle,
          hasFeatures: updatedContent.features.length,
        });
      } catch (error) {
        console.error('[Landing] Error loading CMS content:', error);
        // On error, use default content
        setLandingContent(DEFAULT_LANDING_CONTENT);
        console.log('[Landing] Using default content due to error');
      } finally {
        setIsLoading(false);
        console.log('[Landing] Loading complete');
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
      <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        {/* Debug: Ensure page is rendering */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 start-4 z-[9999] bg-red-500 text-white px-2 py-1 text-xs rounded">
            Landing Page Rendered
          </div>
        )}

        {/* Global Loader */}
        {isLoading && (
          <div className="fixed inset-x-0 top-0 z-50">
            <div className="h-1 bg-emerald-100">
              <div className="h-full w-full animate-pulse bg-gradient-to-r from-emerald-600 to-teal-600"></div>
            </div>
          </div>
        )}

        {/* Always show header */}
        <PublicHeader />

        <main className="relative" style={{ minHeight: 'calc(100vh - 80px)' }}>
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
