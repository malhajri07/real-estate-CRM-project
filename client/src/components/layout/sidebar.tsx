import { Link, useLocation } from "wouter";
import { Home, Users, Building, Filter, Handshake, BarChart3, Bell, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const getNavigationItems = (t: (key: string) => string) => [
  { path: "/", labelKey: "nav.dashboard", icon: Home },
  { path: "/leads", labelKey: "nav.leads", icon: Users, badge: "24" },
  { path: "/properties", labelKey: "nav.properties", icon: Building, badge: "87" },
  { path: "/pipeline", labelKey: "nav.pipeline", icon: Filter },
  { path: "/clients", labelKey: "nav.clients", icon: Handshake },
  { path: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { path: "/reports", labelKey: "nav.reports", icon: BarChart3 },
];

const getBottomItems = (t: (key: string) => string) => [
  { path: "/settings", labelKey: "nav.settings", icon: Settings },
  { path: "/logout", labelKey: "nav.logout", icon: LogOut },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { t, dir } = useLanguage();
  
  const navigationItems = getNavigationItems(t);
  const bottomItems = getBottomItems(t);

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0">
      <div className="p-6">
        <div className={cn("flex items-center", dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3')}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Home className="text-primary-foreground text-sm" size={16} />
          </div>
          <h1 className="text-xl font-semibold">{t('nav.system_title') || 'Real Estate CRM'}</h1>
        </div>
        <div className="mt-4">
          <LanguageToggle />
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3',
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon size={20} />
                  <span>{t(item.labelKey)}</span>
                  {item.badge && (
                    <span className={cn("bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full",
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
        
        <div className="mt-8 pt-8 border-t border-slate-700">
          <ul className="space-y-2">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors",
                      dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'
                    )}
                  >
                    <Icon size={20} />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
