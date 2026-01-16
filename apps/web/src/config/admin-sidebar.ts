/**
 * admin-sidebar.ts - Admin Sidebar Configuration
 * 
 * Location: apps/web/src/ → Config/ → admin-sidebar.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin sidebar navigation configuration. Defines:
 * - Admin menu items and structure
 * - Navigation sections
 * - Icon mappings
 * - Role-based menu visibility
 * 
 * Related Files:
 * - apps/web/src/components/rbac/AdminSidebar.tsx - Admin sidebar component
 * - apps/web/src/config/platform-sidebar.ts - Platform sidebar configuration
 */

import {
  AlertCircle,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  Layers,
  LineChart,
  Plug,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminSidebarContentSection = {
  title: string;
  items: string[];
};

export type AdminSidebarChildConfig = {
  id: string;
  labelKey: string;
  route: string;
  contentSections?: AdminSidebarContentSection[];
};

export type AdminSidebarItemConfig = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  children: AdminSidebarChildConfig[];
};

export const adminSidebarConfig: AdminSidebarItemConfig[] = [
  {
    id: "overview",
    labelKey: "admin.sidebar.overview",
    icon: BarChart3,
    children: [
      {
        id: "overview-main-dashboard",
        labelKey: "admin.sidebar.overview.main_dashboard",
        route: "/admin/overview/main-dashboard",
        contentSections: [
          {
            title: "Dashboard Overview Cards",
            items: [
              "Total Users (Active/Inactive)",
              "Total Organizations",
              "Revenue Metrics",
              "System Health Status",
              "Recent Activity Feed",
              "Quick Actions Panel"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "user-management",
    labelKey: "admin.sidebar.user_management",
    icon: Users,
    children: [
      {
        id: "user-management-all-users",
        labelKey: "admin.sidebar.user_management.all_users",
        route: "/admin/users/all-users",
        contentSections: [
          {
            title: "User List Table",
            items: [
              "User ID, Name, Email, Phone",
              "Registration Date, Last Active",
              "Organization, Role, Status",
              "Actions: Edit, Deactivate, Delete"
            ]
          },
          {
            title: "Management Tools",
            items: ["Search & Filter Options", "Bulk Actions"]
          }
        ]
      },
      {
        id: "user-management-active-users",
        labelKey: "admin.sidebar.user_management.active_users",
        route: "/admin/users/active-users",
        contentSections: [
          {
            title: "Active User Dashboard",
            items: [
              "Online Users Counter",
              "Activity Heatmap",
              "Session Management",
              "Real-time Status",
              "Performance Metrics"
            ]
          }
        ]
      },
      {
        id: "user-management-pending-users",
        labelKey: "admin.sidebar.user_management.pending_users",
        route: "/admin/users/pending-users",
        contentSections: [
          {
            title: "Pending Approvals",
            items: [
              "KYC Verification Queue",
              "Document Review",
              "Approval Workflow",
              "Rejection Reasons",
              "Bulk Approval Actions"
            ]
          }
        ]
      },
      {
        id: "user-management-user-roles",
        labelKey: "admin.sidebar.user_management.user_roles",
        route: "/admin/users/user-roles",
        contentSections: [
          {
            title: "Role Management",
            items: [
              "Role Assignment Interface",
              "Role Hierarchy",
              "Permission Matrix",
              "Role Templates",
              "Custom Role Creation"
            ]
          }
        ]
      },
      {
        id: "user-management-user-permissions",
        labelKey: "admin.sidebar.user_management.user_permissions",
        route: "/admin/users/user-permissions",
        contentSections: [
          {
            title: "Permission Management",
            items: [
              "Granular Permissions",
              "Permission Groups",
              "Access Control Lists",
              "Permission Inheritance",
              "Audit Trail"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "role-management",
    labelKey: "admin.sidebar.role_management",
    icon: ShieldCheck,
    children: [
      {
        id: "role-management-roles-list",
        labelKey: "admin.sidebar.role_management.roles_list",
        route: "/admin/roles/roles-list",
        contentSections: [
          {
            title: "Role Directory",
            items: [
              "Predefined Roles",
              "Custom Roles",
              "Role Descriptions",
              "User Count per Role",
              "Role Status"
            ]
          }
        ]
      },
      {
        id: "role-management-create-role",
        labelKey: "admin.sidebar.role_management.create_role",
        route: "/admin/roles/create-role",
        contentSections: [
          {
            title: "Role Creation Wizard",
            items: [
              "Role Name & Description",
              "Permission Selection",
              "Role Hierarchy",
              "Inheritance Rules",
              "Validation"
            ]
          }
        ]
      },
      {
        id: "role-management-permissions",
        labelKey: "admin.sidebar.role_management.permissions_management",
        route: "/admin/roles/permissions",
        contentSections: [
          {
            title: "Permission Matrix",
            items: [
              "Module Permissions",
              "Action Permissions",
              "Resource Permissions",
              "Conditional Permissions",
              "Permission Testing"
            ]
          }
        ]
      },
      {
        id: "role-management-assignments",
        labelKey: "admin.sidebar.role_management.role_assignments",
        route: "/admin/roles/assignments",
        contentSections: [
          {
            title: "Assignment Interface",
            items: [
              "User-Role Mapping",
              "Bulk Assignments",
              "Temporary Roles",
              "Assignment History",
              "Conflict Resolution"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "organization-management",
    labelKey: "admin.sidebar.organization_management",
    icon: Building2,
    children: [
      {
        id: "organization-management-list",
        labelKey: "admin.sidebar.organization_management.organizations_list",
        route: "/admin/organizations/organizations-list",
        contentSections: [
          {
            title: "Organization Directory",
            items: [
              "Organization Details",
              "Member Count",
              "Subscription Status",
              "Performance Metrics",
              "Contact Information"
            ]
          }
        ]
      },
      {
        id: "organization-management-create",
        labelKey: "admin.sidebar.organization_management.create_organization",
        route: "/admin/organizations/create",
        contentSections: [
          {
            title: "Organization Setup",
            items: [
              "Basic Information",
              "Contact Details",
              "Subscription Plan",
              "Initial Admin Setup",
              "Verification Process"
            ]
          }
        ]
      },
      {
        id: "organization-management-types",
        labelKey: "admin.sidebar.organization_management.organization_types",
        route: "/admin/organizations/types",
        contentSections: [
          {
            title: "Type Management",
            items: [
              "Corporate Types",
              "Individual Types",
              "Government Types",
              "NGO Types",
              "Custom Types"
            ]
          }
        ]
      },
      {
        id: "organization-management-settings",
        labelKey: "admin.sidebar.organization_management.organization_settings",
        route: "/admin/organizations/settings",
        contentSections: [
          {
            title: "Settings Panel",
            items: [
              "General Settings",
              "Subscription Management",
              "Feature Access",
              "Billing Settings",
              "Security Settings"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "revenue",
    labelKey: "admin.sidebar.revenue",
    icon: CreditCard,
    children: [
      {
        id: "revenue-overview",
        labelKey: "admin.sidebar.revenue.overview",
        route: "/admin/revenue/overview",
        contentSections: [
          {
            title: "Revenue Dashboard",
            items: [
              "Total Revenue",
              "Monthly Trends",
              "Revenue by Plan",
              "Payment Methods",
              "Geographic Revenue"
            ]
          }
        ]
      },
      {
        id: "revenue-active-subscriptions",
        labelKey: "admin.sidebar.revenue.active_subscriptions",
        route: "/admin/revenue/active-subscriptions",
        contentSections: [
          {
            title: "Subscription Management",
            items: [
              "Active Subscriptions List",
              "Renewal Dates",
              "Payment Status",
              "Usage Tracking",
              "Upgrade/Downgrade Options"
            ]
          }
        ]
      },
      {
        id: "revenue-payment-methods",
        labelKey: "admin.sidebar.revenue.payment_methods",
        route: "/admin/revenue/payment-methods",
        contentSections: [
          {
            title: "Payment Configuration",
            items: [
              "Supported Methods",
              "Gateway Settings",
              "Currency Options",
              "Tax Configuration",
              "Refund Policies"
            ]
          }
        ]
      },
      {
        id: "revenue-reports",
        labelKey: "admin.sidebar.revenue.reports",
        route: "/admin/revenue/reports",
        contentSections: [
          {
            title: "Reporting Tools",
            items: [
              "Financial Reports",
              "Revenue Analytics",
              "Export Options",
              "Scheduled Reports",
              "Custom Reports"
            ]
          }
        ]
      },
      {
        id: "revenue-plans",
        labelKey: "admin.sidebar.revenue.subscription_plans",
        route: "/admin/revenue/subscription-plans",
        contentSections: [
          {
            title: "Plan Management",
            items: [
              "Plan Creation",
              "Pricing Tiers",
              "Feature Comparison",
              "Plan Migration",
              "Promotional Pricing"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "complaints",
    labelKey: "admin.sidebar.complaints",
    icon: AlertCircle,
    children: [
      {
        id: "complaints-all",
        labelKey: "admin.sidebar.complaints.all_complaints",
        route: "/admin/complaints/all",
        contentSections: [
          {
            title: "Complaint Management",
            items: [
              "Complaint List",
              "Status Tracking",
              "Priority Levels",
              "Assignment System",
              "Resolution Timeline"
            ]
          }
        ]
      },
      {
        id: "complaints-open",
        labelKey: "admin.sidebar.complaints.open_complaints",
        route: "/admin/complaints/open",
        contentSections: [
          {
            title: "Open Issues Dashboard",
            items: [
              "Urgent Complaints",
              "Escalation Rules",
              "Response Time Tracking",
              "Workload Distribution",
              "SLA Monitoring"
            ]
          }
        ]
      },
      {
        id: "complaints-resolved",
        labelKey: "admin.sidebar.complaints.resolved_complaints",
        route: "/admin/complaints/resolved",
        contentSections: [
          {
            title: "Resolution Tracking",
            items: [
              "Resolution Rate",
              "Customer Satisfaction",
              "Resolution Time",
              "Follow-up Actions",
              "Lessons Learned"
            ]
          }
        ]
      },
      {
        id: "complaints-categories",
        labelKey: "admin.sidebar.complaints.categories",
        route: "/admin/complaints/categories",
        contentSections: [
          {
            title: "Category Management",
            items: [
              "Category Definition",
              "Routing Rules",
              "Escalation Paths",
              "Response Templates",
              "Analytics"
            ]
          }
        ]
      },
      {
        id: "complaints-response-templates",
        labelKey: "admin.sidebar.complaints.response_templates",
        route: "/admin/complaints/response-templates",
        contentSections: [
          {
            title: "Template Library",
            items: [
              "Standard Responses",
              "Custom Templates",
              "Multi-language Support",
              "Approval Workflow",
              "Version Control"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "integrations",
    labelKey: "admin.sidebar.integrations",
    icon: Plug,
    children: [
      {
        id: "integrations-whatsapp",
        labelKey: "admin.sidebar.integrations.whatsapp_settings",
        route: "/admin/integrations/whatsapp",
        contentSections: [
          {
            title: "WhatsApp Integration",
            items: [
              "Business API Setup",
              "Webhook Configuration",
              "Message Templates",
              "Contact Management",
              "Analytics Dashboard"
            ]
          }
        ]
      },
      {
        id: "integrations-email",
        labelKey: "admin.sidebar.integrations.email_settings",
        route: "/admin/integrations/email",
        contentSections: [
          {
            title: "Email Integration",
            items: [
              "SMTP Configuration",
              "Email Templates",
              "Delivery Tracking",
              "Bounce Management",
              "Spam Prevention"
            ]
          }
        ]
      },
      {
        id: "integrations-sms",
        labelKey: "admin.sidebar.integrations.sms_settings",
        route: "/admin/integrations/sms",
        contentSections: [
          {
            title: "SMS Integration",
            items: [
              "Provider Configuration",
              "Message Templates",
              "Delivery Reports",
              "Cost Tracking",
              "Opt-out Management"
            ]
          }
        ]
      },
      {
        id: "integrations-social",
        labelKey: "admin.sidebar.integrations.social_media",
        route: "/admin/integrations/social-media",
        contentSections: [
          {
            title: "Social Media Management",
            items: [
              "Platform Connections",
              "Content Scheduling",
              "Engagement Tracking",
              "Analytics Dashboard",
              "Cross-platform Publishing"
            ]
          }
        ]
      },
      {
        id: "integrations-api",
        labelKey: "admin.sidebar.integrations.api_integrations",
        route: "/admin/integrations/api",
        contentSections: [
          {
            title: "API Management",
            items: [
              "API Documentation",
              "Authentication Setup",
              "Rate Limiting",
              "Usage Monitoring",
              "Webhook Management"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "content-management",
    labelKey: "admin.sidebar.content_management",
    icon: FileText,
    children: [
      {
        id: "content-management-landing",
        labelKey: "admin.sidebar.content_management.landing_pages",
        route: "/admin/content/landing-pages",
        contentSections: [
          {
            title: "CMS System",
            items: [
              "Section Management",
              "Content Editing",
              "Draft/Published Workflow",
              "Version Control",
              "SEO Optimization"
            ]
          }
        ]
      },
      {
        id: "content-management-articles",
        labelKey: "admin.sidebar.content_management.articles",
        route: "/admin/content/articles",
        contentSections: [
          {
            title: "Article Management",
            items: [
              "Article Creation",
              "Rich Text Editor",
              "Category Management",
              "Tag System",
              "Publishing Workflow"
            ]
          }
        ]
      },
      {
        id: "content-management-media",
        labelKey: "admin.sidebar.content_management.media_library",
        route: "/admin/content/media-library",
        contentSections: [
          {
            title: "Media Management",
            items: [
              "File Upload",
              "Image Optimization",
              "Video Processing",
              "Storage Management",
              "CDN Integration"
            ]
          }
        ]
      },
      {
        id: "content-management-seo",
        labelKey: "admin.sidebar.content_management.seo_settings",
        route: "/admin/content/seo",
        contentSections: [
          {
            title: "SEO Optimization",
            items: [
              "Meta Tags",
              "Sitemap Generation",
              "URL Structure",
              "Analytics Integration",
              "Performance Monitoring"
            ]
          }
        ]
      },
      {
        id: "content-management-templates",
        labelKey: "admin.sidebar.content_management.content_templates",
        route: "/admin/content/templates",
        contentSections: [
          {
            title: "Template System",
            items: [
              "Template Library",
              "Custom Templates",
              "Template Variables",
              "Preview System",
              "Version Control"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "features",
    labelKey: "admin.sidebar.features",
    icon: Layers,
    children: [
      {
        id: "features-comparison",
        labelKey: "admin.sidebar.features.feature_comparison",
        route: "/admin/features/comparison",
        contentSections: [
          {
            title: "Comparison Matrix",
            items: [
              "Feature Lists",
              "Plan Comparison",
              "Upgrade Paths",
              "Feature Requests",
              "Usage Analytics"
            ]
          }
        ]
      },
      {
        id: "features-pricing",
        labelKey: "admin.sidebar.features.pricing_plans",
        route: "/admin/features/pricing",
        contentSections: [
          {
            title: "Pricing Management",
            items: [
              "Plan Configuration",
              "Pricing Tiers",
              "Discount Management",
              "Promotional Pricing",
              "A/B Testing"
            ]
          }
        ]
      },
      {
        id: "features-corporate",
        labelKey: "admin.sidebar.features.corporate_features",
        route: "/admin/features/corporate",
        contentSections: [
          {
            title: "Enterprise Features",
            items: [
              "Advanced Analytics",
              "Custom Integrations",
              "Priority Support",
              "White-labeling",
              "API Access"
            ]
          }
        ]
      },
      {
        id: "features-individual",
        labelKey: "admin.sidebar.features.individual_features",
        route: "/admin/features/individual",
        contentSections: [
          {
            title: "Individual Plans",
            items: [
              "Basic Features",
              "Usage Limits",
              "Upgrade Options",
              "Support Levels",
              "Feature Access"
            ]
          }
        ]
      },
      {
        id: "features-requests",
        labelKey: "admin.sidebar.features.feature_requests",
        route: "/admin/features/requests",
        contentSections: [
          {
            title: "Request Management",
            items: [
              "Request Submission",
              "Voting System",
              "Status Tracking",
              "Implementation Planning",
              "User Feedback"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "advanced-analytics",
    labelKey: "admin.sidebar.analytics",
    icon: LineChart,
    children: [
      {
        id: "analytics-user",
        labelKey: "admin.sidebar.analytics.user_analytics",
        route: "/admin/analytics/users",
        contentSections: [
          {
            title: "User Insights",
            items: [
              "User Behavior",
              "Engagement Metrics",
              "Retention Analysis",
              "Cohort Analysis",
              "User Journey Mapping"
            ]
          }
        ]
      },
      {
        id: "analytics-revenue",
        labelKey: "admin.sidebar.analytics.revenue_analytics",
        route: "/admin/analytics/revenue",
        contentSections: [
          {
            title: "Revenue Intelligence",
            items: [
              "Revenue Forecasting",
              "Churn Analysis",
              "Customer Lifetime Value",
              "Pricing Optimization",
              "Market Analysis"
            ]
          }
        ]
      },
      {
        id: "analytics-usage",
        labelKey: "admin.sidebar.analytics.usage_statistics",
        route: "/admin/analytics/usage",
        contentSections: [
          {
            title: "Usage Analytics",
            items: [
              "Feature Usage",
              "Performance Metrics",
              "System Load",
              "Error Rates",
              "Capacity Planning"
            ]
          }
        ]
      },
      {
        id: "analytics-performance",
        labelKey: "admin.sidebar.analytics.performance_metrics",
        route: "/admin/analytics/performance",
        contentSections: [
          {
            title: "Performance Monitoring",
            items: [
              "Response Times",
              "Uptime Tracking",
              "Resource Utilization",
              "Database Performance",
              "API Performance"
            ]
          }
        ]
      },
      {
        id: "analytics-custom-reports",
        labelKey: "admin.sidebar.analytics.custom_reports",
        route: "/admin/analytics/custom-reports",
        contentSections: [
          {
            title: "Report Builder",
            items: [
              "Drag-and-drop Interface",
              "Data Visualization",
              "Scheduled Reports",
              "Export Options",
              "Sharing Features"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "billing",
    labelKey: "admin.sidebar.billing",
    icon: Receipt,
    children: [
      {
        id: "billing-invoices",
        labelKey: "admin.sidebar.billing.invoices_list",
        route: "/admin/billing/invoices",
        contentSections: [
          {
            title: "Invoice Management",
            items: [
              "Invoice Generation",
              "Payment Tracking",
              "Status Management",
              "PDF Generation",
              "Email Delivery"
            ]
          }
        ]
      },
      {
        id: "billing-create-invoice",
        labelKey: "admin.sidebar.billing.create_invoice",
        route: "/admin/billing/create-invoice",
        contentSections: [
          {
            title: "Invoice Creation",
            items: [
              "Invoice Wizard",
              "Line Items",
              "Tax Calculation",
              "Payment Terms",
              "Custom Fields"
            ]
          }
        ]
      },
      {
        id: "billing-payment-tracking",
        labelKey: "admin.sidebar.billing.payment_tracking",
        route: "/admin/billing/payment-tracking",
        contentSections: [
          {
            title: "Payment Management",
            items: [
              "Payment Status",
              "Transaction History",
              "Refund Processing",
              "Dispute Management",
              "Reconciliation"
            ]
          }
        ]
      },
      {
        id: "billing-payment-methods",
        labelKey: "admin.sidebar.billing.payment_methods",
        route: "/admin/billing/payment-methods",
        contentSections: [
          {
            title: "Payment Configuration",
            items: [
              "Gateway Setup",
              "Currency Support",
              "Payment Security",
              "Compliance Management",
              "Fraud Prevention"
            ]
          }
        ]
      },
      {
        id: "billing-settings",
        labelKey: "admin.sidebar.billing.billing_settings",
        route: "/admin/billing/settings",
        contentSections: [
          {
            title: "Billing Configuration",
            items: [
              "Tax Settings",
              "Billing Cycles",
              "Late Fees",
              "Payment Reminders",
              "Dunning Management"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "security",
    labelKey: "admin.sidebar.security",
    icon: Shield,
    children: [
      {
        id: "security-access-control",
        labelKey: "admin.sidebar.security.access_control",
        route: "/admin/security/access-control",
        contentSections: [
          {
            title: "Access Management",
            items: [
              "Permission Matrix",
              "Role-based Access",
              "Resource Protection",
              "Session Management",
              "Audit Logging"
            ]
          }
        ]
      },
      {
        id: "security-logs",
        labelKey: "admin.sidebar.security.security_logs",
        route: "/admin/security/logs",
        contentSections: [
          {
            title: "Security Monitoring",
            items: [
              "Login Attempts",
              "Failed Access",
              "Suspicious Activity",
              "Security Alerts",
              "Incident Response"
            ]
          }
        ]
      },
      {
        id: "security-two-factor",
        labelKey: "admin.sidebar.security.two_factor",
        route: "/admin/security/two-factor",
        contentSections: [
          {
            title: "2FA Management",
            items: [
              "Setup Wizard",
              "Backup Codes",
              "Recovery Options",
              "Device Management",
              "Compliance Reporting"
            ]
          }
        ]
      },
      {
        id: "security-password-policies",
        labelKey: "admin.sidebar.security.password_policies",
        route: "/admin/security/password-policies",
        contentSections: [
          {
            title: "Password Management",
            items: [
              "Complexity Rules",
              "Expiration Policies",
              "History Tracking",
              "Reset Procedures",
              "Security Education"
            ]
          }
        ]
      },
      {
        id: "security-alerts",
        labelKey: "admin.sidebar.security.security_alerts",
        route: "/admin/security/alerts",
        contentSections: [
          {
            title: "Alert System",
            items: [
              "Real-time Notifications",
              "Alert Categories",
              "Escalation Rules",
              "Response Procedures",
              "Threat Intelligence"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "notifications",
    labelKey: "admin.sidebar.notifications",
    icon: Bell,
    children: [
      {
        id: "notifications-center",
        labelKey: "admin.sidebar.notifications.notification_center",
        route: "/admin/notifications/center",
        contentSections: [
          {
            title: "Notification Hub",
            items: [
              "Real-time Notifications",
              "Notification History",
              "Priority Management",
              "Action Items",
              "Bulk Operations"
            ]
          }
        ]
      },
      {
        id: "notifications-email",
        labelKey: "admin.sidebar.notifications.email_notifications",
        route: "/admin/notifications/email",
        contentSections: [
          {
            title: "Email System",
            items: [
              "Template Management",
              "Delivery Tracking",
              "Bounce Handling",
              "Unsubscribe Management",
              "Performance Analytics"
            ]
          }
        ]
      },
      {
        id: "notifications-push",
        labelKey: "admin.sidebar.notifications.push_notifications",
        route: "/admin/notifications/push",
        contentSections: [
          {
            title: "Push System",
            items: [
              "Mobile Notifications",
              "Web Push",
              "Delivery Status",
              "Engagement Tracking",
              "A/B Testing"
            ]
          }
        ]
      },
      {
        id: "notifications-templates",
        labelKey: "admin.sidebar.notifications.notification_templates",
        route: "/admin/notifications/templates",
        contentSections: [
          {
            title: "Template Management",
            items: [
              "Template Library",
              "Custom Templates",
              "Multi-language Support",
              "Variable System",
              "Preview Functionality"
            ]
          }
        ]
      },
      {
        id: "notifications-settings",
        labelKey: "admin.sidebar.notifications.notification_settings",
        route: "/admin/notifications/settings",
        contentSections: [
          {
            title: "Configuration Panel",
            items: [
              "User Preferences",
              "Channel Settings",
              "Frequency Control",
              "Quiet Hours",
              "Opt-out Management"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "system-settings",
    labelKey: "admin.sidebar.system_settings",
    icon: Settings,
    children: [
      {
        id: "system-settings-general",
        labelKey: "admin.sidebar.system_settings.general_settings",
        route: "/admin/system/general",
        contentSections: [
          {
            title: "System Configuration",
            items: [
              "Platform Settings",
              "Regional Settings",
              "Language Configuration",
              "Time Zone Management",
              "Feature Toggles"
            ]
          }
        ]
      },
      {
        id: "system-settings-database",
        labelKey: "admin.sidebar.system_settings.database_management",
        route: "/admin/system/database",
        contentSections: [
          {
            title: "Database Operations",
            items: [
              "Connection Management",
              "Query Optimization",
              "Backup Scheduling",
              "Migration Tools",
              "Performance Monitoring"
            ]
          }
        ]
      },
      {
        id: "system-settings-backup",
        labelKey: "admin.sidebar.system_settings.backup_restore",
        route: "/admin/system/backup",
        contentSections: [
          {
            title: "Backup System",
            items: [
              "Automated Backups",
              "Incremental Backups",
              "Restore Procedures",
              "Storage Management",
              "Disaster Recovery"
            ]
          }
        ]
      },
      {
        id: "system-settings-logs",
        labelKey: "admin.sidebar.system_settings.system_logs",
        route: "/admin/system/logs",
        contentSections: [
          {
            title: "Log Management",
            items: [
              "Application Logs",
              "Error Logs",
              "Access Logs",
              "Performance Logs",
              "Log Analysis"
            ]
          }
        ]
      },
      {
        id: "system-settings-maintenance",
        labelKey: "admin.sidebar.system_settings.maintenance",
        route: "/admin/system/maintenance",
        contentSections: [
          {
            title: "Maintenance Tools",
            items: [
              "System Health",
              "Performance Optimization",
              "Cache Management",
              "Cleanup Procedures",
              "Update Management"
            ]
          }
        ]
      }
    ]
  }
];
