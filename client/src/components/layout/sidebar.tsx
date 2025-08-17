import { Link, useLocation } from "wouter";
import { Home, Users, Building, Filter, Handshake, BarChart3, Bell, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

interface SidebarProps {
  onLogout?: () => void;
}

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
];

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { t, dir } = useLanguage();
  
  const navigationItems = getNavigationItems(t);
  const bottomItems = getBottomItems(t);

  return (
    <div className="w-72 bg-sidebar text-sidebar-foreground flex-shrink-0 apple-shadow-large border-l border-sidebar-border fixed h-full overflow-y-auto z-10 right-0">
      <div className="p-8">
        <div className={cn("flex items-center", dir === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4')}>
          <img 
            src={logoImage} 
            alt="شعار عقاراتي" 
            className="w-20 h-20 object-contain"
            style={{ 
              filter: 'drop-shadow(0 0 0 transparent)',
              background: 'transparent'
            }}
          />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">منصة عقاراتي</h1>
            <p className="text-xs text-muted-foreground mt-0.5">نظام إدارة العقارات</p>
          </div>
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
            {onLogout && (
              <li>
                <button
                  onClick={onLogout}
                  className={cn(
                    "w-full flex items-center px-4 py-3 rounded-xl apple-transition font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'
                  )}
                  data-testid="button-logout"
                >
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg">
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
