/**
 * AdminChart.tsx — Themed chart component using shadcn ChartContainer
 *
 * Wraps Recharts with shadcn's ChartContainer for consistent theming,
 * tooltips, and legends across the application.
 */

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { CHART_COLOR_ARRAY } from "@/config/design-tokens";

interface ChartData {
  [key: string]: string | number;
}

interface AdminChartProps {
  title?: string;
  description?: string;
  data: ChartData[];
  type: "line" | "bar" | "area" | "pie";
  dataKeys: string[];
  xAxisKey?: string;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

function buildConfig(dataKeys: string[], colors: string[]): ChartConfig {
  const config: ChartConfig = {};
  dataKeys.forEach((key, i) => {
    config[key] = { label: key, color: colors[i % colors.length] };
  });
  return config;
}

export function AdminChart({
  title,
  description,
  data,
  type,
  dataKeys,
  xAxisKey = "name",
  colors = CHART_COLOR_ARRAY,
  showLegend = true,
  showGrid = true,
}: AdminChartProps) {
  const config = buildConfig(dataKeys, colors);

  const renderChart = () => {
    const commonAxis = (
      <>
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        <XAxis dataKey={xAxisKey} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </>
    );

    switch (type) {
      case "line":
        return (
          <LineChart data={data} accessibilityLayer>
            {commonAxis}
            {dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={`var(--color-${key})`} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart data={data} accessibilityLayer>
            {commonAxis}
            {dataKeys.map((key) => (
              <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart data={data} accessibilityLayer>
            {commonAxis}
            {dataKeys.map((key) => (
              <Area key={key} type="monotone" dataKey={key} stroke={`var(--color-${key})`} fill={`var(--color-${key})`} fillOpacity={0.2} />
            ))}
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart accessibilityLayer>
            <Pie data={data} dataKey={dataKeys[0]} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius={80} label>
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          </PieChart>
        );
      default:
        return null;
    }
  };

  const chart = (
    <ChartContainer config={config} className="min-h-[200px] w-full">
      {renderChart()!}
    </ChartContainer>
  );

  if (title || description) {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{chart}</CardContent>
      </Card>
    );
  }

  return chart;
}

export function AdminLineChart(props: Omit<AdminChartProps, "type">) { return <AdminChart {...props} type="line" />; }
export function AdminBarChart(props: Omit<AdminChartProps, "type">) { return <AdminChart {...props} type="bar" />; }
export function AdminAreaChart(props: Omit<AdminChartProps, "type">) { return <AdminChart {...props} type="area" />; }
export function AdminPieChart(props: Omit<AdminChartProps, "type">) { return <AdminChart {...props} type="pie" />; }
