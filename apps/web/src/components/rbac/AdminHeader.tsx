/**
 * AdminHeader.tsx - Admin Header Component
 * 
 * Location: apps/web/src/ → Components/ → Feature Components → rbac/ → AdminHeader.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin header component for RBAC admin pages. Provides:
 * - Admin navigation
 * - User information display
 * - Logout functionality
 * 
 * Related Files:
 * - apps/web/src/components/rbac/AdminSidebar.tsx - Admin sidebar
 * - apps/web/src/pages/rbac-dashboard.tsx - RBAC dashboard
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
    <div className="bg-white shadow-md fixed inset-x-0 top-0 z-50 h-20">
      <div className="w-full px-6 sm:px-8 lg:px-12 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4 flex-row-reverse">
            <Icon className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div ref={notificationRef} className="relative flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                aria-label="الإشعارات"
                aria-expanded={showNotificationPanel}
                onClick={() => setShowNotificationPanel((prev) => !prev)}
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {notificationCount && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-sm">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
              {notificationMessage && notificationCount && notificationCount > 0 && showNotificationPanel && (
                <div className="absolute top-12 right-0 w-56">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationPanel(false);
                      onNotificationAction?.();
                    }}
                    className="relative w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 shadow-xl ring-1 ring-slate-100 text-right hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                  >
                    <span
                      className="absolute -top-2 right-8 block h-3 w-3 bg-white border border-slate-200 border-b-0 border-r-0 rotate-45 shadow-sm"
                      aria-hidden="true"
                    />
                    {notificationMessage}
                  </button>
                </div>
              )}
            </div>
            {userName && (
              <div className="text-sm font-medium text-gray-700" data-testid="admin-username">
                {userName}
              </div>
            )}
            <Button
              variant="outline"
              onClick={onLogout}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              size="sm"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              size="sm"
              aria-label="العودة للمنصة"
            >
              <Navigation size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              size="sm"
              aria-label="تحديث"
            >
              <RefreshCw size={16} className={cn(loading ? 'animate-spin' : undefined)} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
