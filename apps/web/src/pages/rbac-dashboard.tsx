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
import { AdminHeader } from "@/components/rbac/AdminHeader";
import { AdminSidebar, type SidebarItem } from "@/components/rbac/AdminSidebar";
import { adminSidebarConfig, type AdminSidebarContentSection } from "@/config/admin-sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import UserManagement from "@/pages/admin/user-management";
import RoleManagement from "@/pages/admin/role-management";
import OrganizationManagement from "@/pages/admin/organization-management";
import CMSLandingPage from "@/pages/cms-landing";
import ArticlesManagement from "@/pages/admin/articles-management";
import MediaLibrary from "@/pages/admin/media-library";
import SEOManagement from "@/pages/admin/seo-management";
import TemplatesManagement from "@/pages/admin/templates-management";
import NavigationManagement from "@/pages/admin/navigation-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
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

const LABELS: Record<string, string> = {
  "admin.sidebar.overview": "نظرة عامة",
  "admin.sidebar.overview.main_dashboard": "لوحة التحكم الرئيسية",
  "admin.sidebar.overview.general_statistics": "الإحصائيات العامة",
  "admin.sidebar.overview.recent_activity": "النشاط الأخير",
  "admin.sidebar.user_management": "إدارة المستخدمين",
  "admin.sidebar.user_management.all_users": "جميع المستخدمين",
  "admin.sidebar.user_management.active_users": "المستخدمون النشطون",
  "admin.sidebar.user_management.pending_users": "المستخدمون المعلقون",
  "admin.sidebar.user_management.user_roles": "أدوار المستخدمين",
  "admin.sidebar.user_management.user_permissions": "صلاحيات المستخدمين",
  "admin.sidebar.role_management": "إدارة الأدوار",
  "admin.sidebar.role_management.roles_list": "قائمة الأدوار",
  "admin.sidebar.role_management.create_role": "إنشاء دور جديد",
  "admin.sidebar.role_management.permissions_management": "إدارة الصلاحيات",
  "admin.sidebar.role_management.role_assignments": "تعيين الأدوار",
  "admin.sidebar.organization_management": "إدارة المنظمات",
  "admin.sidebar.organization_management.organizations_list": "قائمة المنظمات",
  "admin.sidebar.organization_management.create_organization": "إنشاء منظمة جديدة",
  "admin.sidebar.organization_management.organization_types": "أنواع المنظمات",
  "admin.sidebar.organization_management.organization_settings": "إعدادات المنظمات",
  "admin.sidebar.revenue": "الإيرادات والاشتراكات",
  "admin.sidebar.revenue.overview": "نظرة عامة على الإيرادات",
  "admin.sidebar.revenue.active_subscriptions": "الاشتراكات النشطة",
  "admin.sidebar.revenue.payment_methods": "طرق الدفع",
  "admin.sidebar.revenue.reports": "تقارير الإيرادات",
  "admin.sidebar.revenue.subscription_plans": "خطط الاشتراك",
  "admin.sidebar.complaints": "إدارة الشكاوى",
  "admin.sidebar.complaints.all_complaints": "جميع الشكاوى",
  "admin.sidebar.complaints.open_complaints": "الشكاوى المفتوحة",
  "admin.sidebar.complaints.resolved_complaints": "الشكاوى المحلولة",
  "admin.sidebar.complaints.categories": "فئات الشكاوى",
  "admin.sidebar.complaints.response_templates": "قوالب الردود",
  "admin.sidebar.integrations": "التكاملات",
  "admin.sidebar.integrations.whatsapp_settings": "إعدادات WhatsApp",
  "admin.sidebar.integrations.email_settings": "إعدادات البريد الإلكتروني",
  "admin.sidebar.integrations.sms_settings": "إعدادات الرسائل النصية",
  "admin.sidebar.integrations.social_media": "وسائل التواصل الاجتماعي",
  "admin.sidebar.integrations.api_integrations": "تكاملات API",
  "admin.sidebar.content_management": "إدارة المحتوى",
  "admin.sidebar.content_management.landing_pages": "صفحات الهبوط",
  "admin.sidebar.content_management.articles": "المقالات",
  "admin.sidebar.content_management.media_library": "مكتبة الوسائط",
  "admin.sidebar.content_management.seo_settings": "إعدادات SEO",
  "admin.sidebar.content_management.content_templates": "قوالب المحتوى",
  "admin.sidebar.features": "الميزات والخطط",
  "admin.sidebar.features.feature_comparison": "مقارنة الميزات",
  "admin.sidebar.features.pricing_plans": "خطط الأسعار",
  "admin.sidebar.features.corporate_features": "ميزات الشركات",
  "admin.sidebar.features.individual_features": "ميزات الأفراد",
  "admin.sidebar.features.feature_requests": "طلبات الميزات",
  "admin.sidebar.analytics": "التحليلات المتقدمة",
  "admin.sidebar.analytics.user_analytics": "تحليلات المستخدمين",
  "admin.sidebar.analytics.revenue_analytics": "تحليلات الإيرادات",
  "admin.sidebar.analytics.usage_statistics": "إحصائيات الاستخدام",
  "admin.sidebar.analytics.performance_metrics": "مقاييس الأداء",
  "admin.sidebar.analytics.custom_reports": "التقارير المخصصة",
  "admin.sidebar.billing": "الفواتير والمدفوعات",
  "admin.sidebar.billing.invoices_list": "قائمة الفواتير",
  "admin.sidebar.billing.create_invoice": "إنشاء فاتورة جديدة",
  "admin.sidebar.billing.payment_tracking": "تتبع المدفوعات",
  "admin.sidebar.billing.payment_methods": "طرق الدفع",
  "admin.sidebar.billing.billing_settings": "إعدادات الفواتير",
  "admin.sidebar.security": "الأمان",
  "admin.sidebar.security.access_control": "التحكم في الوصول",
  "admin.sidebar.security.security_logs": "سجلات الأمان",
  "admin.sidebar.security.two_factor": "المصادقة الثنائية",
  "admin.sidebar.security.password_policies": "سياسات كلمات المرور",
  "admin.sidebar.security.security_alerts": "تنبيهات الأمان",
  "admin.sidebar.notifications": "الإشعارات",
  "admin.sidebar.notifications.notification_center": "مركز الإشعارات",
  "admin.sidebar.notifications.email_notifications": "إشعارات البريد الإلكتروني",
  "admin.sidebar.notifications.push_notifications": "الإشعارات الفورية",
  "admin.sidebar.notifications.notification_templates": "قوالب الإشعارات",
  "admin.sidebar.notifications.notification_settings": "إعدادات الإشعارات",
  "admin.sidebar.system_settings": "إعدادات النظام",
  "admin.sidebar.system_settings.general_settings": "الإعدادات العامة",
  "admin.sidebar.system_settings.database_management": "إدارة قاعدة البيانات",
  "admin.sidebar.system_settings.backup_restore": "النسخ الاحتياطي والاستعادة",
  "admin.sidebar.system_settings.system_logs": "سجلات النظام",
  "admin.sidebar.system_settings.maintenance": "الصيانة"
};

