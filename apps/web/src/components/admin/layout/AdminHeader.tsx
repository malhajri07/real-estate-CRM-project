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
 * - SidebarTrigger for mobile menu toggle
 * 
 * Related Files:
 * - apps/web/src/components/admin/layout/AdminSidebar.tsx - Admin sidebar
 * - apps/web/src/pages/admin/dashboard.tsx - Admin dashboard
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
  notificationMessage?: string;
  onNotificationAction?: () => void;
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
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
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
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div ref={notificationRef} className="relative flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
              aria-expanded={showNotificationPanel}
              onClick={() => setShowNotificationPanel((prev) => !prev)}
            >
              <Bell className="h-4 w-4" />
              {notificationCount && notificationCount > 0 && (
                <span className="absolute end-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground shadow-sm">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
            {notificationMessage && notificationCount && notificationCount > 0 && showNotificationPanel && (
              <div className="absolute end-0 top-12 z-50 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setShowNotificationPanel(false);
                    onNotificationAction?.();
                  }}
                  className="relative w-full rounded-lg border bg-popover p-4 text-start text-sm text-popover-foreground shadow-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {notificationMessage}
                </Button>
              </div>
            )}
          </div>

          {userName && (
            <div className="hidden flex-col items-end px-2 sm:flex">
              <span className="text-xs font-semibold leading-none">{userName}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Admin</span>
            </div>
          )}

          <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && 'animate-spin')} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              aria-label="Back to platform"
            >
              <Navigation className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={onLogout}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
