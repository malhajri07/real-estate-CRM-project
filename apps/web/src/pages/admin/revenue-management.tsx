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

const REVENUE_DATA = [
    { name: 'يناير', revenue: 4000, subscriptions: 240 },
    { name: 'فبراير', revenue: 3000, subscriptions: 139 },
    { name: 'مارس', revenue: 2000, subscriptions: 980 },
    { name: 'أبريل', revenue: 2780, subscriptions: 390 },
    { name: 'مايو', revenue: 1890, subscriptions: 480 },
    { name: 'يونيو', revenue: 2390, subscriptions: 380 },
    { name: 'يوليو', revenue: 3490, subscriptions: 430 },
];

const SUBSCRIPTION_STATUS_DATA = [
    { name: 'نشط', value: 400, color: '#10b981' },
    { name: 'منتهي', value: 100, color: '#ef4444' },
    { name: 'معلق', value: 50, color: '#f59e0b' },
];

const RECENT_TRANSACTIONS = [
    { id: 'TRX-9821', user: 'أحمد محمد', plan: 'الذهبية', amount: '299 SAR', status: 'completed', date: '2025-01-15' },
    { id: 'TRX-9822', user: 'شركة العقار الحديث', plan: 'الشركات', amount: '1500 SAR', status: 'completed', date: '2025-01-14' },
    { id: 'TRX-9823', user: 'خالد العمري', plan: 'الفضية', amount: '149 SAR', status: 'pending', date: '2025-01-14' },
    { id: 'TRX-9824', user: 'مكتب الرياض', plan: 'الشركات', amount: '1500 SAR', status: 'failed', date: '2025-01-13' },
    { id: 'TRX-9825', user: 'سارة العتيبي', plan: 'الذهبية', amount: '299 SAR', status: 'completed', date: '2025-01-12' },
];

const PLANS = [
    { id: 1, name: "الباقة الأساسية", price: "99", period: "شهر", features: ["5 إعلانات", "دعم فني محدود", "إحصائيات أساسية"], active: true },
    { id: 2, name: "الباقة الفضية", price: "149", period: "شهر", features: ["15 إعلان", "دعم فني عبر البريد", "إحصائيات متقدمة"], active: true },
    { id: 3, name: "الباقة الذهبية", price: "299", period: "شهر", features: ["إعلانات غير محدودة", "دعم فني فوري", "مدير حساب خاص"], active: true },
    { id: 4, name: "باقة الشركات", price: "1500", period: "سنة", features: ["وصول API", "تخصيص كامل", "تدريب للفريق"], active: true },
];

// --- Sub-components ---

function OverviewTab() {
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
                        <div className="text-2xl font-bold">45,231.89 SAR</div>
                        <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground">+180 مستخدم جديد</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12.23%</div>
                        <p className="text-xs text-muted-foreground">+2.4% زيادة</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط قيمة المشترك</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573.00 SAR</div>
                        <p className="text-xs text-muted-foreground">+201 SAR زيادة سنوية</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>نمو الإيرادات</CardTitle>
                        <CardDescription>الإيرادات الشهرية للعام الحالي</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={REVENUE_DATA}>
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
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={SUBSCRIPTION_STATUS_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {SUBSCRIPTION_STATUS_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
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
                                <TableHead className="w-[100px]">رقم العملية</TableHead>
                                <TableHead>المستخدم</TableHead>
                                <TableHead>الخطة</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {RECENT_TRANSACTIONS.map((trx) => (
                                <TableRow key={trx.id}>
                                    <TableCell className="font-medium">{trx.id}</TableCell>
                                    <TableCell>{trx.user}</TableCell>
                                    <TableCell>{trx.plan}</TableCell>
                                    <TableCell>{trx.date}</TableCell>
                                    <TableCell>{trx.amount}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant={trx.status === 'completed' ? 'default' : trx.status === 'pending' ? 'secondary' : 'destructive'}
                                        >
                                            {trx.status === 'completed' ? 'مكتمل' : trx.status === 'pending' ? 'معلق' : 'فشل'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function ActiveSubscriptionsTab() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">الاشتراكات النشطة</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4" />
                        تصفية
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                        تصدير
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-10 text-muted-foreground">
                        قائمة المشتركين وتفاصيل خططهم ستظهر هنا.
                    </div>
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
                        <Badge className="bg-green-500">متصل</Badge>
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>mada (مدى)</CardTitle>
                            <CardDescription>المدفوعات المحلية</CardDescription>
                        </div>
                        <Badge className="bg-green-500">متصل</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">العمليات اليومية:</span>
                                <span className="font-medium">3,200.00 SAR</span>
                            </div>
                            <Button variant="outline" className="w-full">إدارة الإعدادات</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PlansTab() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">خطط الاشتراك</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map(plan => (
                    <Card key={plan.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <div className="text-2xl font-bold mt-2">
                                {plan.price} <span className="text-sm font-normal text-muted-foreground">/ {plan.period}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <div className="p-6 pt-0 mt-auto">
                            <Button className="w-full" variant="outline">تعديل الخطة</Button>
                        </div>
                    </Card>
                ))}
                <Card className="flex flex-col justify-center items-center p-6 border-dashed">
                    <div className="rounded-full bg-slate-100 p-4 mb-4">
                        <DollarSign className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">إضافة خطة جديدة</h3>
                    <Button>إنشاء خطة</Button>
                </Card>
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
        <div className="space-y-6 p-6">
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