const translate = (key: string) => LABELS[key] ?? key;

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
  if (!res.ok) throw new Error("فشل في تحميل لوحة التحكم");
  const payload = (await res.json()) as DashboardMetricsResponse;
  if (!payload.success) throw new Error("فشل في تحميل لوحة التحكم");
  return payload;
};

const sidebarContentMap = new Map<string, SidebarContentMeta>();

const sidebarItems: SidebarItem[] = adminSidebarConfig.map((item) => {
  const groupLabel = translate(item.labelKey);
  return {
    id: item.id,
    label: groupLabel,
    icon: item.icon,
    subPages: item.children.map((child) => {
      const childLabel = translate(child.labelKey);
      sidebarContentMap.set(child.route, {
        label: childLabel,
        groupLabel,
        sections: child.contentSections
      });
      return {
        id: child.id,
        label: childLabel,
        route: child.route
      };
    })
  };
});

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

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 shadow-sm transition hover:shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">العملاء المحتملون</CardTitle>
            <p className="text-xs text-slate-500">أداء اليوم وآخر ٧ / ٣٠ يوم</p>
          </CardHeader>
          <CardContent>
            {isLoading && !metrics ? (
              <LoadingRows rows={1} />
            ) : (
              <dl className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="space-y-1">
                  <dt className="text-slate-500">اليوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.leads.today)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٧ أيام</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.leads.last7Days)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٣٠ يوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.leads.last30Days)}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm transition hover:shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">الإعلانات المنشورة</CardTitle>
            <p className="text-xs text-slate-500">أداء اليوم وآخر ٧ / ٣٠ يوم</p>
          </CardHeader>
          <CardContent>
            {isLoading && !metrics ? (
              <LoadingRows rows={1} />
            ) : (
              <dl className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="space-y-1">
                  <dt className="text-slate-500">اليوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.listings.today)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٧ أيام</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.listings.last7Days)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٣٠ يوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.listings.last30Days)}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm transition hover:shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">الصفقات الرابحة</CardTitle>
            <p className="text-xs text-slate-500">أداء اليوم وآخر ٧ / ٣٠ يوم</p>
          </CardHeader>
          <CardContent>
            {isLoading && !metrics ? (
              <LoadingRows rows={1} />
            ) : (
              <dl className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="space-y-1">
                  <dt className="text-slate-500">اليوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.dealsWon.today)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٧ أيام</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.dealsWon.last7Days)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٣٠ يوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatNumber(metrics?.dealsWon.last30Days)}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm transition hover:shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">إجمالي قيمة المبيعات</CardTitle>
            <p className="text-xs text-slate-500">أداء اليوم وآخر ٧ / ٣٠ يوم</p>
          </CardHeader>
          <CardContent>
            {isLoading && !metrics ? (
              <LoadingRows rows={1} />
            ) : (
              <dl className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="space-y-1">
                  <dt className="text-slate-500">اليوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatCurrency(metrics?.gmv.today, currency)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٧ أيام</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatCurrency(metrics?.gmv.last7Days, currency)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">٣٠ يوم</dt>
                  <dd className="text-lg font-semibold text-slate-900">{formatCurrency(metrics?.gmv.last30Days, currency)}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - NEW! */}
      {!isLoading && metrics && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">نشاط المبيعات</CardTitle>
              <p className="text-sm text-slate-500">العملاء المحتملون، الإعلانات، والصفقات</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" fill="#3b82f6" name="العملاء المحتملون" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="listings" fill="#10b981" name="الإعلانات" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deals" fill="#8b5cf6" name="الصفقات" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">الإيرادات المالية</CardTitle>
              <p className="text-sm text-slate-500">قيمة المبيعات، الفواتير، والتحصيلات</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="gmv" stroke="#10b981" strokeWidth={2} name="قيمة المبيعات" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="invoices" stroke="#3b82f6" strokeWidth={2} name="الفواتير" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="cash" stroke="#f59e0b" strokeWidth={2} name="التحصيلات" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">أفضل الوكلاء (آخر 90 يوم)</CardTitle>
            <p className="text-sm text-slate-500">استنادًا إلى عدد الصفقات الرابحة وقيمتها</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <LoadingRows rows={4} />}
            {!isLoading && (!data?.topAgents || data.topAgents.length === 0) ? (
              <p className="text-sm text-slate-500">لا توجد بيانات كافية عن أداء الوكلاء.</p>
            ) : (
              data?.topAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                    <p className="text-xs text-slate-500">
                      {agent.dealsWon.toLocaleString("ar-SA")} صفقة • {formatCurrency(agent.gmv, currency)}
                    </p>
                  </div>
                  <div className="text-left text-xs text-slate-500">
                    {agent.email && <p>{agent.email}</p>}
                    {agent.phone && <p>{agent.phone}</p>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">التذاكر الحديثة</CardTitle>
            <p className="text-sm text-slate-500">آخر عشرة تحديثات ضمن نطاق صلاحياتك</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <LoadingRows rows={5} />}
            {!isLoading && (!data?.recentTickets || data.recentTickets.length === 0) ? (
              <p className="text-sm text-slate-500">لا توجد تذاكر حالياً.</p>
            ) : (
              data?.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="space-y-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{ticket.subject}</p>
                    <Badge variant="outline" className={cn("text-xs", ticketStatusColor(ticket.status))}>
                      {ticketStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{ticket.customerName ?? "-"}</span>
                    <span>{ticket.assignedTo ? `المسؤول: ${ticket.assignedTo}` : "غير معيّن"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <Badge variant="secondary" className={cn("text-xs", ticketPriorityColor(ticket.priority))}>
                      {ticketPriorityLabel(ticket.priority)}
                    </Badge>
                    <span>{new Date(ticket.updatedAt).toLocaleString("ar-SA")}</span>
                  </div>
                </div>
              ))
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

function MetricTripleCard({
  title,
  metric,
  currency,
  loading
}: {
  title: string;
  metric?: { today: number; last7Days: number; last30Days: number };
  currency?: string;
  loading?: boolean;
}) {
  return (
    <Card className="border border-slate-200 shadow-sm transition hover:shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        <p className="text-xs text-slate-500">أداء اليوم وآخر ٧ / ٣٠ يوم</p>
      </CardHeader>
      <CardContent>
        {loading && !metric ? (
          <LoadingRows rows={1} />
        ) : (
          <dl className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="space-y-1">
              <dt className="text-slate-500">اليوم</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {currency ? formatCurrency(metric?.today, currency) : formatNumber(metric?.today)}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-slate-500">آخر ٧ أيام</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {currency ? formatCurrency(metric?.last7Days, currency) : formatNumber(metric?.last7Days)}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-slate-500">آخر ٣٠ يومًا</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {currency ? formatCurrency(metric?.last30Days, currency) : formatNumber(metric?.last30Days)}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
function ContentPlaceholder({ meta }: { meta: SidebarContentMeta }) {
  const { label, groupLabel, sections } = meta;

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <Badge variant="secondary" className="self-start">
            {groupLabel}
          </Badge>
          <CardTitle className="text-base font-semibold text-slate-900">{label}</CardTitle>
          <p className="text-sm text-slate-500">المحتوى التفصيلي قيد الإعداد وسيتكامل مع الواجهات قريباً.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {sections && sections.length > 0 ? (
            sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
                <ul className="list-disc space-y-1 pr-5 text-sm text-slate-600 marker:text-slate-400">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">لا توجد تفاصيل متاحة لهذا القسم حتى الآن.</p>
          )}
          <p className="text-xs text-slate-400">هذا العرض يلخص مسؤوليات القسم لتتبع التنفيذ والربط مع المهام القادمة.</p>
        </CardContent>
      </Card>
    </div>
  );
}


export default function RBACDashboard() {
  const { logout, user } = useAuth();
  const { dir } = useLanguage();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

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

  const activeRoute =
    location === "/admin" || location === "/rbac-dashboard"
      ? "/admin/overview/main-dashboard"
      : location;

  const dashboard = useQuery({
    queryKey: ["rbac-admin", "dashboard"],
    queryFn: dashboardQuery,
    staleTime: 60_000
  });

  const activeItemId = useMemo(() => {
    const match = sidebarItems.find((item) => item.subPages?.some((child) => child.route === activeRoute));
    return match?.id ?? sidebarItems[0]?.id ?? "overview";
  }, [activeRoute]);

  const [expandedItems, setExpandedItems] = useState<string[]>(() => [sidebarItems[0]?.id ?? "overview"]);

  useEffect(() => {
    setExpandedItems((prev) => (prev.includes(activeItemId) ? prev : [...prev, activeItemId]));
  }, [activeItemId]);

  const handleToggleItem = (id: string) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleNavigate = (route: string) => {
    if (!route) return;
    setLocation(route);
  };

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
    }

    const fallbackMeta = sidebarContentMap.get(activeRoute);
    if (fallbackMeta) {
      return <ContentPlaceholder meta={fallbackMeta} />;
    }

    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>المسار غير مدعوم: {activeRoute}</AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50" dir={dir}>
      <AdminHeader
        title="لوحة إدارة النظام"
        subtitle="إدارة المستخدمين والمنظمات والمحتوى"
        onBack={() => setLocation("/home")}
        onLogout={() => {
          logout();
          setLocation("/home");
        }}
        onRefresh={handleRefresh}
        loading={dashboard.isFetching}
        userName={user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.username}
      />
      <div className="flex pt-20">
        <AdminSidebar
          dir={dir}
          items={sidebarItems}
          activeItem={activeItemId}
          expandedItems={expandedItems}
          onToggleItem={handleToggleItem}
          activeRoute={activeRoute}
          onSelectSubPage={handleNavigate}
        />
        <main className="flex-1 min-h-screen bg-slate-50">
          <div className="mx-auto w-full max-w-6xl px-6 py-8">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
