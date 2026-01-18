import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from "recharts";
import {
    Download,
    Filter,
    CreditCard,
    DollarSign,
    TrendingUp,
    Users,
    Activity,
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileText
} from "lucide-react";

// --- Mock Data ---

// --- Mock Data Removed (Connected to API) ---

const PLANS = [
    { id: 1, name: "الباقة الأساسية", price: "99", period: "شهر", features: ["5 إعلانات", "دعم فني محدود", "إحصائيات أساسية"], active: true },
    { id: 2, name: "الباقة الفضية", price: "149", period: "شهر", features: ["15 إعلان", "دعم فني عبر البريد", "إحصائيات متقدمة"], active: true },
    { id: 3, name: "الباقة الذهبية", price: "299", period: "شهر", features: ["إعلانات غير محدودة", "دعم فني فوري", "مدير حساب خاص"], active: true },
    { id: 4, name: "باقة الشركات", price: "1500", period: "سنة", features: ["وصول API", "تخصيص كامل", "تدريب للفريق"], active: true },
];

// --- Sub-components ---

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// --- Types ---
interface AnalyticsData {
    totalRevenue: number;
    activeSubscriptions: number;
    revenueChartData: { name: string; revenue: number }[];
    subscriptionDistribution: { name: string; value: number }[];
    recentTransactions: {
        id: string;
        user: string;
        plan: string;
        amount: string;
        status: string;
        date: string;
    }[];
}

