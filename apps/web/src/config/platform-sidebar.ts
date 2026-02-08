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
  Globe2,
  Heart,
  Home,
  Inbox,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Megaphone,
  Settings,
  Share2,
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

const CORPORATE_MANAGEMENT_ROLES = [
  UserRole.WEBSITE_ADMIN,
  UserRole.CORP_OWNER,
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
  {
    id: "customers",
    labelKey: "sidebar.customers",
    icon: Users,
    subgroups: [
      {
        id: "customers-core",
        labelKey: "sidebar.customers.core",
        children: [
          // [REMOVED] Customers Listing as per requirement
          // {
          //   id: "customers-registry",
          {
            id: "customers-pool",
            labelKey: "nav.pool",
            label: "طلبات العملاء (Pool)",
            path: "/home/platform/pool",
            icon: Inbox,
            matchPaths: ["/pool"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "customers-forum",
            labelKey: "nav.forum",
            label: "المنتدى العقاري",
            path: "/home/platform/forum",
            icon: Users,
            matchPaths: ["/forum"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "customers-properties",
            labelKey: "nav.properties",
            path: "/home/platform/properties",
            icon: Building,
            matchPaths: ["/properties"],
            matchPrefixes: ["/home/platform/properties/", "/properties/"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "customers-leads",
            labelKey: "nav.leads",
            path: "/home/platform/leads",
            icon: Users,
            matchPaths: ["/leads"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },

          {
            id: "customers-pipeline",
            labelKey: "nav.pipeline",
            path: "/home/platform/pipeline",
            icon: ClipboardList,
            matchPaths: ["/pipeline"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "customers-clients",
            labelKey: "nav.clients",
            path: "/home/platform/clients",
            icon: UserCircle2,
            matchPaths: ["/clients"],
            allowedRoles: PLATFORM_CORE_ROLES,
          }
        ]
      },
      {
        id: "customers-ops",
        labelKey: "sidebar.customers.operations",
        children: [
          {
            id: "customers-reports",
            labelKey: "nav.reports",
            path: "/home/platform/reports",
            icon: BarChart3,
            matchPaths: ["/reports"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "customers-settings",
            labelKey: "nav.workspace_settings",
            path: "/home/platform/settings",
            icon: Settings,
            matchPaths: ["/settings"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "customers-marketing-requests",
            labelKey: "nav.marketing_requests",
            path: "/home/platform/marketing-requests",
            icon: Megaphone,
            matchPaths: ["/marketing-requests"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "customers-activities",
            labelKey: "nav.activities",
            path: "/home/platform/activities",
            icon: CheckSquare,
            matchPaths: ["/activities"],
            allowedRoles: EXTENDED_PLATFORM_ROLES,
          },
          {
            id: "customers-calendar",
            labelKey: "nav.calendar",
            path: "/home/platform/calendar",
            icon: Calendar,
            matchPaths: ["/calendar"],
            allowedRoles: EXTENDED_PLATFORM_ROLES,
          }
        ]
      }
    ]
  },
  {
    id: "corporate",
    labelKey: "sidebar.corporateExclusive",
    icon: Building2,
    subgroups: [
      {
        id: "corporate-directory",
        labelKey: "sidebar.corporate.directory",
        children: [
          {
            id: "corporate-agencies",
            labelKey: "nav.agencies",
            path: "/home/platform/agencies",
            icon: Building2,
            matchPaths: ["/agencies"],
            allowedRoles: CORPORATE_MANAGEMENT_ROLES,
          },
          {
            id: "corporate-agency-profile",
            labelKey: "nav.agency_profile",
            path: "/home/platform/agencies",
            icon: Home,
            matchPrefixes: ["/home/platform/agency/", "/agency/"],
            allowedRoles: CORPORATE_MANAGEMENT_ROLES,
          },
          {
            id: "corporate-customer-requests",
            labelKey: "nav.customer_requests",
            path: "/home/platform/customer-requests",
            icon: Inbox,
            matchPaths: ["/customer-requests"],
            allowedRoles: CORPORATE_MANAGEMENT_ROLES,
          }
        ]
      }
    ]
  },
  {
    id: "cross-role",
    labelKey: "sidebar.crossRole",
    icon: Share2,
    subgroups: [
      {
        id: "cross-role-discovery",
        labelKey: "sidebar.crossRole.discovery",
        children: [
          {
            id: "cross-role-favorites",
            labelKey: "nav.favorites",
            path: "/home/platform/favorites",
            icon: Heart,
            matchPaths: ["/favorites"],
            allowedRoles: EXTENDED_PLATFORM_ROLES,
          },
          {
            id: "cross-role-saved-searches",
            labelKey: "nav.saved_searches",
            path: "/home/platform/saved-searches",
            icon: Bookmark,
            matchPaths: ["/saved-searches"],
            allowedRoles: EXTENDED_PLATFORM_ROLES,
          },
          {
            id: "cross-role-compare",
            labelKey: "nav.compare",
            path: "/home/platform/compare",
            icon: Shuffle,
            matchPaths: ["/compare"],
            allowedRoles: EXTENDED_PLATFORM_ROLES,
          },
          {
            id: "cross-role-post-listing",
            labelKey: "nav.post_listing",
            path: "/home/platform/post-listing",
            icon: Megaphone,
            matchPaths: ["/post-listing"],
            allowedRoles: EXTENDED_PLATFORM_ROLES,
          }
        ]
      },
      {
        id: "cross-role-oversight",
        labelKey: "sidebar.crossRole.oversight",
        children: [
          {
            id: "cross-role-agent-profile",
            labelKey: "nav.agent_profile",
            path: "/home/platform/agencies",
            icon: UserCircle2,
            matchPrefixes: ["/home/platform/agent/", "/agent/"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "cross-role-property-detail",
            labelKey: "nav.property_detail",
            path: "/home/platform/properties",
            icon: Building,
            matchPrefixes: ["/home/platform/properties/", "/properties/"],
            allowedRoles: PLATFORM_CORE_ROLES,
          },
          {
            id: "cross-role-public-listing",
            labelKey: "nav.listing_public",
            path: "/home/platform/properties",
            icon: Globe2,
            matchPrefixes: ["/home/platform/listing/", "/listing/"],
            allowedRoles: EXTENDED_PLATFORM_ROLES,
          },
          {
            id: "cross-role-unverified-listings",
            labelKey: "nav.unverified_listings",
            path: "/home/platform/unverified-listings",
            icon: ShieldCheck,
            matchPaths: [
              "/unverified-listings",
              "/home/platform/unverified-listings"
            ],
            allowedRoles: PLATFORM_CORE_ROLES,
          },

        ]
      }
    ]
  }
];
