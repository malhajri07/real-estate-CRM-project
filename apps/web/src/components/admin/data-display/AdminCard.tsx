/**
 * AdminCard.tsx - Admin Card Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → data-display/ → AdminCard.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin card component for displaying metrics and data. Provides:
 * - Metric card display
 * - Trend indicators
 * - Icon support
 * 
 * Related Files:
 * - apps/web/src/pages/admin/enhanced-dashboard.tsx - Uses this component
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminCardProps {
    title?: string;
    description?: string;
    value?: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    children?: ReactNode;
    onClick?: () => void;
}

export function AdminCard({
    title,
    description,
    value,
    icon,
    trend,
    className,
    children,
    onClick,
}: AdminCardProps) {
    const isClickable = !!onClick;

    return (
        <div
            className={cn(
                'rounded-lg border bg-card text-card-foreground shadow-sm transition-all',
                isClickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
                className
            )}
            onClick={onClick}
        >
            <div className="p-6">
                {(title || icon) && (
                    <div className="flex items-center justify-between mb-2">
                        {title && (
                            <h3 className="text-sm font-medium text-muted-foreground">
                                {title}
                            </h3>
                        )}
                        {icon && (
                            <div className="h-8 w-8 text-muted-foreground">
                                {icon}
                            </div>
                        )}
                    </div>
                )}

                {value !== undefined && (
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{value}</p>
                        {trend && (
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                )}

                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}

                {children && <div className="mt-4">{children}</div>}
            </div>
        </div>
    );
}

interface AdminMetricCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
    onClick?: () => void;
}

export function AdminMetricCard({
    title,
    value,
    icon,
    trend,
    color = 'blue',
    onClick,
}: AdminMetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <AdminCard onClick={onClick}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold mt-2">{value}</p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            {trend.label && (
                                <span className="text-xs text-muted-foreground">
                                    {trend.label}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
                    {icon}
                </div>
            </div>
        </AdminCard>
    );
}
