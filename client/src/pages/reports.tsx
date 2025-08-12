import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, TrendingUp, Users, Building, Calendar, BarChart3, PieChart } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MetricsCard from "@/components/ui/metrics-card";
import { useToast } from "@/hooks/use-toast";
import type { Lead, Property, Deal } from "@shared/schema";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const { toast } = useToast();

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

  const calculateConversionRate = () => {
    if (!leads || leads.length === 0) return 0;
    const closedDeals = filteredDeals.filter(deal => deal.stage === 'closed').length;
    return ((closedDeals / filteredLeads.length) * 100).toFixed(1);
  };

  const calculateAveragePropertyPrice = () => {
    if (!filteredProperties || filteredProperties.length === 0) return 0;
    const totalValue = filteredProperties.reduce((sum, property) => sum + parseFloat(property.price), 0);
    return totalValue / filteredProperties.length;
  };

  const calculateTotalCommission = () => {
    if (!filteredDeals) return 0;
    return filteredDeals
      .filter(deal => deal.stage === 'closed')
      .reduce((sum, deal) => sum + (deal.commission ? parseFloat(deal.commission) : 0), 0);
  };

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
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
      <Header title="التقارير" />
      
      <main className="flex-1 overflow-y-auto p-6">
        {/* Report Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
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
            value={filteredLeads.length}
            change={`${filteredLeads.length > 0 ? '+' : ''}${filteredLeads.length} في ${selectedPeriod} أيام`}
            changeType="positive"
            icon={Users}
            iconColor="bg-blue-100 text-blue-600"
          />
          
          <MetricsCard
            title="العقارات المدرجة"
            value={filteredProperties.length}
            change={`${filteredProperties.length > 0 ? '+' : ''}${filteredProperties.length} في ${selectedPeriod} أيام`}
            changeType="positive"
            icon={Building}
            iconColor="bg-green-100 text-green-600"
          />
          
          <MetricsCard
            title="معدل التحويل"
            value={`${calculateConversionRate()}%`}
            change="نسبة العميل المحتمل إلى الصفقة المكتملة"
            changeType="neutral"
            icon={TrendingUp}
            iconColor="bg-purple-100 text-purple-600"
          />
          
          <MetricsCard
            title="إجمالي العمولة"
            value={formatCurrency(calculateTotalCommission())}
            change={`من ${filteredDeals.filter(d => d.stage === 'closed').length} صفقة مكتملة`}
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-yellow-100 text-yellow-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart size={20} />
                <span>مصادر العملاء المحتملين</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getLeadSourceBreakdown().length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  لا توجد بيانات عملاء محتملين متاحة للفترة المحددة.
                </div>
              ) : (
                <div className="space-y-3">
                  {getLeadSourceBreakdown().map(({ source, count }) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{source}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(count / filteredLeads.length) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-500 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 size={20} />
                <span>أنواع العقارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getPropertyTypeBreakdown().length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  لا توجد بيانات عقارات متاحة للفترة المحددة.
                </div>
              ) : (
                <div className="space-y-3">
                  {getPropertyTypeBreakdown().map(({ type, count }) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${(count / filteredProperties.length) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-500 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deal Pipeline Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Pipeline Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Deals</span>
                  <span className="font-semibold">{filteredDeals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active Deals</span>
                  <span className="font-semibold">
                    {filteredDeals.filter(d => !['closed', 'lost'].includes(d.stage)).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Closed Deals</span>
                  <span className="font-semibold text-green-600">
                    {filteredDeals.filter(d => d.stage === 'closed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Pipeline Value</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      filteredDeals.reduce((sum, deal) => 
                        sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0), 0
                      )
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Property Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Properties</span>
                  <span className="font-semibold">{filteredProperties.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active Listings</span>
                  <span className="font-semibold">
                    {filteredProperties.filter(p => p.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Sold Properties</span>
                  <span className="font-semibold text-green-600">
                    {filteredProperties.filter(p => p.status === 'sold').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Average Price</span>
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
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Lead Conversion</span>
                  <span className="font-semibold">{calculateConversionRate()}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Avg. Deal Size</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      filteredDeals.length > 0 
                        ? filteredDeals.reduce((sum, deal) => 
                            sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0), 0
                          ) / filteredDeals.length
                        : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Commission Rate</span>
                  <span className="font-semibold">
                    {filteredDeals.length > 0 
                      ? ((calculateTotalCommission() / 
                          filteredDeals.reduce((sum, deal) => 
                            sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0), 0
                          )) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Monthly Revenue</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(calculateTotalCommission())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
