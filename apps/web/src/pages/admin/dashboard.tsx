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

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminSidebar, type SidebarItem } from "@/components/admin/layout/AdminSidebar";
import { adminSidebarConfig, type AdminSidebarContentSection } from "@/config/admin-sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { AlertCircle, Users } from "lucide-react";
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
  const res = await fetch("/api/rbac-admin/dashboard", { credentials: "include" });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'No error details');
    throw new Error(`فشل في تحميل لوحة التحكم (${res.status} ${res.statusText}): ${errorText}`);
  }
  const payload = (await res.json()) as DashboardMetricsResponse;
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
        <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4 text-xs">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 font-medium">{entry.name}:</span>
              <span className="text-slate-900 font-bold ml-auto">{
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
    <div className="space-y-8 animate-in-start">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="العملاء المحتملون"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          metric={metrics?.leads}
          loading={isLoading && !metrics}
        />
        <MetricCard
          title="الإعلانات المنشورة"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<div className="text-xl">🏠</div>}
          metric={metrics?.listings}
          loading={isLoading && !metrics}
        />
        <MetricCard
          title="الصفقات الرابحة"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<div className="text-xl">🏆</div>}
          metric={metrics?.dealsWon}
          loading={isLoading && !metrics}
        />
        <MetricCard
          title="قيمة المبيعات (GMV)"
          subtitle="أداء اليوم وآخر ٧ / ٣٠ يوم"
          icon={<div className="text-xl">💰</div>}
          metric={metrics?.gmv}
          currency={currency}
          loading={isLoading && !metrics}
        />
      </div>

      {/* Charts Section - NEW! */}
      {!isLoading && metrics && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="glass border-0 rounded-[2rem] overflow-hidden p-2 transition-all hover:shadow-2xl">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">نشاط المبيعات</CardTitle>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">العملاء المحتملون، الإعلانات، والصفقات</p>
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
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 rounded-[2rem] overflow-hidden p-2 transition-all hover:shadow-2xl">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">الإيرادات المالية</CardTitle>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">قيمة المبيعات، الفواتير، والتحصيلات</p>
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
                    <Line type="monotone" dataKey="gmv" stroke="#10b981" strokeWidth={4} name="قيمة المبيعات" dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="invoices" stroke="#3b82f6" strokeWidth={4} name="الفواتير" dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="cash" stroke="#f59e0b" strokeWidth={4} name="التحصيلات" dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="glass border-0 rounded-[2rem] xl:col-span-2 overflow-hidden transition-all hover:shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">أفضل الوكلاء</CardTitle>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">النشاط خلال آخر ٩٠ يومًا</p>
          </CardHeader>
          <CardContent className="p-8 pt-2 space-y-4">
            {isLoading && <LoadingRows rows={4} />}
            {!isLoading && (!data?.topAgents || data.topAgents.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="rounded-2xl bg-white p-4 shadow-sm text-3xl">👥</div>
                <div>
                  <p className="text-base font-bold text-slate-800">لا يوجد وكلاء نشطين</p>
                  <p className="text-sm text-slate-500 mt-1">لم يتم تسجيل أي نشاط للوكلاء في الفترة المحددة</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.topAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex flex-col p-5 rounded-2xl bg-white/50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        {agent.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 leading-none mb-1">{agent.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{agent.email || "بدون بريد"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter">الصفقات</span>
                        <span className="text-xs font-black text-slate-900">{agent.dealsWon}</span>
                      </div>
                      <div className="flex flex-col text-end">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter">القيمة الإجمالية</span>
                        <span className="text-xs font-black text-blue-600">{formatCurrency(agent.gmv, currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-0 rounded-[2rem] overflow-hidden transition-all hover:shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">التذاكر الحديثة</CardTitle>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">آخر التحديثات</p>
          </CardHeader>
          <CardContent className="p-8 pt-2 space-y-4">
            {isLoading && <LoadingRows rows={5} />}
            {!isLoading && (!data?.recentTickets || data.recentTickets.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="rounded-2xl bg-white p-4 shadow-sm text-3xl">🎫</div>
                <div>
                  <p className="text-base font-bold text-slate-800">لا توجد تذاكر</p>
                  <p className="text-sm text-slate-500 mt-1">جميع التذاكر تمت معالجتها</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col p-4 rounded-xl bg-white/50 border border-slate-100 hover:bg-white hover:border-blue-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">{ticket.subject}</p>
                      <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-0 shrink-0", ticketStatusColor(ticket.status))}>
                        {ticketStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-500">{ticket.customerName || "عميل"}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(ticket.updatedAt).toLocaleDateString("ar-SA")}</span>
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
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
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
      return "bg-emerald-50 text-emerald-700";
    case "MEDIUM":
      return "bg-sky-50 text-sky-700";
    case "HIGH":
      return "bg-amber-50 text-amber-700";
    case "URGENT":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const LoadingRows = ({ rows }: { rows: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
    ))}
  </div>
);

function ContentPlaceholder({ meta }: { meta: SidebarContentMeta }) {
  const { label, groupLabel, sections } = meta;

  return (
    <div className="space-y-8 animate-in-start">
      <Card className="glass border-0 rounded-[2.5rem] overflow-hidden relative p-4 lg:p-12">
        <div className="absolute top-0 end-0 w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardHeader className="space-y-6 relative z-10 pt-0 ps-0">
          <Badge variant="secondary" className="px-3 py-1 bg-blue-600/10 text-blue-700 border-0 rounded-lg text-[10px] font-bold uppercase tracking-widest w-fit">
            {groupLabel}
          </Badge>
          <CardTitle className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">{label}</CardTitle>
          <p className="text-lg lg:text-xl text-slate-500 max-w-2xl leading-relaxed">
            المحتوى التفصيلي قيد الإعداد وسيتكامل مع الواجهات قريباً. نحن نعمل على تطوير حلول ذكية ومبتكرة تليق بجودة أعمالكم.
          </p>
        </CardHeader>
        <CardContent className="space-y-10 relative z-10 ps-0 pe-0 pb-0">
          {sections && sections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {sections.map((section) => (
                <div key={section.title} className="bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border border-white/40 shadow-sm transition hover:shadow-xl hover:bg-white/60 hover:-translate-y-1 duration-300">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 mb-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                    {section.title}
                  </h3>
                  <ul className="space-y-4 ps-1">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-slate-600 font-semibold flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200/50 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-2xl">⏳</div>
              <p className="text-xl font-bold text-slate-400 italic">لا توجد تفاصيل متاحة لهذا القسم حتى الآن. سيتم التحديث قريباً.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function RBACDashboard() {
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
    queryKey: ["rbac-admin", "dashboard"],
    queryFn: dashboardQuery,
    staleTime: 60_000
  });

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["rbac-admin", "dashboard"] });
  };

  const renderContent = () => {
    switch (activeRoute) {
      case "/admin/overview/main-dashboard":
      case "/admin/overview/general-statistics":
      case "/admin/overview/recent-activity":
        return (
          <OverviewDashboard
            data={dashboard.data}
            isLoading={dashboard.isLoading || dashboard.isFetching}
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
        <AlertDescription>المسار غير مدعوم: {activeRoute}</AlertDescription>
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