function OverviewTab() {
    const { data, isLoading } = useQuery<AnalyticsData>({
        queryKey: ['/api/billing/analytics'],
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    const {
        totalRevenue = 0,
        activeSubscriptions = 0,
        revenueChartData = [],
        subscriptionDistribution = [],
        recentTransactions = []
    } = data || {};

    // Helper colors for pie chart
    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} SAR</div>
                        <p className="text-xs text-muted-foreground">الإيرادات المحصلة</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubscriptions}</div>
                        <p className="text-xs text-muted-foreground">مشترك حالي</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--%</div>
                        <p className="text-xs text-muted-foreground">سيتم تفعيله قريباً</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط قيمة المشترك</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-- SAR</div>
                        <p className="text-xs text-muted-foreground">سيتم تفعيله قريباً</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>نمو الإيرادات</CardTitle>
                        <CardDescription>الإيرادات الشهرية (آخر 6 أشهر)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="الإيرادات" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>توزيع الاشتراكات</CardTitle>
                        <CardDescription>حالة الاشتراكات الحالية</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subscriptionDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {subscriptionDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>آخر العمليات المالية</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px] text-right">رقم العملية</TableHead>
                                <TableHead className="text-right">المستخدم</TableHead>
                                <TableHead className="text-right">الخطة</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">المبلغ</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        لا توجد عمليات حديثة
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentTransactions.map((trx) => (
                                    <TableRow key={trx.id}>
                                        <TableCell className="font-medium">{trx.id}</TableCell>
                                        <TableCell>{trx.user}</TableCell>
                                        <TableCell>{trx.plan}</TableCell>
                                        <TableCell>{trx.date}</TableCell>
                                        <TableCell>{trx.amount}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={trx.status === 'PAID' || trx.status === 'completed' ? 'default' : trx.status === 'PENDING' || trx.status === 'pending' ? 'secondary' : 'destructive'}
                                            >
                                                {trx.status === 'PAID' ? 'مكتمل' : trx.status === 'PENDING' ? 'معلق' : trx.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

const PlanFeature = ({ feature }: { feature: string }) => (
    <li className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        {feature}
    </li>
);

function ActiveSubscriptionsTab() {
    const { data: subscriptions, isLoading } = useQuery<any[]>({
        queryKey: ['/api/billing/subscriptions'],
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">الاشتراكات النشطة</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>قائمة المشتركين</CardTitle>
                    <CardDescription>إدارة اشتراكات العملاء الحالية</CardDescription>
                </CardHeader>
                <CardContent>
                    {!subscriptions || subscriptions.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            لا توجد اشتراكات نشطة حالياً.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">رقم الاشتراك</TableHead>
                                    <TableHead className="text-right">الخطة</TableHead>
                                    <TableHead className="text-right">تاريخ البدء</TableHead>
                                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.id.substring(0, 8)}...</TableCell>
                                        <TableCell>{sub.plan?.nameAr || sub.plan?.nameEn || 'غير محدد'}</TableCell>
                                        <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {sub.status === 'ACTIVE' ? 'نشط' : sub.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function PaymentMethodsTab() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">طرق الدفع وبوابات الدفع</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Stripe</CardTitle>
                            <CardDescription>بوابة الدفع العالمية</CardDescription>
                        </div>
                        <Badge className="bg-green-500">متصل (محاكاة)</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">الرصيد المتاح:</span>
                                <span className="font-medium">12,450.00 USD</span>
                            </div>
                            <Button variant="outline" className="w-full">إدارة الإعدادات</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>PayPal</CardTitle>
                            <CardDescription>المدفوعات الإلكترونية</CardDescription>
                        </div>
                        <Badge variant="secondary">غير نشط</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">قم بتفعيل PayPal لاستقبال المدفوعات.</p>
                            <Button className="w-full">تفعيل</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PlansTab() {
    const { data: plans, isLoading } = useQuery<any[]>({
        queryKey: ['/api/billing/plans'],
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">خطط الاشتراك</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(plans || []).map(plan => (
                    <Card key={plan.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{plan.nameAr || plan.nameEn}</CardTitle>
                            <div className="text-2xl font-bold mt-2">
                                {plan.price} <span className="text-sm font-normal text-muted-foreground"> {plan.currency} / {plan.billingPeriod}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm">
                                {(plan.pricing_plan_features || []).map((feature: any) => (
                                    <PlanFeature key={feature.id} feature={feature.nameAr || feature.nameEn} />
                                ))}
                                {(!plan.pricing_plan_features || plan.pricing_plan_features.length === 0) && (
                                    <li className="text-muted-foreground italic">لا توجد ميزات مدرجة</li>
                                )}
                            </ul>
                        </CardContent>
                        <div className="p-6 pt-0 mt-auto">
                            <Button className="w-full" variant="outline">تعديل الخطة</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

// --- Main Page Component ---

export default function RevenueManagement() {
    const [location, setLocation] = useLocation();

    // Determine active tab based on URL
    const activeTab = location.split('/').pop() || 'overview';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/revenue/${value}`);
    };

    return (
        <div className="space-y-6 p-6" dir="rtl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">إدارة الإيرادات</h1>
                <p className="text-muted-foreground">
                    نظرة شاملة على الأداء المالي، الاشتراكات، وخطط الأسعار.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="active-subscriptions">الاشتراكات</TabsTrigger>
                    <TabsTrigger value="subscription-plans">الخطط</TabsTrigger>
                    <TabsTrigger value="payment-methods">الدفع</TabsTrigger>
                    <TabsTrigger value="reports">التقارير</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <OverviewTab />
                </TabsContent>

                <TabsContent value="active-subscriptions">
                    <ActiveSubscriptionsTab />
                </TabsContent>

                <TabsContent value="subscription-plans">
                    <PlansTab />
                </TabsContent>

                <TabsContent value="payment-methods">
                    <PaymentMethodsTab />
                </TabsContent>

                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>التقارير المالية</CardTitle>
                            <CardDescription>قم بتحميل التقارير المالية الشهرية والسنوية</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    "تقرير الدخل - يناير 2025",
                                    "تقرير الضرائب - الربع الرابع 2024",
                                    "تقرير الاشتراكات - السنوي 2024"
                                ].map((report, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                            <span className="font-medium">{report}</span>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
