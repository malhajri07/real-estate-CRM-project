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
};

export default function Dashboard() {
  const [addPropertyDrawerOpen, setAddPropertyDrawerOpen] = useState(false);
  const [completedactivities, setCompletedActivities] = useState<string[]>([]);
  const { dir, language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const numericLocale = "en-US"; // Numeric values (0-9) across application

  // Get user's name for welcome message
  const userName = user?.firstName || user?.name || user?.username || "مستخدم";

  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useQuery<MetricResponse>({
    queryKey: ["/api/reports/dashboard/metrics"],
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
      new: { label: t("status.new"), variant: "info" },
      qualified: { label: t("status.qualified"), variant: "success" },
      showing: { label: t("status.showing"), variant: "secondary" },
      negotiation: { label: t("status.negotiation"), variant: "warning" },
      closed: { label: t("status.closed"), variant: "success" },
    }),
    [t]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(numericLocale, {
        style: "currency",
        currency: "SAR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [numericLocale]
  );

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  const metricCards = useMemo(
    () => [
      {
        id: "leads",
        label: t("dashboard.total_leads"),
        value: metrics?.totalLeads ?? 0,
        icon: Users,
        // accent removed
        delta: { value: 12, tone: "up" as const },
        href: "/home/platform/leads",
      },
      {
        id: "properties",
        label: t("dashboard.active_properties"),
        value: metrics?.activeProperties ?? 0,
        icon: Building,
        // accent removed
        delta: { value: 8, tone: "up" as const },
        href: "/home/platform/properties",
      },
      {
        id: "pipeline",
        label: t("dashboard.deals_in_pipeline"),
        value: metrics?.dealsInPipeline ?? 0,
        icon: Filter,
        // accent removed
        delta: { value: -2, tone: "down" as const },
        href: "/home/platform/pipeline",
      },
      {
        id: "revenue",
        label: t("dashboard.monthly_revenue"),
        value: formatCurrency(metrics?.monthlyRevenue ?? 0),
        icon: Banknote,
        // accent removed
        delta: { value: 24, tone: "up" as const },
      },
    ],
    [metrics, formatCurrency, t]
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
      { id: "lead", label: t("dashboard.pipeline.lead"), value: counts.lead },
      { id: "qualified", label: t("dashboard.pipeline.qualified"), value: counts.qualified },
      { id: "showing", label: t("dashboard.pipeline.showing"), value: counts.showing },
      { id: "negotiation", label: t("dashboard.pipeline.negotiation"), value: counts.negotiation },
      { id: "closed", label: t("dashboard.pipeline.closed"), value: counts.closed },
    ];
  }, [deals, t]);

  const quickActions = useMemo(
    () => [
      {
        id: "add-property",
        label: t("dashboard.quick_actions.add_property"),
        icon: Home,
        onClick: () => setAddPropertyDrawerOpen(true),
        variant: "primary" as const,
      },
      {
        id: "schedule-showing",
        label: t("dashboard.quick_actions.schedule_showing"),
        icon: Calendar,
        onClick: () => setLocation("/home/platform/calendar"),
        variant: "secondary" as const,
      },
      {
        id: "export-leads",
        label: t("dashboard.quick_actions.export_leads"),
        icon: Download,
        onClick: () => setLocation("/home/platform/leads"),
        variant: "secondary" as const,
      },
    ],
    [t, setLocation]
  );

  const handleLeadCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleLeadMessage = (leadId: string) => {
    setLocation('/home/platform/leads');
  };

  if (metricsError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader
          title={`${t("dashboard.welcome") || "مرحباً"} ${userName}`}
          subtitle={t("dashboard.welcome_subtitle") || "نظرة عامة على أداءك اليوم"}
        />
        <QueryErrorFallback
          message={t("dashboard.load_error") || "فشل تحميل بيانات لوحة التحكم"}
          onRetry={() => refetchMetrics()}
        />
      </div>
    );
  }

  if (metricsLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader
          title={`${t("dashboard.welcome") || "مرحباً"} ${userName}`}
          subtitle={t("dashboard.welcome_subtitle") || "نظرة عامة على أداءك اليوم"}
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
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader
          title={`${t("dashboard.welcome") || "مرحباً"} ${userName}`}
          subtitle={t("dashboard.welcome_subtitle") || "نظرة عامة على أداءك اليوم"}
        />
      
      <section aria-label={t("dashboard.quick_summary")} className={GRID_METRICS}>
        {metricCards.map((metric) => (
          <MetricCard
            key={metric.id}
            {...metric}
          />
        ))}
      </section>

      {/* Row 1: Pipeline Flow + Revenue Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-container shrink-0">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("dashboard.deals_in_pipeline") || (language === "ar" ? "خط الأنابيب" : "Pipeline")}</CardTitle>
                <CardDescription>{t("dashboard.pipeline_description") || (language === "ar" ? "توزيع الصفقات حسب المرحلة" : "Deal distribution by stage")}</CardDescription>
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
                <CardTitle>{t("dashboard.monthly_revenue") || (language === "ar" ? "إيرادات الشهر" : "Monthly Revenue")}</CardTitle>
                <CardDescription>{t("dashboard.revenue_description") || (language === "ar" ? "نظرة عامة على الإيرادات" : "Revenue overview")}</CardDescription>
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
                <CardTitle>{t("dashboard.recent_leads")}</CardTitle>
                <CardDescription>{t("dashboard.recent_leads_description")}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4 font-bold bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => setLocation("/home/platform/leads")}
            >
              {t("form.view_all")}
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
                title={t("dashboard.no_recent_leads")}
                description={t("dashboard.no_recent_leads_description")}
              />
            ) : (
              <ul className="space-y-3" aria-live="polite">
                {recentLeads.slice(0, 5).map((lead, index) => {
                  const status = statusBadges[lead.status ?? ""] ?? {
                    label: lead.status ? t(`status.${lead.status}`) ?? lead.status : undefined,
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
                <CardTitle>{t("dashboard.recent_activity") || (language === "ar" ? "النشاط الأخير" : "Recent Activity")}</CardTitle>
                <CardDescription>{t("dashboard.recent_activity_description") || (language === "ar" ? "آخر التحديثات والإجراءات" : "Latest updates and actions")}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4 font-bold bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => setLocation("/home/platform/activities")}
            >
              {t("form.view_all")}
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
                title={t("dashboard.no_activities_today")}
                description={t("dashboard.no_tasks_description")}
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