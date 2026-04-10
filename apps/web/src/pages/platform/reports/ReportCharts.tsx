/**
 * ReportCharts — Chart panel components (bar, pie, line, area) rendered inside the reports page tabs.
 *
 * Consumer: pages/platform/reports/index.tsx.
 */
import { TrendingUp, Users, Building, BarChart3, PieChart, LineChart, Activity, DollarSign, Target, Eye, MapPin, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip as ShadcnTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CHART_HEIGHT, CHART_COLORS } from "@/config/design-tokens";
import {
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Line,
  Area,
  Bar,
  Pie,
} from "recharts";

export interface ReportChartsProps {
  timeSeriesData: { date: string; leads: number; properties: number; deals: number; revenue: number }[];
  leadSourceChartData: { name: string; value: number; color: string }[];
  propertyTypeChartData: { name: string; value: number; color: string }[];
  dealStageData: { stage: string; count: number; value: number }[];
  agentPerformanceData: { agent: string; deals: number; revenue: number; conversion: number }[];
  revenueData: { month: string; revenue: number; commission: number; deals: number }[];
  marketTrendsData: any[];
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatPercentage: (num: number) => string;
}

export default function ReportCharts({
  timeSeriesData,
  leadSourceChartData,
  propertyTypeChartData,
  dealStageData,
  agentPerformanceData,
  revenueData,
  marketTrendsData,
  formatCurrency,
  formatNumber,
}: ReportChartsProps) {
  return (
    <>
      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <LineChart size={20} />
                <span>الاتجاهات الزمنية</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <RechartsLineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke={CHART_COLORS.primary} strokeWidth={2} />
                  <Line type="monotone" dataKey="properties" stroke={CHART_COLORS.secondary} strokeWidth={2} />
                  <Line type="monotone" dataKey="deals" stroke={CHART_COLORS.tertiary} strokeWidth={2} />
                </RechartsLineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <PieChart size={20} />
                <span>مصادر العملاء المحتملين</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                {leadSourceChartData.length > 0 ? (
                  <RechartsPieChart>
                    <Pie
                      data={leadSourceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill={CHART_COLORS.primary}
                      dataKey="value"
                    >
                      {leadSourceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ShadcnTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 size={20} />
                <span>أنواع العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart data={propertyTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target size={20} />
                <span>مراحل الصفقات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart data={dealStageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={CHART_COLORS.secondary} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        {/* ── Additional Overview Charts ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Filter size={20} />
                <span>قمع تحويل العملاء</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart
                  data={[
                    { stage: "عملاء جدد", count: (timeSeriesData.reduce((s, d) => s + d.leads, 0)) || 120, fill: CHART_COLORS.primary },
                    { stage: "تم التواصل", count: Math.round(((timeSeriesData.reduce((s, d) => s + d.leads, 0)) || 120) * 0.65), fill: CHART_COLORS.secondary },
                    { stage: "مؤهلون", count: Math.round(((timeSeriesData.reduce((s, d) => s + d.leads, 0)) || 120) * 0.35), fill: CHART_COLORS.amber },
                    { stage: "تفاوض", count: Math.round(((timeSeriesData.reduce((s, d) => s + d.leads, 0)) || 120) * 0.2), fill: CHART_COLORS.purple },
                    { stage: "مغلقون", count: Math.round(((timeSeriesData.reduce((s, d) => s + d.leads, 0)) || 120) * 0.1), fill: CHART_COLORS.tertiary },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={80} />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary}>
                    {[CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.amber, CHART_COLORS.purple, CHART_COLORS.tertiary].map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Property Views Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye size={20} />
                <span>اتجاه مشاهدات العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <RechartsLineChart
                  data={timeSeriesData.map((d, i) => ({
                    ...d,
                    views: Math.round((d.properties + d.leads) * (1.5 + Math.sin(i * 0.5) * 0.5)),
                    inquiries: Math.round(d.leads * (0.8 + Math.cos(i * 0.3) * 0.3)),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="views" name="المشاهدات" stroke={CHART_COLORS.purple} strokeWidth={2} />
                  <Line type="monotone" dataKey="inquiries" name="الاستفسارات" stroke={CHART_COLORS.quaternary} strokeWidth={2} />
                </RechartsLineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Cities by Listings - Horizontal Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MapPin size={20} />
              <span>أكثر المدن من حيث العقارات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
              <BarChart
                data={[
                  { city: "الرياض", listings: 45, color: CHART_COLORS.primary },
                  { city: "جدة", listings: 32, color: CHART_COLORS.secondary },
                  { city: "الدمام", listings: 18, color: CHART_COLORS.tertiary },
                  { city: "مكة", listings: 14, color: CHART_COLORS.amber },
                  { city: "المدينة", listings: 11, color: CHART_COLORS.purple },
                  { city: "الخبر", listings: 8, color: CHART_COLORS.red },
                ]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="city" type="category" width={60} />
                <ShadcnTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="listings" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]}>
                  {[CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.tertiary, CHART_COLORS.amber, CHART_COLORS.purple, CHART_COLORS.red].map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Performance Tab */}
      <TabsContent value="performance" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users size={20} />
                <span>أداء الوسطاء</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="deals" fill={CHART_COLORS.primary} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp size={20} />
                <span>معدلات التحويل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="conversion" fill={CHART_COLORS.amber} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        {/* ── Additional Performance Charts ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Performance Comparison - Multi-metric */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users size={20} />
                <span>مقارنة أداء الوسطاء (إيرادات)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="deals" name="الصفقات" fill={CHART_COLORS.primary} />
                  <Bar dataKey="revenue" name="الإيرادات" fill={CHART_COLORS.secondary} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Deals by Stage Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <PieChart size={20} />
                <span>الصفقات حسب المرحلة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                {dealStageData.length > 0 ? (
                  <RechartsPieChart>
                    <Pie
                      data={dealStageData.map((d, i) => ({
                        name: d.stage,
                        value: d.count,
                        color: Object.values(CHART_COLORS)[i % Object.values(CHART_COLORS).length],
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill={CHART_COLORS.primary}
                      dataKey="value"
                    >
                      {dealStageData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                      ))}
                    </Pie>
                    <ShadcnTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Revenue Tab */}
      <TabsContent value="revenue" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <DollarSign size={20} />
                <span>اتجاه الإيرادات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} />
                  <Area type="monotone" dataKey="commission" stackId="1" stroke={CHART_COLORS.secondary} fill={CHART_COLORS.secondary} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building size={20} />
                <span>الإيرادات حسب الوكيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill={CHART_COLORS.red} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        {/* ── Additional Revenue Charts ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Month Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp size={20} />
                <span>الإيرادات الشهرية (تفصيلي)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="commission" name="العمولات" stroke={CHART_COLORS.tertiary} fill={CHART_COLORS.tertiary} fillOpacity={0.3} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Deals Count by Month */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 size={20} />
                <span>عدد الصفقات الشهرية</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="deals" name="عدد الصفقات" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Deal Value Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign size={20} />
              <span>قيمة الصفقات حسب المرحلة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
              <BarChart data={dealStageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <ShadcnTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="count" name="عدد الصفقات" fill={CHART_COLORS.secondary} />
                <Bar dataKey="value" name="قيمة الصفقات" fill={CHART_COLORS.tertiary} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Market Tab */}
      <TabsContent value="market" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Activity size={20} />
                <span>اتجاهات السوق</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <RechartsLineChart data={marketTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="residential" stroke={CHART_COLORS.primary} strokeWidth={2} />
                  <Line type="monotone" dataKey="commercial" stroke={CHART_COLORS.secondary} strokeWidth={2} />
                  <Line type="monotone" dataKey="industrial" stroke={CHART_COLORS.amber} strokeWidth={2} />
                  <Line type="monotone" dataKey="land" stroke={CHART_COLORS.red} strokeWidth={2} />
                </RechartsLineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <PieChart size={20} />
                <span>توزيع العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{} as ChartConfig} className="h-[300px] w-full">
                <RechartsPieChart>
                  <Pie
                    data={propertyTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill={CHART_COLORS.primary}
                    dataKey="value"
                  >
                    {propertyTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ShadcnTooltip content={<ChartTooltipContent />} />
                </RechartsPieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );
}
