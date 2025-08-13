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
    <div className="w-72 bg-sidebar text-sidebar-foreground flex-shrink-0 apple-shadow-large border-r border-sidebar-border">
      <div className="p-8">
        <div className={cn("flex items-center", dir === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4')}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center apple-shadow">
            <Home className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t('nav.system_title') || 'Real Estate CRM'}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Property Management</p>
          </div>
        </div>
        <div className="mt-6">
          <LanguageToggle />
        </div>
      </div>
      
      <nav className="px-6 pb-6">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl apple-transition font-medium",
                    dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3',
                    isActive
                      ? "bg-primary text-primary-foreground apple-shadow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-lg",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm tracking-tight">{t(item.labelKey)}</span>
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
        
        <div className="mt-8 pt-6 border-t border-sidebar-border">
          <ul className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl apple-transition font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'
                    )}
                  >
                    <div className="w-6 h-6 flex items-center justify-center rounded-lg">
                      <Icon size={18} />
                    </div>
                    <span className="text-sm tracking-tight">{t(item.labelKey)}</span>
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
