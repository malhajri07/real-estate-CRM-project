/**
 * AdminHeader.tsx - Admin Header Component
 * 
 * Location: apps/web/src/ → Components/ → Admin/ → Layout/ → AdminHeader.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin header component for RBAC admin pages. Provides:
 * - Admin navigation
 * - User information display
 * - Logout functionality
 * 
 * Related Files:
 * - apps/web/src/components/admin/layout/AdminSidebar.tsx - Admin sidebar
 * - apps/web/src/pages/admin/dashboard.tsx - Admin dashboard
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Shield, LogOut, Navigation, RefreshCw, Bell } from 'lucide-react';

type AdminHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onLogout: () => void;
  onBack: () => void;
  onRefresh: () => void;
  loading?: boolean;
  userName?: string;
  notificationCount?: number;
  notificationMessage?: string; // يسمح بإظهار رسالة Tailwind كتنبيه عائم مرتبط بأيقونة الإشعارات
  onNotificationAction?: () => void; // عند النقر على الرسالة يتم إرسال المستخدم للقسم المرتبط بالتحديث
};

export function AdminHeader({
  title,
  subtitle,
  icon: Icon = Shield,
  onLogout,
  onBack,
  onRefresh,
  loading = false,
  userName,
  notificationCount,
  notificationMessage,
  onNotificationAction,
}: AdminHeaderProps) {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false); // التحكم في ظهور لوحة الإشعارات عند النقر على الأيقونة
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setShowNotificationPanel(false);
      }
    };

    if (showNotificationPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationPanel]);

  return (
    <header className="glass fixed inset-x-0 top-0 z-50 h-20 transition-all duration-300 border-b-0 shadow-none">
      <div className="w-full px-6 sm:px-8 lg:px-12 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-5">
            <div className="p-2.5 bg-blue-600/10 rounded-2xl">
              <Icon className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div ref={notificationRef} className="relative flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="relative h-11 w-11 p-0 hover:bg-slate-100/80 rounded-2xl transition-colors"
                aria-label="الإشعارات"
                aria-expanded={showNotificationPanel}
                onClick={() => setShowNotificationPanel((prev) => !prev)}
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {notificationCount && notificationCount > 0 && (
                  <span className="absolute top-2.5 end-2.5 h-4 w-4 bg-red-500 border-2 border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
              {notificationMessage && notificationCount && notificationCount > 0 && showNotificationPanel && (
                <div className="absolute top-14 end-0 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationPanel(false);
                      onNotificationAction?.();
                    }}
                    className="relative w-full bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 shadow-2xl text-start hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <span
                      className="absolute -top-1.5 end-8 block h-3 w-3 bg-white border-t border-s border-slate-200/50 rotate-45"
                      aria-hidden="true"
                    />
                    {notificationMessage}
                  </button>
                </div>
              )}
            </div>

            {userName && (
              <div className="hidden sm:flex flex-col items-end me-2 px-3">
                <span className="text-xs font-semibold text-slate-900 leading-none mb-1">{userName}</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider leading-none">Admin</span>
              </div>
            )}

            <div className="h-8 w-px bg-slate-200/50 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="h-10 w-10 p-0 rounded-2xl bg-white/50 border-slate-200/60 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                aria-label="تحديث"
              >
                <RefreshCw size={18} className={cn(loading ? 'animate-spin' : undefined)} />
              </Button>

              <Button
                variant="outline"
                onClick={onBack}
                className="h-10 w-10 p-0 rounded-2xl bg-white/50 border-slate-200/60 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                aria-label="العودة للمنصة"
              >
                <Navigation size={18} />
              </Button>

              <Button
                variant="outline"
                onClick={onLogout}
                className="h-10 w-10 p-0 rounded-2xl bg-red-50/50 border-red-100/60 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                aria-label="تسجيل الخروج"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
