/**
 * dashboard.tsx - Platform Dashboard
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → dashboard.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Main platform dashboard for authenticated users. Displays:
 * - Activity feed
 * - Lead management
 * - Quick actions
 * - Recent updates
 * 
 * Route: /home/platform
 * 
 * Related Files:
 * - apps/web/src/components/dashboard/RoleBasedDashboard.tsx - Role-based dashboard
 * - apps/web/src/hooks/useDashboardData.ts - Dashboard data hook
 */

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PipelineFlow } from "@/components/dashboard/PipelineFlow";
import { LeadCard } from "@/components/dashboard/LeadCard";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Activity,
  Lead,
  Deal,
} from "@shared/types";
import {
  Badge,
  type BadgeProps,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Banknote,
  Building,
  Calendar,
  Download,
  Filter,
  Home,
  Users,
  Phone,
  Zap,
  ListTodo,
  Clock,
} from "lucide-react";
import AddPropertyDrawer from "@/components/modals/add-property-drawer";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { SarSymbol } from "@/components/ui/sar-symbol";
import { useLanguage } from "@/contexts/LanguageContext";
import EmptyState from "@/components/ui/empty-state";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";

type MetricResponse = {
  totalLeads: number;
  activeProperties: number;
  dealsInPipeline: number;
  monthlyRevenue: number;
  pipelineByStage: {
    lead: number;
    qualified: number;
    showing: number;
    negotiation: number;
    closed: number;
  };
  growth?: { leads: number; deals: number; revenue: number };
  stuckDeals?: { count: number; totalValue: number };
  period?: string;
};

