import { useState } from "react";
import { useLocation } from "wouter";
import { AdminCard, MetricCard } from "@/components/admin";
import { AdminTable, type AdminTableColumn } from "@/components/admin";
import { AdminLineChart, AdminPieChart } from "@/components/admin/data-display/AdminChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Download,
    DollarSign,
    TrendingUp,
    Users,
    Activity,
    CheckCircle2,
    FileText,
    Loader2,
    Calendar,
    ArrowUpRight,
    Wallet,
    ShieldCheck
} from "lucide-react";
import {
    useAdminBillingAnalytics,
    useAdminSubscriptions,
    useAdminPlans,
    useSeedBillingData,
    type AdminTransaction
} from "@/lib/billingAdmin";

// --- Sub-components ---

function OverviewTab() {
    const { data, isLoading, error } = useAdminBillingAnalytics();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-bold animate-pulse">جاري تحليل البيانات المالية...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-100 bg-red-50/50 p-8 text-center rounded-[2rem]">
                <p className="text-red-600 font-bold">تعذر تحميل البيانات المالية: {error.message}</p>
            </Card>
        );
    }

    const {
        totalRevenue = 0,
        activeSubscriptions = 0,
        revenueChartData = [],
        subscriptionDistribution = [],
        recentTransactions = []
    } = data || {};

    const transactionColumns: AdminTableColumn<AdminTransaction>[] = [
        {
            key: 'id',
            label: 'العملية',
            render: (trx) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">#{trx.id.slice(0, 8)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{trx.date}</span>
                </div>
            )
        },
        {
            key: 'user',
            label: 'المشترك',
            render: (trx) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{trx.user}</span>
                    <span className="text-[10px] font-bold text-slate-400">{trx.plan}</span>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'المبلغ',
            render: (trx) => (
                <span className="font-black text-slate-900">{trx.amount}</span>
            )
        },
        {
            key: 'status',
            label: 'الحالة',
            className: "w-24",
            render: (trx) => {
                const isPaid = trx.status === 'PAID' || trx.status === 'completed';
                const isPending = trx.status === 'PENDING' || trx.status === 'pending';
                return (
                    <Badge
                        className={cn(
                            "border-0 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase",
                            isPaid && "bg-emerald-50 text-emerald-700",
                            isPending && "bg-amber-50 text-amber-700",
                            (!isPaid && !isPending) && "bg-slate-100 text-slate-500"
                        )}
                    >
                        {isPaid ? 'مكتمل' : isPending ? 'معلق' : trx.status}
                    </Badge>
                );
            }
        },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="إجمالي الإيرادات"
                    subtitle="ريال سعودي"
                    icon={<Wallet className="w-5 h-5 text-emerald-600" />}
                    metric={{ today: totalRevenue, last7Days: totalRevenue, last30Days: totalRevenue }}
                    currency="SAR"
                    loading={isLoading}
                />
                <MetricCard
                    title="الاشتراكات النشطة"
                    subtitle="مستخدم مفعل"
                    icon={<Users className="w-5 h-5 text-blue-600" />}
                    metric={{ today: activeSubscriptions, last7Days: activeSubscriptions, last30Days: activeSubscriptions }}
                    loading={isLoading}
                />
                <MetricCard
                    title="معدل النمو"
                    subtitle="آخر ٣٠ يوم"
                    icon={<ArrowUpRight className="w-5 h-5 text-purple-600" />}
                    metric={{ today: 12, last7Days: 8, last30Days: 15 }}
                    loading={isLoading}
                />
                <MetricCard
                    title="متوسط دخل العميل"
                    subtitle="لكل عملية"
                    icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
                    metric={{ today: 450, last7Days: 420, last30Days: 445 }}
                    currency="SAR"
                    loading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            تحليل نمو الإيرادات
                        </h3>
                        <p className="text-slate-500 font-medium text-sm">مراقبة تدفق الدخل الشهري</p>
                    </div>
                    <div className="h-[300px]">
                        <AdminLineChart
                            data={revenueChartData}
                            dataKeys={["revenue"]}
                            xAxisKey="name"
                        />
                    </div>
                </Card>

                <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            توزيع الاشتراكات
                        </h3>
                        <p className="text-slate-500 font-medium text-sm">تقسيم المستخدمين حسب حالة الاشتراك</p>
                    </div>
                    <div className="h-[300px]">
                        <AdminPieChart
                            data={subscriptionDistribution}
                            dataKeys={["value"]}
                            xAxisKey="name"
                        />
                    </div>
                </Card>
            </div>

            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">آخر العمليات المالية</h3>
                        <p className="text-slate-500 font-medium text-sm">سجل التحويلات والمدفوعات الأخيرة</p>
                    </div>
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                        <Calendar className="w-4 h-4 me-2" />
                        عرض الكل
                    </Button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
                    <AdminTable
                        columns={transactionColumns}
                        data={recentTransactions}
                        keyExtractor={(trx) => trx.id}
                        pageSize={5}
                    />
                </div>
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
    const { data: subscriptions, isLoading, error } = useAdminSubscriptions();

    const subscriptionColumns: AdminTableColumn<any>[] = [
        {
            key: 'id',
            label: 'الاشتراك',
            render: (sub) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">#{sub.id.substring(0, 8)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">ID: {sub.id.substring(0, 4)}</span>
                </div>
            )
        },
        {
            key: 'user',
            label: 'المستخدم',
            render: (sub) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">
                        {sub.user ? `${sub.user.firstName ?? ''} ${sub.user.lastName ?? ''}`.trim() || sub.user.username : "غير معروف"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 italic">نشط منذ {new Date(sub.startDate).getFullYear()}</span>
                </div>
            )
        },
        {
            key: 'plan',
            label: 'الخطة',
            render: (sub) => (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                    {sub.plan?.nameAr || sub.plan?.nameEn || 'Basic'}
                </Badge>
            )
        },
        {
            key: 'dates',
            label: 'الفترة',
            render: (sub) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-600">{new Date(sub.startDate).toLocaleDateString()}</span>
                    <span className="text-[10px] font-bold text-slate-400">إلى {new Date(sub.endDate).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (sub) => (
                <Badge className={cn("border-0 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase", sub.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                    {sub.status === 'ACTIVE' ? 'نشط' : sub.status}
                </Badge>
            )
        },
    ];

    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-8 font-bold">فشل تحميل الاشتراكات: {error.message}</div>;
    }

    return (
        <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">قائمة المشتركين</h2>
                    <p className="text-slate-500 font-medium">إدارة اشتراكات العملاء الحالية وتفاصيل الوصول</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
                <AdminTable
                    columns={subscriptionColumns}
                    data={subscriptions || []}
                    keyExtractor={(sub) => sub.id}
                />
            </div>
        </Card>
    );
}

