import { Link, useLocation } from "wouter";
import { Home, Users, Building, Filter, Handshake, BarChart3, Bell, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { path: "/", label: "لوحة التحكم", icon: Home },
  { path: "/leads", label: "العملاء المحتملين", icon: Users, badge: "24" },
  { path: "/properties", label: "العقارات", icon: Building, badge: "87" },
  { path: "/pipeline", label: "مراحل الصفقات", icon: Filter },
  { path: "/clients", label: "علاقات العملاء", icon: Handshake },
  { path: "/notifications", label: "الإشعارات والحملات", icon: Bell },
  { path: "/reports", label: "التقارير", icon: BarChart3 },
];

const bottomItems = [
  { path: "/settings", label: "الإعدادات", icon: Settings },
  { path: "/logout", label: "تسجيل الخروج", icon: LogOut },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Home className="text-primary-foreground text-sm" size={16} />
          </div>
          <h1 className="text-xl font-semibold">نظام إدارة العقارات</h1>
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
                    "flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="mr-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
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
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
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
