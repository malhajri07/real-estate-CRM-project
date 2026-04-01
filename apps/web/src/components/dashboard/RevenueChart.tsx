
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { CHART_COLORS } from '@/config/design-tokens';

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
                                    <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
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
                                content={
                                  <ChartTooltip
                                    formatter={(value: number) => `SAR ${value}`}
                                  />
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke={CHART_COLORS.green}
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
