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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3" aria-label={t("dashboard.details_section")}>
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pipeline Flow + Revenue Chart - side by side on large screens */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Clean Pipeline Flow */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <PipelineFlow stages={pipelineStages} />
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card className="rounded-2xl p-6">
              <CardHeader className="pb-4 px-0 pt-0">
                <div className="flex items-center gap-3">
                  <div className="icon-container shrink-0">
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-bold text-foreground tracking-tight">
                      {t("dashboard.monthly_revenue") || "إيرادات الشهر"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-2 font-medium leading-relaxed">
                      {t("dashboard.revenue_description") || t("dashboard.pipeline_description") || "نظرة عامة على الإيرادات الشهرية"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <RevenueChart />
              </CardContent>
            </Card>
          </div>

          {/* Recent Leads */}
          <Card className="rounded-2xl p-6">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-6 px-0 pt-0">
                <div className="flex items-center gap-3">
                  <div className="icon-container shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                      {t("dashboard.recent_leads")}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium leading-relaxed">
                      {t("dashboard.recent_leads_description")}
                    </CardDescription>
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
              <CardContent className="px-0 pb-0">
              {leadsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : recentLeads.length === 0 ? (
                <EmptyState
                  title={t("dashboard.no_recent_leads")}
                  description={t("dashboard.no_recent_leads_description")}
                />
              ) : (
                <ul className="space-y-4" aria-live="polite">
                  {recentLeads.slice(0, 6).map((lead, index) => {
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
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="icon-container shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>
                    {t("dashboard.quick_actions")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.quick_actions_description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action, index) => (
                <ActionCard
                  key={action.id}
                  id={action.id}
                  label={action.label}
                  icon={action.icon}
                  onClick={action.onClick}
                  disabled={!action.onClick}
                  variant={action.variant}
                  index={index}
                />
              ))}
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="icon-container shrink-0">
                  <ListTodo className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>
                    {t("dashboard.tasks_title")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.tasks_description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : !todaysActivities || todaysActivities.length === 0 ? (
                <EmptyState
                  title={t("dashboard.no_activities_today")}
                  description={t("dashboard.no_tasks_description")}
                />
              ) : (
                <ul className="space-y-4" aria-live="polite">
                  {todaysActivities.map((activity, index) => (
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
      </div>

      <AddPropertyDrawer open={addPropertyDrawerOpen} onOpenChange={setAddPropertyDrawerOpen} />
    </div>
  );
}