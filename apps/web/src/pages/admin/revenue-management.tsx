/**
 * RevenueManagement — إدارة الإيرادات | Admin revenue dashboard with transaction tables and trend charts.
 *
 * @route /admin/revenue
 * @auth WEBSITE_ADMIN
 * @dataSources revenue/summary, revenue/transactions
 */
import { useLocation } from "wouter";
import { MetricCard } from "@/components/admin";
import { AdminTable, type AdminTableColumn } from "@/components/admin";
import { AdminLineChart, AdminPieChart } from "@/components/admin/data-display/AdminChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { ADMIN_BUTTON_PRIMARY } from "@/config/design-tokens";
import { formatAdminDate } from "@/lib/formatters";
import {
    Download,
    DollarSign,
    TrendingUp,
    Users,
    Activity,
    CheckCircle2,
    FileText,
    Calendar,
    ArrowUpRight,
    Wallet,
    ShieldCheck,
    Plus
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import {
    useAdminBillingAnalytics,
    useAdminSubscriptions,
    useAdminPlans,
    useSeedBillingData,
    type AdminTransaction
} from "@/lib/billingAdmin";

// --- Sub-components ---

function OverviewTab() {
    const showSkeleton = useMinLoadTime();
    const { data, isLoading, error } = useAdminBillingAnalytics();

    if (isLoading || showSkeleton) {
        return <AdminPageSkeleton />;
    }

    if (error) {
        return (
            <Card className="border-destructive/20 bg-destructive/5 p-6 text-center rounded-2xl">
                <p className="text-destructive font-bold">تعذر تحميل البيانات المالية: {error.message}</p>
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
                    <span className="font-bold text-foreground">#{trx.id.slice(0, 8)}</span>
                    <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter mt-0.5">{trx.date}</span>
                </div>
            )
        },
        {
            key: 'user',
            label: 'المشترك',
            render: (trx) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground/80">{trx.user}</span>
                    <span className="text-xs font-bold text-muted-foreground/70">{trx.plan}</span>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'المبلغ',
            render: (trx) => (
                <span className="font-bold text-foreground">{trx.amount}</span>
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
                            "border-0 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase",
                            isPaid && "bg-primary/10 text-primary",
                            isPending && "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
                            (!isPaid && !isPending) && "bg-muted/50 text-muted-foreground"
                        )}
                    >
                        {isPaid ? 'مكتمل' : isPending ? 'معلق' : trx.status}
                    </Badge>
                );
            }
        },
    ];

    return (
        <div className="space-y-6">
            <div className={GRID_METRICS}>
                <MetricCard
                    title="إجمالي الإيرادات"
                    subtitle=""
                    icon={<Wallet className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: totalRevenue, last7Days: totalRevenue, last30Days: totalRevenue }}
                    currency="SAR"
                    loading={isLoading}
                />
                <MetricCard
                    title="الاشتراكات النشطة"
                    subtitle="مستخدم مفعل"
                    icon={<Users className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: activeSubscriptions, last7Days: activeSubscriptions, last30Days: activeSubscriptions }}
                    loading={isLoading}
                />
                <MetricCard
                    title="معدل النمو"
                    subtitle="آخر ٣٠ يوم"
                    icon={<ArrowUpRight className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: 12, last7Days: 8, last30Days: 15 }}
                    loading={isLoading}
                />
                <MetricCard
                    title="متوسط دخل العميل"
                    subtitle="لكل عملية"
                    icon={<TrendingUp className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: 450, last7Days: 420, last30Days: 445 }}
                    currency="SAR"
                    loading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 group">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 text-muted-foreground" />
                            تحليل نمو الإيرادات
                        </h3>
                        <p className="text-muted-foreground font-medium text-sm">مراقبة تدفق الدخل الشهري</p>
                    </div>
                    <div className="h-[300px]">
                        <AdminLineChart
                            data={revenueChartData}
                            dataKeys={["revenue"]}
                            xAxisKey="name"
                        />
                    </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 group">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                            توزيع الاشتراكات
                        </h3>
                        <p className="text-muted-foreground font-medium text-sm">تقسيم المستخدمين حسب حالة الاشتراك</p>
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

            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">آخر العمليات المالية</h3>
                        <p className="text-muted-foreground font-medium text-sm">سجل التحويلات والمدفوعات الأخيرة</p>
                    </div>
                    <Button variant="outline" className="h-10 rounded-xl border-border text-muted-foreground font-bold hover:bg-muted/30">
                        <Calendar className="w-4 h-4 me-2" />
                        عرض الكل
                    </Button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-white/40">
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
        <CheckCircle2 className="h-4 w-4 text-primary" />
        {feature}
    </li>
);

