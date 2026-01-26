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

const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  id: 0,
  loadingText: "",
  heroWelcomeText: "",
  heroTitle: "",
  heroSubtitle: "",
  heroButton: "",
  heroLoginButton: "",
  heroDashboardTitle: "",
  heroDashboardMetrics: [],
  featuresTitle: "",
  featuresDescription: "",
  features: [],
  solutionsTitle: "",
  solutionsDescription: "",
  solutions: [],
  statsTitle: "",
  stats: [],
  pricingTitle: "",
  pricingSubtitle: "",
  contactTitle: "",
  contactDescription: "",
  contactInfo: [],
  footerDescription: "",
  footerCopyright: "",
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

          setLandingContent((current) => ({
            ...current,
            heroWelcomeText: heroContent?.badge ?? current.heroWelcomeText,
            heroTitle: heroContent?.title ?? hero?.title ?? current.heroTitle,
            heroSubtitle: heroContent?.subtitle ?? hero?.subtitle ?? current.heroSubtitle,
            heroButton: heroContent?.cta?.label ?? current.heroButton,
            heroLoginButton: heroContent?.secondaryCta?.label ?? current.heroLoginButton,
            heroDashboardTitle: heroContent?.dashboardTitle ?? current.heroDashboardTitle,
            heroDashboardMetrics: Array.isArray(hero?.cards) && hero.cards.length > 0
              ? hero.cards.map((card: any, index: number) => ({
                id: index,
                value: card.content?.value ?? card.content?.title ?? "",
                label: card.content?.label ?? card.content?.body ?? "",
                color: card.content?.color ?? "blue",
                order: card.orderIndex ?? index,
              }))
              : current.heroDashboardMetrics,
            featuresTitle: features?.content?.title ?? features?.title ?? current.featuresTitle,
            featuresDescription: features?.content?.subtitle ?? features?.subtitle ?? current.featuresDescription,
            features: Array.isArray(features?.cards) && features.cards.length > 0
              ? features.cards.map((card: any, index: number) => ({
                id: index,
                title: card.content?.title ?? card.title ?? "",
                description: card.content?.body ?? card.body ?? "",
                icon: card.content?.icon ?? "Sparkles",
              }))
              : current.features,
            solutionsTitle: solutions?.content?.title ?? solutions?.title ?? current.solutionsTitle,
            solutionsDescription: solutions?.content?.subtitle ?? solutions?.subtitle ?? current.solutionsDescription,
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
              : current.solutions,
            statsTitle: stats?.content?.title ?? stats?.title ?? current.statsTitle,
            stats: Array.isArray(stats?.cards) && stats.cards.length > 0
              ? stats.cards.map((card: any, index: number) => ({
                id: index,
                number: card.content?.value ?? "", // Fix: property name check
                value: card.content?.value ?? "",
                label: card.content?.label ?? "",
                suffix: card.content?.suffix ?? "",
              }))
              : current.stats,
            pricingTitle: pricing?.content?.title ?? pricing?.title ?? current.pricingTitle,
            pricingSubtitle: pricing?.content?.subtitle ?? pricing?.subtitle ?? current.pricingSubtitle,
            contactTitle: contact?.content?.title ?? contact?.title ?? current.contactTitle,
            contactDescription: contact?.content?.subtitle ?? contact?.subtitle ?? current.contactDescription,
            contactInfo: Array.isArray(contact?.cards) && contact.cards.length > 0
              ? contact.cards.map((card: any, index: number) => ({
                id: index,
                type: card.content?.type ?? "info",
                label: card.content?.title ?? card.title ?? "",
                value: card.content?.body ?? card.body ?? "",
                icon: card.content?.icon ?? "Mail",
              }))
              : current.contactInfo,
            footerDescription: footer?.content?.body ?? current.footerDescription,
            footerCopyright: footer?.content?.copyright ?? current.footerCopyright,
            footerLogoUrl: footer?.content?.logoUrl ?? null,
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
              : current.footerLinks,
          }));

          if (Array.isArray(pricing?.cards)) {
            setPricingPlans(
              pricing.cards.map((card: any, index: number) => ({
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
              }))
            );
          } else {
            setPricingPlans([]);
          }
        }
      } catch (error) {
        console.error('Error loading CMS content:', error);
      } finally {
        setIsLoading(false);
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

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      {/* Global Loader */}
      {isLoading && (
        <div className="fixed inset-x-0 top-0 z-50">
          <div className="h-1 bg-emerald-100">
            <div className="h-full w-full animate-pulse bg-emerald-600"></div>
          </div>
        </div>
      )}

      <PublicHeader />

      <main>
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
  );
}
