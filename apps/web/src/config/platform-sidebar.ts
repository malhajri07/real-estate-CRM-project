/**
 * platform-sidebar.ts - Platform Sidebar Configuration
 * 
 * Location: apps/web/src/ → Config/ → platform-sidebar.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Platform sidebar navigation configuration. Defines:
 * - Sidebar menu items
 * - Navigation structure
 * - Icon mappings
 * 
 * Related Files:
 * - apps/web/src/components/layout/sidebar.tsx - Sidebar component
 * - apps/web/src/config/admin-sidebar.ts - Admin sidebar configuration
 */

import {
  BarChart3,
  Bell,
  Bookmark,
  Building,
  Building2,
  ClipboardList,
  FileText,
  Globe2,
  Heart,
  Home,
  Inbox,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Megaphone,
  Settings,
  ShieldCheck,
  Shuffle,
  UserCircle2,
  Users
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

export const platformSidebarConfig: PlatformSidebarGroupConfig[] = [
  // 1. Dashboard (standalone)
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

  // 2. Sales
  {
    id: "sales",
    labelKey: "sidebar.sales",
    label: "المبيعات",
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
        id: "clients",
        labelKey: "nav.clients",
        path: "/home/platform/clients",
        icon: UserCircle2,
        matchPaths: ["/clients"],
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
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
      {
        id: "calendar",
        labelKey: "nav.calendar",
        path: "/home/platform/calendar",
        icon: Calendar,
        matchPaths: ["/calendar"],
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
    ],
  },

  // 3. Properties
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
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
      {
        id: "favorites",
        labelKey: "nav.favorites",
        path: "/home/platform/favorites",
        icon: Heart,
        matchPaths: ["/favorites"],
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
      {
        id: "compare",
        labelKey: "nav.compare",
        path: "/home/platform/compare",
        icon: Shuffle,
        matchPaths: ["/compare"],
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
      {
        id: "saved-searches",
        labelKey: "nav.saved_searches",
        path: "/home/platform/saved-searches",
        icon: Bookmark,
        matchPaths: ["/saved-searches"],
        allowedRoles: EXTENDED_PLATFORM_ROLES,
      },
    ],
  },

  // 4. Requests
  {
    id: "requests",
    labelKey: "sidebar.requests",
    label: "الطلبات",
    icon: Inbox,
    children: [
      {
        id: "pool",
        labelKey: "nav.pool",
        label: "طلبات العملاء (Pool)",
        path: "/home/platform/pool",
        icon: Inbox,
        matchPaths: ["/pool", "/home/platform/pool"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "broker-requests",
        labelKey: "nav.broker_requests",
        label: "طلبات التعاون",
        path: "/home/platform/broker-requests",
        icon: Inbox,
        matchPaths: ["/broker-requests", "/home/platform/broker-requests"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // 5. Community
  {
    id: "community",
    labelKey: "sidebar.community",
    label: "المجتمع",
    icon: Globe2,
    children: [
      {
        id: "forum",
        labelKey: "nav.forum",
        label: "المنتدى العقاري",
        path: "/home/platform/forum",
        icon: Users,
        matchPaths: ["/forum"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "team",
        labelKey: "nav.team",
        label: "فريق العمل",
        path: "/home/platform/team",
        icon: Users,
        matchPaths: ["/team", "/home/platform/team"],
        allowedRoles: ["CORP_OWNER", "WEBSITE_ADMIN"] as any,
      },
    ],
  },

  // 6. Analytics (standalone)
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
    ],
  },

  // 7. Operations (admin)
  {
    id: "operations",
    labelKey: "sidebar.operations",
    label: "العمليات",
    icon: ShieldCheck,
    children: [
      {
        id: "moderation",
        labelKey: "nav.moderation",
        path: "/home/platform/moderation",
        icon: ShieldCheck,
        matchPaths: ["/moderation"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "unverified-listings",
        labelKey: "nav.unverified_listings",
        path: "/home/platform/unverified-listings",
        icon: ShieldCheck,
        matchPaths: ["/unverified-listings", "/home/platform/unverified-listings"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "cms",
        labelKey: "nav.cms",
        path: "/home/platform/cms",
        icon: FileText,
        matchPaths: ["/cms", "/cms-admin"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "marketing-requests",
        labelKey: "nav.marketing_requests",
        path: "/home/platform/marketing-requests",
        icon: Megaphone,
        matchPaths: ["/marketing-requests"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },

  // 8. Settings
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
        allowedRoles: PLATFORM_CORE_ROLES,
      },
      {
        id: "notifications",
        labelKey: "nav.notifications",
        path: "/home/platform/notifications",
        icon: Bell,
        matchPaths: ["/notifications"],
        allowedRoles: PLATFORM_CORE_ROLES,
      },
    ],
  },
];
