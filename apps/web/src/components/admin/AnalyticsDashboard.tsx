import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Building2,
  Home,
  DollarSign,
  Calendar,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalProperties: number;
    totalListings: number;
    totalTransactions: number;
    totalRevenue: number;
    userGrowth: number;
    propertyGrowth: number;
    revenueGrowth: number;
  };
  userStats: {
    byRole: Record<string, number>;
    byStatus: { active: number; inactive: number };
    newUsersThisMonth: number;
    newUsersLastMonth: number;
  };
  propertyStats: {
    byType: Record<string, number>;
    byCity: Record<string, number>;
    byStatus: Record<string, number>;
    averagePrice: number;
    priceGrowth: number;
  };
  communicationStats: {
    whatsappMessages: number;
    smsSent: number;
    emailsSent: number;
    socialMediaShares: number;
    responseRate: number;
  };
  revenueStats: {
    monthly: Array<{ month: string; revenue: number }>;
    bySource: Record<string, number>;
    averageTransactionValue: number;
  };
}

const roleLabels: Record<string, string> = {
  'WEBSITE_ADMIN': 'مدير المنصة',
  'CORP_OWNER': 'مالك شركة',
  'CORP_AGENT': 'وكيل شركة',
  'INDIV_AGENT': 'وكيل مستقل',
  'SELLER': 'بائع',
  'BUYER': 'مشتري',
};

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const stackSegmentStyle = (percentage: number): React.CSSProperties => ({
  "--stack-segment": `${clampPercentage(percentage)}%`,
});

const meterFillStyle = (percentage: number): React.CSSProperties => ({
  "--meter-fill": `${clampPercentage(percentage)}%`,
});

