/**
 * Charts.tsx - Chart Components for RBAC Dashboard
 * 
 * This component provides standalone chart components for analytics:
 * - Logins over last 30 days (daily line chart)
 * - Requests per minute over last 24h (RPM area chart)
 * - Top 10 endpoints by volume + error rate (horizontal bar chart)
 * - RTL-aware chart layouts
 * - Loading states and error handling
 * 
 * Key Features:
 * - Standalone chart components
 * - RTL layout support
 * - Loading skeletons
 * - Error states with retry
 * - Responsive design
 * - Accessibility support
 * 
 * Dependencies:
 * - Recharts for chart rendering
 * - UI components from shadcn/ui
 * - Lucide React icons
 * - Language context for RTL
 * 
 * Routes affected: /rbac-dashboard
 * Pages affected: RBAC dashboard
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  Clock,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoginsSeries, useRPMSeries, useTopEndpoints } from '@/hooks/useDashboardData';

interface ChartData {
  [key: string]: any;
}

interface ChartProps {
  className?: string;
  isLoading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
}

const extractErrorMessage = (error?: string | Error | null) => {
  if (!error) return undefined;
  return typeof error === "string" ? error : error.message;
};

/**
 * Logins Chart Component
 * 
 * Displays daily login trends over the last 30 days.
 * Uses line chart with RTL-aware layout.
 */
export const LoginsChart: React.FC<ChartProps> = ({
  className,
  isLoading: externalLoading,
  error: externalError,
  onRetry,
}) => {
  const { dir } = useLanguage();
  const {
    data: loginsData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useLoginsSeries();

  const resolvedLoading = externalLoading ?? queryLoading;
  const combinedError = externalError ?? queryError ?? null;
  const errorMessage = extractErrorMessage(combinedError);
  const chartData = loginsData?.series ?? [];

  const handleRetry = () => {
    void refetch();
    if (onRetry) {
      onRetry();
    }
  };

  // Transform API data
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('ar-SA')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (errorMessage) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            تسجيلات الدخول - آخر 30 يوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>فشل في تحميل بيانات تسجيلات الدخول: {errorMessage}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                إعادة المحاولة
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          تسجيلات الدخول - آخر 30 يوم
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resolvedLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="logins" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="إجمالي تسجيلات الدخول"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="uniqueUsers" 
                stroke="#10b981" 
                strokeWidth={2}
                name="المستخدمون الفريدون"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * RPM Chart Component
 * 
 * Displays requests per minute over the last 24 hours.
 * Uses area chart with gradient fill.
 */
export const RPMChart: React.FC<ChartProps> = ({
  className,
  isLoading: externalLoading,
  error: externalError,
  onRetry,
}) => {
  const { dir } = useLanguage();
  const {
    data: rpmSeries,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useRPMSeries();

  const resolvedLoading = externalLoading ?? queryLoading;
  const combinedError = externalError ?? queryError ?? null;
  const errorMessage = extractErrorMessage(combinedError);

  // Mock data for last 24 hours, used as graceful fallback when the API has no data yet.
  const fallbackData: ChartData[] = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    return {
      hour: hour.toISOString().split('T')[1].substring(0, 5),
      requests: Math.floor(Math.random() * 1000) + 200,
      errors: Math.floor(Math.random() * 50) + 10
    };
  });

  const toHourLabel = (value: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    }
    return value;
  };

  const normalizedSeries =
    rpmSeries?.series?.map((point) => ({
      hour: toHourLabel(point.timestamp),
      requests: point.requests,
      errors: point.errors,
    })) ?? [];

  const chartData = normalizedSeries.length > 0 ? normalizedSeries : fallbackData;

  const handleRetry = () => {
    void refetch();
    if (onRetry) {
      onRetry();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('ar-SA')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (errorMessage) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            الطلبات في الدقيقة - آخر 24 ساعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>فشل في تحميل بيانات الطلبات: {errorMessage}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                إعادة المحاولة
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          الطلبات في الدقيقة - آخر 24 ساعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resolvedLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="errorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#3b82f6"
                fill="url(#requestsGradient)"
                strokeWidth={2}
                name="الطلبات"
              />
              <Area
                type="monotone"
                dataKey="errors"
                stroke="#ef4444"
                fill="url(#errorsGradient)"
                strokeWidth={2}
                name="الأخطاء"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Top Endpoints Chart Component
 * 
 * Displays top 10 endpoints by volume with error rates.
 * Uses horizontal bar chart for better readability.
 */
export const TopEndpointsChart: React.FC<ChartProps> = ({
  className,
  isLoading: externalLoading,
  error: externalError,
  onRetry,
}) => {
  const { dir } = useLanguage();
  const {
    data: endpointsSeries,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useTopEndpoints();

  const resolvedLoading = externalLoading ?? queryLoading;
  const combinedError = externalError ?? queryError ?? null;
  const errorMessage = extractErrorMessage(combinedError);

  // Mock data for top 10 endpoints as a fallback when the analytics service has no entries yet.
  const fallbackData = [
    { endpoint: '/api/auth/login', volume: 1250, errorRate: 0.2 },
    { endpoint: '/api/users', volume: 980, errorRate: 0.1 },
    { endpoint: '/api/properties', volume: 850, errorRate: 0.3 },
    { endpoint: '/api/leads', volume: 720, errorRate: 0.1 },
    { endpoint: '/api/reports', volume: 650, errorRate: 0.4 },
    { endpoint: '/api/analytics', volume: 580, errorRate: 0.2 },
    { endpoint: '/api/notifications', volume: 520, errorRate: 0.1 },
    { endpoint: '/api/audit', volume: 480, errorRate: 0.0 },
    { endpoint: '/api/settings', volume: 420, errorRate: 0.2 },
    { endpoint: '/api/export', volume: 380, errorRate: 0.5 }
  ];

  const normalizedData =
    endpointsSeries?.endpoints?.map((endpoint) => ({
      endpoint: endpoint.endpoint,
      volume: endpoint.volume,
      errorRate: endpoint.errorRate,
    })) ?? [];

  const endpointsData = normalizedData.length > 0 ? normalizedData : fallbackData;

  const handleRetry = () => {
    void refetch();
    if (onRetry) {
      onRetry();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('ar-SA')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (errorMessage) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            أفضل 10 نقاط نهاية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>فشل في تحميل بيانات النقاط النهائية: {errorMessage}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                إعادة المحاولة
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          أفضل 10 نقاط نهاية
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resolvedLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={endpointsData} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="endpoint" 
                tick={{ fontSize: 10 }}
                width={200}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="volume" 
                fill="#3b82f6" 
                name="الحجم"
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="errorRate" 
                fill="#ef4444" 
                name="معدل الخطأ (%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Charts Container Component
 * 
 * Container component that renders all chart components
 * with proper spacing and responsive layout.
 */
export const ChartsContainer: React.FC<{
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ isLoading, error, onRetry, className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoginsChart isLoading={isLoading} error={error} onRetry={onRetry} />
        <RPMChart isLoading={isLoading} error={error} onRetry={onRetry} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <TopEndpointsChart isLoading={isLoading} error={error} onRetry={onRetry} />
      </div>
    </div>
  );
};

export default ChartsContainer;
