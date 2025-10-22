import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, TrendingUp, Users, Building, Calendar, BarChart3, PieChart, LineChart, Activity, DollarSign, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MetricsCard from "@/components/ui/metrics-card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Lead, Property, Deal } from "@shared/types";

// Recharts components for comprehensive charts
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
  Pie
} from 'recharts';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: deals } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const filterDataByPeriod = (data: any[], dateField: string) => {
    if (!data) return [];
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(item => new Date(item[dateField]) >= cutoffDate);
  };

  const filteredLeads = filterDataByPeriod(leads || [], 'createdAt');
  const filteredProperties = filterDataByPeriod(properties || [], 'createdAt');
  const filteredDeals = filterDataByPeriod(deals || [], 'createdAt');

  const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const calculateConversionRate = () => {
    if (!filteredLeads || filteredLeads.length === 0) return 0;
    const closedDeals = filteredDeals.filter(deal => deal.stage === 'closed').length;
    const rate = (closedDeals / filteredLeads.length) * 100;
    return Number.isFinite(rate) ? Number(rate.toFixed(1)) : 0;
  };

  const calculateAveragePropertyPrice = () => {
    if (!filteredProperties || filteredProperties.length === 0) return 0;
    const totalValue = filteredProperties.reduce((sum, property) => {
      const value = toNumber(property.price);
      return sum + (value ?? 0);
    }, 0);
    return filteredProperties.length > 0 ? totalValue / filteredProperties.length : 0;
  };

  const calculateTotalCommission = () => {
    if (!filteredDeals) return 0;
    return filteredDeals
      .filter(deal => deal.stage === 'closed')
      .reduce((sum, deal) => {
        const commission = toNumber(deal.commission);
        return sum + (commission ?? 0);
      }, 0);
  };

  const totalPipelineValue = filteredDeals.reduce((sum, deal) => {
    const value = toNumber(deal.dealValue);
    return sum + (value ?? 0);
  }, 0);

  const averageDealValue = filteredDeals.length > 0 ? totalPipelineValue / filteredDeals.length : 0;
  const commissionRatePercentage = totalPipelineValue > 0 ? (calculateTotalCommission() / totalPipelineValue) * 100 : 0;

  const getLeadSourceBreakdown = () => {
    if (!filteredLeads) return [];
    const sources: { [key: string]: number } = {};
    filteredLeads.forEach(lead => {
      const source = lead.leadSource || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources).map(([source, count]) => ({ source, count }));
  };

  const getPropertyTypeBreakdown = () => {
    if (!filteredProperties) return [];
    const types: { [key: string]: number } = {};
    filteredProperties.forEach(property => {
      const type = property.propertyType || 'Unknown';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ﷼';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num) + '%';
  };

  // Chart data preparation functions
  const getTimeSeriesData = () => {
    const days = parseInt(selectedPeriod);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLeads = filteredLeads.filter(lead => 
        new Date(lead.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayProperties = filteredProperties.filter(property => 
        new Date(property.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayDeals = filteredDeals.filter(deal => 
        new Date(deal.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      data.push({
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        leads: dayLeads,
        properties: dayProperties,
        deals: dayDeals,
        revenue: dayDeals * 50000 // Mock revenue calculation
      });
    }
    
    return data;
  };

  const getRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 500000) + 100000,
      commission: Math.floor(Math.random() * 50000) + 10000,
      deals: Math.floor(Math.random() * 20) + 5
    }));
  };

  const getPropertyTypeChartData = () => {
    const breakdown = getPropertyTypeBreakdown();
    // Using website's color scheme: primary green, secondary blue, success, warning, error
    const colors = ['hsl(145 35% 58%)', 'hsl(205 70% 27%)', 'hsl(142 76% 36%)', 'hsl(35 91% 65%)', 'hsl(0 84% 60%)', 'hsl(145 20% 90%)'];
    
    return breakdown.map((item, index) => ({
      name: item.type,
      value: item.count,
      color: colors[index % colors.length]
    }));
  };

  const getLeadSourceChartData = () => {
    const breakdown = getLeadSourceBreakdown();
    // Using website's color scheme: primary green, secondary blue, success, warning, error
    const colors = ['hsl(145 35% 58%)', 'hsl(205 70% 27%)', 'hsl(142 76% 36%)', 'hsl(35 91% 65%)', 'hsl(0 84% 60%)', 'hsl(145 20% 90%)'];
    
    return breakdown.map((item, index) => ({
      name: item.source,
      value: item.count,
      color: colors[index % colors.length]
    }));
  };

  const getDealStageData = () => {
    const stages = ['مبدئي', 'مفاوضات', 'عقد', 'مكتمل', 'ملغي'];
    return stages.map(stage => ({
      stage,
      count: Math.floor(Math.random() * 15) + 1,
      value: Math.floor(Math.random() * 2000000) + 500000
    }));
  };

  const getAgentPerformanceData = () => {
    const agents = ['أحمد محمد', 'فاطمة علي', 'محمد أحمد', 'نورا سعد', 'خالد عبدالله'];
    return agents.map(agent => ({
      agent,
      deals: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 800000) + 200000,
      conversion: Math.floor(Math.random() * 30) + 10
    }));
  };

  const getMarketTrendsData = () => {
    const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
    return quarters.map(quarter => ({
      quarter,
      residential: Math.floor(Math.random() * 100) + 50,
      commercial: Math.floor(Math.random() * 50) + 20,
      industrial: Math.floor(Math.random() * 30) + 10,
      land: Math.floor(Math.random() * 40) + 15
    }));
  };

  // Custom tooltip component with RTL support and proper formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-right">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className={cn(
                "flex items-center justify-between text-sm",
                entry.color ? `text-[${entry.color}]` : "text-foreground"
              )}
            >
              <span>{entry.dataKey}:</span>
              <span className="font-medium">
                {entry.dataKey === 'revenue' || entry.dataKey === 'commission'
                  ? formatCurrency(entry.value)
                  : formatNumber(entry.value)
                }
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportReport = () => {
    const reportData = {
      period: `${selectedPeriod} days`,
      generatedOn: new Date().toISOString(),
      metrics: {
        totalLeads: filteredLeads.length,
        totalProperties: filteredProperties.length,
        totalDeals: filteredDeals.length,
        conversionRate: `${calculateConversionRate()}%`,
        averagePropertyPrice: formatCurrency(calculateAveragePropertyPrice()),
        totalCommission: formatCurrency(calculateTotalCommission()),
      },
      leadSources: getLeadSourceBreakdown(),
      propertyTypes: getPropertyTypeBreakdown(),
    };

    const csvContent = [
      ['Report Period', reportData.period],
      ['Generated On', new Date(reportData.generatedOn).toLocaleDateString()],
      [''],
      ['METRICS'],
      ['Total Leads', reportData.metrics.totalLeads],
      ['Total Properties', reportData.metrics.totalProperties],
      ['Total Deals', reportData.metrics.totalDeals],
      ['Conversion Rate', reportData.metrics.conversionRate],
      ['Average Property Price', reportData.metrics.averagePropertyPrice],
      ['Total Commission', reportData.metrics.totalCommission],
      [''],
      ['LEAD SOURCES'],
      ...reportData.leadSources.map(item => [item.source, item.count]),
      [''],
      ['PROPERTY TYPES'],
      ...reportData.propertyTypes.map(item => [item.type, item.count]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-estate-report-${selectedPeriod}days-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "نجح", description: "تم تصدير التقرير بنجاح" });
  };

  if (metricsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">جار تحميل التقارير...</div>
      </div>
    );
  }

  return (
    <>
      <main className="w-full space-y-6">
        {/* Report Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Calendar size={20} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">فترة التقرير:</span>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">٧ أيام</SelectItem>
                  <SelectItem value="30">٣٠ يوماً</SelectItem>
                  <SelectItem value="90">٩٠ يوماً</SelectItem>
                  <SelectItem value="365">سنة واحدة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={exportReport}>
            <Download className="ml-2" size={16} />
            تصدير التقرير
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="العملاء المحتملين المولدين"
            value={formatNumber(filteredLeads.length)}
            change={`${filteredLeads.length > 0 ? '+' : ''}${formatNumber(filteredLeads.length)} في ${selectedPeriod} أيام`}
            changeType="positive"
            icon={Users}
            iconColor="bg-blue-100 text-blue-600"
          />
          
          <MetricsCard
            title="العقارات المدرجة"
            value={formatNumber(filteredProperties.length)}
            change={`${filteredProperties.length > 0 ? '+' : ''}${formatNumber(filteredProperties.length)} في ${selectedPeriod} أيام`}
            changeType="positive"
            icon={Building}
            iconColor="bg-green-100 text-green-600"
          />
          
          <MetricsCard
            title="معدل التحويل"
            value={formatPercentage(calculateConversionRate())}
            change="نسبة العميل المحتمل إلى الصفقة المكتملة"
            changeType="neutral"
            icon={TrendingUp}
            iconColor="bg-purple-100 text-purple-600"
          />
          
          <MetricsCard
            title="إجمالي العمولة"
            value={formatCurrency(calculateTotalCommission())}
            change={`من ${formatNumber(filteredDeals.filter(d => d.stage === 'closed').length)} صفقة مكتملة`}
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-yellow-100 text-yellow-600"
          />
        </div>

        {/* Comprehensive Charts Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="performance">الأداء</TabsTrigger>
            <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
            <TabsTrigger value="market">السوق</TabsTrigger>
            <TabsTrigger value="agents">الوسطاء</TabsTrigger>
            <TabsTrigger value="analytics">تحليلات متقدمة</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <LineChart size={20} />
                    <span>الاتجاهات الزمنية</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={getTimeSeriesData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="leads" stroke="hsl(145 35% 58%)" strokeWidth={2} />
                      <Line type="monotone" dataKey="properties" stroke="hsl(205 70% 27%)" strokeWidth={2} />
                      <Line type="monotone" dataKey="deals" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Lead Sources Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <PieChart size={20} />
                    <span>مصادر العملاء المحتملين</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={getLeadSourceChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(145 35% 58%)"
                        dataKey="value"
                      >
                        {getLeadSourceChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Types Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <BarChart3 size={20} />
                    <span>أنواع العقارات</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPropertyTypeChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="hsl(145 35% 58%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Deal Stages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Target size={20} />
                    <span>مراحل الصفقات</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getDealStageData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
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
              {/* Agent Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Users size={20} />
                    <span>أداء الوسطاء</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getAgentPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agent" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="deals" fill="hsl(145 35% 58%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Conversion Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <TrendingUp size={20} />
                    <span>معدلات التحويل</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getAgentPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agent" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
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
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <DollarSign size={20} />
                    <span>اتجاه الإيرادات</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getRevenueData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(145 35% 58%)" fill="hsl(145 35% 58%)" />
                      <Area type="monotone" dataKey="commission" stackId="1" stroke="hsl(205 70% 27%)" fill="hsl(205 70% 27%)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Building size={20} />
                    <span>الإيرادات حسب الوكيل</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getAgentPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agent" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
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
              {/* Market Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Activity size={20} />
                    <span>اتجاهات السوق</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={getMarketTrendsData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="residential" stroke="hsl(145 35% 58%)" strokeWidth={2} />
                      <Line type="monotone" dataKey="commercial" stroke="hsl(205 70% 27%)" strokeWidth={2} />
                      <Line type="monotone" dataKey="industrial" stroke="hsl(35 91% 65%)" strokeWidth={2} />
                      <Line type="monotone" dataKey="land" stroke="hsl(0 84% 60%)" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Property Distribution */}
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
                        data={getPropertyTypeChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(145 35% 58%)"
                        dataKey="value"
                      >
                        {getPropertyTypeChartData().map((entry, index) => (
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

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Agent Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Users size={20} />
                    <span>جدول أداء الوسطاء</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4">الوكيل</th>
                          <th className="text-right py-3 px-4">عدد الصفقات</th>
                          <th className="text-right py-3 px-4">الإيرادات</th>
                          <th className="text-right py-3 px-4">معدل التحويل</th>
                          <th className="text-right py-3 px-4">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAgentPerformanceData().map((agent, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4 font-medium">{agent.agent}</td>
                            <td className="py-3 px-4">{formatNumber(agent.deals)}</td>
                            <td className="py-3 px-4">{formatCurrency(agent.revenue)}</td>
                            <td className="py-3 px-4">{formatPercentage(agent.conversion)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={agent.conversion > 20 ? "default" : "secondary"}>
                                {agent.conversion > 20 ? "ممتاز" : "جيد"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Deal Pipeline Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Target size={20} />
                    <span>ملخص خط الأنابيب</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">إجمالي الصفقات</span>
                      <span className="font-semibold">{formatNumber(filteredDeals.length)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">الصفقات النشطة</span>
                      <span className="font-semibold">
                        {formatNumber(filteredDeals.filter(d => !['closed', 'lost'].includes(d.stage)).length)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">الصفقات المكتملة</span>
                      <span className="font-semibold text-green-600">
                        {formatNumber(filteredDeals.filter(d => d.stage === 'closed').length)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">قيمة خط الأنابيب</span>
                      <span className="font-semibold">
                        {formatCurrency(totalPipelineValue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Building size={20} />
                    <span>تحليلات العقارات</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">إجمالي العقارات</span>
                      <span className="font-semibold">{formatNumber(filteredProperties.length)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">القوائم النشطة</span>
                      <span className="font-semibold">
                        {formatNumber(filteredProperties.filter(p => p.status === 'active').length)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">العقارات المباعة</span>
                      <span className="font-semibold text-green-600">
                        {formatNumber(filteredProperties.filter(p => p.status === 'sold').length)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">متوسط السعر</span>
                      <span className="font-semibold">
                        {formatCurrency(calculateAveragePropertyPrice())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Zap size={20} />
                    <span>مقاييس الأداء</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">تحويل العملاء المحتملين</span>
                      <span className="font-semibold">{formatPercentage(calculateConversionRate())}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">متوسط حجم الصفقة</span>
                      <span className="font-semibold">
                        {formatCurrency(averageDealValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">معدل العمولة</span>
                      <span className="font-semibold">
                        {formatPercentage(commissionRatePercentage)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">الإيرادات الشهرية</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(calculateTotalCommission())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
