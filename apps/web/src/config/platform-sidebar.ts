import {
  BarChart3,
  Bell,
  Bookmark,
  Building,
  Building2,
  ClipboardList,
  Filter,
  FileText,
  Heart,
  Inbox,
  LayoutDashboard,
  Megaphone,
  PlusSquare,
  Settings,
  Shuffle,
  ShieldCheck,
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

export type PlatformSidebarGroupConfig = {
  id: string;
  labelKey?: string;
  label?: string;
  icon: LucideIcon;
  children: PlatformSidebarChildConfig[];
};

export const platformSidebarConfig: PlatformSidebarGroupConfig[] = [
  {
    id: "dashboard",
    labelKey: "sidebar.salesManagement",
    icon: LayoutDashboard,
    children: [
      {
        id: "dashboard-overview",
        labelKey: "nav.dashboard",
        path: "/home/platform",
        icon: LayoutDashboard,
        matchPaths: ["/dashboard"]
      },
      {
        id: "dashboard-leads",
        labelKey: "nav.leads",
        path: "/home/platform/leads",
        icon: Users,
        matchPaths: ["/leads"]
      },
      {
        id: "dashboard-pipeline",
        labelKey: "nav.pipeline",
        path: "/home/platform/pipeline",
        icon: Filter,
        matchPaths: ["/pipeline"]
      },
      {
        id: "dashboard-reports",
        labelKey: "nav.reports",
        path: "/home/platform/reports",
        icon: BarChart3,
        matchPaths: ["/reports"]
      },
      {
        id: "dashboard-notifications",
        labelKey: "nav.notifications",
        path: "/home/platform/notifications",
        icon: Bell,
        matchPaths: ["/notifications"]
      }
    ]
  },
  {
    id: "crm",
    labelKey: "sidebar.customerManagement",
    icon: Users,
    children: [
      {
        id: "crm-customers",
        labelKey: "nav.customers",
        path: "/home/platform/customers",
        icon: Users,
        matchPaths: ["/customers"]
      },
      {
        id: "crm-clients",
        labelKey: "nav.clients",
        path: "/home/platform/clients",
        icon: Users,
        matchPaths: ["/clients"]
      },
      {
        id: "crm-customer-requests",
        labelKey: "nav.customer_requests",
        path: "/home/platform/customer-requests",
        icon: Inbox,
        matchPaths: ["/customer-requests"]
      },
      {
        id: "crm-admin-requests",
        labelKey: "nav.admin_requests",
        path: "/home/platform/admin-requests",
        icon: ClipboardList,
        matchPaths: ["/admin/requests"]
      }
    ]
  },
  {
    id: "marketplace",
    labelKey: "sidebar.marketplace",
    icon: Building,
    children: [
      {
        id: "marketplace-properties",
        labelKey: "nav.properties",
        path: "/home/platform/properties",
        icon: Building,
        matchPaths: ["/properties"],
        matchPrefixes: ["/home/platform/properties/", "/properties/", "/home/platform/listing/", "/listing/"]
      },
      {
        id: "marketplace-agencies",
        labelKey: "nav.agencies",
        path: "/home/platform/agencies",
        icon: Building2,
        matchPaths: ["/agencies"],
        matchPrefixes: ["/home/platform/agency/", "/agency/", "/home/platform/agent/", "/agent/"]
      },
      {
        id: "marketplace-moderation",
        labelKey: "nav.moderation",
        path: "/home/platform/moderation",
        icon: ShieldCheck,
        matchPaths: ["/moderation"]
      },
      {
        id: "marketplace-favorites",
        labelKey: "nav.favorites",
        path: "/home/platform/favorites",
        icon: Heart,
        matchPaths: ["/favorites"]
      },
      {
        id: "marketplace-saved-searches",
        labelKey: "nav.saved_searches",
        path: "/home/platform/saved-searches",
        icon: Bookmark,
        matchPaths: ["/saved-searches"]
      },
      {
        id: "marketplace-compare",
        labelKey: "nav.compare",
        path: "/home/platform/compare",
        icon: Shuffle,
        matchPaths: ["/compare"]
      },
      {
        id: "marketplace-post-listing",
        labelKey: "nav.post_listing",
        path: "/home/platform/post-listing",
        icon: PlusSquare,
        matchPaths: ["/post-listing"]
      }
    ]
  },
  {
    id: "marketing",
    labelKey: "sidebar.marketingContent",
    icon: Megaphone,
    children: [
      {
        id: "marketing-requests",
        labelKey: "nav.marketing_requests",
        path: "/home/platform/marketing-requests",
        icon: Megaphone,
        matchPaths: ["/marketing-requests"]
      },
      {
        id: "marketing-cms",
        labelKey: "nav.cms",
        path: "/home/platform/cms",
        icon: FileText,
        matchPaths: ["/cms", "/cms-admin"]
      }
    ]
  },
  {
    id: "settings",
    labelKey: "sidebar.settingsSupport",
    icon: Settings,
    children: [
      {
        id: "settings-general",
        labelKey: "nav.settings",
        path: "/home/platform/settings",
        icon: Settings,
        matchPaths: ["/settings"]
      }
    ]
  }
];
