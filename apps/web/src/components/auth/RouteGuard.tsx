
import React, { ComponentType, LazyExoticComponent, Suspense } from 'react';
import { useAuth, UserRole } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton, FullPageSkeleton } from '@/components/skeletons/dashboard-skeleton';
import PlatformShell from '@/components/layout/PlatformShell';
import { logger } from '@/lib/logger';

interface RouteGuardProps {
    component: ComponentType<any> | LazyExoticComponent<ComponentType<any>>;
    allowedRoles?: readonly UserRole[];
    requiredPermission?: string;
    withShell?: boolean;
    shellProps?: {
        title?: string;
        searchPlaceholder?: string;
        onLogout?: () => void;
    };
}

const AccessDenied = ({
    redirectTo = '/home/platform',
    message = 'ليس لديك الصلاحية للوصول إلى هذه الصفحة.',
}: {
    redirectTo?: string;
    message?: string;
}) => {
    const [, setLocation] = useLocation();
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="max-w-md w-full space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <span className="text-2xl">🔒</span>
                </div>
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold text-foreground">صلاحية غير كافية</h1>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setLocation(redirectTo, { replace: true })}
                        className="rounded-full"
                    >
                        العودة إلى المنصة
                    </Button>
                    <Button
                        onClick={() => setLocation('/home', { replace: true })}
                        className="rounded-full bg-primary hover:bg-primary/90"
                    >
                        الذهاب إلى الصفحة الرئيسية
                    </Button>
                </div>
            </div>
        </div>
    );
};

export function RouteGuard({
    component: Component,
    allowedRoles,
    requiredPermission,
    withShell = false,
    shellProps,
}: RouteGuardProps) {
    const { hasRole, hasPermission, user } = useAuth();

    if (allowedRoles && !hasRole(Array.from(allowedRoles))) {
        logger.warn('Access Denied: Missing required role', {
            context: 'RouteGuard',
            data: { userRoles: user?.roles, allowedRoles }
        });
        return <AccessDenied message="حسابك الحالي لا يمتلك صلاحية الوصول إلى هذه الصفحة داخل المنصة." />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        logger.warn('Access Denied: Missing required permission', {
            context: 'RouteGuard',
            data: { userRoles: user?.roles, requiredPermission }
        });
        return <AccessDenied message="صلاحية إضافية مطلوبة للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام." />;
    }

    const content = (
        <Suspense fallback={
            <div className="h-full">
                <DashboardSkeleton />
            </div>
        }>
            <Component />
        </Suspense>
    );

    if (withShell) {
        return (
            <PlatformShell
                onLogout={shellProps?.onLogout}
                title={shellProps?.title}
                searchPlaceholder={shellProps?.searchPlaceholder}
            >
                {content}
            </PlatformShell>
        );
    }

    // Without shell — show full page skeleton with sidebar frame
    return (
        <Suspense fallback={<FullPageSkeleton />}>
            <Component />
        </Suspense>
    );
}
