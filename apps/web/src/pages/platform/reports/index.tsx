/**
 * reports/index.tsx - Reports and Analytics Page
 *
 * Route: /home/platform/reports or /reports
 *
 * Reports and analytics dashboard. Keeps all state and queries here,
 * delegates rendering to sub-components:
 *   - ReportFilters  — period/date filter controls
 *   - ReportCharts   — chart components (Line, Area, Bar, Pie)
 *   - ReportTable    — agent performance table + analytics summary
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, TrendingUp, Users, Building, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricsCard from "@/components/ui/metrics-card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { CHART_COLOR_ARRAY } from "@/config/design-tokens";
import type { Lead, Property, Deal } from "@shared/types";
import PageHeader from "@/components/ui/page-header";
import { ReportsSkeleton } from "@/components/skeletons/page-skeletons";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { formatAdminDate } from "@/lib/formatters";

import ReportFilters from "./ReportFilters";
import ReportCharts from "./ReportCharts";
import ReportTable from "./ReportTable";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const { toast } = useToast();
  const { t, dir } = useLanguage();

  const { data: leads = [], isLoading: leadsLoading, isError: leadsError, refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    retry: false,
  });

  const { data: properties = [], isLoading: propertiesLoading, isError: propertiesError, refetch: refetchProperties } = useQuery<Property[]>({
    queryKey: ["/api/listings"],
    retry: false,
  });

  const { data: deals = [], isLoading: dealsLoading, isError: dealsError, refetch: refetchDeals } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
    retry: false,
  });

  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeDeals = Array.isArray(deals) ? deals : [];

  const filterDataByPeriod = (data: any[], dateField: string) => {
    if (!Array.isArray(data)) return [];
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.filter(item => {
      const val = item?.[dateField];
      if (val == null) return false;
      const d = new Date(val);
      return !isNaN(d.getTime()) && d >= cutoffDate;
    });
  };

  const filteredLeads = filterDataByPeriod(safeLeads, "createdAt");
  const filteredProperties = filterDataByPeriod(safeProperties, "createdAt");
  const filteredDeals = filterDataByPeriod(safeDeals, "createdAt");

  const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const calculateConversionRate = () => {
    if (!filteredLeads || filteredLeads.length === 0) return 0;
    const closedDeals = filteredDeals.filter(deal => deal.stage === "closed").length;
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
      .filter(deal => deal.stage === "closed")
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

  // --- Data preparation functions ---

  const getLeadSourceBreakdown = () => {
    if (!filteredLeads) return [];
    const sources: { [key: string]: number } = {};
    filteredLeads.forEach(lead => {
      const source = lead.leadSource || "غير معروف";
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources).map(([source, count]) => ({ source, count }));
  };

  const getPropertyTypeBreakdown = () => {
    if (!filteredProperties) return [];
    const types: { [key: string]: number } = {};
    filteredProperties.forEach(property => {
      const type = property.propertyType || "غير معروف";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " ﷼";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num) + "%";
  };

  const CHART_COLORS = CHART_COLOR_ARRAY;

  const getTimeSeriesData = () => {
    const days = parseInt(selectedPeriod);
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      data.push({
        date: date.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        leads: filteredLeads.filter(lead => new Date(lead.createdAt).toISOString().split("T")[0] === dateStr).length,
        properties: filteredProperties.filter(property => new Date(property.createdAt).toISOString().split("T")[0] === dateStr).length,
        deals: filteredDeals.filter(deal => new Date(deal.createdAt).toISOString().split("T")[0] === dateStr).length,
        revenue: filteredDeals.filter(deal => new Date(deal.createdAt).toISOString().split("T")[0] === dateStr).length * 50000,
      });
    }
    return data;
  };

  const getRevenueData = () => {
    if (!filteredDeals) return [];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthlyData = new Map<string, { revenue: number; commission: number; deals: number }>();

    filteredDeals.forEach(deal => {
      if (deal.stage === "closed") {
        const date = new Date(deal.createdAt);
        const monthKey = months[date.getMonth()];
        const current = monthlyData.get(monthKey) || { revenue: 0, commission: 0, deals: 0 };
        monthlyData.set(monthKey, {
          revenue: current.revenue + (toNumber(deal.dealValue) || 0),
          commission: current.commission + (toNumber(deal.commission) || 0),
          deals: current.deals + 1,
        });
      }
    });

    if (monthlyData.size === 0) {
      const last6 = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6.push({ month: months[d.getMonth()], revenue: 0, commission: 0, deals: 0 });
      }
      return last6;
    }

    return Array.from(monthlyData.entries()).map(([month, data]) => ({ month, ...data }));
  };

  const getPropertyTypeChartData = () => {
    return getPropertyTypeBreakdown().map((item, index) => ({
      name: item.type,
      value: item.count,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  };

  const getLeadSourceChartData = () => {
    return getLeadSourceBreakdown().map((item, index) => ({
      name: item.source,
      value: item.count,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  };

  const getDealStageData = () => {
    if (!filteredDeals) return [];
    const stages: Record<string, { count: number; value: number }> = {};
    filteredDeals.forEach(deal => {
      const stage = deal.stage;
      if (!stages[stage]) stages[stage] = { count: 0, value: 0 };
      stages[stage].count++;
      stages[stage].value += toNumber(deal.dealValue) || 0;
    });
    return Object.keys(stages).map(stage => ({ stage, count: stages[stage].count, value: stages[stage].value }));
  };

  const getAgentPerformanceData = () => {
    if (!filteredDeals) return [];
    const agents: Record<string, { deals: number; revenue: number; won: number }> = {};
    filteredDeals.forEach(deal => {
      const agentName = (deal as any).agent?.firstName
        ? `${(deal as any).agent.firstName} ${(deal as any).agent.lastName || ""}`
        : `وسيط ${(deal as any).agentId || "غير معروف"}`;
      if (!agents[agentName]) agents[agentName] = { deals: 0, revenue: 0, won: 0 };
      agents[agentName].deals++;
      agents[agentName].revenue += toNumber(deal.dealValue) || 0;
      if (deal.stage === "closed" || deal.stage === "won") agents[agentName].won++;
    });
    return Object.keys(agents).map(agent => ({
      agent,
      deals: agents[agent].deals,
      revenue: agents[agent].revenue,
      conversion: agents[agent].deals > 0 ? (agents[agent].won / agents[agent].deals) * 100 : 0,
    }));
  };

  const getMarketTrendsData = () => [];

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
      ["فترة التقرير", reportData.period],
      ["تاريخ الإنشاء", formatAdminDate(reportData.generatedOn)],
      [""],
      ["المؤشرات"],
      ["إجمالي العملاء المحتملين", reportData.metrics.totalLeads],
      ["إجمالي العقارات", reportData.metrics.totalProperties],
      ["إجمالي الصفقات", reportData.metrics.totalDeals],
      ["معدل التحويل", reportData.metrics.conversionRate],
      ["متوسط سعر العقار", reportData.metrics.averagePropertyPrice],
      ["إجمالي العمولة", reportData.metrics.totalCommission],
      [""],
      ["مصادر العملاء"],
      ...reportData.leadSources.map(item => [item.source, item.count]),
      [""],
      ["أنواع العقارات"],
      ...reportData.propertyTypes.map(item => [item.type, item.count]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `real-estate-report-${selectedPeriod}days-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "نجح", description: "تم تصدير التقرير بنجاح" });
  };

  const isInitialLoading = leadsLoading && propertiesLoading && dealsLoading;
  const hasAnyError = leadsError || propertiesError || dealsError;
  const retryAll = () => { refetchLeads(); refetchProperties(); refetchDeals(); };

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader title={t("التقارير والتحليلات")} subtitle={t("عرض تقارير الأداء والإحصائيات")}>
        <Button onClick={exportReport}>
          <Download className="me-2" size={16} />
          تصدير التقرير
        </Button>
      </PageHeader>

      {isInitialLoading && (
        <ReportsSkeleton />
      )}

      {hasAnyError && (
        <QueryErrorFallback message="قد لا تظهر بعض البيانات بسبب خطأ في تحميلها" onRetry={retryAll} />
      )}

      <ReportFilters selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

      {/* Key Metrics */}
      <div className={GRID_METRICS}>
        <MetricsCard
          title="العملاء المحتملين المولدين"
          value={formatNumber(filteredLeads.length)}
          change={`${filteredLeads.length > 0 ? "+" : ""}${formatNumber(filteredLeads.length)} في ${selectedPeriod} أيام`}
          changeType="positive"
          icon={Users}
        />
        <MetricsCard
          title="العقارات المدرجة"
          value={formatNumber(filteredProperties.length)}
          change={`${filteredProperties.length > 0 ? "+" : ""}${formatNumber(filteredProperties.length)} في ${selectedPeriod} أيام`}
          changeType="positive"
          icon={Building}
        />
        <MetricsCard
          title="معدل التحويل"
          value={formatPercentage(calculateConversionRate())}
          change="نسبة العميل المحتمل إلى الصفقة المكتملة"
          changeType="neutral"
          icon={TrendingUp}
        />
        <MetricsCard
          title="إجمالي العمولة"
          value={formatCurrency(calculateTotalCommission())}
          change={`من ${formatNumber(filteredDeals.filter(d => d.stage === "closed").length)} صفقة مكتملة`}
          changeType="positive"
          icon={DollarSign}
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

        <ReportCharts
          timeSeriesData={getTimeSeriesData()}
          leadSourceChartData={getLeadSourceChartData()}
          propertyTypeChartData={getPropertyTypeChartData()}
          dealStageData={getDealStageData()}
          agentPerformanceData={getAgentPerformanceData()}
          revenueData={getRevenueData()}
          marketTrendsData={getMarketTrendsData()}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          formatPercentage={formatPercentage}
        />

        <ReportTable
          agentPerformanceData={getAgentPerformanceData()}
          filteredDeals={filteredDeals}
          filteredProperties={filteredProperties}
          filteredLeads={filteredLeads}
          totalPipelineValue={totalPipelineValue}
          averageDealValue={averageDealValue}
          commissionRatePercentage={commissionRatePercentage}
          conversionRate={calculateConversionRate()}
          averagePropertyPrice={calculateAveragePropertyPrice()}
          totalCommission={calculateTotalCommission()}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          formatPercentage={formatPercentage}
        />
      </Tabs>
    </div>
  );
}
