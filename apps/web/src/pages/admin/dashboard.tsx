/**
 * rbac-dashboard.tsx - RBAC Dashboard
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → rbac-dashboard.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Main RBAC admin dashboard. Provides:
 * - Admin navigation and layout
 * - Dashboard overview
 * - Access to admin management pages
 * 
 * Route: /admin/overview/main-dashboard or /rbac-dashboard
 * 
 * Related Files:
 * - apps/web/src/components/rbac/AdminHeader.tsx - Admin header
 * - apps/web/src/components/rbac/AdminSidebar.tsx - Admin sidebar
 * - apps/web/src/config/admin-sidebar.ts - Admin sidebar configuration
 */

import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { adminSidebarConfig, type AdminSidebarContentSection } from "@/config/admin-sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { formatAdminDate } from "@/lib/formatters";
import UserManagement from "@/pages/admin/user-management";
import RoleManagement from "@/pages/admin/role-management";
import OrganizationManagement from "@/pages/admin/organization-management";
import CMSLandingPage from "@/pages/admin/cms-landing";
import ArticlesManagement from "@/pages/admin/articles-management";
import MediaLibrary from "@/pages/admin/media-library";
import SEOManagement from "@/pages/admin/seo-management";
import TemplatesManagement from "@/pages/admin/templates-management";
import NavigationManagement from "@/pages/admin/navigation-management";
import RevenueManagement from "@/pages/admin/revenue-management";
import ComplaintsManagement from "@/pages/admin/complaints-management";
import IntegrationsManagement from "@/pages/admin/integrations-management";
import FeaturesManagement from "@/pages/admin/features-management";
import AnalyticsManagement from "@/pages/admin/analytics-management";
import BillingManagement from "@/pages/admin/billing-management";
import SecurityManagement from "@/pages/admin/security-management";
import NotificationsManagement from "@/pages/admin/notifications-management";
import SystemSettings from "@/pages/admin/system-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, Home, Trophy, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { MetricCard } from "@/components/admin";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, CHART_HEIGHT } from "@/config/design-tokens";
import { GRID_METRICS, GRID_TWO_COL } from "@/config/platform-theme";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

// LABELS mapping removed - now using central LanguageContext translations

type SidebarContentMeta = {
  label: string;
  groupLabel: string;
  sections?: AdminSidebarContentSection[];
};

type DashboardMetricsResponse = {
  success: boolean;
  metrics: {
    currency: string;
    leads: { today: number; last7Days: number; last30Days: number };
    listings: { today: number; last7Days: number; last30Days: number };
    appointments: { today: number; last7Days: number; last30Days: number };
    dealsWon: { today: number; last7Days: number; last30Days: number };
    gmv: { today: number; last7Days: number; last30Days: number; currency: string };
    invoiceTotal: { today: number; last7Days: number; last30Days: number; currency: string };
    cashCollected: { today: number; last7Days: number; last30Days: number; currency: string };
  };
  topAgents: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    dealsWon: number;
    gmv: number;
  }>;
  recentTickets: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    channel?: string | null;
    updatedAt: string;
    openedAt: string;
    customerName?: string | null;
    assignedTo?: string | null;
  }>;
};

const dashboardQuery = async (): Promise<DashboardMetricsResponse> => {
  const payload = await apiGet<DashboardMetricsResponse>("api/rbac-admin/dashboard");
  if (!payload.success) throw new Error("فشل في تحميل لوحة التحكم");
  return payload;
};

const sidebarContentMap = new Map<string, SidebarContentMeta>();
// sidebarContentMap is now populated inside RBACDashboard to use the translation function

type DashboardProps = {
  data?: DashboardMetricsResponse;
  isLoading: boolean;
  error?: Error | null;
};

