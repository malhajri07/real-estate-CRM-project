/**
 * Enhanced Admin Dashboard
 * 
 * This is the new main dashboard for the admin panel featuring:
 * - Interactive charts
 * - Real-time metrics
 * - Customizable layout
 * - Better data visualization
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Building2,
    DollarSign,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
} from 'lucide-react';
import {
    AdminBreadcrumbs,
    AdminMetricCard,
    AdminLineChart,
    AdminBarChart,
    AdminPieChart,
    AdminLoading,
    AdminDateRangePicker,
} from '@/components/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with actual API calls
const mockRevenueData = [
    { month: 'يناير', revenue: 45000, subscriptions: 120 },
    { month: 'فبراير', revenue: 52000, subscriptions: 145 },
    { month: 'مارس', revenue: 48000, subscriptions: 135 },
    { month: 'أبريل', revenue: 61000, subscriptions: 165 },
    { month: 'مايو', revenue: 55000, subscriptions: 155 },
    { month: 'يونيو', revenue: 67000, subscriptions: 180 },
];

const mockUserGrowthData = [
    { month: 'يناير', users: 1200 },
    { month: 'فبراير', users: 1450 },
    { month: 'مارس', users: 1680 },
    { month: 'أبريل', users: 1920 },
    { month: 'مايو', users: 2150 },
    { month: 'يونيو', users: 2400 },
];

const mockUsersByRoleData = [
    { name: 'مشرف النظام', value: 5 },
    { name: 'مالك شركة', value: 45 },
    { name: 'وكيل شركة', value: 180 },
    { name: 'وكيل فردي', value: 320 },
    { name: 'بائع', value: 450 },
    { name: 'مشتري', value: 1400 },
];

const mockRecentActivity = [
    { id: 1, user: 'أحمد محمد', action: 'قام بإنشاء عقار جديد', time: 'منذ 5 دقائق', type: 'success' },
    { id: 2, user: 'فاطمة علي', action: 'قامت بتحديث ملف العميل', time: 'منذ 12 دقيقة', type: 'info' },
    { id: 3, user: 'محمد خالد', action: 'أضاف تقرير جديد', time: 'منذ 23 دقيقة', type: 'success' },
    { id: 4, user: 'سارة أحمد', action: 'حذفت قائمة عقارات', time: 'منذ 35 دقيقة', type: 'warning' },
    { id: 5, user: 'عمر حسن', action: 'قام بتسجيل الدخول', time: 'منذ ساعة', type: 'info' },
];

export default function EnhancedAdminDashboard() {
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    // Mock query - replace with actual API call
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['admin-dashboard-metrics', dateRange],
        queryFn: async () => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));
            return {
                totalUsers: 2400,
                userGrowth: 12.5,
                totalRevenue: 328000,
                revenueGrowth: 8.3,
                activeOrganizations: 45,
                orgGrowth: 5.2,
                openTickets: 23,
                ticketChange: -15.4,
            };
        },
    });

    if (isLoading) {
        return <AdminLoading fullScreen text="جار تحميل لوحة التحكم..." />;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Breadcrumbs */}
            <AdminBreadcrumbs
                items={[
                    { label: 'نظرة عامة', href: '/admin/overview/main-dashboard' },
                    { label: 'لوحة التحكم الرئيسية' },
                ]}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم الرئيسية</h1>
                    <p className="text-gray-600 mt-1">نظرة شاملة على أداء النظام</p>
                </div>
                <AdminDateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="اختر نطاق التاريخ"
                    className="w-80"
                />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminMetricCard
                    title="إجمالي المستخدمين"
                    value={metrics?.totalUsers.toLocaleString() || '0'}
                    icon={<Users className="h-6 w-6" />}
                    color="blue"
                    trend={{
                        value: metrics?.userGrowth || 0,
                        isPositive: (metrics?.userGrowth || 0) > 0,
                        label: 'من الشهر الماضي',
                    }}
                />
                <AdminMetricCard
                    title="إجمالي الإيرادات"
                    value={`${(metrics?.totalRevenue || 0).toLocaleString()} ر.س`}
                    icon={<DollarSign className="h-6 w-6" />}
                    color="green"
                    trend={{
                        value: metrics?.revenueGrowth || 0,
                        isPositive: (metrics?.revenueGrowth || 0) > 0,
                        label: 'من الشهر الماضي',
                    }}
                />
                <AdminMetricCard
                    title="المنظمات النشطة"
                    value={metrics?.activeOrganizations || 0}
                    icon={<Building2 className="h-6 w-6" />}
                    color="purple"
                    trend={{
                        value: metrics?.orgGrowth || 0,
                        isPositive: (metrics?.orgGrowth || 0) > 0,
                        label: 'من الشهر الماضي',
                    }}
                />
                <AdminMetricCard
                    title="التذاكر المفتوحة"
                    value={metrics?.openTickets || 0}
                    icon={<AlertCircle className="h-6 w-6" />}
                    color="yellow"
                    trend={{
                        value: Math.abs(metrics?.ticketChange || 0),
                        isPositive: (metrics?.ticketChange || 0) < 0,
                        label: 'من الأسبوع الماضي',
                    }}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <AdminLineChart
                    title="الإيرادات الشهرية"
                    description="نمو الإيرادات والاشتراكات على مدار الأشهر الستة الماضية"
                    data={mockRevenueData}
                    dataKeys={['revenue', 'subscriptions']}
                    xAxisKey="month"
                    colors={['#10b981', '#3b82f6']}
                    height={300}
                />

                {/* User Growth Chart */}
                <AdminBarChart
                    title="نمو المستخدمين"
                    description="عدد المستخدمين الجدد شهرياً"
                    data={mockUserGrowthData}
                    dataKeys={['users']}
                    xAxisKey="month"
                    colors={['#8b5cf6']}
                    height={300}
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users by Role */}
                <div className="lg:col-span-1">
                    <AdminPieChart
                        title="المستخدمون حسب الدور"
                        description="توزيع المستخدمين حسب الأدوار"
                        data={mockUsersByRoleData}
                        dataKeys={['value']}
                        xAxisKey="name"
                        height={300}
                    />
                </div>

                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>النشاط الأخير</CardTitle>
                        <CardDescription>آخر الأنشطة في النظام</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockRecentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                                    <div className="mt-1">
                                        {activity.type === 'success' && (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        )}
                                        {activity.type === 'info' && (
                                            <Activity className="h-5 w-5 text-blue-600" />
                                        )}
                                        {activity.type === 'warning' && (
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                                        <p className="text-sm text-gray-600">{activity.action}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        {activity.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>إحصائيات سريعة</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="today" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="today">اليوم</TabsTrigger>
                            <TabsTrigger value="week">هذا الأسبوع</TabsTrigger>
                            <TabsTrigger value="month">هذا الشهر</TabsTrigger>
                            <TabsTrigger value="year">هذا العام</TabsTrigger>
                        </TabsList>
                        <TabsContent value="today" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">24</p>
                                    <p className="text-sm text-gray-600">مستخدمون جدد</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">12</p>
                                    <p className="text-sm text-gray-600">عقارات جديدة</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <p className="text-2xl font-bold text-purple-600">8</p>
                                    <p className="text-sm text-gray-600">صفقات مغلقة</p>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-2xl font-bold text-yellow-600">5</p>
                                    <p className="text-sm text-gray-600">تذاكر جديدة</p>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="week">
                            <p className="text-center text-gray-500 py-8">إحصائيات الأسبوع قريباً...</p>
                        </TabsContent>
                        <TabsContent value="month">
                            <p className="text-center text-gray-500 py-8">إحصائيات الشهر قريباً...</p>
                        </TabsContent>
                        <TabsContent value="year">
                            <p className="text-center text-gray-500 py-8">إحصائيات السنة قريباً...</p>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
