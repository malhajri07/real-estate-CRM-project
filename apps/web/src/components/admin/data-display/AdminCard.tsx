import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
                'glass border-0 rounded-[2rem] transition-all duration-300',
                onClick && 'cursor-pointer hover:shadow-2xl hover:-translate-y-1',
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="p-6 pb-2">
                {title && <CardTitle className="text-xl font-bold tracking-tight text-slate-900">{title}</CardTitle>}
                {description && <p className="text-sm text-slate-500 font-medium">{description}</p>}
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
    const formatNumber = (val?: number) => (val ?? 0).toLocaleString('en-US');
    const formatCurrency = (val?: number, curr = 'SAR') => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val ?? 0);
        return `${formatted} ريال`;
    };

    return (
        <Card className={cn("glass border-0 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 rounded-[2rem] group", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">{title}</CardTitle>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{subtitle}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl group-hover:bg-blue-600 transition-colors duration-300 group-hover:text-white">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
                {loading ? (
                    <div className="h-10 w-full animate-pulse bg-slate-100 rounded-xl" />
                ) : (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">اليوم</span>
                            <span className="text-sm font-black text-slate-900">
                                {currency ? formatCurrency(metric?.today, currency) : formatNumber(metric?.today)}
                            </span>
                        </div>
                        <div className="flex flex-col border-s border-slate-100 ps-3">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">٧ أيام</span>
                            <span className="text-sm font-black text-slate-900">
                                {currency ? formatCurrency(metric?.last7Days, currency) : formatNumber(metric?.last7Days)}
                            </span>
                        </div>
                        <div className="flex flex-col border-s border-slate-100 ps-3">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">٣٠ يوم</span>
                            <span className="text-sm font-black text-slate-900">
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
