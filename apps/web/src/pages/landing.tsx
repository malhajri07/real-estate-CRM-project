import { useState, useEffect, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PublicHeader from "@/components/layout/PublicHeader";
import { Building, Users, TrendingUp, Shield, BarChart3, MessageSquare, Phone, Mail, MapPin, Camera, FileText, DollarSign, GitBranch, CheckCircle, CircleCheckBig, UserPlus, Eye, NotebookPen, Sparkles, Clock, Headset } from "lucide-react";
// import PropertySearchMap from "@/components/PropertySearchMap"; // Map component removed
import ListingCard from "@/components/listings/ListingCard";
import { type LandingPageContent, type PricingPlan } from "@/lib/cms";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";
import agarkomFooterLogo from "@assets/6_1756507125793.png";
import { Link, useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";

const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  id: 0,
  loadingText: "جار تحميل المحتوى...",
  heroWelcomeText: "مرحباً بك في",
  heroTitle: "منصة عقاراتي للوساطة العقارية",
  heroSubtitle: "منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة",
  heroButton: "ابدأ رحلتك المجانية",
  heroLoginButton: "تسجيل الدخول",
  heroDashboardTitle: "منصة عقاراتي - لوحة التحكم",
  heroDashboardMetrics: [
    { id: 1, value: "1.2M ﷼", label: "إيرادات", color: "blue", order: 1 },
    { id: 2, value: "3,847", label: "عملاء", color: "green", order: 2 },
    { id: 3, value: "89", label: "عقارات", color: "orange", order: 3 },
    { id: 4, value: "45", label: "صفقات", color: "purple", order: 4 },
  ],
  featuresTitle: "لماذا تختار منصة عقاراتي؟",
  featuresDescription:
    "عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة",
  features: [],
  solutionsTitle: "حلول شاملة لإدارة العقارات",
  solutionsDescription: "أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية",
  solutions: [],
  statsTitle: "أرقامنا تتحدث",
  stats: [],
  pricingTitle: "خطط الأسعار",
  pricingSubtitle: "اختر الخطة المناسبة لك",
  contactTitle: "تواصل معنا",
  contactDescription: "نحن هنا لمساعدتك في رحلتك العقارية",
  contactInfo: [],
  footerDescription: "منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية",
  footerCopyright: "© 2024 منصة عقاراتي. جميع الحقوق محفوظة.",
  footerLinks: [],
  navigation: [
    { id: 1, text: "الرئيسية", url: "#home", order: 1 },
    { id: 2, text: "ابحث عن عقار", url: "/map", order: 2 },
    { id: 3, text: "المميزات", url: "#features", order: 3 },
    { id: 4, text: "الحلول", url: "#solutions", order: 4 },
    { id: 5, text: "الأسعار", url: "#pricing", order: 5 },
    { id: 6, text: "اتصل بنا", url: "#contact", order: 6 },
  ],
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

const FALLBACK_FEATURES = [
  {
    id: 1,
    title: "إدارة شاملة للعقارات",
    description: "أدوات متقدمة لإدارة ممتلكاتك العقارية بكل سهولة ومرونة",
    icon: "building",
  },
  {
    id: 2,
    title: "تسويق ذكي",
    description: "حملات تسويقية مخصصة مع تقارير أداء دقيقة",
    icon: "trending-up",
  },
  {
    id: 3,
    title: "دعم متواصل",
    description: "فريق دعم متخصص متواجد لخدمتك على مدار الساعة",
    icon: "headset",
  },
];

const FALLBACK_SOLUTIONS = [
  {
    id: 1,
    title: "إدارة العملاء",
    description:
      "تابع علاقاتك مع العملاء المحتملين وعمليات التواصل في لوحة موحدة.",
    icon: "users",
    features: [
      { id: 1, text: "قواعد بيانات للعملاء" },
      { id: 2, text: "إشعارات ذكية للمتابعة" },
      { id: 3, text: "تقارير تحليلية للأداء" },
    ],
  },
  {
    id: 2,
    title: "إدارة العقارات",
    description:
      "إدارة كاملة للعقارات تشمل الوسائط والتسعير والتقارير التفصيلية.",
    icon: "building",
    features: [
      { id: 1, text: "إدارة الوسائط والصور" },
      { id: 2, text: "تفاصيل دقيقة للعقار" },
      { id: 3, text: "مقارنة العروض والأسعار" },
    ],
  },
  {
    id: 3,
    title: "إدارة الصفقات",
    description:
      "تابع مراحل الصفقات والمهام المتعلقة بها حتى إتمامها بنجاح.",
    icon: "git-branch",
    features: [
      { id: 1, text: "لوحات متابعة للصفقات" },
      { id: 2, text: "تنبيهات المهام القادمة" },
      { id: 3, text: "تقارير الربحية والنمو" },
    ],
  },
];

const FALLBACK_PRICING_PLANS: PricingPlan[] = [
  {
    id: 1,
    name: "الباقة الأساسية",
    price: 0,
    period: "monthly",
    isPopular: false,
    description: "للمبتدئين",
    features: [
      { id: 1, text: "حتى 50 عميل محتمل", included: true },
      { id: 2, text: "حتى 25 عقار", included: true },
      { id: 3, text: "5 حملات تسويقية شهرياً", included: true },
      { id: 4, text: "100 رسالة واتساب شهرياً", included: true },
      { id: 5, text: "تقارير أساسية", included: true },
      { id: 6, text: "دعم عبر البريد الإلكتروني", included: true },
    ],
    buttonText: "ابدأ مجاناً",
    order: 1,
  },
  {
    id: 2,
    name: "الباقة الاحترافية",
    price: 299,
    period: "monthly",
    isPopular: true,
    description: "للشركات المتنامية",
    features: [
      { id: 7, text: "حتى 500 عميل محتمل", included: true },
      { id: 8, text: "حتى 200 عقار", included: true },
      { id: 9, text: "25 حملة تسويقية شهرياً", included: true },
      { id: 10, text: "2000 رسالة واتساب شهرياً", included: true },
      { id: 11, text: "تقارير متقدمة وتحليلات", included: true },
      { id: 12, text: "دعم فني على مدار الساعة", included: true },
      { id: 13, text: "إدارة 3 مستخدمين", included: true },
      { id: 14, text: "تكامل مع الأنظمة الخارجية", included: true },
    ],
    buttonText: "اختر هذه الباقة",
    order: 2,
  },
  {
    id: 3,
    name: "باقة الشركات",
    price: 899,
    period: "monthly",
    isPopular: false,
    description: "للمؤسسات الكبيرة",
    features: [
      { id: 15, text: "عملاء محتملين غير محدودين", included: true },
      { id: 16, text: "عقارات غير محدودة", included: true },
      { id: 17, text: "حملات تسويقية غير محدودة", included: true },
      { id: 18, text: "10,000 رسالة واتساب شهرياً", included: true },
      { id: 19, text: "تقارير مخصصة ولوحات تحكم", included: true },
      { id: 20, text: "مدير حساب مخصص", included: true },
      { id: 21, text: "مستخدمين غير محدودين", included: true },
      { id: 22, text: "تكاملات API متقدمة", included: true },
    ],
    buttonText: "اتصل بنا",
    order: 3,
  },
];

const FALLBACK_CONTACTS = [
  {
    id: 1,
    type: "phone",
    label: "الهاتف",
    value: "+966 50 123 4567",
    icon: "phone",
  },
  {
    id: 2,
    type: "email",
    label: "البريد الإلكتروني",
    value: "info@aqaraty.sa",
    icon: "mail",
  },
  {
    id: 3,
    type: "location",
    label: "العنوان",
    value: "الرياض - المملكة العربية السعودية",
    icon: "map-pin",
  },
];

const FALLBACK_FOOTER_GROUPS = [
  {
    category: "روابط سريعة",
    links: [
      { text: "الرئيسية", url: "#home" },
      { text: "المميزات", url: "#features" },
      { text: "الحلول", url: "#solutions" },
      { text: "الأسعار", url: "#pricing" },
      { text: "اتصل بنا", url: "#contact" },
    ],
  },
  {
    category: "الدعم",
    links: [
      { text: "الهاتف: +966 50 123 4567", url: "tel:+966501234567" },
      { text: "البريد: info@aqaraty.sa", url: "mailto:info@aqaraty.sa" },
      { text: "الدعم متاح 24/7", url: "#support" },
    ],
  },
];

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

const SKELETON_LISTING_COUNT = 6;

export default function Landing() {
  const [landingContent, setLandingContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [, setLocation] = useLocation(); // Use SPA-friendly navigation so landing buttons reach /login without full reloads.

  // Apply SEO meta tags
  useSEO("/", landingContent?.heroTitle, landingContent?.heroSubtitle);


  const defaultNavigation = [
    { href: '#home', label: 'الرئيسية' },
    { href: '/map', label: 'ابحث عن عقار' },
    { href: '#request', label: 'اطلب عقارك' },
    { href: '/unverified-listings', label: 'اعرض عقارك' },
    { href: '/marketing-request', label: 'سوق الوسطاء' },
  ];

  const navigationLinks = (landingContent.navigation && landingContent.navigation.length > 0
    ? [...landingContent.navigation]
      .sort((a: any, b: any) => a.order - b.order)
      .map((item: any) => ({ href: item.url || '#', label: item.text || String(item.id) }))
    : []
  ).reduce((acc: { href: string; label: string }[], item) => {
    if (!acc.some((link) => link.href === item.href && link.label === item.label)) {
      acc.push({ href: item.href, label: item.label });
    }
    return acc;
  }, []);

  const combinedNavigation = [
    ...navigationLinks.filter((link) =>
      defaultNavigation.some((allowed) => allowed.href === link.href)
    ),
  ];

  for (const link of defaultNavigation) {
    if (!combinedNavigation.some((existing) => existing.href === link.href)) {
      combinedNavigation.push(link);
    }
  }

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
      : FALLBACK_FOOTER_GROUPS;

  const displayedPricingPlans = pricingPlans.length > 0 ? pricingPlans : FALLBACK_PRICING_PLANS;

  const heroMetrics = (landingContent.heroDashboardMetrics?.length
    ? [...landingContent.heroDashboardMetrics]
    : DEFAULT_LANDING_CONTENT.heroDashboardMetrics
  ).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  const featuresList = landingContent.features?.length ? landingContent.features : FALLBACK_FEATURES;
  const solutionsList = landingContent.solutions?.length ? landingContent.solutions : FALLBACK_SOLUTIONS;
  const statsList = landingContent.stats?.length ? landingContent.stats : [
    { id: 1, number: "+12K", label: "معاملة ناجحة", suffix: "" },
    { id: 2, number: "98%", label: "رضا العملاء", suffix: "" },
    { id: 3, number: "24/7", label: "دعم متواصل", suffix: "" },
    { id: 4, number: "+150", label: "شركة تعتمد علينا", suffix: "" }
  ];
  const contactDetails = landingContent.contactInfo?.length ? landingContent.contactInfo : FALLBACK_CONTACTS;

  useEffect(() => {
    const loadCMSContent = async (noCache = false) => {
      try {
        const landingRes = await fetch(`/api/landing${noCache ? `?t=${Date.now()}` : ""}`, {
          credentials: "include",
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

        // load featured and recent
        const [f, r] = await Promise.all([
          fetch('/api/listings/featured').then(r => r.json()).catch(() => []),
          fetch('/api/listings?page=1&pageSize=12&sort=newest').then(r => r.json()).catch(() => ({ items: [] }))
        ]);
        setFeatured(Array.isArray(f) ? f : []);
        setRecent(Array.isArray(r?.items) ? r.items : (Array.isArray(r) ? r : []));
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

  const showFeaturedSkeleton = isLoading && featured.length === 0;
  const showRecentSkeleton = isLoading && recent.length === 0;
  const heroContentReady = !isLoading;

  const featuredSkeletons = Array.from({ length: SKELETON_LISTING_COUNT });

  const renderListingSkeleton = (index: number, keyPrefix: string) => (
    <div key={`${keyPrefix}-skeleton-${index}`} className="ui-surface overflow-hidden">
      <div className="aspect-video bg-slate-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-11/12 rounded bg-slate-200 animate-pulse" />
        <div className="flex items-center justify-between mt-2">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-8 flex-1 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 flex-1 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 flex-1 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );

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
              <p className="text-primary font-medium mb-4" data-cms-element="hero-welcome">{landingContent?.heroWelcomeText || "مرحباً بك في"}</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight" data-cms-field="heroTitle">
                {landingContent?.heroTitle || "منصة عقاراتي للوساطة العقارية"}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed" data-cms-field="heroSubtitle">
                {landingContent?.heroSubtitle || "منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4" data-cms-element="hero-actions">
                <Button onClick={handleSignUp} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg" data-cms-field="heroButton">
                  {landingContent?.heroButton || "ابدأ رحلتك المجانية"}
                </Button>
                <Button onClick={handleLogin} variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg" data-cms-element="hero-login">
                  {landingContent?.heroLoginButton || "تسجيل الدخول"}
                </Button>
              </div>
            </div>
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
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <div className="flex items-center space-x-reverse space-x-1">
                      <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
                        <Building className="h-2 w-2 text-white" />
                      </div>
                      <span className="text-green-600 font-bold text-[10px]" data-cms-field="heroDashboardTitle">{landingContent?.heroDashboardTitle || "منصة عقاراتي - لوحة التحكم"}</span>
                    </div>
                    <div className="flex space-x-reverse space-x-0.5">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Top Metrics Grid */}
                  <div className="grid grid-cols-4 gap-1 text-center" data-cms-collection="hero-metrics">
                    {heroMetrics.length > 0 ? (
                      heroMetrics.map((metric) => {
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
                      })
                    ) : (
                      <>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-1.5 rounded">
                          <div className="text-xs font-bold text-blue-600">1.2M ﷼</div>
                          <div className="text-[7px] text-blue-700">إيرادات</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-1.5 rounded">
                          <div className="text-xs font-bold text-green-600">3,847</div>
                          <div className="text-[7px] text-green-700">عملاء</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-1.5 rounded">
                          <div className="text-xs font-bold text-orange-600">89</div>
                          <div className="text-[7px] text-orange-700">عقارات</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-1.5 rounded">
                          <div className="text-xs font-bold text-purple-600">45</div>
                          <div className="text-[7px] text-purple-700">صفقات</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Multi-Section Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Recent Activities */}
                    <div className="bg-gray-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-gray-700">أنشطة حديثة</span>
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="bg-white p-1 rounded text-[6px]">
                          <div className="flex items-center space-x-reverse space-x-0.5">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            <span>عقد فيلا</span>
                          </div>
                        </div>
                        <div className="bg-white p-1 rounded text-[6px]">
                          <div className="flex items-center space-x-reverse space-x-0.5">
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            <span>معاينة شقة</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Marketing Campaigns */}
                    <div className="bg-indigo-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-indigo-800">حملات تسويق</span>
                        <BarChart3 className="h-2 w-2 text-indigo-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="bg-white bg-opacity-50 rounded p-0.5 text-[6px]">
                          <div className="flex justify-between">
                            <span>24 نشطة</span>
                            <span className="text-indigo-600">89K مشاهدة</span>
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-50 rounded p-0.5 text-[6px]">
                          <div className="flex justify-between">
                            <span>عملاء جدد</span>
                            <span className="text-indigo-600">2.8K</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales Performance */}
                    <div className="bg-purple-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-purple-800">أداء المبيعات</span>
                        <span className="text-[6px] text-purple-600">+23%</span>
                      </div>
                      <div className="flex items-end h-4 space-x-0.5 space-x-reverse">
                        <div className="bg-purple-400 w-1 h-2 rounded-t"></div>
                        <div className="bg-purple-500 w-1 h-3 rounded-t"></div>
                        <div className="bg-purple-600 w-1 h-4 rounded-t"></div>
                        <div className="bg-purple-500 w-1 h-3 rounded-t"></div>
                        <div className="bg-purple-600 w-1 h-4 rounded-t"></div>
                      </div>
                    </div>
                  </div>

                  {/* Communication & Social Media */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* WhatsApp & Email */}
                    <div className="bg-green-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-green-700">واتساب وإيميل</span>
                        <MessageSquare className="h-2 w-2 text-green-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>156 رسالة اليوم</span>
                          <span className="text-green-600">94% رد</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>12 حملة إيميل</span>
                          <span className="text-green-600">87% فتح</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="bg-blue-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-blue-700">شبكات التواصل</span>
                        <TrendingUp className="h-2 w-2 text-blue-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>تويتر: 45K</span>
                          <span>إنستغرام: 28K</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>سناب: 10K</span>
                          <span>تيك توك: 6K</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Base & Team Performance */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Customer Analytics */}
                    <div className="bg-yellow-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-yellow-800">قاعدة العملاء</span>
                        <Users className="h-2 w-2 text-yellow-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>+284 الشهر الماضي</span>
                          <span className="text-yellow-600">نمو 8.1%</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>نشاط 92%</span>
                          <span className="text-yellow-600">تحويل 12.4%</span>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Details */}
                    <div className="bg-rose-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-rose-800">حملات نشطة</span>
                        <TrendingUp className="h-2 w-2 text-rose-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>واتساب: 18</span>
                          <span>تويتر: 6</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>الفريق: أحمد 12</span>
                          <span>فاطمة 8</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-100 rounded p-1.5">
                    <div className="text-[8px] font-medium text-gray-700 mb-1">إجراءات سريعة</div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="bg-white rounded p-1 text-center">
                        <div className="w-2.5 h-2.5 bg-blue-100 rounded mx-auto mb-0.5 flex items-center justify-center">
                          <Users className="h-1 w-1 text-blue-600" />
                        </div>
                        <div className="text-[6px] text-gray-600">عميل</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="w-2.5 h-2.5 bg-green-100 rounded mx-auto mb-0.5 flex items-center justify-center">
                          <Building className="h-1 w-1 text-green-600" />
                        </div>
                        <div className="text-[6px] text-gray-600">عقار</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="w-2.5 h-2.5 bg-purple-100 rounded mx-auto mb-0.5 flex items-center justify-center">
                          <Phone className="h-1 w-1 text-purple-600" />
                        </div>
                        <div className="text-[6px] text-gray-600">اتصال</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white" data-cms-section="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-cms-content="features-header">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="featuresTitle">
              {landingContent?.featuresTitle || "لماذا تختار منصة عقاراتي؟"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-cms-element="features-description">
              {landingContent?.featuresDescription ||
                "عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-cms-collection="features">
            {(landingContent?.features && landingContent.features.length > 0
              ? landingContent.features
              : FALLBACK_FEATURES
            ).map((feature: any, index: number) => {
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
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-gray-50" data-cms-section="solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-cms-content="solutions-header">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="solutionsTitle">
              {landingContent?.solutionsTitle || "حلول شاملة لإدارة العقارات"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-cms-field="solutionsDescription">
              {landingContent?.solutionsDescription || "أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-cms-collection="solutions">
            {(landingContent?.solutions && landingContent.solutions.length > 0
              ? landingContent.solutions
              : FALLBACK_SOLUTIONS
            ).map((solution: any, index: number) => {
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-green-600" data-cms-section="stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-cms-content="stats-header">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4" data-cms-field="statsTitle">
              {landingContent?.statsTitle || "أرقامنا تتحدث"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-cms-collection="stats">
            {landingContent?.stats && landingContent.stats.length > 0 ? (
              landingContent.stats.map((stat: any) => (
                <div key={stat.id} className="text-center" data-cms-item="stat" data-stat-id={stat.id}>
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2" data-cms-field="stat-number">
                    {stat.number}{stat.suffix || ''}
                  </div>
                  <p className="text-green-100 text-lg" data-cms-field="stat-label">{stat.label}</p>
                </div>
              ))
            ) : (
              // Fallback stats if CMS content is not available
              <>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">10,000+</div>
                  <p className="text-green-100 text-lg">عميل راضٍ</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">50,000+</div>
                  <p className="text-green-100 text-lg">عقار تم بيعه</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">99.8%</div>
                  <p className="text-green-100 text-lg">وقت تشغيل النظام</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">24/7</div>
                  <p className="text-green-100 text-lg">دعم فني</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50" data-cms-section="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-cms-content="pricing-header">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="pricingTitle">
              {landingContent?.pricingTitle || "خطط الأسعار"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-cms-field="pricingSubtitle">
              {landingContent?.pricingSubtitle || "اختر الخطة المناسبة لك"}
            </p>
          </div>

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

          {/* Features Comparison */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">مقارنة بين الباقات</h3>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">المميزات</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">الأساسية</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-green-50">الاحترافية</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">الشركات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">مساحة التخزين</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">1 جيجا</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 bg-green-50">50 جيجا</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">500 جيجا</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">النسخ الاحتياطية</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">أسبوعية</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 bg-green-50">يومية</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">فورية</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">تطبيق الجوال</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600 bg-green-50">✓</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">التدريب المجاني</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-400">-</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600 bg-green-50">✓</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">عقارات مميزة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showFeaturedSkeleton ? featuredSkeletons : featured.slice(0, SKELETON_LISTING_COUNT)).map((item: any, index: number) =>
              showFeaturedSkeleton ? (
                renderListingSkeleton(index, "featured")
              ) : (
                <ListingCard key={item.id ?? `featured-${index}`} item={item} />
              )
            )}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-12 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">أحدث الإعلانات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showRecentSkeleton ? featuredSkeletons : recent.slice(0, SKELETON_LISTING_COUNT)).map((item: any, index: number) =>
              showRecentSkeleton ? (
                renderListingSkeleton(index, "recent")
              ) : (
                <ListingCard key={item.id ?? `recent-${index}`} item={item} />
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            ابدأ رحلتك مع منصة عقاراتي اليوم
          </h2>
          <p className="text-xl text-green-100 mb-8">
            انضم إلى آلاف الوكلاء العقاريين الذين يستخدمون منصتنا لإدارة أعمالهم بكفاءة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleSignUp} className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              إنشاء حساب مجاني
            </Button>
            <Button onClick={handleLogin} variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold">
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white" data-cms-section="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-cms-content="contact-header">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-cms-field="contactTitle">
              {landingContent?.contactTitle || "تواصل معنا"}
            </h2>
            <p className="text-xl text-gray-600" data-cms-field="contactDescription">
              {landingContent?.contactDescription || "فريق عمل منصة عقاراتي جاهز دوماً للإجابة على استفساراتكم"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-cms-collection="contact-info">
            {(landingContent?.contactInfo && landingContent.contactInfo.length > 0
              ? landingContent.contactInfo
              : FALLBACK_CONTACTS
            ).map((info: any, index: number) => {
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
              <p
                className="text-gray-400 mb-4"
                data-cms-field="footerDescription"
              >
                {landingContent?.footerDescription || "منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية"}
              </p>
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

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p data-cms-field="footerCopyright">{landingContent?.footerCopyright || "© 2024 منصة عقاراتي. جميع الحقوق محفوظة."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
