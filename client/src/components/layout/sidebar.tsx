import { Link, useLocation } from "wouter";
import { Home, Users, Building, Building2, Filter, Handshake, BarChart3, Bell, Settings, LogOut, MapPin, PlusSquare, Heart, Shuffle, Bookmark, ShieldCheck, Shield, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

type NavItem = {
  path: string;
  labelKey?: string;
  label?: string;
  icon: any;
  badge?: string | number;
};

interface SidebarProps {
  onLogout?: () => void;
}

const getNavigationItems = (t: (key: string) => string): NavItem[] => [
  // CRM
  { path: "/home/platform", labelKey: "nav.dashboard", icon: Home },
  { path: "/home/platform/customers", label: "العملاء المحتملين", icon: Users },
  { path: "/home/platform/properties", labelKey: "nav.properties", icon: Building },
  { path: "/home/platform/pipeline", labelKey: "nav.pipeline", icon: Filter },
  { path: "/home/platform/clients", labelKey: "nav.clients", icon: Handshake },
  { path: "/home/platform/notifications", labelKey: "nav.notifications", icon: Bell },
  { path: "/home/platform/reports", labelKey: "nav.reports", icon: BarChart3 },
  { path: "/home/platform/marketing-requests", label: "طلبات التسويق", icon: Megaphone },
  // Marketplace/Public
  { path: "/post-listing", labelKey: "nav.post_listing", icon: PlusSquare },
  { path: "/home/platform/agencies", labelKey: "nav.agencies", icon: Handshake },
  { path: "/saved-searches", label: "عمليات البحث", icon: Bookmark },
  { path: "/favorites", labelKey: "nav.favorites", icon: Heart },
  { path: "/compare", labelKey: "nav.compare", icon: Shuffle },
  { path: "/home/platform/moderation", label: "المراجعة", icon: ShieldCheck },
  // Use the platform-accessible requests page instead of server-only admin route
  { path: "/customer-requests", label: "طلبات العملاء", icon: Bookmark },
];

const getBottomItems = (t: (key: string) => string): NavItem[] => [
  { path: "/home/platform/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { t, dir } = useLanguage();
  
  const navigationItems = getNavigationItems(t);
  const bottomItems = getBottomItems(t);

  return (
    <div className="w-64 md:w-72 bg-white text-slate-700 shadow-md border-l border-slate-200 fixed right-0 top-0 h-full overflow-y-auto z-50">
      <div className="p-4">
        <div className="flex justify-center">
          <img
            src={agarkomLogo}
            alt="عقاركم"
            width={180}
            height={101}
            loading="lazy"
            decoding="async"
            className="h-24 w-auto object-contain"
          />
        </div>
      </div>
      
      <nav className="px-4 md:px-6 pb-6">
        <ul className="space-y-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors font-medium",
                    isActive
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-lg",
                    dir === 'rtl' ? 'ml-3' : 'mr-3',
                    isActive ? "text-white" : "text-slate-500"
                  )}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm tracking-tight">{item.label ?? (item.labelKey ? t(item.labelKey) : "")}</span>
                  {item.badge && (
                    <span className={cn("bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium",
                      dir === 'rtl' ? 'mr-auto' : 'ml-auto'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-4 pt-3 border-t border-slate-200">
          <ul className="space-y-0">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="flex items-center px-3 py-2 rounded-md transition-colors font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <div className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-lg",
                      dir === 'rtl' ? 'ml-3' : 'mr-3'
                    )}>
                      <Icon size={18} />
                    </div>
                    <span className="text-sm tracking-tight">{t(item.labelKey || "")}</span>
                  </Link>
                </li>
              );
            })}
            {onLogout && (
              <li>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-3 py-2 rounded-md transition-colors font-medium text-slate-600 hover:bg-slate-100"
                  data-testid="button-logout"
                >
                  <div className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-lg",
                    dir === 'rtl' ? 'ml-3' : 'mr-3'
                  )}>
                    <LogOut size={18} />
                  </div>
                  <span className="text-sm tracking-tight">تسجيل الخروج</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </div>
  );
}
