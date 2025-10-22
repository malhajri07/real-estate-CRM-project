import { ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Check,
  Clock3,
  Download,
  Filter,
  Home,
  MapPin,
  Phone,
  Plus,
  Users,
} from "lucide-react";
import AddLeadModal from "@/components/modals/add-lead-modal";
import AddPropertyModal from "@/components/modals/add-property-modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

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
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const { dir, language, t } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";

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
        accent: "bg-gradient-to-br from-brand-50 via-white to-white text-brand-700",
        delta: { value: 12, tone: "up" as const },
      },
      {
        id: "properties",
        label: t("dashboard.active_properties"),
        value: metrics?.activeProperties ?? 0,
        icon: Building,
        accent: "bg-gradient-to-br from-emerald-50 via-white to-white text-emerald-700",
        delta: { value: 8, tone: "up" as const },
      },
      {
        id: "pipeline",
        label: t("dashboard.deals_in_pipeline"),
        value: metrics?.dealsInPipeline ?? 0,
        icon: Filter,
        accent: "bg-gradient-to-br from-amber-50 via-white to-white text-amber-600",
        delta: { value: -2, tone: "down" as const },
      },
      {
        id: "revenue",
        label: t("dashboard.monthly_revenue"),
        value: formatCurrency(metrics?.monthlyRevenue ?? 0),
        icon: Banknote,
        accent: "bg-gradient-to-br from-rose-50 via-white to-white text-rose-600",
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
        onClick: () => setAddLeadModalOpen(true),
      },
      {
        id: "add-property",
        label: t("dashboard.quick_actions.add_property"),
        icon: Home,
        onClick: () => setAddPropertyModalOpen(true),
      },
      {
        id: "schedule-showing",
        label: t("dashboard.quick_actions.schedule_showing"),
        icon: Calendar,
      },
      {
        id: "export-leads",
        label: t("dashboard.quick_actions.export_leads"),
        icon: Download,
      },
    ],
    [t]
  );

  if (metricsLoading) {
    return (
      <>
        <DashboardSkeleton />
        <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
        <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
      </>
    );
  }

  return (
    <div className="space-y-10 py-6" dir={dir}>
      <section aria-label={t("dashboard.quick_summary")} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.id} className={cn("border border-border/60 shadow-card transition hover:-translate-y-0.5", metric.accent)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-inner">
                <metric.icon className="h-5 w-5" />
              </div>
              <Badge variant={metric.delta.tone === "down" ? "warning" : "success"} className="rounded-full px-3 py-1 text-xs font-semibold">
                {metric.delta.tone === "down" ? "-" : "+"}
                {Math.abs(metric.delta.value)}%
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
              <CardDescription className="text-sm text-slate-600">
                {metric.label}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-3" aria-label={t("dashboard.details_section")}>
        <div className="space-y-8 lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t("dashboard.pipeline_stages")}</CardTitle>
                <CardDescription>{t("dashboard.pipeline_description")}</CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {dateFormatter.format(new Date())}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {pipelineStages.map((stage) => (
                  <div key={stage.id} className="rounded-2xl border border-border/60 bg-white/70 p-4 text-center shadow-sm dark:bg-neutral-900/60">
                    <p className="text-2xl font-semibold text-foreground">{stage.value}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{stage.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t("dashboard.recent_leads")}</CardTitle>
                <CardDescription>{t("dashboard.recent_leads_description")}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                {t("form.view_all")}
              </Button>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : recentLeads.length === 0 ? (
                <EmptyState
                  title={t("dashboard.no_recent_leads")}
                  description={t("dashboard.no_recent_leads_description")}
                  action={<Button onClick={() => setAddLeadModalOpen(true)}>{t("leads.add_lead")}</Button>}
                />
              ) : (
                <ul className="space-y-3" aria-live="polite">
                  {recentLeads.slice(0, 6).map((lead) => {
                    const status = statusBadges[lead.status ?? ""] ?? {
                      label: lead.status ? t(`status.${lead.status}`) ?? lead.status : undefined,
                      variant: "secondary" as const,
                    };

                    return (
                      <li key={lead.id} className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:bg-neutral-900/60">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {lead.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead.city && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {lead.city}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-2 lg:items-end">
                            <Badge variant={status.variant} className="rounded-full px-3 py-1 text-xs font-semibold">
                              {status.label ?? (lead.status ?? t("status.new"))}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(lead.createdAt).toLocaleDateString(locale)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t("dashboard.quick_actions")}</CardTitle>
              <CardDescription>{t("dashboard.quick_actions_description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="secondary"
                  className="w-full justify-between rounded-2xl px-4"
                  onClick={action.onClick}
                  disabled={!action.onClick}
                >
                  <span className="text-sm font-semibold text-foreground">{action.label}</span>
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t("dashboard.tasks_title")}</CardTitle>
              <CardDescription>{t("dashboard.tasks_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : !todaysActivities || todaysActivities.length === 0 ? (
                <EmptyState
                  title={t("dashboard.no_activities_today")}
                  description={t("dashboard.no_tasks_description")}
                />
              ) : (
                <ul className="space-y-3" aria-live="polite">
                  {todaysActivities.map((activity) => (
                    <li
                      key={activity.id}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:bg-neutral-900/60",
                        activity.completed && "opacity-60"
                      )}
                    >
                      <span className={cn(
                        "mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border text-brand-600",
                        activity.completed ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-brand-200 bg-brand-50"
                      )}>
                        {activity.completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Clock3 className="h-4 w-4" />
                        )}
                      </span>
                      <div className="space-y-1">
                        <p className={cn("text-sm font-semibold", activity.completed && "line-through text-muted-foreground")}>{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.scheduledDate
                            ? new Date(activity.scheduledDate).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
                            : t("dashboard.no_time_scheduled")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
      <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-2xl" />
        ))}
      </section>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-muted/40 px-6 py-12 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
