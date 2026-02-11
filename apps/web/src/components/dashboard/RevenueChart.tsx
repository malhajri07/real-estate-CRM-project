
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueChartData {
    name: string;
    revenue: number;
}

export function RevenueChart() {
    const { t, language } = useLanguage();
    const isRtl = language === 'ar';

    // Fetch real revenue data from API
    const { data: chartData, isLoading } = useQuery<RevenueChartData[]>({
        queryKey: ["/api/reports/dashboard/revenue-chart"],
    });

    const formattedData = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            // Return empty data structure if no data
            const monthNames = isRtl 
                ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
                : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return monthNames.map(name => ({ name, revenue: 0 }));
        }
        return chartData;
    }, [chartData, isRtl]);

    if (isLoading) {
        return (
            <div className="w-full">
                <CardContent className="ps-2">
                    <Skeleton className="h-[300px] w-full rounded-2xl" />
                </CardContent>
            </div>
        );
    }

    return (
        <div className="w-full">
            <CardContent className="ps-2">
                <div className="h-[300px] w-full" style={{ direction: 'ltr' }}>
                    {/* Charts are usually LTR regardless of page direction for axis consistency, or need specific handling */}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={formattedData}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                reversed={isRtl}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `SAR ${value}`}
                                orientation={isRtl ? 'right' : 'left'}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: number) => [`SAR ${value}`, t('dashboard.revenue') || 'الإيرادات']}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </div>
    );
}
