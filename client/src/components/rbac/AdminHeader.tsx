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
}: AdminHeaderProps) {
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
            <Button
              variant="ghost"
              size="sm"
              className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
              aria-label="الإشعارات"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {notificationCount && notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-sm">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
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
