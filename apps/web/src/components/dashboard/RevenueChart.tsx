/**
 * RevenueChart — Area chart visualising monthly revenue trends on the agent dashboard.
 *
 * Consumer: pages/platform/dashboard.tsx.
 */
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueChartData {
  name: string;
  revenue: number;
}

const chartConfig = {
  revenue: { label: "الإيرادات", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function RevenueChart() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const { data: chartData, isLoading } = useQuery<RevenueChartData[]>({
    queryKey: ["/api/reports/dashboard/revenue-chart"],
  });

  const formattedData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      const months = isRtl
        ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
        : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return months.map((name) => ({ name, revenue: 0 }));
    }
    return chartData;
  }, [chartData, isRtl]);

  if (isLoading) {
    return <CardContent className="ps-2"><Skeleton className="h-[300px] w-full rounded-2xl" /></CardContent>;
  }

  return (
    <CardContent className="ps-2">
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis fontSize={11} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="url(#revenueGradient)" fillOpacity={1} />
        </AreaChart>
      </ChartContainer>
    </CardContent>
  );
}