export default function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const {
    data: analytics,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<AnalyticsData>({
    queryKey: ['analytics', 'comprehensive', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/comprehensive?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
      }
      return response.json() as Promise<AnalyticsData>;
    },
  });

  const isInitialLoading = isLoading && !analytics;
  const showSkeleton = isFetching && !isInitialLoading;
  const errorMessage = isError
    ? (error instanceof Error ? error.message : 'فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.')
    : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const refreshData = () => {
    void refetch();
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  // Skeleton component for loading states
  const SkeletonCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );

  // Stacked bar chart component for Users by Role
  const UsersByRoleChart = ({ data }: { data: AnalyticsData }) => {
    const totalUsers = Object.values(data.userStats.byRole).reduce((sum, count) => sum + count, 0);
    const roleColors = {
      'WEBSITE_ADMIN': 'bg-primary',
      'CORP_OWNER': 'bg-success',
      'CORP_AGENT': 'bg-warning',
      'INDIV_AGENT': 'bg-error',
      'SELLER': 'bg-accent',
      'BUYER': 'bg-muted'
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">توزيع المستخدمين حسب الدور</h3>
          <span className="text-sm text-gray-500">إجمالي: {formatNumber(totalUsers)}</span>
        </div>

        {/* Stacked Bar */}
        <div className="relative">
          <div className="ui-stack h-8 rounded-xl bg-gray-100">
            {Object.entries(data.userStats.byRole).map(([role, count]) => {
              const percentage = totalUsers ? (count / totalUsers) * 100 : 0;
              return (
                <div
                  key={role}
                  className={cn(
                    "ui-stack__segment",
                    roleColors[role as keyof typeof roleColors] || "bg-gray-400"
                  )}
                  style={stackSegmentStyle(percentage)}
                  title={`${roleLabels[role as keyof typeof roleLabels] || role}: ${formatNumber(count)} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(data.userStats.byRole).map(([role, count]) => {
            const percentage = (count / totalUsers) * 100;
            return (
              <div key={role} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded ${roleColors[role as keyof typeof roleColors] || 'bg-gray-400'}`}></div>
                <span className="text-gray-600">{roleLabels[role as keyof typeof roleLabels] || role}</span>
                <span className="text-gray-900 font-medium">{formatNumber(count)}</span>
                <span className="text-gray-500">({percentage.toFixed(1)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isInitialLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">لوحة التحليلات</h2>
            <p className="text-gray-600">إحصائيات شاملة عن أداء المنصة</p>
            {errorMessage && (
              <div className="flex items-center gap-2 mt-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="quarter">هذا الربع</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshData} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button disabled>
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const totalProperties = analytics.overview.totalProperties || 0;
  const monthlyRevenueMax =
    Math.max(...analytics.revenueStats.monthly.map((month) => month.revenue || 0)) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">لوحة التحليلات</h2>
          <p className="text-gray-600">إحصائيات شاملة عن أداء المنصة</p>
          {errorMessage && (
            <div className="flex items-center gap-2 mt-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshData} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {showSkeleton || !analytics ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalUsers)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(analytics.overview.userGrowth)}
                      <span className={`text-sm ${getGrowthColor(analytics.overview.userGrowth)}`}>
                        {analytics.overview.userGrowth}%
                      </span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي العقارات</p>
                    <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalProperties)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(analytics.overview.propertyGrowth)}
                      <span className={`text-sm ${getGrowthColor(analytics.overview.propertyGrowth)}`}>
                        {analytics.overview.propertyGrowth}%
                      </span>
                    </div>
                  </div>
                  <Home className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي المعاملات</p>
                    <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalTransactions)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(analytics.revenueStats.averageTransactionValue)} متوسط
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(analytics.overview.revenueGrowth)}
                      <span className={`text-sm ${getGrowthColor(analytics.overview.revenueGrowth)}`}>
                        {analytics.overview.revenueGrowth}%
                      </span>
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-error" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="users" className="w-full">
        {showSkeleton || !analytics ? (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              العقارات
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              التواصل
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              الإيرادات
            </TabsTrigger>
          </TabsList>
        )}

        {/* Users Analytics */}
        <TabsContent value="users" className="space-y-4">
          {showSkeleton || !analytics ? (
            <div className="space-y-4">
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Users by Role Stacked Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المستخدمين حسب الدور</CardTitle>
                </CardHeader>
                <CardContent>
                  <UsersByRoleChart data={analytics} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>
              <CardHeader>
                <CardTitle>حالة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">نشط</span>
                    </div>
                    <span className="font-bold">{formatNumber(analytics.userStats.byStatus.active)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">غير نشط</span>
                    </div>
                    <span className="font-bold">{formatNumber(analytics.userStats.byStatus.inactive)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Properties Analytics */}
        <TabsContent value="properties" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع العقارات حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.propertyStats.byType).map(([type, count]) => {
                    const percentage = totalProperties
                      ? (count / totalProperties) * 100
                      : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="ui-meter h-2 w-20 bg-gray-200">
                            <div
                              className="ui-meter__fill h-full rounded-full bg-green-500"
                              style={meterFillStyle(percentage)}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-left">
                            {formatNumber(count)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع العقارات حسب المدينة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.propertyStats.byCity).map(([city, count]) => {
                    const percentage = totalProperties
                      ? (count / totalProperties) * 100
                      : 0;
                    return (
                      <div key={city} className="flex items-center justify-between">
                        <span className="text-sm">{city}</span>
                        <div className="flex items-center gap-2">
                          <div className="ui-meter h-2 w-20 bg-gray-200">
                            <div
                              className="ui-meter__fill h-full rounded-full bg-purple-500"
                              style={meterFillStyle(percentage)}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-left">
                            {formatNumber(count)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الأسعار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">متوسط السعر</p>
                  <p className="text-xl font-bold">{formatCurrency(analytics.propertyStats.averagePrice)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">نمو الأسعار</p>
                  <div className="flex items-center justify-center gap-1">
                    {getGrowthIcon(analytics.propertyStats.priceGrowth)}
                    <p className="text-xl font-bold">{analytics.propertyStats.priceGrowth}%</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">إجمالي الإعلانات</p>
                  <p className="text-xl font-bold">{formatNumber(analytics.overview.totalListings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Analytics */}
        <TabsContent value="communication" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">رسائل واتساب</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.communicationStats.whatsappMessages)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">رسائل SMS</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.communicationStats.smsSent)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">رسائل البريد الإلكتروني</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.communicationStats.emailsSent)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">مشاركات وسائل التواصل</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.communicationStats.socialMediaShares)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>معدل الاستجابة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {analytics.communicationStats.responseRate}%
                </div>
                <p className="text-gray-600">معدل استجابة العملاء للرسائل</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الإيرادات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.revenueStats.monthly.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="ui-meter h-2 w-32 bg-gray-200">
                          <div
                            className="ui-meter__fill h-full rounded-full bg-green-500"
                            style={meterFillStyle((month.revenue / monthlyRevenueMax) * 100)}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-left">
                          {formatCurrency(month.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع الإيرادات حسب المصدر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.revenueStats.bySource).map(([source, percentage]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm">{source}</span>
                      <div className="flex items-center gap-2">
                        <div className="ui-meter h-2 w-20 bg-gray-200">
                          <div
                            className="ui-meter__fill h-full rounded-full bg-blue-500"
                            style={meterFillStyle(percentage)}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-left">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
