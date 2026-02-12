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

import { ReactNode, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
  Plus,
  Users,
  Phone,
  Zap,
  ListTodo,
} from "lucide-react";
import AddLeadDrawer from "@/components/modals/add-lead-drawer";
import AddPropertyDrawer from "@/components/modals/add-property-drawer";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { BUTTON_PRIMARY_CLASSES, TYPOGRAPHY, PAGE_WRAPPER, CARD_STYLES, LOADING_STYLES } from "@/config/platform-theme";

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
  const [addLeadDrawerOpen, setAddLeadDrawerOpen] = useState(false);
  const [addPropertyDrawerOpen, setAddPropertyDrawerOpen] = useState(false);
  const [completedactivities, setCompletedActivities] = useState<string[]>([]);
  const { dir, language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  
  // Get user's name for welcome message
  const userName = user?.firstName || user?.name || user?.username || "مستخدم";

  const {
    data: metrics,
    isLoading: metricsLoading,
  } = useQuery<MetricResponse>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
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
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "SAR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
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

  const pipelineStages = useMemo(
    () => [
      { id: "lead", label: t("dashboard.pipeline.lead"), value: metrics?.pipelineByStage?.lead ?? 0 },
      { id: "qualified", label: t("dashboard.pipeline.qualified"), value: metrics?.pipelineByStage?.qualified ?? 0 },
      { id: "showing", label: t("dashboard.pipeline.showing"), value: metrics?.pipelineByStage?.showing ?? 0 },
      { id: "negotiation", label: t("dashboard.pipeline.negotiation"), value: metrics?.pipelineByStage?.negotiation ?? 0 },
      { id: "closed", label: t("dashboard.pipeline.closed"), value: metrics?.pipelineByStage?.closed ?? 0 },
    ],
    [metrics, t]
  );

  const quickActions = useMemo(
    () => [
      {
        id: "add-lead",
        label: t("dashboard.quick_actions.add_lead"),
        icon: Plus,
        onClick: () => setAddLeadDrawerOpen(true),
        variant: "primary" as const,
      },
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
    setLocation(`/home/platform/leads/${leadId}`);
  };

  if (metricsLoading) {
    return (
      <>
        <DashboardSkeleton />
        <AddLeadDrawer open={addLeadDrawerOpen} onOpenChange={setAddLeadDrawerOpen} />
        <AddPropertyDrawer open={addPropertyDrawerOpen} onOpenChange={setAddPropertyDrawerOpen} />
      </>
    );
  }

  const toggleActivity = (id: string) => {
    setCompletedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full space-y-8 relative min-h-screen" dir={dir}>
      {/* Clean Background - Apple Style */}
      <div className="absolute inset-0 bg-[#F5F5F7] pointer-events-none z-0" />
      
      {/* Welcome Header - Minimal Text */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-2"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {t("dashboard.welcome") || "مرحباً"} {userName}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {t("dashboard.welcome_subtitle") || "نظرة عامة على أداءك اليوم"}
          </p>
        </div>
      </motion.div>
      
      {/* Clean Metric Cards */}
      <section aria-label={t("dashboard.quick_summary")} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={metric.id}
            {...metric}
            index={index}
            className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl border-none"
          />
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3 relative z-10" aria-label={t("dashboard.details_section")}>
        {/* Left Column - Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Clean Pipeline Flow */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <PipelineFlow stages={pipelineStages} dateFormatter={dateFormatter} />
          </div>

          {/* Revenue Chart with Clean Background */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Card className="bg-transparent border-0 shadow-none p-0">
              <CardHeader className="pb-4 px-0 pt-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                      <Banknote className="h-6 w-6" />
                    </div>
                  </div>
                <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                  {t("dashboard.monthly_revenue") || "إيرادات الشهر"}
                </CardTitle>
                <CardDescription className="text-slate-500 mt-2 font-medium" style={{ lineHeight: '1.6' }}>
                  {t("dashboard.revenue_description") || t("dashboard.pipeline_description") || "نظرة عامة على الإيرادات الشهرية"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <RevenueChart />
              </CardContent>
            </Card>
          </div>

          {/* Clean Recent Leads */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Card className="bg-transparent border-0 shadow-none p-0">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-6 px-0 pt-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                    <Users className="h-6 w-6" />
                  </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                    {t("dashboard.recent_leads")}
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium" style={{ lineHeight: '1.6' }}>
                    {t("dashboard.recent_leads_description")}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full px-4 font-bold bg-slate-50 text-slate-600 hover:bg-slate-100"
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
                  action={<Button onClick={() => setAddLeadDrawerOpen(true)}>{t("leads.add_lead")}</Button>}
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
        <div className="space-y-8">
          {/* Enhanced Quick Actions */}
          <Card className={CARD_STYLES.container}>
            <CardHeader className={CARD_STYLES.header}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className={TYPOGRAPHY.cardTitle}>
                {t("dashboard.quick_actions")}
              </CardTitle>
              <CardDescription className={TYPOGRAPHY.cardDescription}>
                {t("dashboard.quick_actions_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(CARD_STYLES.content, "space-y-3")}>
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

          {/* Enhanced Today's Tasks */}
          <Card className={CARD_STYLES.container}>
            <CardHeader className={CARD_STYLES.header}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                  <ListTodo className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className={TYPOGRAPHY.cardTitle}>
                {t("dashboard.tasks_title")}
              </CardTitle>
              <CardDescription className={TYPOGRAPHY.cardDescription}>
                {t("dashboard.tasks_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className={CARD_STYLES.content}>
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
                <ul className="space-y-3" aria-live="polite">
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
      </div>

      <AddLeadDrawer open={addLeadDrawerOpen} onOpenChange={setAddLeadDrawerOpen} />
      <AddPropertyDrawer open={addPropertyDrawerOpen} onOpenChange={setAddPropertyDrawerOpen} />
    </div>
  );
}



interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}