export default function Dashboard() {
  const [addPropertyDrawerOpen, setAddPropertyDrawerOpen] = useState(false);
  const [completedactivities, setCompletedActivities] = useState<string[]>([]);
  const [period, setPeriod] = useState("30d");
  const minLoadTime = useMinLoadTime();
  const { dir, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const numericLocale = "en-US"; // Numeric values (0-9) across application

  // Get user's name and role for scoped dashboard
  const userName = user?.firstName || user?.name || user?.username || "مستخدم";
  const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];
  const isCorpOwner = userRoles.includes("CORP_OWNER");
  const isCorpAgent = userRoles.includes("CORP_AGENT");
  const isIndivAgent = userRoles.includes("INDIV_AGENT");
  const isAdmin = userRoles.includes("WEBSITE_ADMIN");
  const isCorporate = isCorpOwner || isCorpAgent;

  // Personal metrics (always shown for all roles)
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useQuery<MetricResponse>({
    queryKey: ["/api/reports/dashboard/metrics", "personal", period],
    queryFn: () => fetch(`/api/reports/dashboard/metrics?view=personal&period=${period}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
    }).then((r) => r.json()),
  });

  // Org-wide metrics (shown for CORP_AGENT as aggregate + CORP_OWNER as full view)
  const { data: orgMetrics } = useQuery<MetricResponse>({
    queryKey: ["/api/reports/dashboard/metrics", "org"],
    queryFn: () => fetch("/api/reports/dashboard/metrics?view=org", {
      headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
    }).then((r) => r.json()),
    enabled: isCorporate || isAdmin,
  });

  // Leaderboard (CORP_OWNER only)
  const { data: leaderboard } = useQuery<{ id: string; name: string; deals: number; wonDeals: number; revenue: number; conversionRate: number }[]>({
    queryKey: ["/api/reports/dashboard/leaderboard"],
    queryFn: () => fetch("/api/reports/dashboard/leaderboard", {
      headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
    }).then((r) => r.json()),
    enabled: isCorpOwner || isAdmin,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: deals } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: todaysActivities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities/today"],
  });

  const recentLeads = leads?.slice(0, 10) ?? [];

  const statusBadges = useMemo<Record<string, { label: string; variant: NonNullable<BadgeProps["variant"]> }>>(
    () => ({
      new: { label: "جديد", variant: "info" },
      qualified: { label: "مؤهل", variant: "success" },
      showing: { label: "معاينة", variant: "secondary" },
      negotiation: { label: "تفاوض", variant: "warning" },
      closed: { label: "مغلق", variant: "success" },
    }),
    []
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(numericLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [numericLocale]
  );

  const formatCurrency = (value: number) => `${numberFormatter.format(value)}`;

  const growthData = metrics?.growth;
  const makeDelta = (val: number | undefined) => {
    if (val === undefined) return undefined;
    const tone = val > 0 ? "up" as const : val < 0 ? "down" as const : "neutral" as const;
    return { value: Math.abs(val), tone };
  };

  const metricCards = useMemo(
    () => [
      {
        id: "leads",
        label: "إجمالي العملاء",
        value: metrics?.totalLeads ?? 0,
        icon: Users,
        delta: makeDelta(growthData?.leads),
        href: "/home/platform/leads",
      },
      {
        id: "properties",
        label: "العقارات النشطة",
        value: metrics?.activeProperties ?? 0,
        icon: Building,
        delta: makeDelta(0),
        href: "/home/platform/properties",
      },
      {
        id: "pipeline",
        label: "الصفقات",
        value: metrics?.dealsInPipeline ?? 0,
        icon: Filter,
        delta: makeDelta(growthData?.deals),
        href: "/home/platform/pipeline",
      },
      {
        id: "revenue",
        label: "الإيرادات الشهرية",
        value: formatCurrency(metrics?.monthlyRevenue ?? 0),
        icon: Banknote,
        currency: true,
        delta: makeDelta(growthData?.revenue),
      },
    ],
    [metrics, formatCurrency, growthData]
  );

  const pipelineStages = useMemo(() => {
    const STAGE_IDS = ["lead", "qualified", "showing", "negotiation", "closed"] as const;
    const counts = { lead: 0, qualified: 0, showing: 0, negotiation: 0, closed: 0 };
    (deals ?? []).forEach((deal: any) => {
      const stage = (deal.stage ?? deal.status ?? "").toString().toLowerCase();
      if (STAGE_IDS.includes(stage as any)) {
        counts[stage as keyof typeof counts]++;
      }
    });
    return [
      { id: "lead", label: "عميل جديد", value: counts.lead },
      { id: "qualified", label: "مؤهل", value: counts.qualified },
      { id: "showing", label: "معاينة", value: counts.showing },
      { id: "negotiation", label: "تفاوض", value: counts.negotiation },
      { id: "closed", label: "مغلق", value: counts.closed },
    ];
  }, [deals]);

  const quickActions = useMemo(
    () => [
      {
        id: "add-property",
        label: "إضافة عقار",
        icon: Home,
        onClick: () => setAddPropertyDrawerOpen(true),
        variant: "primary" as const,
      },
      {
        id: "schedule-showing",
        label: "جدولة معاينة",
        icon: Calendar,
        onClick: () => setLocation("/home/platform/calendar"),
        variant: "secondary" as const,
      },
      {
        id: "export-leads",
        label: "تصدير العملاء",
        icon: Download,
        onClick: () => setLocation("/home/platform/leads"),
        variant: "secondary" as const,
      },
    ],
    [setLocation]
  );

  const handleLeadCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleLeadMessage = (leadId: string) => {
    setLocation('/home/platform/leads');
  };

  if (metricsError) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader
          title={`مرحباً ${userName}`}
          subtitle={"نظرة عامة على أداءك اليوم"}
        />
        <QueryErrorFallback
          message={"فشل تحميل بيانات لوحة التحكم"}
          onRetry={() => refetchMetrics()}
        />
      </div>
    );
  }

  if (metricsLoading || minLoadTime) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader
          title={`مرحباً ${userName}`}
          subtitle={"نظرة عامة على أداءك اليوم"}
        />
        <DashboardSkeleton />
        <AddPropertyDrawer open={addPropertyDrawerOpen} onOpenChange={setAddPropertyDrawerOpen} />
      </div>
    );
  }

  const toggleActivity = (id: string) => {
    setCompletedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader
          title={`مرحباً ${userName}`}
          subtitle={"نظرة عامة على أداءك"}
        >
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {[
              { value: "30d", label: "30 يوم" },
              { value: "90d", label: "90 يوم" },
              { value: "1y", label: "سنة" },
            ].map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant={period === p.value ? "default" : "ghost"}
                className="h-7 text-xs rounded-md"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </PageHeader>

      <section aria-label={"ملخص سريع"} className={GRID_METRICS}>
        {metricCards.map((metric) => (
          <MetricCard
            key={metric.id}
            {...metric}
          />
        ))}
      </section>

      {/* Growth Indicators — only show non-zero changes */}
      {metrics?.growth && (metrics.growth.leads !== 0 || metrics.growth.deals !== 0 || metrics.growth.revenue !== 0) && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "العملاء", value: metrics.growth.leads },
            { label: "الصفقات", value: metrics.growth.deals },
            { label: "الإيرادات", value: metrics.growth.revenue },
          ].filter((g) => g.value !== 0).map((g) => (
            <Badge key={g.label} variant="outline" className={cn("gap-1 text-xs", g.value > 0 ? "text-primary border-primary/30" : "text-destructive border-destructive/30")}>
              {g.value > 0 ? "⬆" : "⬇"} {Math.abs(g.value)}% {g.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Stuck Deals Alert */}
      {metrics?.stuckDeals && metrics.stuckDeals.count > 0 && (
        <Card className="border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[hsl(var(--warning)/0.1)] flex items-center justify-center">
                <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <p className="font-bold text-sm">{metrics.stuckDeals.count} صفقة متوقفة</p>
                <p className="text-xs text-muted-foreground">في مرحلة التفاوض أكثر من 30 يوم · قيمة إجمالية {metrics.stuckDeals.totalValue.toLocaleString()} ر.س</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/home/platform/pipeline")}>
              عرض الصفقات
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Org Aggregate (CORP_AGENT sees org summary, CORP_OWNER sees org + leaderboard) */}
      {isCorporate && orgMetrics && (
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-muted-foreground">أداء المنشأة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-2xl font-black tabular-nums">{orgMetrics.totalLeads}</p><p className="text-xs text-muted-foreground">إجمالي العملاء</p></div>
              <div><p className="text-2xl font-black tabular-nums">{orgMetrics.activeProperties}</p><p className="text-xs text-muted-foreground">العقارات النشطة</p></div>
              <div><p className="text-2xl font-black tabular-nums">{orgMetrics.dealsInPipeline}</p><p className="text-xs text-muted-foreground">الصفقات النشطة</p></div>
              <div><p className="text-2xl font-black tabular-nums text-primary">{orgMetrics.monthlyRevenue?.toLocaleString()}</p><p className="text-xs text-muted-foreground">إيرادات الشهر</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Leaderboard (CORP_OWNER only) */}
      {(isCorpOwner || isAdmin) && leaderboard && leaderboard.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">ترتيب الوسطاء</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setLocation("/home/platform/team")}>عرض الفريق</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((agent, i) => (
                <div key={agent.id} className="flex items-center gap-3 text-sm">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">{i + 1}</span>
                  <span className="flex-1 font-medium truncate">{agent.name}</span>
                  <span className="text-xs text-muted-foreground">{agent.wonDeals} صفقة</span>
                  <span className="text-xs font-bold text-primary tabular-nums">{agent.revenue.toLocaleString()}</span>
                  <Badge variant="outline" className="text-[10px]">{agent.conversionRate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 1: Pipeline Flow + Revenue Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-container shrink-0">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>خط الأنابيب</CardTitle>
                <CardDescription>توزيع الصفقات حسب المرحلة</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PipelineFlow stages={pipelineStages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-container shrink-0">
                <Banknote className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>إيرادات الشهر</CardTitle>
                <CardDescription>نظرة عامة على الإيرادات</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Recent Leads + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-container shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{"آخر العملاء"}</CardTitle>
                <CardDescription>{"أحدث العملاء المضافين"}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4 font-bold bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => setLocation("/home/platform/leads")}
            >
              {"عرض الكل"}
            </Button>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <EmptyState
                title={"لا يوجد عملاء"}
                description={"لم يتم إضافة عملاء بعد"}
              />
            ) : (
              <ul className="space-y-3" aria-live="polite">
                {recentLeads.slice(0, 5).map((lead, index) => {
                  const status = statusBadges[lead.status ?? ""] ?? {
                    label: lead.status || undefined,
                    variant: "secondary" as const,
                  };
                  return (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      statusBadge={status}
                      locale={locale}
                      index={index}
                      onCall={handleLeadCall}
                      onMessage={handleLeadMessage}
                    />
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-container shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>النشاط الأخير</CardTitle>
                <CardDescription>آخر التحديثات والإجراءات</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4 font-bold bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => setLocation("/home/platform/activities")}
            >
              {"عرض الكل"}
            </Button>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : !todaysActivities || todaysActivities.length === 0 ? (
              <EmptyState
                title={"لا توجد مهام"}
                description={"لا توجد مهام مجدولة لليوم"}
              />
            ) : (
              <ul className="space-y-3" aria-live="polite">
                {todaysActivities.slice(0, 5).map((activity, index) => (
                  <TaskCard
                    key={activity.id}
                    activity={activity}
                    completed={activity.completed || completedactivities.includes(activity.id)}
                    onClick={() => toggleActivity(activity.id)}
                    locale={locale}
                    index={index}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AddPropertyDrawer open={addPropertyDrawerOpen} onOpenChange={setAddPropertyDrawerOpen} />
    </div>
  );
}