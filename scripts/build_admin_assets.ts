import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { adminSidebarConfig } from "../apps/web/src/config/admin-sidebar";

type Status = "live" | "mocked" | "stub";

type RouteMeta = {
  status: Status;
  purpose: string;
  widgets: string[];
  apis: string[];
  db: string[];
  rbac: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LABELS_AR: Record<string, string> = {
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

const toEnglish = (labelKey?: string): string => {
  if (!labelKey) return "";
  const suffix = labelKey.split(".").pop() ?? labelKey;
  return suffix
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const routeMeta: Record<string, RouteMeta> = {
  "/admin/overview/main-dashboard": {
    status: "live",
    purpose:
      "[Live] Executive overview for platform KPIs (users, organizations, health) with recent activity context.",
    widgets: ["Metric summary cards", "Recent activity list", "Manual refresh"],
    apis: ["GET /api/rbac-admin/stats", "GET /api/rbac-admin/activities"],
    db: ["users", "organizations", "audit_logs"],
    rbac: ["WEBSITE_ADMIN"]
  },
  "/admin/overview/general-statistics": {
    status: "live",
    purpose:
      "[Live] Trend analytics for adoption and revenue; should add time slicing beyond current stat snapshot.",
    widgets: ["Trend charts", "Segment filters", "Export CSV"],
    apis: [
      "GET /api/rbac-admin/stats?granularity=monthly (proposed)",
      "GET /api/rbac-admin/activities?type=aggregated (proposed)"
    ],
    db: ["users", "organizations", "transactions_summary"],
    rbac: ["WEBSITE_ADMIN", "DATA_ANALYST"]
  },
  "/admin/overview/recent-activity": {
    status: "live",
    purpose:
      "[Live] Audit timeline of recent administrative actions for compliance monitoring.",
    widgets: ["Activity feed", "Action type filters", "Export JSON"],
    apis: ["GET /api/rbac-admin/activities"],
    db: ["audit_logs", "users"],
    rbac: ["WEBSITE_ADMIN", "SECURITY_ADMIN"]
  },
  "/admin/users/all-users": {
    status: "mocked",
    purpose:
      "[Mocked] Manage full user directory; current UI uses static seed data and must integrate with admin APIs.",
    widgets: ["Status KPI cards", "Search & filters", "User data table", "Edit dialog"],
    apis: [
      "GET /api/rbac-admin/users",
      "POST /api/rbac-admin/users",
      "PUT /api/rbac-admin/users/:id",
      "DELETE /api/rbac-admin/users/:id"
    ],
    db: ["users", "organizations", "audit_logs"],
    rbac: ["WEBSITE_ADMIN"]
  },
  "/admin/users/active-users": {
    status: "mocked",
    purpose:
      "[Mocked] Focused roster of active accounts with session monitoring; UI duplicates all-users view.",
    widgets: ["Active count card", "Real-time status badges", "Filter chips"],
    apis: ["GET /api/rbac-admin/users?status=active", "GET /api/rbac-admin/users/online (proposed)"],
    db: ["users", "sessions", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "SUPPORT_ADMIN"]
  },
  "/admin/users/pending-users": {
    status: "mocked",
    purpose:
      "[Mocked] Approval queue for onboarding (KYC); needs wiring to approval endpoints.",
    widgets: ["Pending list table", "Document status indicators", "Bulk approve/reject dialog"],
    apis: [
      "GET /api/rbac-admin/users?status=pending",
      "POST /api/rbac-admin/users/:userId/approve",
      "POST /api/rbac-admin/users/:userId/reject",
      "POST /api/rbac-admin/users/:userId/request-info"
    ],
    db: ["users", "kyc_documents", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "COMPLIANCE_ADMIN"]
  },
  "/admin/users/user-roles": {
    status: "mocked",
    purpose:
      "[Mocked] Matrix of roles per user; currently static, should leverage role endpoints and inline editing.",
    widgets: ["Role summary cards", "Role assignment table", "Role filter tabs"],
    apis: ["GET /api/rbac-admin/users?includeRoles=true", "PUT /api/rbac-admin/users/:id (roles)"],
    db: ["users", "user_roles", "roles"],
    rbac: ["WEBSITE_ADMIN", "RBAC_ADMIN"]
  },
  "/admin/users/user-permissions": {
    status: "mocked",
    purpose:
      "[Mocked] Fine-grained permission inspector; requires dedicated permission schema.",
    widgets: ["Permission category list", "Toggle matrix", "Audit trail panel"],
    apis: [
      "GET /api/rbac-admin/roles",
      "GET /api/rbac-admin/permissions (proposed)",
      "PUT /api/rbac-admin/users/:id/permissions (proposed)"
    ],
    db: ["permissions", "role_permissions", "user_permissions", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "RBAC_ADMIN"]
  },
  "/admin/roles/roles-list": {
    status: "mocked",
    purpose:
      "[Mocked] Catalog existing roles with counts; UI uses mock arrays and lacks API integration.",
    widgets: ["Role KPI cards", "Role list table", "Detail drawer"],
    apis: ["GET /api/rbac-admin/roles", "GET /api/rbac-admin/users?role=...", "DELETE /api/rbac-admin/roles/:id (proposed)"],
    db: ["roles", "role_permissions", "users"],
    rbac: ["WEBSITE_ADMIN", "RBAC_ADMIN"]
  },
  "/admin/roles/create-role": {
    status: "mocked",
    purpose:
      "[Mocked] Wizard to add custom roles; needs backend support for creation and validation.",
    widgets: ["Role builder dialog", "Permission checklist", "Review step"],
    apis: [
      "POST /api/rbac-admin/roles (proposed)",
      "GET /api/rbac-admin/permissions (proposed)"
    ],
    db: ["roles", "role_permissions", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "RBAC_ADMIN"]
  },
  "/admin/roles/permissions": {
    status: "mocked",
    purpose:
      "[Mocked] Central permission matrix across modules; currently informational only.",
    widgets: ["Module grid", "Permission filters", "Export CSV"],
    apis: ["GET /api/rbac-admin/permissions (proposed)", "PUT /api/rbac-admin/roles/:id/permissions (proposed)"],
    db: ["permissions", "role_permissions"],
    rbac: ["WEBSITE_ADMIN", "RBAC_ADMIN"]
  },
  "/admin/roles/assignments": {
    status: "mocked",
    purpose:
      "[Mocked] Bulk assignment dashboard to map users to roles.",
    widgets: ["Assignment table", "Bulk assign dialog", "History timeline"],
    apis: ["GET /api/rbac-admin/users?includeRoles=true", "POST /api/rbac-admin/roles/:id/assign (proposed)"],
    db: ["user_roles", "roles", "users", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "RBAC_ADMIN"]
  },
  "/admin/organizations/organizations-list": {
    status: "mocked",
    purpose:
      "[Mocked] Directory of partner organizations; UI seeded with mock data.",
    widgets: ["Organization summary cards", "Filter controls", "Organization table"],
    apis: ["GET /api/rbac-admin/organizations"],
    db: ["organizations", "subscriptions", "users"],
    rbac: ["WEBSITE_ADMIN", "PARTNERSHIPS_ADMIN"]
  },
  "/admin/organizations/create": {
    status: "mocked",
    purpose:
      "[Mocked] Intake form to onboard new organizations; lacks API wiring.",
    widgets: ["Organization create dialog", "Validation alerts", "Plan selector"],
    apis: ["POST /api/rbac-admin/organizations", "POST /api/rbac-admin/subscriptions (proposed)"],
    db: ["organizations", "subscriptions", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "PARTNERSHIPS_ADMIN"]
  },
  "/admin/organizations/types": {
    status: "mocked",
    purpose:
      "[Mocked] Taxonomy management for organization classifications.",
    widgets: ["Type list", "Edit modal", "Usage count badges"],
    apis: ["GET /api/rbac-admin/organization-types (proposed)", "POST /api/rbac-admin/organization-types (proposed)"],
    db: ["organization_types", "organizations"],
    rbac: ["WEBSITE_ADMIN", "PARTNERSHIPS_ADMIN"]
  },
  "/admin/organizations/settings": {
    status: "mocked",
    purpose:
      "[Mocked] Administer per-organization feature flags and billing settings.",
    widgets: ["Settings tabs", "Toggle switches", "Audit log feed"],
    apis: ["GET /api/rbac-admin/organizations/:id/settings (proposed)", "PUT /api/rbac-admin/organizations/:id/settings (proposed)"],
    db: ["organization_settings", "feature_flags", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "PARTNERSHIPS_ADMIN"]
  },
  "/admin/revenue/overview": {
    status: "stub",
    purpose:
      "[Stub] Revenue dashboard summarizing ARR/MRR, churn, channel performance.",
    widgets: ["Revenue KPI cards", "Trend charts", "Plan mix donut"],
    apis: ["GET /api/revenue/summary (proposed)", "GET /api/revenue/trends (proposed)"],
    db: ["subscriptions", "payments", "invoices"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN"]
  },
  "/admin/revenue/active-subscriptions": {
    status: "stub",
    purpose:
      "[Stub] Monitor active subscription roster with renewal health.",
    widgets: ["Subscription table", "Renewal reminders", "Filter chips"],
    apis: ["GET /api/revenue/subscriptions (proposed)", "PATCH /api/revenue/subscriptions/:id (proposed)"],
    db: ["subscriptions", "organizations", "plans"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN"]
  },
  "/admin/revenue/payment-methods": {
    status: "stub",
    purpose:
      "[Stub] Manage allowed payment gateways and tokens.",
    widgets: ["Gateway cards", "Credential status badges", "Edit modal"],
    apis: ["GET /api/revenue/payment-providers (proposed)", "POST /api/revenue/payment-providers (proposed)"],
    db: ["payment_providers", "organization_payment_methods"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN"]
  },
  "/admin/revenue/reports": {
    status: "stub",
    purpose:
      "[Stub] Generate exportable finance reports (revenue, AR aging).",
    widgets: ["Report builder", "Schedule panel", "Export queue"],
    apis: ["POST /api/revenue/reports (proposed)", "GET /api/revenue/reports/:id (proposed)"],
    db: ["financial_reports", "invoices", "payments"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN", "ACCOUNTANT"]
  },
  "/admin/revenue/subscription-plans": {
    status: "stub",
    purpose:
      "[Stub] Configure pricing plans and feature bundles.",
    widgets: ["Plan comparison table", "Plan editor", "Change log"],
    apis: ["GET /api/revenue/plans (proposed)", "POST /api/revenue/plans (proposed)", "PUT /api/revenue/plans/:id (proposed)"],
    db: ["plans", "plan_features", "feature_flags"],
    rbac: ["WEBSITE_ADMIN", "PRODUCT_MANAGER"]
  },
  "/admin/complaints/all": {
    status: "stub",
    purpose:
      "[Stub] Master queue of customer complaints and internal escalations.",
    widgets: ["Complaint table", "Priority badges", "Assignment controls"],
    apis: ["GET /api/complaints (proposed)", "PUT /api/complaints/:id (proposed)"],
    db: ["complaints", "complaint_assignments", "users"],
    rbac: ["WEBSITE_ADMIN", "SUPPORT_ADMIN"]
  },
  "/admin/complaints/open": {
    status: "stub",
    purpose:
      "[Stub] Focus on unresolved complaints with SLA tracking.",
    widgets: ["Kanban board", "SLA timer", "Escalation buttons"],
    apis: ["GET /api/complaints?status=open (proposed)", "POST /api/complaints/:id/escalate (proposed)"],
    db: ["complaints", "complaint_escalations", "users"],
    rbac: ["WEBSITE_ADMIN", "SUPPORT_ADMIN"]
  },
  "/admin/complaints/resolved": {
    status: "stub",
    purpose:
      "[Stub] Archive of resolved cases with satisfaction insights.",
    widgets: ["Resolved list", "Survey scores chart", "Reopen action"],
    apis: ["GET /api/complaints?status=resolved (proposed)", "POST /api/complaints/:id/reopen (proposed)"],
    db: ["complaints", "resolution_surveys"],
    rbac: ["WEBSITE_ADMIN", "SUPPORT_ADMIN"]
  },
  "/admin/complaints/categories": {
    status: "stub",
    purpose:
      "[Stub] Taxonomy management for complaint routing.",
    widgets: ["Category tree", "Routing rule editor", "Usage counts"],
    apis: ["GET /api/complaints/categories (proposed)", "POST /api/complaints/categories (proposed)"],
    db: ["complaint_categories", "complaints"],
    rbac: ["WEBSITE_ADMIN", "SUPPORT_ADMIN"]
  },
  "/admin/complaints/response-templates": {
    status: "stub",
    purpose:
      "[Stub] Library of SLA-compliant response templates.",
    widgets: ["Template list", "Rich text editor", "Version history"],
    apis: ["GET /api/complaints/templates (proposed)", "POST /api/complaints/templates (proposed)"],
    db: ["response_templates", "template_versions"],
    rbac: ["WEBSITE_ADMIN", "SUPPORT_ADMIN", "CONTENT_EDITOR"]
  },
  "/admin/integrations/whatsapp": {
    status: "stub",
    purpose:
      "[Stub] Configure WhatsApp Business API credentials and templates.",
    widgets: ["Credential card", "Template gallery", "Webhook status"],
    apis: ["GET /api/integrations/whatsapp (proposed)", "POST /api/integrations/whatsapp (proposed)"],
    db: ["integration_credentials", "message_templates", "webhook_events"],
    rbac: ["WEBSITE_ADMIN", "INTEGRATIONS_ADMIN"]
  },
  "/admin/integrations/email": {
    status: "stub",
    purpose:
      "[Stub] Manage SMTP providers, domains, and deliverability tracking.",
    widgets: ["Provider list", "Verified domain table", "Deliverability chart"],
    apis: ["GET /api/integrations/email (proposed)", "POST /api/integrations/email (proposed)"],
    db: ["integration_credentials", "email_domains", "deliverability_metrics"],
    rbac: ["WEBSITE_ADMIN", "INTEGRATIONS_ADMIN"]
  },
  "/admin/integrations/sms": {
    status: "stub",
    purpose:
      "[Stub] Configure SMS providers, cost tracking, and templates.",
    widgets: ["Provider cards", "Usage chart", "Template list"],
    apis: ["GET /api/integrations/sms (proposed)", "POST /api/integrations/sms (proposed)"],
    db: ["integration_credentials", "sms_usage", "message_templates"],
    rbac: ["WEBSITE_ADMIN", "INTEGRATIONS_ADMIN"]
  },
  "/admin/integrations/social-media": {
    status: "stub",
    purpose:
      "[Stub] Link social accounts for lead generation and posting.",
    widgets: ["Account connection list", "Content scheduler", "Engagement chart"],
    apis: ["GET /api/integrations/social (proposed)", "POST /api/integrations/social/connect (proposed)"],
    db: ["integration_credentials", "scheduled_posts", "engagement_metrics"],
    rbac: ["WEBSITE_ADMIN", "MARKETING_ADMIN"]
  },
  "/admin/integrations/api": {
    status: "stub",
    purpose:
      "[Stub] Manage API keys, rate limits, and webhook sinks for partners.",
    widgets: ["API key table", "Rate limit editor", "Webhook test console"],
    apis: ["GET /api/integrations/api-keys (proposed)", "POST /api/integrations/api-keys (proposed)", "GET /api/integrations/webhooks (proposed)"],
    db: ["api_keys", "api_usage", "webhooks"],
    rbac: ["WEBSITE_ADMIN", "INTEGRATIONS_ADMIN"]
  },
  "/admin/content/landing-pages": {
    status: "live",
    purpose:
      "[Live] Drag-and-drop CMS for the public landing page with draft/publish workflow.",
    widgets: ["Section list with drag reorder", "Section editor form", "Card editor modal"],
    apis: [
      "GET /api/cms/landing/sections",
      "PUT /api/cms/landing/sections/:id",
      "POST /api/cms/landing/cards",
      "PUT /api/cms/landing/cards/:id",
      "POST /api/cms/landing/sections/reorder"
    ],
    db: ["landingSection", "landingCard", "landingVersion", "landingAuditLog"],
    rbac: ["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]
  },
  "/admin/content/articles": {
    status: "stub",
    purpose:
      "[Stub] Editorial workspace for knowledge center/blog articles.",
    widgets: ["Article list", "Rich text editor", "Publication workflow"],
    apis: ["GET /api/cms/articles (proposed)", "POST /api/cms/articles (proposed)", "PUT /api/cms/articles/:id (proposed)"],
    db: ["cms_articles", "cms_article_versions", "mediaLibrary"],
    rbac: ["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]
  },
  "/admin/content/media-library": {
    status: "stub",
    purpose:
      "[Stub] Asset manager for images, videos, and documents.",
    widgets: ["Media grid", "Metadata panel", "Bulk upload"],
    apis: ["GET /api/cms/media (proposed)", "POST /api/cms/media (proposed)", "DELETE /api/cms/media/:id (proposed)"],
    db: ["mediaLibrary", "mediaUsage"],
    rbac: ["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]
  },
  "/admin/content/seo": {
    status: "stub",
    purpose:
      "[Stub] SEO settings for landing pages, sitemaps, and metadata.",
    widgets: ["SEO checklist", "Preview cards", "Sitemap generation button"],
    apis: ["GET /api/cms/seo (proposed)", "PUT /api/cms/seo (proposed)"],
    db: ["seo_settings", "landingSection"],
    rbac: ["WEBSITE_ADMIN", "CMS_ADMIN"]
  },
  "/admin/content/templates": {
    status: "stub",
    purpose:
      "[Stub] Manage reusable content templates across channels.",
    widgets: ["Template catalog", "Version history", "Clone action"],
    apis: ["GET /api/cms/templates (proposed)", "POST /api/cms/templates (proposed)"],
    db: ["content_templates", "template_versions"],
    rbac: ["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]
  },
  "/admin/features/comparison": {
    status: "stub",
    purpose:
      "[Stub] Comparison matrix for plan features vs competitors.",
    widgets: ["Feature comparison table", "Toggle competitor columns", "Notes drawer"],
    apis: ["GET /api/features/comparison (proposed)"],
    db: ["feature_matrix", "competitor_benchmarks"],
    rbac: ["WEBSITE_ADMIN", "PRODUCT_MANAGER"]
  },
  "/admin/features/pricing": {
    status: "stub",
    purpose:
      "[Stub] Manage pricing experiments and plan positioning.",
    widgets: ["Pricing tier cards", "AB test config", "Rollout slider"],
    apis: ["GET /api/features/pricing (proposed)", "POST /api/features/pricing-experiments (proposed)"],
    db: ["plans", "pricing_experiments", "feature_flags"],
    rbac: ["WEBSITE_ADMIN", "PRODUCT_MANAGER"]
  },
  "/admin/features/corporate": {
    status: "stub",
    purpose:
      "[Stub] Configure enterprise-only capabilities and SLAs.",
    widgets: ["Feature toggle list", "SLA form", "Usage metrics"],
    apis: ["GET /api/features/corporate (proposed)", "PUT /api/features/corporate (proposed)"],
    db: ["feature_flags", "enterprise_settings"],
    rbac: ["WEBSITE_ADMIN", "PRODUCT_MANAGER", "PARTNERSHIPS_ADMIN"]
  },
  "/admin/features/individual": {
    status: "stub",
    purpose:
      "[Stub] Calibrate individual agent plan entitlements.",
    widgets: ["Feature list", "Usage caps editor", "Upgrade prompts"],
    apis: ["GET /api/features/individual (proposed)", "PUT /api/features/individual (proposed)"],
    db: ["feature_flags", "usage_limits"],
    rbac: ["WEBSITE_ADMIN", "PRODUCT_MANAGER"]
  },
  "/admin/features/requests": {
    status: "stub",
    purpose:
      "[Stub] Backlog of feature requests with voting and prioritization.",
    widgets: ["Request board", "Vote tally", "Roadmap lane"],
    apis: ["GET /api/features/requests (proposed)", "POST /api/features/requests/:id/status (proposed)"],
    db: ["feature_requests", "user_votes", "roadmap_items"],
    rbac: ["WEBSITE_ADMIN", "PRODUCT_MANAGER", "SUPPORT_ADMIN"]
  },
  "/admin/analytics/users": {
    status: "stub",
    purpose:
      "[Stub] Deep dive into user cohorts, retention, and funnels.",
    widgets: ["Cohort chart", "Funnel visualization", "Segment filters"],
    apis: ["GET /api/analytics/users (proposed)", "GET /api/analytics/funnels (proposed)"],
    db: ["analytics_user_cohorts", "events", "sessions"],
    rbac: ["WEBSITE_ADMIN", "DATA_ANALYST"]
  },
  "/admin/analytics/revenue": {
    status: "stub",
    purpose:
      "[Stub] Revenue analytics across plans, regions, and lifecycle.",
    widgets: ["Revenue trend chart", "Plan mix table", "Forecast widget"],
    apis: ["GET /api/analytics/revenue (proposed)", "GET /api/analytics/forecast (proposed)"],
    db: ["analytics_revenue_daily", "subscriptions", "payments"],
    rbac: ["WEBSITE_ADMIN", "DATA_ANALYST", "FINANCE_ADMIN"]
  },
  "/admin/analytics/usage": {
    status: "stub",
    purpose:
      "[Stub] Feature usage statistics to inform adoption and churn risk.",
    widgets: ["Usage heatmap", "Feature filters", "Time range selector"],
    apis: ["GET /api/analytics/usage (proposed)", "GET /api/analytics/feature-events (proposed)"],
    db: ["feature_usage_events", "sessions", "users"],
    rbac: ["WEBSITE_ADMIN", "DATA_ANALYST", "PRODUCT_MANAGER"]
  },
  "/admin/analytics/performance": {
    status: "stub",
    purpose:
      "[Stub] Monitor system performance (latency, uptime, error rates).",
    widgets: ["Latency chart", "Error rate gauges", "Region selector"],
    apis: ["GET /api/analytics/performance (proposed)", "GET /api/analytics/incidents (proposed)"],
    db: ["system_metrics", "incident_reports", "uptime_checks"],
    rbac: ["WEBSITE_ADMIN", "SYS_ADMIN", "SECURITY_ADMIN"]
  },
  "/admin/analytics/custom-reports": {
    status: "stub",
    purpose:
      "[Stub] Self-serve builder for exporting tailored analytics sets.",
    widgets: ["Drag/drop report builder", "Visualization picker", "Schedule form"],
    apis: ["POST /api/analytics/custom-reports (proposed)", "GET /api/analytics/custom-reports/:id (proposed)"],
    db: ["custom_reports", "report_schedules"],
    rbac: ["WEBSITE_ADMIN", "DATA_ANALYST"]
  },
  "/admin/billing/invoices": {
    status: "stub",
    purpose:
      "[Stub] Invoice ledger with status tracking and resend controls.",
    widgets: ["Invoice table", "Status filters", "Download PDF action"],
    apis: ["GET /api/billing/invoices (proposed)", "POST /api/billing/invoices/:id/send (proposed)"],
    db: ["invoices", "payments", "organizations"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN", "ACCOUNTANT"]
  },
  "/admin/billing/create-invoice": {
    status: "stub",
    purpose:
      "[Stub] Guided flow to create manual invoices and credits.",
    widgets: ["Invoice wizard", "Line item builder", "Tax calculator"],
    apis: ["POST /api/billing/invoices (proposed)", "GET /api/billing/tax-rates (proposed)"],
    db: ["invoices", "invoice_items", "tax_rates"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN", "ACCOUNTANT"]
  },
  "/admin/billing/payment-tracking": {
    status: "stub",
    purpose:
      "[Stub] Track incoming payments, reconciliation, and disputes.",
    widgets: ["Payment timeline", "Reconciliation checklist", "Dispute alerts"],
    apis: ["GET /api/billing/payments (proposed)", "POST /api/billing/payments/:id/reconcile (proposed)"],
    db: ["payments", "payment_reconciliation", "disputes"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN"]
  },
  "/admin/billing/payment-methods": {
    status: "stub",
    purpose:
      "[Stub] Catalog of stored payment instruments per organization.",
    widgets: ["Payment method list", "Verification status badges", "Remove button"],
    apis: ["GET /api/billing/payment-methods (proposed)", "DELETE /api/billing/payment-methods/:id (proposed)"],
    db: ["organization_payment_methods", "payment_providers"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN"]
  },
  "/admin/billing/settings": {
    status: "stub",
    purpose:
      "[Stub] Configure billing cycles, late fees, and dunning rules.",
    widgets: ["Settings form", "Preview schedule", "Audit log"],
    apis: ["GET /api/billing/settings (proposed)", "PUT /api/billing/settings (proposed)"],
    db: ["billing_settings", "dunning_rules", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "FINANCE_ADMIN"]
  },
  "/admin/security/access-control": {
    status: "stub",
    purpose:
      "[Stub] Policy dashboard for RBAC scopes and session controls.",
    widgets: ["Policy table", "Session limits editor", "Access review queue"],
    apis: ["GET /api/security/policies (proposed)", "PUT /api/security/policies (proposed)"],
    db: ["security_policies", "user_sessions", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "SECURITY_ADMIN"]
  },
  "/admin/security/logs": {
    status: "stub",
    purpose:
      "[Stub] Centralized security event log with filters and exports.",
    widgets: ["Log stream", "Severity filters", "Export button"],
    apis: ["GET /api/security/logs (proposed)", "GET /api/rbac-admin/activities?type=security (proposed)"],
    db: ["security_events", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "SECURITY_ADMIN"]
  },
  "/admin/security/two-factor": {
    status: "stub",
    purpose:
      "[Stub] Manage two-factor enforcement and recovery codes.",
    widgets: ["Policy toggles", "Enrollment table", "Reset codes modal"],
    apis: ["GET /api/security/mfa (proposed)", "POST /api/security/mfa/enroll (proposed)", "POST /api/security/mfa/reset (proposed)"],
    db: ["mfa_settings", "users", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "SECURITY_ADMIN"]
  },
  "/admin/security/password-policies": {
    status: "stub",
    purpose:
      "[Stub] Configure password complexity and rotation policies.",
    widgets: ["Policy form", "Compliance tracker", "Exception list"],
    apis: ["GET /api/security/password-policy (proposed)", "PUT /api/security/password-policy (proposed)"],
    db: ["security_policies", "users", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "SECURITY_ADMIN", "COMPLIANCE_ADMIN"]
  },
  "/admin/security/alerts": {
    status: "stub",
    purpose:
      "[Stub] Alerting rules for suspicious activity and incident response.",
    widgets: ["Alert rule list", "Notification channels", "Acknowledge workflow"],
    apis: ["GET /api/security/alerts (proposed)", "POST /api/security/alerts (proposed)", "POST /api/security/alerts/:id/acknowledge (proposed)"],
    db: ["security_alerts", "alert_channels", "incident_actions"],
    rbac: ["WEBSITE_ADMIN", "SECURITY_ADMIN"]
  },
  "/admin/notifications/center": {
    status: "stub",
    purpose:
      "[Stub] Unified inbox of system notifications with prioritization.",
    widgets: ["Notification feed", "Priority filters", "Bulk actions"],
    apis: ["GET /api/notifications (proposed)", "PUT /api/notifications/:id (proposed)"],
    db: ["notifications", "notification_preferences", "users"],
    rbac: ["WEBSITE_ADMIN", "COMMUNICATIONS_ADMIN"]
  },
  "/admin/notifications/email": {
    status: "stub",
    purpose:
      "[Stub] Configure and monitor outbound email campaigns and alerts.",
    widgets: ["Campaign list", "Delivery analytics", "Template picker"],
    apis: ["GET /api/notifications/email (proposed)", "POST /api/notifications/email/send (proposed)"],
    db: ["email_notifications", "message_templates", "deliverability_metrics"],
    rbac: ["WEBSITE_ADMIN", "COMMUNICATIONS_ADMIN", "MARKETING_ADMIN"]
  },
  "/admin/notifications/push": {
    status: "stub",
    purpose:
      "[Stub] Manage push notification topics and performance.",
    widgets: ["Topic manager", "Delivery chart", "Test push button"],
    apis: ["GET /api/notifications/push (proposed)", "POST /api/notifications/push/send (proposed)"],
    db: ["push_notifications", "notification_tokens"],
    rbac: ["WEBSITE_ADMIN", "COMMUNICATIONS_ADMIN"]
  },
  "/admin/notifications/templates": {
    status: "stub",
    purpose:
      "[Stub] Template governance for omni-channel messaging.",
    widgets: ["Template library", "Version diff viewer", "Approval workflow"],
    apis: ["GET /api/notifications/templates (proposed)", "POST /api/notifications/templates (proposed)"],
    db: ["notification_templates", "template_versions", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "COMMUNICATIONS_ADMIN", "CONTENT_EDITOR"]
  },
  "/admin/notifications/settings": {
    status: "stub",
    purpose:
      "[Stub] Fine-tune notification policies, quiet hours, and preferences.",
    widgets: ["Settings form", "Channel toggles", "Preview panel"],
    apis: ["GET /api/notifications/settings (proposed)", "PUT /api/notifications/settings (proposed)"],
    db: ["notification_settings", "notification_preferences"],
    rbac: ["WEBSITE_ADMIN", "COMMUNICATIONS_ADMIN"]
  },
  "/admin/system/general": {
    status: "stub",
    purpose:
      "[Stub] Global platform configuration (locale, branding, feature flags).",
    widgets: ["Settings tabs", "Feature toggle list", "Audit log"],
    apis: ["GET /api/system/settings (proposed)", "PUT /api/system/settings (proposed)"],
    db: ["system_settings", "feature_flags", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "SYS_ADMIN"]
  },
  "/admin/system/database": {
    status: "stub",
    purpose:
      "[Stub] Monitor database connectivity, migrations, and replicas.",
    widgets: ["Connection status cards", "Migration history table", "Query performance chart"],
    apis: ["GET /api/system/database/health (proposed)", "GET /api/system/database/migrations (proposed)"],
    db: ["database_migrations", "metrics_database", "backup_jobs"],
    rbac: ["WEBSITE_ADMIN", "SYS_ADMIN", "DATA_ENGINEER"]
  },
  "/admin/system/backup": {
    status: "stub",
    purpose:
      "[Stub] Schedule and monitor backups with restore workflow.",
    widgets: ["Backup schedule timeline", "Restore wizard", "Checksum status"],
    apis: ["GET /api/system/backups (proposed)", "POST /api/system/backups/run (proposed)", "POST /api/system/backups/restore (proposed)"],
    db: ["backup_jobs", "backup_artifacts", "restore_tickets"],
    rbac: ["WEBSITE_ADMIN", "SYS_ADMIN"]
  },
  "/admin/system/logs": {
    status: "stub",
    purpose:
      "[Stub] Aggregate system logs for troubleshooting.",
    widgets: ["Log stream", "Source filters", "Search bar"],
    apis: ["GET /api/system/logs (proposed)", "GET /api/system/logs/export (proposed)"],
    db: ["system_logs", "audit_logs"],
    rbac: ["WEBSITE_ADMIN", "SYS_ADMIN", "SECURITY_ADMIN"]
  },
  "/admin/system/maintenance": {
    status: "stub",
    purpose:
      "[Stub] Plan maintenance windows, cache purges, and update orchestration.",
    widgets: ["Maintenance calendar", "Task checklist", "Status banner editor"],
    apis: ["GET /api/system/maintenance (proposed)", "POST /api/system/maintenance (proposed)"],
    db: ["maintenance_windows", "system_tasks", "status_banners"],
    rbac: ["WEBSITE_ADMIN", "SYS_ADMIN"]
  }
};

const flattenStatusCounts = (): Record<Status, number> => {
  const counts: Record<Status, number> = { live: 0, mocked: 0, stub: 0 };
  Object.values(routeMeta).forEach((meta) => {
    counts[meta.status] += 1;
  });
  return counts;
};

const formatPurpose = (purpose: string): string => purpose;

const formatList = (list: string[]): string =>
  list.length ? list.join("; ") : "—";

const rows: string[] = [];
const groups = adminSidebarConfig.map((group) => {
  const groupLabelKey = group.labelKey ?? group.id;
  const groupLabelAr = LABELS_AR[groupLabelKey] ?? groupLabelKey;
  const groupLabelEn = toEnglish(groupLabelKey);

  const children = group.children.map((child) => {
    const meta = routeMeta[child.route];
    if (!meta) {
      throw new Error(`Missing meta for route ${child.route}`);
    }
    const childLabelKey = child.labelKey ?? child.id;
    const childLabelAr = LABELS_AR[childLabelKey] ?? childLabelKey;
    const childLabelEn = toEnglish(childLabelKey);
    const markdownPath = `[${child.route}](${child.route})`;
    rows.push(
      `| ${groupLabelEn} / ${groupLabelAr} | ${childLabelEn} / ${childLabelAr} | ${markdownPath} | ${formatPurpose(meta.purpose)} | ${formatList(meta.widgets)} | ${formatList(meta.apis)} | ${formatList(meta.db)} | ${formatList(meta.rbac)} |`
    );
    return {
      id: child.id,
      label: { en: childLabelEn, ar: childLabelAr },
      path: child.route,
      status: meta.status,
      purpose: meta.purpose,
      keyUiWidgets: meta.widgets,
      requiredApi: meta.apis,
      dbEntities: meta.db,
      rbac: meta.rbac
    };
  });

  return {
    id: group.id,
    label: { en: groupLabelEn, ar: groupLabelAr },
    children
  };
});

const statusCounts = flattenStatusCounts();
const generatedAt = new Date().toISOString();

const adminSurface = {
  generatedAt,
  totals: {
    groups: groups.length,
    pages: Object.keys(routeMeta).length,
    byStatus: statusCounts
  },
  groups
};

const tableHeader =
  "| Group | Subgroup | Path | Purpose | Key UI widgets | Required API endpoints | DB entities touched | RBAC |";
const markdown = [
  "# Admin Sitemap",
  "",
  `- Generated at: ${generatedAt}`,
  `- Total groups: ${groups.length}`,
  `- Total pages: ${Object.keys(routeMeta).length}`,
  `- Status mix → live: ${statusCounts.live}, mocked: ${statusCounts.mocked}, stub: ${statusCounts.stub}`,
  "",
  tableHeader,
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows
].join("\n");

writeFileSync(path.join(__dirname, "..", "admin_surface.json"), JSON.stringify(adminSurface, null, 2));
writeFileSync(path.join(__dirname, "..", "sitemap.md"), `${markdown}\n`);

console.log("Generated admin_surface.json and sitemap.md");
