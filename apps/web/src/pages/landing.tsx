import { useState, useEffect, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PublicHeader from "@/components/layout/PublicHeader";
import { Building, Users, TrendingUp, Shield, BarChart3, MessageSquare, Phone, Mail, MapPin, Camera, FileText, DollarSign, GitBranch, CheckCircle, CircleCheckBig, UserPlus, Eye, NotebookPen, Sparkles, Clock, Headset } from "lucide-react";
import { type LandingPageContent, type PricingPlan } from "@/lib/cms";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";
import agarkomFooterLogo from "@assets/6_1756507125793.png";
import { Link, useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";

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

const ICON_COMPONENTS: Record<string, ComponentType<{ className?: string }>> = {
  users: Users,
  building: Building,
  "trending-up": TrendingUp,
  "bar-chart": BarChart3,
  "message-square": MessageSquare,
  shield: Shield,
  camera: Camera,
  "file-text": FileText,
  "dollar-sign": DollarSign,
  "git-branch": GitBranch,
  "check-circle": CheckCircle,
  "circle-check-big": CircleCheckBig,
  "user-plus": UserPlus,
  eye: Eye,
  "notebook-pen": NotebookPen,
  phone: Phone,
  email: Mail,
  mail: Mail,
  "map-pin": MapPin,
  location: MapPin,
  support: Headset,
  headset: Headset,
  clock: Clock,
  sparkles: Sparkles,
};


type FooterLinkGroup = { category: string; links: { text: string; url: string }[] };

const HERO_METRIC_COLORS = ["blue", "green", "orange", "purple", "pink", "emerald"];
const HERO_METRIC_THEME: Record<string, { bg: string; text: string; subText: string }> = {
  blue: { bg: "from-blue-50 to-blue-100", text: "text-blue-600", subText: "text-blue-700" },
  green: { bg: "from-green-50 to-green-100", text: "text-green-600", subText: "text-green-700" },
  orange: { bg: "from-orange-50 to-orange-100", text: "text-orange-600", subText: "text-orange-700" },
  purple: { bg: "from-purple-50 to-purple-100", text: "text-purple-600", subText: "text-purple-700" },
  pink: { bg: "from-pink-50 to-pink-100", text: "text-pink-600", subText: "text-pink-700" },
  emerald: { bg: "from-emerald-50 to-emerald-100", text: "text-emerald-600", subText: "text-emerald-700" },
};

function renderIcon(iconName: string | undefined, className: string) {
  if (!iconName) {
    return <Sparkles className={className} />;
  }
  const key = iconName.toLowerCase();
  const IconComponent = ICON_COMPONENTS[key];
  if (!IconComponent) {
    return <Sparkles className={className} />;
  }
  return <IconComponent className={className} />;
}


export default function Landing() {
  const [landingContent, setLandingContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation(); // Use SPA-friendly navigation so landing buttons reach /login without full reloads.

  // Apply SEO meta tags
  useSEO("/", landingContent?.heroTitle, landingContent?.heroSubtitle);


  // Navigation comes only from CMS - no fallback/default navigation
  const navigationLinks = (landingContent.navigation && landingContent.navigation.length > 0
    ? [...landingContent.navigation]
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((item: any) => ({ href: item.url || '#', label: item.text || String(item.id) }))
    : []
  ).reduce((acc: { href: string; label: string }[], item) => {
    if (!acc.some((link) => link.href === item.href && link.label === item.label)) {
      acc.push({ href: item.href, label: item.label });
    }
    return acc;
  }, []);

  // Footer groups come only from CMS - no fallback
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

  // All content comes only from CMS - no fallbacks
  const displayedPricingPlans = pricingPlans;
  const heroMetrics = (landingContent.heroDashboardMetrics || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const featuresList = landingContent.features || [];
  const solutionsList = landingContent.solutions || [];
  const statsList = landingContent.stats || [];
  const contactDetails = landingContent.contactInfo || [];

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
            heroDashboardMetrics:
              Array.isArray(hero?.cards) && hero.cards.length > 0
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
            features:
              Array.isArray(features?.cards) && features.cards.length > 0
                ? features.cards.map((card: any, index: number) => ({
                  id: index,
                  title: card.content?.title ?? card.title ?? "",
                  description: card.content?.body ?? card.body ?? "",
                  icon: card.content?.icon ?? "Sparkles",
                }))
                : current.features,
            solutionsTitle: solutions?.content?.title ?? solutions?.title ?? current.solutionsTitle,
            solutionsDescription: solutions?.content?.subtitle ?? solutions?.subtitle ?? current.solutionsDescription,
            solutions:
              Array.isArray(solutions?.cards) && solutions.cards.length > 0
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
            stats:
              Array.isArray(stats?.cards) && stats.cards.length > 0
                ? stats.cards.map((card: any, index: number) => ({
                  id: index,
                  number: card.content?.value ?? "",
                  label: card.content?.label ?? "",
                  suffix: card.content?.suffix ?? "",
                }))
                : current.stats,
            pricingTitle: pricing?.content?.title ?? pricing?.title ?? current.pricingTitle,
            pricingSubtitle: pricing?.content?.subtitle ?? pricing?.subtitle ?? current.pricingSubtitle,
            contactTitle: contact?.content?.title ?? contact?.title ?? current.contactTitle,
            contactDescription:
              contact?.content?.subtitle ?? contact?.subtitle ?? current.contactDescription,
            contactInfo:
              Array.isArray(contact?.cards) && contact.cards.length > 0
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
            footerLinks:
              Array.isArray(footer?.cards) && footer.cards.length > 0
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
            navigation:
              Array.isArray(navigation?.cards) && navigation.cards.length > 0
                ? navigation.cards.map((card: any, index: number) => ({
                  id: index,
                  text: card.content?.label ?? card.content?.title ?? card.title ?? "",
                  url: card.content?.href ?? card.content?.link ?? "#",
                  order: card.orderIndex ?? index,
                }))
                : current.navigation,
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
        // سيتم استخدام القيم الافتراضية في حال فشل التحميل
      } finally {
        setIsLoading(false);
      }
    };

    loadCMSContent(true);

    // Live update when CMS content changes (same tab or other tabs)
    const handleCmsUpdated = () => {
      loadCMSContent(true);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cmsLandingUpdatedAt') {
        handleCmsUpdated();
      }
    };
    window.addEventListener('cms:landing-updated', handleCmsUpdated as EventListener);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('cms:landing-updated', handleCmsUpdated as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleLogin = () => {
    setLocation("/rbac-login"); // Route internally to avoid issues with direct window navigation.
  };

  const handleSignUp = () => {
    setLocation("/signup"); // Align signup navigation with Wouter routing as well.
  };

  const heroContentReady = !isLoading;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-white" aria-busy={isLoading}>
      {isLoading && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
          <div className="h-1 bg-primary/15">
            <div className="h-full w-full animate-pulse bg-primary/60"></div>
          </div>
        </div>
      )}
      {/* Header */}
      <PublicHeader />

      {/* Hero Section */}
      <section id="home" className="pt-28 pb-20 bg-gradient-to-br from-primary/10 to-white" data-cms-section="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div
              className={cn(
                "text-right space-y-6 transition-opacity duration-500 ease-out",
                heroContentReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              data-cms-content="hero-content"
            >
              {landingContent?.heroWelcomeText && (
                <p className="text-primary font-medium mb-4" data-cms-element="hero-welcome">{landingContent.heroWelcomeText}</p>
              )}
              {landingContent?.heroTitle && (
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight" data-cms-field="heroTitle">
                  {landingContent.heroTitle}
                </h1>
              )}
              {landingContent?.heroSubtitle && (
                <p className="text-xl text-gray-600 mb-8 leading-relaxed" data-cms-field="heroSubtitle">
                  {landingContent.heroSubtitle}
                </p>
              )}
              {(landingContent?.heroButton || landingContent?.heroLoginButton) && (
                <div className="flex flex-col sm:flex-row gap-4" data-cms-element="hero-actions">
                  {landingContent?.heroButton && (
                    <Button onClick={handleSignUp} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg" data-cms-field="heroButton">
                      {landingContent.heroButton}
                    </Button>
                  )}
                  {landingContent?.heroLoginButton && (
                    <Button onClick={handleLogin} variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg" data-cms-element="hero-login">
                      {landingContent.heroLoginButton}
                    </Button>
                  )}
                </div>
              )}
            </div>
            {(landingContent?.heroDashboardTitle || heroMetrics.length > 0) && (
              <div
                className={cn(
                  "lg:text-left transition-opacity duration-500 ease-out",
                  heroContentReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <div
                  className={cn(
                    "bg-white rounded-2xl shadow-2xl p-3 transform rotate-3 hover:rotate-0 transition-transform duration-300 overflow-hidden",
                    isLoading && "animate-pulse"
                  )}
                >
                  <div className="space-y-2">
                    {/* Header */}
                    {(landingContent?.heroDashboardTitle || heroMetrics.length > 0) && (
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                        <div className="flex items-center space-x-reverse space-x-1">
                          <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
                            <Building className="h-2 w-2 text-white" />
                          </div>
                          {landingContent?.heroDashboardTitle && (
                            <span className="text-green-600 font-bold text-[10px]" data-cms-field="heroDashboardTitle">{landingContent.heroDashboardTitle}</span>
                          )}
                        </div>
                        <div className="flex space-x-reverse space-x-0.5">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                    )}

                    {/* Top Metrics Grid */}
                    {heroMetrics.length > 0 && (
                      <div className="grid grid-cols-4 gap-1 text-center" data-cms-collection="hero-metrics">
                        {heroMetrics.map((metric) => {
                          const theme = HERO_METRIC_THEME[metric.color] ?? HERO_METRIC_THEME.blue;
                          return (
                            <div
                              key={metric.id}
                              className={`bg-gradient-to-br ${theme.bg} p-1.5 rounded`}
                              data-cms-item="hero-metric"
                              data-metric-id={metric.id}
                            >
                              <div className={`text-xs font-bold ${theme.text}`} data-cms-field="metric-value">{metric.value}</div>
                              <div className={`text-[7px] ${theme.subText}`} data-cms-field="metric-label">{metric.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white" data-cms-section="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(landingContent?.featuresTitle || landingContent?.featuresDescription || (landingContent?.features && landingContent.features.length > 0)) && (
            <>
              <div className="text-center mb-16" data-cms-content="features-header">
                {landingContent?.featuresTitle && (
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="featuresTitle">
                    {landingContent.featuresTitle}
                  </h2>
                )}
                {landingContent?.featuresDescription && (
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-cms-element="features-description">
                    {landingContent.featuresDescription}
                  </p>
                )}
              </div>

              {landingContent?.features && landingContent.features.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-cms-collection="features">
                  {landingContent.features.map((feature: any, index: number) => {
                    const key = feature.id ?? `feature-${index}`;
                    const title = feature.title ?? "";
                    const description = feature.description ?? "";
                    const iconName = feature.icon;
                    return (
                      <Card
                        key={key}
                        className="text-center hover:shadow-lg transition-shadow duration-300"
                        data-cms-item="feature"
                        data-feature-id={feature.id ?? `fallback-${index}`}
                      >
                        <CardContent className="p-8">
                          <div
                            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            data-cms-element="feature-icon"
                          >
                            {renderIcon(iconName, "h-8 w-8 text-green-600")}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-3" data-cms-field="feature-title">
                            {title}
                          </h3>
                          <p className="text-gray-600" data-cms-field="feature-description">
                            {description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-gray-50" data-cms-section="solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(landingContent?.solutionsTitle || landingContent?.solutionsDescription || (landingContent?.solutions && landingContent.solutions.length > 0)) && (
            <>
              <div className="text-center mb-16" data-cms-content="solutions-header">
                {landingContent?.solutionsTitle && (
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="solutionsTitle">
                    {landingContent.solutionsTitle}
                  </h2>
                )}
                {landingContent?.solutionsDescription && (
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-cms-field="solutionsDescription">
                    {landingContent.solutionsDescription}
                  </p>
                )}
              </div>

              {landingContent?.solutions && landingContent.solutions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-cms-collection="solutions">
                  {landingContent.solutions.map((solution: any, index: number) => {
              const key = solution.id ?? `solution-${index}`;
              const featureItems = Array.isArray(solution.features) ? solution.features : [];
              return (
                <Card
                  key={key}
                  className="rounded-3xl border border-border/60 bg-card/80 shadow-outline backdrop-blur-xl hover:shadow-xl transition-shadow duration-300"
                  data-cms-item="solution"
                  data-solution-id={solution.id ?? `fallback-${index}`}
                >
                  <CardContent className="p-8 text-center">
                    <div
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                      data-cms-element="solution-icon"
                    >
                      {renderIcon(solution.icon, "h-10 w-10 text-green-600")}
                    </div>
                    <h3
                      className="text-2xl font-bold text-gray-900 mb-4"
                      data-cms-field="solution-title"
                    >
                      {solution.title}
                    </h3>
                    <p
                      className="text-gray-600 mb-6"
                      data-cms-field="solution-description"
                    >
                      {solution.description}
                    </p>
                    {featureItems.length > 0 && (
                      <ul className="text-right space-y-3 text-gray-600" data-cms-collection="solution-features">
                        {featureItems.map((item: any, featureIndex: number) => {
                          const text = typeof item === "string" ? item : item?.text ?? "";
                          const iconName = typeof item === "string" ? "circle-check-big" : item?.icon ?? "circle-check-big";
                          return (
                            <li
                              key={`${key}-feature-${featureIndex}`}
                              className="flex items-center gap-3"
                              data-cms-item="solution-feature"
                              data-feature-index={featureIndex}
                            >
                              {renderIcon(iconName, "h-5 w-5 text-green-600 flex-shrink-0")}
                              <span data-cms-field="feature-text">{text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {(landingContent?.statsTitle || (landingContent?.stats && landingContent.stats.length > 0)) && (
        <section className="py-20 bg-green-600" data-cms-section="stats">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {landingContent?.statsTitle && (
              <div className="text-center mb-16" data-cms-content="stats-header">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4" data-cms-field="statsTitle">
                  {landingContent.statsTitle}
                </h2>
              </div>
            )}

            {landingContent?.stats && landingContent.stats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-cms-collection="stats">
                {landingContent.stats.map((stat: any) => (
                  <div key={stat.id} className="text-center" data-cms-item="stat" data-stat-id={stat.id}>
                    <div className="text-4xl lg:text-5xl font-bold text-white mb-2" data-cms-field="stat-number">
                      {stat.number}{stat.suffix || ''}
                    </div>
                    <p className="text-green-100 text-lg" data-cms-field="stat-label">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}


      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50" data-cms-section="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(landingContent?.pricingTitle || landingContent?.pricingSubtitle || displayedPricingPlans.length > 0) && (
            <>
              {(landingContent?.pricingTitle || landingContent?.pricingSubtitle) && (
                <div className="text-center mb-16" data-cms-content="pricing-header">
                  {landingContent?.pricingTitle && (
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="pricingTitle">
                      {landingContent.pricingTitle}
                    </h2>
                  )}
                  {landingContent?.pricingSubtitle && (
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-cms-field="pricingSubtitle">
                      {landingContent.pricingSubtitle}
                    </p>
                  )}
                </div>
              )}

              {displayedPricingPlans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20" data-cms-collection="pricing-plans">
                  {displayedPricingPlans.map((plan: any) => (
              <Card
                key={plan.id}
                className={`relative hover:shadow-xl transition-shadow duration-300 h-full ${plan.isPopular ? 'border-2 border-green-500' : ''}`}
                data-cms-item="pricing-plan"
                data-plan-id={plan.id}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">الأكثر شعبية</span>
                  </div>
                )}
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4" data-cms-field="plan-name">{plan.name}</h3>
                    <div className="text-4xl.font-bold.text-green-600 mb-2" data-cms-field="plan-price">
                      {plan.price === 0 ? 'مجاناً' : `${plan.price} ﷼`}
                    </div>
                    <p className="text-gray-600" data-cms-field="plan-description">{plan.description}</p>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-4 text-right" data-cms-collection="plan-features">
                      {plan.features.map((feature: any) => (
                        <li
                          key={feature.id}
                          className="flex items-center gap-4 border-b border-gray-100 pb-3"
                          data-cms-item="plan-feature"
                          data-feature-id={feature.id}
                        >
                          {feature.included ? (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <div className="h-5 w-5 flex-shrink-0" />
                          )}
                          <span
                            className={`${feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}
                            data-cms-field="feature-text"
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <Button
                      onClick={handleSignUp}
                      className={`w-full py-3 text-lg font-semibold ${plan.isPopular ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                      data-cms-field="plan-button"
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white" data-cms-section="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(landingContent?.contactTitle || landingContent?.contactDescription || (landingContent?.contactInfo && landingContent.contactInfo.length > 0)) && (
            <>
              {(landingContent?.contactTitle || landingContent?.contactDescription) && (
                <div className="text-center mb-16" data-cms-content="contact-header">
                  {landingContent?.contactTitle && (
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="contactTitle">
                      {landingContent.contactTitle}
                    </h2>
                  )}
                  {landingContent?.contactDescription && (
                    <p className="text-xl text-gray-600" data-cms-field="contactDescription">
                      {landingContent.contactDescription}
                    </p>
                  )}
                </div>
              )}

              {landingContent?.contactInfo && landingContent.contactInfo.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-cms-collection="contact-info">
                  {landingContent.contactInfo.map((info: any, index: number) => {
                    const key = info.id ?? `contact-${index}`;
                    const iconKey = info.icon || info.type || "phone";
                    return (
                      <Card
                        key={key}
                        className="text-center hover:shadow-xl transition-shadow duration-300"
                        data-cms-item="contact-info"
                        data-contact-id={info.id ?? `fallback-${index}`}
                      >
                        <CardContent className="p-8">
                          <div
                            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            data-cms-element="contact-icon"
                          >
                            {renderIcon(iconKey, "h-8 w-8 text-green-600")}
                          </div>
                          <h3
                            className="text-xl font-semibold text-gray-900 mb-2"
                            data-cms-field="contact-label"
                          >
                            {info.label}
                          </h3>
                          <p
                            className="text-gray-600"
                            data-cms-field="contact-value"
                          >
                            {info.value}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" data-cms-section="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img
                  src={agarkomFooterLogo}
                  alt="عقاركم"
                  width={256}
                  height={144}
                  loading="lazy"
                  decoding="async"
                  className="h-36 w-auto object-contain"
                />
              </div>
              {landingContent?.footerDescription && (
                <p
                  className="text-gray-400 mb-4"
                  data-cms-field="footerDescription"
                >
                  {landingContent.footerDescription}
                </p>
              )}
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-cms-collection="footer-links">
              {footerGroups.map((group, groupIndex) => (
                <div key={`${group.category}-${groupIndex}`} data-cms-item="footer-group" data-group-category={group.category}>
                  <h3 className="text-lg font-semibold mb-4" data-cms-field="group-category">{group.category}</h3>
                  <ul className="space-y-2 text-gray-400" data-cms-collection="group-links">
                    {group.links.map((link, linkIndex) => (
                      <li key={`${group.category}-${linkIndex}`} data-cms-item="footer-link" data-link-index={linkIndex}>
                        <a href={link.url || "#"} className="hover:text-green-400" data-cms-field="link-text">
                          {link.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {landingContent?.footerCopyright && (
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p data-cms-field="footerCopyright">{landingContent.footerCopyright}</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
