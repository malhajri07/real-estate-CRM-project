/**
 * platform-sidebar.ts — Agent Platform Sidebar Navigation
 *
 * Grouped by agent workflow:
 *   1. Dashboard — overview
 *   2. CRM — leads, pipeline, activities
 *   3. Properties — listings, post, pool
 *   4. Calendar — scheduling
 *   5. Collaboration — broker requests, forum
 *   6. Marketing — campaigns, promotions
 *   7. Analytics — reports
 *   8. Management — team (corp only), operations (admin only)
 *   9. Settings
 */

import {
  BarChart3,
  Building,
  Calculator,
  Calendar,
  CheckSquare,
  ClipboardList,
  FileText,
  Globe2,
  Handshake,
  Heart,
  Home,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { UserRole } from "@shared/rbac";

export type PlatformSidebarChildConfig = {
  id: string;
  labelKey?: string;
  label?: string;
  path: string;
  icon: LucideIcon;
  matchPaths?: string[];
  matchPrefixes?: string[];
  allowedRoles?: UserRole[];
};

export type PlatformSidebarSubgroupConfig = {
  id: string;
  labelKey?: string;
  label?: string;
  children: PlatformSidebarChildConfig[];
};

export type PlatformSidebarGroupConfig = {
  id: string;
  labelKey?: string;
  label?: string;
  icon: LucideIcon;
  children?: PlatformSidebarChildConfig[];
  subgroups?: PlatformSidebarSubgroupConfig[];
};

const PLATFORM_CORE_ROLES = [
  UserRole.WEBSITE_ADMIN,
  UserRole.CORP_OWNER,
  UserRole.CORP_AGENT,
  UserRole.INDIV_AGENT,
];

const EXTENDED_PLATFORM_ROLES = [
  UserRole.WEBSITE_ADMIN,
  UserRole.CORP_OWNER,
  UserRole.CORP_AGENT,
  UserRole.INDIV_AGENT,
  UserRole.SELLER,
  UserRole.BUYER,
];

const BUYER_ROLES = [
  UserRole.BUYER,
  UserRole.WEBSITE_ADMIN,
];

const SELLER_ROLES = [
  UserRole.SELLER,
  UserRole.WEBSITE_ADMIN,
];

export const platformSidebarConfig: PlatformSidebarGroupConfig[] = [
  // ── 1. Dashboard ──────────────────────────────────────────────────────
  {
    id: "dashboard",
    labelKey: "sidebar.dashboard",
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    children: [
      {
        id: "dashboard",
        labelKey: "nav.dashboard",
        path: "/home/platform",
        icon: LayoutDashboard,
        matchPaths: ["/home/platform", "/"],
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
    ],
  },

  // ── 2. CRM — Lead management & deal pipeline ─────────────────────────
  {
    id: "crm",
    labelKey: "sidebar.crm",
    label: "إدارة العملاء",
    icon: Users,
    children: [
      {
        id: "leads",
        labelKey: "nav.leads",
        path: "/home/platform/leads",
        icon: Users,
        matchPaths: ["/leads"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "pipeline",
        labelKey: "nav.pipeline",
        path: "/home/platform/pipeline",
        icon: ClipboardList,
        matchPaths: ["/pipeline"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "activities",
        labelKey: "nav.activities",
        path: "/home/platform/activities",
        icon: CheckSquare,
        matchPaths: ["/activities"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "tenants",
        label: "المستأجرين",
        path: "/home/platform/tenants",
        icon: Home,
        matchPaths: ["/tenants"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "inbox",
        label: "صندوق الرسائل",
        path: "/home/platform/inbox",
        icon: MessageSquare,
        matchPaths: ["/inbox"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // ── 3. Properties — Listings & inventory ──────────────────────────────
  {
    id: "properties-group",
    labelKey: "sidebar.properties",
    label: "العقارات",
    icon: Building,
    children: [
      {
        id: "properties",
        labelKey: "nav.properties",
        path: "/home/platform/properties",
        icon: Building,
        matchPaths: ["/properties"],
        matchPrefixes: ["/home/platform/properties/", "/properties/"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "post-listing",
        labelKey: "nav.post_listing",
        path: "/home/platform/post-listing",
        icon: Megaphone,
        matchPaths: ["/post-listing"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "pool",
        labelKey: "nav.pool",
        label: "الطلبات العقارية",
        path: "/home/platform/pool",
        icon: Inbox,
        matchPaths: ["/pool", "/home/platform/pool"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "projects",
        label: "المشاريع",
        path: "/home/platform/projects",
        icon: Building,
        matchPaths: ["/projects", "/home/platform/projects"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // ── 4. Calendar — Appointments & scheduling ───────────────────────────
  {
    id: "scheduling",
    labelKey: "sidebar.scheduling",
    label: "الجدولة",
    icon: Calendar,
    children: [
      {
        id: "calendar",
        labelKey: "nav.calendar",
        path: "/home/platform/calendar",
        icon: Calendar,
        matchPaths: ["/calendar"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // ── 5. Collaboration — Broker requests & community ────────────────────
  {
    id: "collaboration",
    labelKey: "sidebar.collaboration",
    label: "التعاون",
    icon: Handshake,
    children: [
      {
        id: "broker-requests",
        labelKey: "nav.broker_requests",
        label: "طلبات التعاون",
        path: "/home/platform/broker-requests",
        icon: Handshake,
        matchPaths: ["/broker-requests", "/home/platform/broker-requests"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "forum",
        labelKey: "nav.forum",
        label: "المنتدى",
        path: "/home/platform/forum",
        icon: MessageSquare,
        matchPaths: ["/forum"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // ── 6. Marketing — Campaigns & promotions ─────────────────────────────
  {
    id: "marketing",
    labelKey: "sidebar.marketing",
    label: "التسويق",
    icon: Megaphone,
    children: [
      {
        id: "campaigns",
        labelKey: "nav.campaigns",
        path: "/home/platform/notifications",
        icon: Megaphone,
        matchPaths: ["/notifications"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "promotions",
        labelKey: "nav.marketing_requests",
        path: "/home/platform/marketing-requests",
        icon: BarChart3,
        matchPaths: ["/marketing-requests"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // ── 7. Tools — Calculators ─────────────────────────────────────────────
  {
    id: "tools",
    labelKey: "sidebar.tools",
    label: "الأدوات",
    icon: BarChart3,
    children: [
      {
        id: "mortgage",
        label: "حاسبة التمويل",
        path: "/home/platform/tools/mortgage",
        icon: BarChart3,
        matchPaths: ["/tools/mortgage"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "roi",
        label: "العائد الاستثماري",
        path: "/home/platform/tools/roi",
        icon: BarChart3,
        matchPaths: ["/tools/roi"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // ── 8. Analytics ──────────────────────────────────────────────────────
  {
    id: "analytics",
    labelKey: "sidebar.analytics",
    label: "التحليلات",
    icon: BarChart3,
    children: [
      {
        id: "reports",
        labelKey: "nav.reports",
        path: "/home/platform/reports",
        icon: BarChart3,
        matchPaths: ["/reports"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "report-builder",
        label: "منشئ التقارير",
        path: "/home/platform/reports/builder",
        icon: BarChart3,
        matchPaths: ["/reports/builder"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // ── 8. Management — Team (corp) + Admin operations ────────────────────
  {
    id: "management",
    labelKey: "sidebar.management",
    label: "الإدارة",
    icon: ShieldCheck,
    children: [
      {
        id: "team",
        labelKey: "nav.team",
        label: "فريق العمل",
        path: "/home/platform/team",
        icon: Users,
        matchPaths: ["/team", "/home/platform/team"],
        allowedRoles: ["CORP_OWNER", "WEBSITE_ADMIN"] as any,
      },
      {
        id: "moderation",
        labelKey: "nav.moderation",
        path: "/home/platform/moderation",
        icon: ShieldCheck,
        matchPaths: ["/moderation"],
        allowedRoles: ["WEBSITE_ADMIN"] as any,
      },
      {
        id: "unverified-listings",
        labelKey: "nav.unverified_listings",
        path: "/home/platform/unverified-listings",
        icon: ShieldCheck,
        matchPaths: ["/unverified-listings", "/home/platform/unverified-listings"],
        allowedRoles: ["WEBSITE_ADMIN"] as any,
      },
      {
        id: "cms",
        labelKey: "nav.cms",
        path: "/home/platform/cms",
        icon: FileText,
        matchPaths: ["/cms", "/cms-admin"],
        allowedRoles: ["WEBSITE_ADMIN"] as any,
      },
    ],
  },

  // ── 9. Buyer Portal ─────────────────────────────────────────────────
  {
    id: "buyer-portal",
    label: "بوابة المشتري",
    icon: Search,
    children: [
      {
        id: "client-dashboard",
        label: "لوحة العميل",
        path: "/client",
        icon: LayoutDashboard,
        matchPaths: ["/client", "/client/dashboard"],
        allowedRoles: BUYER_ROLES,
      },
      {
        id: "browse-properties",
        label: "تصفح العقارات",
        path: "/map",
        icon: Building,
        matchPaths: ["/map"],
        allowedRoles: BUYER_ROLES,
      },
      {
        id: "buyer-messages",
        label: "الرسائل",
        path: "/home/platform/inbox",
        icon: MessageSquare,
        matchPaths: ["/inbox"],
        allowedRoles: BUYER_ROLES,
      },
      {
        id: "buyer-favorites",
        label: "المفضلة",
        path: "/home/platform/favorites",
        icon: Heart,
        matchPaths: ["/favorites"],
        allowedRoles: BUYER_ROLES,
      },
      {
        id: "buyer-saved-searches",
        label: "بحث محفوظ",
        path: "/home/platform/saved-searches",
        icon: Search,
        matchPaths: ["/saved-searches"],
        allowedRoles: BUYER_ROLES,
      },
      {
        id: "buyer-mortgage",
        label: "حاسبة التمويل",
        path: "/home/platform/tools/mortgage",
        icon: Calculator,
        matchPaths: ["/tools/mortgage"],
        allowedRoles: BUYER_ROLES,
      },
      {
        id: "buyer-roi",
        label: "العائد الاستثماري",
        path: "/home/platform/tools/roi",
        icon: BarChart3,
        matchPaths: ["/tools/roi"],
        allowedRoles: BUYER_ROLES,
      },
    ],
  },

  // ── 10. Seller Portal ────────────────────────────────────────────────
  {
    id: "seller-portal",
    label: "بوابة البائع",
    icon: Home,
    children: [
      {
        id: "seller-dashboard",
        label: "لوحة العميل",
        path: "/client",
        icon: LayoutDashboard,
        matchPaths: ["/client", "/client/dashboard"],
        allowedRoles: SELLER_ROLES,
      },
      {
        id: "seller-messages",
        label: "الرسائل",
        path: "/home/platform/inbox",
        icon: MessageSquare,
        matchPaths: ["/inbox"],
        allowedRoles: SELLER_ROLES,
      },
      {
        id: "seller-post-listing",
        label: "إضافة إعلان",
        path: "/home/platform/post-listing",
        icon: Megaphone,
        matchPaths: ["/post-listing"],
        allowedRoles: SELLER_ROLES,
      },
      {
        id: "seller-compare",
        label: "مقارنة العقارات",
        path: "/home/platform/compare",
        icon: BarChart3,
        matchPaths: ["/compare"],
        allowedRoles: SELLER_ROLES,
      },
      {
        id: "seller-mortgage",
        label: "حاسبة التمويل",
        path: "/home/platform/tools/mortgage",
        icon: Calculator,
        matchPaths: ["/tools/mortgage"],
        allowedRoles: SELLER_ROLES,
      },
    ],
  },

  // ── 11. Settings ──────────────────────────────────────────────────────
  {
    id: "settings-group",
    labelKey: "sidebar.settings",
    label: "الإعدادات",
    icon: Settings,
    children: [
      {
        id: "settings",
        labelKey: "nav.workspace_settings",
        path: "/home/platform/settings",
        icon: Settings,
        matchPaths: ["/settings"],
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
    ],
  },
];