function ActiveSubscriptionsTab() {
    const showSkeleton = useMinLoadTime();
    const { data: subscriptions, isLoading, error } = useAdminSubscriptions();

    const subscriptionColumns: AdminTableColumn<any>[] = [
        {
            key: 'id',
            label: 'الاشتراك',
            render: (sub) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">#{sub.id.substring(0, 8)}</span>
                    <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter mt-0.5">ID: {sub.id.substring(0, 4)}</span>
                </div>
            )
        },
        {
            key: 'user',
            label: 'المستخدم',
            render: (sub) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground/80">
                        {sub.user ? `${sub.user.firstName ?? ''} ${sub.user.lastName ?? ''}`.trim() || sub.user.username : "غير معروف"}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground/70 italic">نشط منذ {new Date(sub.startDate).getFullYear()}</span>
                </div>
            )
        },
        {
            key: 'plan',
            label: 'الخطة',
            render: (sub) => (
                <Badge variant="secondary" className="bg-primary/5 text-primary border-0 text-xs font-bold uppercase px-2 py-0.5 rounded-md">
                    {sub.plan?.nameAr || sub.plan?.nameEn || 'Basic'}
                </Badge>
            )
        },
        {
            key: 'dates',
            label: 'الفترة',
            render: (sub) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">{formatAdminDate(sub.startDate)}</span>
                    <span className="text-xs font-bold text-muted-foreground/70">إلى {formatAdminDate(sub.endDate)}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (sub) => (
                <Badge className={cn("border-0 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase", sub.status === 'ACTIVE' ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground/70")}>
                    {sub.status === 'ACTIVE' ? 'نشط' : sub.status}
                </Badge>
            )
        },
    ];

    if (isLoading || showSkeleton) {
        return <AdminPageSkeleton />;
    }

    if (error) {
        return <div className="text-center text-destructive p-6 font-bold">فشل تحميل الاشتراكات: {error.message}</div>;
    }

    return (
        <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">قائمة المشتركين</h2>
                    <p className="text-muted-foreground font-medium">إدارة اشتراكات العملاء الحالية وتفاصيل الوصول</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white/40">
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
        <div className="space-y-6">
            <div className="px-4">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">طرق الدفع وبوابات الدفع</h2>
                <p className="text-muted-foreground font-medium text-sm">إدارة الاتصال بمزودي خدمات الدفع العالمية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold uppercase px-2.5 py-1 rounded-lg">متصل (محاكاة)</Badge>
                    </div>

                    <div className="flex flex-col h-full">
                        <div className="mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Activity className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-1">Stripe</h3>
                            <p className="text-muted-foreground font-medium text-sm">بوابة الدفع العالمية رقم ١ للمؤسسات</p>
                        </div>

                        <div className="space-y-6 mt-auto">
                            <div className="p-4 bg-card/50 border border-border rounded-2xl flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">الرصيد المتاح</span>
                                <span className="text-xl font-bold text-foreground">12,450.00 USD</span>
                            </div>
                            <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-xl shadow-primary/20">
                                إدارة الإعدادات
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 group relative overflow-hidden bg-muted/30">
                    <div className="absolute top-0 right-0 p-8">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 text-xs font-bold uppercase px-2.5 py-1 rounded-lg">غير نشط</Badge>
                    </div>

                    <div className="flex flex-col h-full opacity-60 grayscale-[0.5]">
                        <div className="mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
                                <DollarSign className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-1">PayPal</h3>
                            <p className="text-muted-foreground font-medium text-sm">نظام الدفع عبر الإنترنت الموثوق</p>
                        </div>

                        <div className="space-y-4 mt-auto">
                            <p className="text-xs font-medium text-muted-foreground text-center">قم بتفعيل PayPal لاستقبال المدفوعات.</p>
                            <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-xl shadow-primary/10">
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
    const showSkeleton = useMinLoadTime();
    const { data: plans, isLoading, error } = useAdminPlans();

    if (isLoading || showSkeleton) {
        return <AdminPageSkeleton />;
    }

    if (error) {
        return <div className="text-center text-destructive p-6 font-bold">فشل تحميل الخطط: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">خطط الاشتراك</h2>
                    <p className="text-muted-foreground font-medium">إدارة الباقات والميزات والأسعار</p>
                </div>
                <Button className={ADMIN_BUTTON_PRIMARY}>
                    <Plus className="h-5 w-5 me-2" />
                    إضافة خطة جديدة
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(plans || []).map(plan => (
                    <Card key={plan.id} className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col hover:shadow-md hover:shadow-primary/10 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-foreground mb-2 truncate max-w-[180px]">{plan.nameAr || plan.nameEn}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                                <span className="text-muted-foreground/70 font-bold text-sm uppercase">{plan.currency} / {plan.billingPeriod === 'MONTHLY' ? 'شهري' : plan.billingPeriod}</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-10">
                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest border-b border-border pb-2">الميزات المشمولة</p>
                            <ul className="space-y-4">
                                {(plan.pricing_plan_features || []).map((feature) => (
                                    <li key={feature.id} className="flex items-start gap-3">
                                        <div className="mt-1 h-4 w-4 rounded-full bg-muted/50 flex items-center justify-center">
                                            <CheckCircle2 className="h-2.5 w-2.5 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground leading-tight">{feature.nameAr || feature.nameEn || feature.code}</span>
                                    </li>
                                ))}
                                {(!plan.pricing_plan_features || plan.pricing_plan_features.length === 0) && (
                                    <li className="text-muted-foreground/70 text-xs italic">لا توجد ميزات مدرجة</li>
                                )}
                            </ul>
                        </div>

                        <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all mt-auto shadow-xl shadow-primary/20">
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
        <div className={PAGE_WRAPPER}>
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-end">
                        <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">إدارة الإيرادات</h1>
                        <p className="text-muted-foreground font-medium text-lg">نظرة شاملة على الأداء المالي، الاشتراكات، وخطط الأسعار</p>
                    </div>
                    <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl border-border text-muted-foreground font-bold hover:bg-muted/30 transition-all shadow-sm"
                        onClick={() => seedMutation.mutate()}
                        disabled={seedMutation.isPending}
                    >
                        {seedMutation.isPending ? <Spinner size="sm" className="me-2" /> : <Activity className="h-5 w-5 me-2 text-muted-foreground" />}
                        إعادة تعيين بيانات تجريبية
                    </Button>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="overview" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="active-subscriptions" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الاشتراكات</TabsTrigger>
                    <TabsTrigger value="subscription-plans" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الخطط</TabsTrigger>
                    <TabsTrigger value="payment-methods" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الدفع</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">التقارير</TabsTrigger>
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
                    <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight tracking-tight">التقارير المالية</h2>
                            <p className="text-muted-foreground font-medium">قم بتحميل التقارير المالية الشهرية والسنوية</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { name: "تقرير الدخل - يناير 2025", type: "PDF" },
                                { name: "تقرير الضرائب - الربع الرابع 2024", type: "EXCEL" },
                                { name: "تقرير الاشتراكات - السنوي 2024", type: "PDF" }
                            ].map((report, i) => (
                                <div key={i} className="flex flex-col p-6 bg-card/50 border border-border rounded-2xl hover:bg-card hover:shadow-md hover:shadow-primary/10 transition-all group">
                                    <div className="h-12 w-12 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-foreground mb-1">{report.name}</span>
                                    <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-6">{report.type}</span>
                                    <Button variant="outline" className="mt-auto h-10 w-full rounded-xl border-border font-bold text-muted-foreground hover:bg-muted/50 hover:text-foreground/80 hover:border-border transition-all">
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
