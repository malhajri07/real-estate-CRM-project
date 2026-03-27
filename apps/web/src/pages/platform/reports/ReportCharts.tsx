import { TrendingUp, Users, Building, BarChart3, PieChart, LineChart, Activity, DollarSign, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

function CustomTooltip({ active, payload, label, formatCurrency, formatNumber }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border rounded-xl shadow-lg text-end">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className={cn(
              "flex items-center justify-between text-sm",
              entry.color ? `text-[${entry.color}]` : "text-foreground",
            )}
          >
            <span>{entry.dataKey}:</span>
            <span className="font-medium">
              {entry.dataKey === "revenue" || entry.dataKey === "commission"
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
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
    <CustomTooltip {...props} formatCurrency={formatCurrency} formatNumber={formatNumber} />
  );

  return (
    <>
      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <LineChart size={20} />
                <span>الاتجاهات الزمنية</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke="hsl(145 35% 58%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="properties" stroke="hsl(205 70% 27%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="deals" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <PieChart size={20} />
                <span>مصادر العملاء المحتملين</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {leadSourceChartData.length > 0 ? (
                  <RechartsPieChart>
                    <Pie
                      data={leadSourceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(145 35% 58%)"
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
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <BarChart3 size={20} />
                <span>أنواع العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertyTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="value" fill="hsl(145 35% 58%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Target size={20} />
                <span>مراحل الصفقات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dealStageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="count" fill="hsl(205 70% 27%)" />
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
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Users size={20} />
                <span>أداء الوسطاء</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="deals" fill="hsl(145 35% 58%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <TrendingUp size={20} />
                <span>معدلات التحويل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="conversion" fill="hsl(35 91% 65%)" />
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
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <DollarSign size={20} />
                <span>اتجاه الإيرادات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(145 35% 58%)" fill="hsl(145 35% 58%)" />
                  <Area type="monotone" dataKey="commission" stackId="1" stroke="hsl(205 70% 27%)" fill="hsl(205 70% 27%)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Building size={20} />
                <span>الإيرادات حسب الوكيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="revenue" fill="hsl(0 84% 60%)" />
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
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Activity size={20} />
                <span>اتجاهات السوق</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={marketTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="residential" stroke="hsl(145 35% 58%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="commercial" stroke="hsl(205 70% 27%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="industrial" stroke="hsl(35 91% 65%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="land" stroke="hsl(0 84% 60%)" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <PieChart size={20} />
                <span>توزيع العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={propertyTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(145 35% 58%)"
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
