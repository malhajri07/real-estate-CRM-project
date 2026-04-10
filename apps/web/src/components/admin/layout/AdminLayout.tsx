/**
 * AdminLayout — Root shell that composes AdminSidebar + AdminHeader around page content.
 *
 * Consumer: all pages rendered under /admin/* routes.
 */
import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminSidebarConfig } from '@/config/admin-sidebar';
import { mapConfigToSidebarItems, getActiveItemFromRoute, getExpandedItemsFromRoute } from '@/components/admin/utilities/sidebar-utils';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

type AdminLayoutProps = {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    isLoading?: boolean;
    onRefresh?: () => void;
};

export function AdminLayout({
    children,
    title,
    subtitle,
    actions,
    isLoading = false,
    onRefresh,
}: AdminLayoutProps) {
    const { t, dir } = useLanguage();
    const { user, logout } = useAuth();
    const [location, setLocation] = useLocation();

    const [expandedItems, setExpandedItems] = useState<string[]>(() =>
        getExpandedItemsFromRoute(location, adminSidebarConfig)
    );

    const activeItem = getActiveItemFromRoute(location, adminSidebarConfig);
    const sidebarItems = mapConfigToSidebarItems(adminSidebarConfig, t);

    const handleToggleItem = useCallback((id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    }, []);

    const handleSelectSubPage = useCallback((route: string) => {
        setLocation(route);
    }, [setLocation]);

    const handleBack = useCallback(() => {
        setLocation('/admin/overview/main-dashboard');
    }, [setLocation]);

    const handleRefresh = useCallback(() => {
        if (onRefresh) {
            onRefresh();
        } else {
            window.location.reload();
        }
    }, [onRefresh]);

    return (
        <SidebarProvider>
            <AdminSidebar
                dir={document.documentElement.dir as 'rtl' | 'ltr' || 'rtl'}
                items={sidebarItems}
                activeItem={activeItem}
                expandedItems={expandedItems}
                onToggleItem={handleToggleItem}
                activeRoute={location}
                onSelectSubPage={handleSelectSubPage}
            />
            <SidebarInset>
                <AdminHeader
                    title={title}
                    subtitle={subtitle}
                    onLogout={logout}
                    onBack={handleBack}
                    onRefresh={handleRefresh}
                    loading={isLoading}
                    userName={user?.name || user?.email}
                />
                <div className="flex-1 p-6 md:p-10">
                    <div className="mx-auto w-full max-w-7xl">
                        {actions && (
                            <div className="mb-8 flex flex-wrap justify-end gap-3">
                                {actions}
                            </div>
                        )}
                        <div className="relative">
                            {children}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