function PaymentMethodsTab() {
    return (
        <div className="space-y-8">
            <div className="px-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">طرق الدفع وبوابات الدفع</h2>
                <p className="text-slate-500 font-medium text-sm">إدارة الاتصال بمزودي خدمات الدفع العالمية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">متصل (محاكاة)</Badge>
                    </div>

                    <div className="flex flex-col h-full">
                        <div className="mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Activity className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-1">Stripe</h3>
                            <p className="text-slate-500 font-medium text-sm">بوابة الدفع العالمية رقم ١ للمؤسسات</p>
                        </div>

                        <div className="space-y-6 mt-auto">
                            <div className="p-4 bg-white/50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الرصيد المتاح</span>
                                <span className="text-xl font-black text-slate-900">12,450.00 USD</span>
                            </div>
                            <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-900/10">
                                إدارة الإعدادات
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none group relative overflow-hidden bg-slate-50/50">
                    <div className="absolute top-0 right-0 p-8">
                        <Badge variant="secondary" className="bg-slate-200 text-slate-500 border-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">غير نشط</Badge>
                    </div>

                    <div className="flex flex-col h-full opacity-60 grayscale-[0.5]">
                        <div className="mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mb-4">
                                <DollarSign className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-1">PayPal</h3>
                            <p className="text-slate-500 font-medium text-sm">نظام الدفع عبر الإنترنت الموثوق</p>
                        </div>

                        <div className="space-y-4 mt-auto">
                            <p className="text-xs font-medium text-slate-500 text-center">قم بتفعيل PayPal لاستقبال المدفوعات.</p>
                            <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xl shadow-blue-600/10">
                                تفعيل الخدمة
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function PlansTab() {
    const { data: plans, isLoading, error } = useAdminPlans();

    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-8 font-bold">فشل تحميل الخطط: {error.message}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">خطط الاشتراك</h2>
                    <p className="text-slate-500 font-medium">إدارة الباقات والميزات والأسعار</p>
                </div>
                <Button className="premium-gradient text-white border-0 shadow-lg shadow-blue-500/25 h-12 px-8 rounded-2xl font-bold">
                    <Plus className="h-5 w-5 me-2" />
                    إضافة خطة جديدة
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(plans || []).map(plan => (
                    <Card key={plan.id} className="glass border-0 rounded-[2.5rem] p-8 shadow-none flex flex-col hover:shadow-2xl hover:shadow-blue-500/5 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50/50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-black text-slate-900 mb-2 truncate max-w-[180px]">{plan.nameAr || plan.nameEn}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                                <span className="text-slate-400 font-bold text-sm uppercase">{plan.currency} / {plan.billingPeriod === 'MONTHLY' ? 'شهري' : plan.billingPeriod}</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">الميزات المشمولة</p>
                            <ul className="space-y-3">
                                {(plan.pricing_plan_features || []).map((feature) => (
                                    <li key={feature.id} className="flex items-start gap-3">
                                        <div className="mt-1 h-4 w-4 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 leading-tight">{feature.nameAr || feature.nameEn || feature.code}</span>
                                    </li>
                                ))}
                                {(!plan.pricing_plan_features || plan.pricing_plan_features.length === 0) && (
                                    <li className="text-slate-400 text-xs italic">لا توجد ميزات مدرجة</li>
                                )}
                            </ul>
                        </div>

                        <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all mt-auto shadow-xl shadow-slate-900/10">
                            تعديل تفاصيل الخطة
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    )
}

// --- Main Page Component ---

export default function RevenueManagement() {
    const [location, setLocation] = useLocation();
    const seedMutation = useSeedBillingData();

    // Determine active tab based on URL
    const activeTab = location.split('/').pop() || 'overview';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/revenue/${value}`);
    };

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-right">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الإيرادات</h1>
                        <p className="text-slate-500 font-medium text-lg">نظرة شاملة على الأداء المالي، الاشتراكات، وخطط الأسعار</p>
                    </div>
                    <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
                        onClick={() => seedMutation.mutate()}
                        disabled={seedMutation.isPending}
                    >
                        {seedMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin me-2" /> : <Activity className="h-5 w-5 me-2 text-blue-500" />}
                        إعادة تعيين بيانات تجريبية
                    </Button>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="overview" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="active-subscriptions" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الاشتراكات</TabsTrigger>
                    <TabsTrigger value="subscription-plans" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الخطط</TabsTrigger>
                    <TabsTrigger value="payment-methods" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الدفع</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">التقارير</TabsTrigger>
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
                    <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight tracking-tight">التقارير المالية</h2>
                            <p className="text-slate-500 font-medium">قم بتحميل التقارير المالية الشهرية والسنوية</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { name: "تقرير الدخل - يناير 2025", type: "PDF" },
                                { name: "تقرير الضرائب - الربع الرابع 2024", type: "EXCEL" },
                                { name: "تقرير الاشتراكات - السنوي 2024", type: "PDF" }
                            ].map((report, i) => (
                                <div key={i} className="flex flex-col p-6 bg-white/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-slate-900 mb-1">{report.name}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{report.type}</span>
                                    <Button variant="outline" className="mt-auto h-10 w-full rounded-xl border-slate-100 font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all">
                                        <Download className="h-4 w-4 me-2" />
                                        تحميل التقرير
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
