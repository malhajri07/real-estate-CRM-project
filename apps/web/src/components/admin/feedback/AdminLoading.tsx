import { cn } from '@/lib/utils';

interface AdminLoadingProps {
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export function AdminLoading({ text = 'جار التحميل...', fullScreen = false, className }: AdminLoadingProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">{text}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex items-center justify-center py-8', className)}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{text}</p>
            </div>
        </div>
    );
}

export function AdminSkeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse bg-muted rounded', className)} />;
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(rows)].map((_, i) => (
                <AdminSkeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}

export function AdminCardSkeleton() {
    return (
        <div className="rounded-lg border p-6 space-y-3">
            <AdminSkeleton className="h-4 w-24" />
            <AdminSkeleton className="h-8 w-32" />
            <AdminSkeleton className="h-3 w-20" />
        </div>
    );
}
