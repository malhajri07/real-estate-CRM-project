import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, formatPrice } from '@/lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TIME_PERIOD_LABELS } from '@/constants/labels';

interface AdminCardProps {
    title?: string;
    description?: string;
    className?: string;
    children?: ReactNode;
    onClick?: () => void;
}

export function AdminCard({
    title,
    description,
    className,
    children,
    onClick,
}: AdminCardProps) {
    return (
        <Card
            className={cn(
                'glass border-0 rounded-2xl transition-all duration-300',
                onClick && 'cursor-pointer hover:shadow-2xl hover:-translate-y-1',
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="p-6 pb-2">
                {title && <CardTitle className="text-xl font-bold tracking-tight text-foreground">{title}</CardTitle>}
                {description && <p className="text-sm text-muted-foreground font-medium">{description}</p>}
            </CardHeader>
            <CardContent className="p-6 pt-2">
                {children}
            </CardContent>
        </Card>
    );
}

interface MetricCardProps {
    title: string;
    subtitle: string;
    icon: ReactNode;
    metric?: { today: number; last7Days: number; last30Days: number };
    currency?: string;
    loading?: boolean;
    className?: string;
}

export function MetricCard({
    title,
    subtitle,
    icon,
    metric,
    currency,
    loading,
    className,
}: MetricCardProps) {
    const formatCurrency = (val?: number, curr = 'SAR') => formatPrice(val, curr);

    return (
        <Card className={cn("glass border-0 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 rounded-2xl group", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-foreground tracking-tight">{title}</CardTitle>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{subtitle}</p>
                </div>
                <div className="icon-container-sm group-hover:bg-primary/20 transition-colors duration-300">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
                {loading ? (
                    <div className="h-10 w-full animate-pulse bg-slate-100 rounded-xl" />
                ) : (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-muted-foreground mb-1">{TIME_PERIOD_LABELS.today}</span>
                            <span className="text-sm font-bold text-foreground">
                                {currency ? formatCurrency(metric?.today, currency) : formatNumber(metric?.today)}
                            </span>
                        </div>
                        <div className="flex flex-col border-s border-border ps-3">
                            <span className="text-xs font-bold text-muted-foreground mb-1">{TIME_PERIOD_LABELS.week7}</span>
                            <span className="text-sm font-bold text-foreground">
                                {currency ? formatCurrency(metric?.last7Days, currency) : formatNumber(metric?.last7Days)}
                            </span>
                        </div>
                        <div className="flex flex-col border-s border-border ps-3">
                            <span className="text-xs font-bold text-muted-foreground mb-1">{TIME_PERIOD_LABELS.month30}</span>
                            <span className="text-sm font-bold text-foreground">
                                {currency ? formatCurrency(metric?.last30Days, currency) : formatNumber(metric?.last30Days)}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * @deprecated Use MetricCard instead.
 */
export const AdminMetricCard = MetricCard;
