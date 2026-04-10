/**
 * BillingManagement — إدارة الفوترة | Admin page for managing subscription plans, invoices, and payment status.
 *
 * @route /admin/billing
 * @auth WEBSITE_ADMIN
 * @dataSources billing/plans, billing/invoices, billing/metrics
 */
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
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
    CreditCard,
    Download,
    Eye,
    CheckCircle2,
    Search,
    Filter,
    TrendingUp,
    Wallet,
    History,
    FileText,
    MoreHorizontal,
    Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatAdminDate, formatPrice } from "@/lib/formatters";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { STATUS_COLORS } from "@/config/design-tokens";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";

type Invoice = {
    id: string;
    number: string;
    status: string;
    issueDate: string;
    amountDue: number | string;
    amountPaid: number | string;
    currency: string;
    account?: {
        organization?: {
            nameAr?: string;
            nameEn?: string;
        } | null;
        user?: {
            firstName?: string | null;
            lastName?: string | null;
            email?: string | null;
        } | null;
    };
    subscription?: {
        plan?: {
            nameAr?: string;
            nameEn?: string;
        } | null;
    } | null;
};

type BillingStats = {
    totalCollected: number;
    pendingInvoices: number;
    revenueChange: string;
};

function InvoiceTable({ invoices, isLoading }: { invoices: Invoice[]; isLoading: boolean }) {
    return (
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input placeholder="البحث عن فاتورة أو عميل..." className="h-12 pe-11 rounded-2xl bg-card border-border focus:ring-primary/20" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-border font-bold text-muted-foreground">
                        <Filter className="h-4 w-4 me-2" />
                        تصفية
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">
                        <Plus className="h-5 w-5 me-2" />
                        إنشاء فاتورة
                    </Button>
                </div>
            </div>
            <Table className="text-end">
                <TableHeader className="bg-muted/50">
                    <TableRow className="border-border">
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">رقم الفاتورة</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">العميل</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">المبلغ</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">التاريخ</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الحالة</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={6} className="p-4">
                                    <Skeleton className="h-12 w-full" />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="p-8 text-center">
                                <p className="text-muted-foreground font-medium">لا توجد فواتير</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((inv) => {
                            const clientName = inv.account?.organization?.nameAr || 
                                inv.account?.organization?.nameEn ||
                                `${inv.account?.user?.firstName || ''} ${inv.account?.user?.lastName || ''}`.trim() ||
                                inv.account?.user?.email ||
                                'غير محدد';
                            const invoiceType = inv.subscription?.plan?.nameAr || 
                                inv.subscription?.plan?.nameEn || 
                                'فاتورة';
                            const amount = Number(inv.amountPaid || inv.amountDue || 0);
                            const statusMap: Record<string, { label: string; className: string }> = {
                                'PAID': { label: 'مدفوعة', className: `${STATUS_COLORS.success.bg} ${STATUS_COLORS.success.text}` },
                                'PENDING': { label: 'معلقة', className: `${STATUS_COLORS.pending.bg} ${STATUS_COLORS.pending.text}` },
                                'OVERDUE': { label: 'متأخرة', className: `${STATUS_COLORS.error.bg} ${STATUS_COLORS.error.text}` },
                                'DRAFT': { label: 'مسودة', className: `${STATUS_COLORS.inactive.bg} ${STATUS_COLORS.inactive.text}` }
                            };
                            const statusInfo = statusMap[inv.status] || { label: inv.status, className: 'bg-muted/30 text-foreground/80' };
                            const issueDate = formatAdminDate(inv.issueDate);

                            return (
                                <TableRow key={inv.id} className="hover:bg-primary/5 transition-colors group border-border">
                                    <TableCell className="py-4"><span className="text-sm font-bold text-foreground">{inv.number}</span></TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground/80">{clientName}</span>
                                            <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter">{invoiceType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4"><span className="text-sm font-bold text-primary">{formatPrice(amount, inv.currency || 'SAR')}</span></TableCell>
                                    <TableCell className="py-4"><span className="text-xs font-bold text-muted-foreground">{issueDate}</span></TableCell>
                                    <TableCell className="py-4">
                                        <Badge className={cn("text-xs font-bold border-0 px-3 py-1 rounded-lg", statusInfo.className)}>
                                            {statusInfo.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50"><Eye className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50"><Download className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

// --- Main Page Component ---

export default function BillingManagement() {
    const showSkeleton = useMinLoadTime();
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'invoices';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/billing/${value}`);
    };

    const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{ success: boolean; invoices: Invoice[] }>({
        queryKey: ['/api/rbac-admin/billing/invoices'],
        queryFn: async () => apiGet('api/rbac-admin/billing/invoices')
    });

    const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; stats: BillingStats }>({
        queryKey: ['/api/rbac-admin/billing/stats'],
        queryFn: async () => apiGet('api/rbac-admin/billing/stats')
    });

    const invoices = invoicesData?.invoices || [];
    const stats = statsData?.stats;

    if ((invoicesLoading && statsLoading) || showSkeleton) {
        return (
            <div className={PAGE_WRAPPER}>
                <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight mb-6">إدارة الفواتير والاشتراكات</h1>
                <AdminPageSkeleton />
            </div>
        );
    }

    return (
        <div className={PAGE_WRAPPER}>
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-primary text-white rounded-xl flex items-center justify-center shadow-xl shadow-primary/10">
                            <CreditCard className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">إدارة الفواتير والاشتراكات</h1>
                            <p className="text-muted-foreground font-medium text-lg">متابعة العمليات المالية وإصدار الفواتير للعملاء</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm p-6">
                            <Skeleton className="h-20 w-full" />
                        </Card>
                    ))
                ) : (
                    [
                        { 
                            title: "إجمالي التحصيل",
                            value: formatPrice(stats?.totalCollected || 0),
                            icon: Wallet, 
                            color: "text-muted-foreground", 
                            bg: "bg-muted/50" 
                        },
                        { 
                            title: "فواتير معلقة", 
                            value: `${stats?.pendingInvoices || 0} فاتورة`, 
                            icon: History, 
                            color: "text-muted-foreground", 
                            bg: "bg-muted/50" 
                        },
                        { 
                            title: "الإيراد الشهري", 
                            value: `${stats?.revenueChange ? (Number(stats.revenueChange) > 0 ? '+' : '') + stats.revenueChange : '0'}٪`, 
                            icon: TrendingUp, 
                            color: "text-muted-foreground", 
                            bg: "bg-muted/50" 
                        },
                    ].map((stat, i) => (
                        <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">{stat.title}</p>
                                    <h3 className="text-xl font-bold text-foreground">{stat.value}</h3>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="invoices" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الفواتير</TabsTrigger>
                    <TabsTrigger value="subscriptions" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الاشتراكات</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الإعدادات المالية</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <InvoiceTable invoices={invoices} isLoading={invoicesLoading} />
                </TabsContent>

                <TabsContent value="subscriptions" className="space-y-4">
                    <Card className="rounded-2xl p-20 text-center bg-muted/30 border-2 border-dashed border-border flex flex-col items-center">
                        <div className="h-20 w-20 bg-card rounded-2xl shadow-xl shadow-slate-500/10 flex items-center justify-center text-muted-foreground/70 mb-6 group-hover:scale-110 transition-transform">
                            <FileText className="h-10 w-10 text-primary opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">إدارة الاشتراكات</h3>
                        <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed mt-2">
                            سيتم توفير قائمة بكافة اشتراكات العملاء وتفاصيل تجديدها قريباً.
                        </p>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-foreground tracking-tight">إعدادات الفاتورة</h3>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">ضريبة القيمة المضافة (٪)</Label>
                                    <Input defaultValue="١٥" className="h-12 rounded-xl bg-muted/30 border-border font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">بادئة رقم الفاتورة</Label>
                                    <Input defaultValue="INV-" className="h-12 rounded-xl bg-muted/30 border-border font-mono" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-foreground tracking-tight">بوابة الدفع</h3>
                                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-card rounded-xl flex items-center justify-center text-primary shadow-sm">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-bold text-primary">بوابة Moyasar متصلة</span>
                                    </div>
                                    <Button variant="ghost" className="text-xs font-bold text-primary underline">تعديل</Button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 pt-8 border-t border-border flex justify-end">
                            <Button className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20 transition-all hover:bg-primary/90">حفظ الإعدادات</Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
