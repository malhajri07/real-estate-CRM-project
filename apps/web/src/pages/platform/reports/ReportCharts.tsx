import { TrendingUp, Users, Building, BarChart3, PieChart, LineChart, Activity, DollarSign, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
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
  const renderTooltip = (props: any) => (
    <ChartTooltip
      {...props}
      formatter={(value: number) => formatCurrency(value)}
    />
  );

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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <RechartsLineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke={CHART_COLORS.primary} strokeWidth={2} />
                  <Line type="monotone" dataKey="properties" stroke={CHART_COLORS.blue} strokeWidth={2} />
                  <Line type="monotone" dataKey="deals" stroke={CHART_COLORS.green} strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
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
                    <Tooltip />
                  </RechartsPieChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
                )}
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={propertyTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={dealStageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="count" fill={CHART_COLORS.blue} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="deals" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="conversion" fill={CHART_COLORS.amber} />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} />
                  <Area type="monotone" dataKey="commission" stackId="1" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} />
                </AreaChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="revenue" fill={CHART_COLORS.red} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <RechartsLineChart data={marketTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="residential" stroke={CHART_COLORS.primary} strokeWidth={2} />
                  <Line type="monotone" dataKey="commercial" stroke={CHART_COLORS.blue} strokeWidth={2} />
                  <Line type="monotone" dataKey="industrial" stroke={CHART_COLORS.amber} strokeWidth={2} />
                  <Line type="monotone" dataKey="land" stroke={CHART_COLORS.red} strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
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
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );
}