function OverviewDashboard({ data, isLoading, error }: DashboardProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>فشل في تحميل بيانات النظرة العامة: {error.message}</AlertDescription>
      </Alert>
    );
  }

  const metrics = data?.metrics;
  const currency = metrics?.gmv.currency ?? "SAR";

  // Prepare chart data for trends
  const chartData = useMemo(() => {
    if (!metrics) return [];
    return [
      { period: 'اليوم', leads: metrics.leads.today, listings: metrics.listings.today, deals: metrics.dealsWon.today },
      { period: '٧ أيام', leads: metrics.leads.last7Days, listings: metrics.listings.last7Days, deals: metrics.dealsWon.last7Days },
      { period: '٣٠ يوم', leads: metrics.leads.last30Days, listings: metrics.listings.last30Days, deals: metrics.dealsWon.last30Days },
    ];
  }, [metrics]);

  const revenueChartData = useMemo(() => {
    if (!metrics) return [];
    return [
      { period: 'اليوم', gmv: metrics.gmv.today, invoices: metrics.invoiceTotal.today, cash: metrics.cashCollected.today },
      { period: '٧ أيام', gmv: metrics.gmv.last7Days, invoices: metrics.invoiceTotal.last7Days, cash: metrics.cashCollected.last7Days },
      { period: '٣٠ يوم', gmv: metrics.gmv.last30Days, invoices: metrics.invoiceTotal.last30Days, cash: metrics.cashCollected.last30Days },
    ];
  }, [metrics]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border shadow-xl rounded-2xl p-4 text-xs">
          <p className="font-bold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground font-medium">{entry.name}:</span>
              <span className="text-foreground font-bold ml-auto">{
                typeof entry.value === 'number' && entry.name.includes('قيمة') || entry.name.includes('التحصيلات')
                  ? formatCurrency(entry.value, currency)
                  : formatNumber(entry.value)
              }</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics Cards */}
      <div className={GRID_METRICS}>
        <MetricCard
          title="العملاء المحتملون"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<Users className="w-5 h-5 text-muted-foreground" />}
          metric={metrics?.leads}
          loading={isLoading && !metrics}
        />
        <MetricCard
          title="الإعلانات المنشورة"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<Home className="w-5 h-5 text-muted-foreground" />}
          metric={metrics?.listings}
          loading={isLoading && !metrics}
        />
        <MetricCard
          title="الصفقات الرابحة"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<Trophy className="w-5 h-5 text-muted-foreground" />}
          metric={metrics?.dealsWon}
          loading={isLoading && !metrics}
        />
        <MetricCard
          title="قيمة المبيعات (GMV)"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<Wallet className="w-5 h-5 text-muted-foreground" />}
          metric={metrics?.gmv}
          currency={currency}
          loading={isLoading && !metrics}
        />
      </div>

      {/* Charts Section - NEW! */}
      {!isLoading && metrics && (
        <div className={GRID_TWO_COL}>
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg font-bold text-foreground tracking-tight">نشاط المبيعات</CardTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">العملاء المحتملون، الإعلانات، والصفقات</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="h-[320px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '25px', fontSize: '12px', fontWeight: 600, color: '#64748b' }} />
                    <Bar dataKey="leads" fill="url(#colorLeads)" name="العملاء المحتملون" radius={[8, 8, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="listings" fill="url(#colorListings)" name="الإعلانات" radius={[8, 8, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="deals" fill="url(#colorDeals)" name="الصفقات" radius={[8, 8, 0, 0]} maxBarSize={40} />
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={1} />
                        <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={1} />
                        <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={1} />
                        <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg font-bold text-foreground tracking-tight">الإيرادات المالية</CardTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">قيمة المبيعات، الفواتير، والتحصيلات</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="h-[320px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '25px', fontSize: '12px', fontWeight: 600, color: '#64748b' }} />
                    <Line type="monotone" dataKey="gmv" stroke={CHART_COLORS.green} strokeWidth={4} name="قيمة المبيعات" dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="invoices" stroke={CHART_COLORS.blue} strokeWidth={4} name="الفواتير" dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="cash" stroke={CHART_COLORS.amber} strokeWidth={4} name="التحصيلات" dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border border-border bg-card shadow-sm xl:col-span-2 overflow-hidden hover:shadow-md transition-all">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">أفضل الوكلاء</CardTitle>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">النشاط خلال آخر ٩٠ يومًا</p>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {isLoading && <LoadingRows rows={4} />}
            {!isLoading && (!data?.topAgents || data.topAgents.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-muted/30 rounded-2xl border border-dashed border-border">
                <div className="rounded-2xl bg-card p-4 shadow-sm"><Users className="h-12 w-12 text-muted-foreground/70" /></div>
                <div>
                  <p className="text-base font-bold text-foreground">لا يوجد وكلاء نشطين</p>
                  <p className="text-sm text-muted-foreground mt-1">لم يتم تسجيل أي نشاط للوكلاء في الفترة المحددة</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.topAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex flex-col p-5 rounded-2xl bg-card/50 border border-border hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground font-bold group-hover:bg-muted group-hover:text-foreground/80 transition-colors duration-300">
                        {agent.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground leading-none mb-1">{agent.name}</span>
                        <span className="text-xs font-bold text-muted-foreground/70 truncate max-w-[150px]">{agent.email || "بدون بريد"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-muted-foreground/70 uppercase tracking-tighter">الصفقات</span>
                        <span className="text-xs font-bold text-foreground">{agent.dealsWon}</span>
                      </div>
                      <div className="flex flex-col text-end">
                        <span className="text-xs font-extrabold text-muted-foreground/70 uppercase tracking-tighter">القيمة الإجمالية</span>
                        <span className="text-xs font-bold text-muted-foreground">{formatCurrency(agent.gmv, currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">التذاكر الحديثة</CardTitle>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">آخر التحديثات</p>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {isLoading && <LoadingRows rows={5} />}
            {!isLoading && (!data?.recentTickets || data.recentTickets.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-muted/30 rounded-2xl border border-dashed border-border">
                <div className="rounded-2xl bg-card p-4 shadow-sm text-3xl">🎫</div>
                <div>
                  <p className="text-base font-bold text-foreground">لا توجد تذاكر</p>
                  <p className="text-sm text-muted-foreground mt-1">جميع التذاكر تمت معالجتها</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col p-4 rounded-xl bg-card/50 border border-border hover:bg-card hover:border-primary/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-bold text-foreground group-hover:text-foreground/80 transition-colors line-clamp-1">{ticket.subject}</p>
                      <Badge className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded-md border-0 shrink-0", ticketStatusColor(ticket.status))}>
                        {ticketStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-xs font-bold text-muted-foreground">{ticket.customerName || "عميل"}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground/70">{formatAdminDate(ticket.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const formatNumber = (value?: number) => (value ?? 0).toLocaleString("en-US");

const formatCurrency = (value?: number, currency = "SAR") => {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
  return `${formatted} ريال`;
};

const ticketStatusLabel = (status: string) => {
  switch (status) {
    case "OPEN":
      return "مفتوحة";
    case "IN_PROGRESS":
      return "قيد المعالجة";
    case "RESOLVED":
      return "تم الحل";
    case "CLOSED":
      return "مغلقة";
    default:
      return status;
  }
};

const ticketStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "IN_PROGRESS":
      return "bg-primary/5 text-primary border-primary/20";
    case "RESOLVED":
      return "bg-primary/10 text-primary border-primary/20";
    case "CLOSED":
      return "bg-muted/50 text-muted-foreground border-border";
    default:
      return "bg-muted/50 text-muted-foreground border-border";
  }
};

const ticketPriorityLabel = (priority: string) => {
  switch (priority) {
    case "LOW":
      return "منخفض";
    case "MEDIUM":
      return "متوسط";
    case "HIGH":
      return "مرتفع";
    case "URGENT":
      return "عاجل";
    default:
      return priority;
  }
};

const ticketPriorityColor = (priority: string) => {
  switch (priority) {
    case "LOW":
      return "bg-primary/10 text-primary";
    case "MEDIUM":
      return "bg-sky-50 text-sky-700";
    case "HIGH":
      return "bg-amber-50 text-amber-700";
    case "URGENT":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
};

const LoadingRows = ({ rows }: { rows: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-10 animate-pulse rounded-lg bg-muted/50" />
    ))}
  </div>
);

function ContentPlaceholder({ meta }: { meta: SidebarContentMeta }) {
  const { label, groupLabel, sections } = meta;

  return (
    <div className="w-full space-y-6">
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative p-4 lg:p-6">
        <div className="absolute top-0 end-0 w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardHeader className="space-y-6 relative z-10 pt-0 ps-0">
          <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-0 rounded-lg text-xs font-bold uppercase tracking-widest w-fit">
            {groupLabel}
          </Badge>
          <CardTitle className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">{label}</CardTitle>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            المحتوى التفصيلي قيد الإعداد وسيتكامل مع الواجهات قريباً. نحن نعمل على تطوير حلول ذكية ومبتكرة تليق بجودة أعمالكم.
          </p>
        </CardHeader>
        <CardContent className="space-y-10 relative z-10 ps-0 pe-0 pb-0">
          {sections && sections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {sections.map((section) => (
                <div key={section.title} className="bg-card p-6 rounded-2xl border border-border shadow-sm transition hover:shadow-md hover:bg-card/60 hover:-translate-y-1 duration-300">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-3 mb-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                    {section.title}
                  </h3>
                  <ul className="space-y-4 ps-1">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-muted-foreground font-semibold flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted group-hover:bg-blue-400 transition-colors" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center">
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6 text-2xl">⏳</div>
              <p className="text-xl font-bold text-muted-foreground/70 italic">لا توجد تفاصيل متاحة لهذا القسم حتى الآن. سيتم التحديث قريباً.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function RBACDashboard() {
  const showSkeleton = useMinLoadTime();
  const { logout, user } = useAuth();
  const { dir, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Populate sidebarContentMap for dynamic headers and placeholders
  useMemo(() => {
    adminSidebarConfig.forEach((item) => {
      const groupLabel = t(item.labelKey);
      item.children.forEach((child) => {
        const childLabel = t(child.labelKey);
        sidebarContentMap.set(child.route, {
          label: childLabel,
          groupLabel,
          sections: child.contentSections
        });
      });
    });
  }, [t]);

  useEffect(() => {
    const legacyRedirects: Record<string, string> = {
      "/rbac-dashboard": "/admin/overview/main-dashboard",
      "/admin": "/admin/overview/main-dashboard",
      "/admin/user-management": "/admin/users/all-users",
      "/admin/role-management": "/admin/roles/roles-list",
      "/admin/organization-management": "/admin/organizations/organizations-list"
    };

    const prefixRemaps: Array<[string, string]> = [
      ["/overview/", "/admin/overview/"],
      ["/admin/user-management/", "/admin/users/"],
      ["/admin/role-management/", "/admin/roles/"],
      ["/admin/organization-management/", "/admin/organizations/"],
      ["/revenue/", "/admin/revenue/"],
      ["/complaints/", "/admin/complaints/"],
      ["/integrations/", "/admin/integrations/"],
      ["/content/", "/admin/content/"],
      ["/features/", "/admin/features/"],
      ["/analytics/", "/admin/analytics/"],
      ["/billing/", "/admin/billing/"],
      ["/security/", "/admin/security/"],
      ["/notifications/", "/admin/notifications/"],
      ["/system/", "/admin/system/"]
    ];

    const directTarget = legacyRedirects[location];
    if (directTarget && location !== directTarget) {
      setLocation(directTarget, { replace: true });
      return;
    }

    for (const [legacyPrefix, newPrefix] of prefixRemaps) {
      if (location.startsWith(legacyPrefix)) {
        const remapped = location.replace(legacyPrefix, newPrefix);
        if (remapped !== location) {
          setLocation(remapped, { replace: true });
        }
        return;
      }
    }
  }, [location, setLocation]);

  /* State logic removed - handled by AdminLayout */

  const activeRoute =
    location === "/admin" || location === "/rbac-dashboard"
      ? "/admin/overview/main-dashboard"
      : location;

  const dashboard = useQuery({
    queryKey: ["/api/rbac-admin/dashboard"],
    queryFn: dashboardQuery,
    staleTime: 60_000
  });

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["/api/rbac-admin/dashboard"] });
  };

  const renderContent = () => {
    switch (activeRoute) {
      case "/admin/overview/main-dashboard":
      case "/admin/overview/general-statistics":
      case "/admin/overview/recent-activity":
        return (
          <OverviewDashboard
            data={dashboard.data}
            isLoading={dashboard.isLoading || dashboard.isFetching || showSkeleton}
            error={(dashboard.error as Error) ?? null}
          />
        );
      case "/admin/users":
      case "/admin/users/all-users":
      case "/admin/users/active-users":
      case "/admin/users/pending-users":
      case "/admin/users/user-roles":
      case "/admin/users/user-permissions":
        return <UserManagement />;
      case "/admin/roles":
      case "/admin/roles/roles-list":
      case "/admin/roles/create-role":
      case "/admin/roles/permissions":
      case "/admin/roles/assignments":
        return <RoleManagement />;
      case "/admin/organizations":
      case "/admin/organizations/organizations-list":
      case "/admin/organizations/create":
      case "/admin/organizations/types":
      case "/admin/organizations/settings":
        return <OrganizationManagement />;
      case "/admin/content/landing-pages":
        return <CMSLandingPage />;
      case "/admin/content/articles":
        return <ArticlesManagement />;
      case "/admin/content/media-library":
        return <MediaLibrary />;
      case "/admin/content/seo":
        return <SEOManagement />;
      case "/admin/content/templates":
        return <TemplatesManagement />;
      case "/admin/content/navigation":
        return <NavigationManagement />;
      case "/admin/revenue":
      case "/admin/revenue/overview":
      case "/admin/revenue/active-subscriptions":
      case "/admin/revenue/payment-methods":
      case "/admin/revenue/reports":
      case "/admin/revenue/subscription-plans":
        return <RevenueManagement />;
      case "/admin/complaints":
      case "/admin/complaints/all":
      case "/admin/complaints/open":
      case "/admin/complaints/resolved":
      case "/admin/complaints/categories":
      case "/admin/complaints/response-templates":
        return <ComplaintsManagement />;
      case "/admin/integrations":
      case "/admin/integrations/whatsapp":
      case "/admin/integrations/email":
      case "/admin/integrations/sms":
      case "/admin/integrations/api":
      case "/admin/integrations/social-media":
        return <IntegrationsManagement />;
      case "/admin/features":
      case "/admin/features/comparison":
      case "/admin/features/requests":
      case "/admin/features/pricing":
        return <FeaturesManagement />;
      case "/admin/analytics":
      case "/admin/analytics/users":
      case "/admin/analytics/revenue":
      case "/admin/analytics/listings":
      case "/admin/analytics/performance":
        return <AnalyticsManagement />;
      case "/admin/billing":
      case "/admin/billing/invoices":
      case "/admin/billing/subscriptions":
      case "/admin/billing/settings":
        return <BillingManagement />;
      case "/admin/security":
      case "/admin/security/access-control":
      case "/admin/security/audit-logs":
      case "/admin/security/authentication":
        return <SecurityManagement />;
      case "/admin/notifications":
      case "/admin/notifications/center":
      case "/admin/notifications/templates":
      case "/admin/notifications/logs":
        return <NotificationsManagement />;
      case "/admin/system":
      case "/admin/system/general":
      case "/admin/system/branding":
      case "/admin/system/integrations":
      case "/admin/system/advanced":
        return <SystemSettings />;
    }

    const fallbackMeta = sidebarContentMap.get(activeRoute);
    if (fallbackMeta) {
      return <ContentPlaceholder meta={fallbackMeta} />;
    }

    // Default fallback needed to prevent null returns if route doesn't match
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          المسار غير مدعوم: {activeRoute}
          <br />
          Current Location: {location}
        </AlertDescription>
      </Alert>
    );
  };

  const layoutMeta = sidebarContentMap.get(activeRoute);
  const layoutTitle = layoutMeta?.label || "لوحة إدارة النظام";
  const layoutSubtitle = layoutMeta?.groupLabel || "إدارة المستخدمين والمنظمات والمحتوى";

  return (
    <AdminLayout
      title={layoutTitle}
      subtitle={layoutSubtitle}
      isLoading={dashboard.isFetching}
      onRefresh={handleRefresh}
    >
      {renderContent()}
    </AdminLayout>
  );
}
