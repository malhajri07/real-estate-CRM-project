import { useState, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminSidebarConfig } from '@/config/admin-sidebar';
import { mapConfigToSidebarItems, getActiveItemFromRoute, getExpandedItemsFromRoute } from '@/components/admin/utilities/sidebar-utils';

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

    // Sidebar State
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
        setLocation('/platform/dashboard');
    }, [setLocation]);

    const handleRefresh = useCallback(() => {
        if (onRefresh) {
            onRefresh();
        } else {
            window.location.reload();
        }
    }, [onRefresh]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden" dir={dir}>
            {/* Subtle background decorative elements */}
            <div className="absolute top-[-10%] start-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] end-[-10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <AdminHeader
                title={title}
                subtitle={subtitle}
                onLogout={logout}
                onBack={handleBack}
                onRefresh={handleRefresh}
                loading={isLoading}
                userName={user?.name || user?.email}
            />

            <div className="flex flex-1 pt-20 relative z-10">
                {/* Sidebar */}
                <aside className="hidden md:block w-72 fixed inset-y-0 start-0 top-20 bottom-0 z-40 transition-all duration-300">
                    <AdminSidebar
                        dir={dir}
                        items={sidebarItems}
                        activeItem={activeItem}
                        expandedItems={expandedItems}
                        onToggleItem={handleToggleItem}
                        activeRoute={location}
                        onSelectSubPage={handleSelectSubPage}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 md:ms-72 p-6 md:p-10 w-full max-w-7xl mx-auto transition-all duration-300 animate-in-start">
                    {actions && (
                        <div className="mb-8 flex justify-end gap-3 flex-wrap">
                            {actions}
                        </div>
                    )}
                    <div className="relative">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
