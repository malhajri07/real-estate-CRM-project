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
  Megaphone,
  Settings,
  Share2,
  ShieldCheck,
  Shuffle,
  UserCircle2,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformSidebarChildConfig = {
  id: string;
  labelKey?: string;
  label?: string;
  path: string;
  icon: LucideIcon;
  matchPaths?: string[];
  matchPrefixes?: string[];
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
          {
            id: "customers-registry",
            labelKey: "nav.customers",
            path: "/home/platform/customers",
            icon: Users,
            matchPaths: ["/customers"]
          },
          {
            id: "customers-properties",
            labelKey: "nav.properties",
            path: "/home/platform/properties",
            icon: Building,
            matchPaths: ["/properties"],
            matchPrefixes: ["/home/platform/properties/", "/properties/"]
          },
          {
            id: "customers-leads",
            labelKey: "nav.leads",
            path: "/home/platform/leads",
            icon: Users,
            matchPaths: ["/leads"]
          },
          {
            id: "customers-pipeline",
            labelKey: "nav.pipeline",
            path: "/home/platform/pipeline",
            icon: ClipboardList,
            matchPaths: ["/pipeline"]
          },
          {
            id: "customers-clients",
            labelKey: "nav.clients",
            path: "/home/platform/clients",
            icon: UserCircle2,
            matchPaths: ["/clients"]
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
            matchPaths: ["/reports"]
          },
          {
            id: "customers-notifications",
            labelKey: "nav.notifications",
            path: "/home/platform/notifications",
            icon: Bell,
            matchPaths: ["/notifications"]
          },
          {
            id: "customers-settings",
            labelKey: "nav.workspace_settings",
            path: "/home/platform/settings",
            icon: Settings,
            matchPaths: ["/settings"]
          },
          {
            id: "customers-marketing-requests",
            labelKey: "nav.marketing_requests",
            path: "/home/platform/marketing-requests",
            icon: Megaphone,
            matchPaths: ["/marketing-requests"]
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
            matchPaths: ["/agencies"]
          },
          {
            id: "corporate-agency-profile",
            labelKey: "nav.agency_profile",
            path: "/home/platform/agencies",
            icon: Home,
            matchPrefixes: ["/home/platform/agency/", "/agency/"]
          },
          {
            id: "corporate-customer-requests",
            labelKey: "nav.customer_requests",
            path: "/home/platform/customer-requests",
            icon: Inbox,
            matchPaths: ["/customer-requests"]
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
            matchPaths: ["/favorites"]
          },
          {
            id: "cross-role-saved-searches",
            labelKey: "nav.saved_searches",
            path: "/home/platform/saved-searches",
            icon: Bookmark,
            matchPaths: ["/saved-searches"]
          },
          {
            id: "cross-role-compare",
            labelKey: "nav.compare",
            path: "/home/platform/compare",
            icon: Shuffle,
            matchPaths: ["/compare"]
          },
          {
            id: "cross-role-post-listing",
            labelKey: "nav.post_listing",
            path: "/home/platform/post-listing",
            icon: Megaphone,
            matchPaths: ["/post-listing"]
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
            matchPrefixes: ["/home/platform/agent/", "/agent/"]
          },
          {
            id: "cross-role-property-detail",
            labelKey: "nav.property_detail",
            path: "/home/platform/properties",
            icon: Building,
            matchPrefixes: ["/home/platform/properties/", "/properties/"]
          },
          {
            id: "cross-role-public-listing",
            labelKey: "nav.listing_public",
            path: "/home/platform/properties",
            icon: Globe2,
            matchPrefixes: ["/home/platform/listing/", "/listing/"]
          },
          {
            id: "cross-role-unverified-listings",
            labelKey: "nav.unverified_listings",
            path: "/home/platform/unverified-listings",
            icon: ShieldCheck,
            matchPaths: [
              "/unverified-listings",
              "/home/platform/unverified-listings"
            ]
          }
        ]
      }
    ]
  }
];
