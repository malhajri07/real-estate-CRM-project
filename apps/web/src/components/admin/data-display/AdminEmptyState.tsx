import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminEmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function AdminEmptyState({
    icon,
    title,
    description,
    action,
    className,
}: AdminEmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
            {icon && (
                <div className="h-16 w-16 text-muted-foreground mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
