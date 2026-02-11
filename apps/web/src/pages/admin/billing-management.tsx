import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CreditCard,
    Receipt,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Filter,
    ArrowUpRight,
    TrendingUp,
    Wallet,
    History,
    FileText,
    MoreHorizontal,
    Plus,
    Printer,
    Share2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Card className="glass border-0 rounded-[2.5rem] overflow-hidden shadow-none">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input placeholder="البحث عن فاتورة أو عميل..." className="h-12 pr-11 rounded-2xl bg-white border-slate-100 focus:ring-blue-500/20" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-bold text-slate-600">
                        <Filter className="h-4 w-4 me-2" />
                        تصفية
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/10">
                        <Plus className="h-5 w-5 me-2" />
                        إنشاء فاتورة
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-end">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">رقم الفاتورة</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">العميل</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">المبلغ</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">التاريخ</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">الحالة</th>
                            <th className="p-4 w-[120px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 px-8">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={6} className="p-4">
                                        <Skeleton className="h-12 w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center">
                                    <p className="text-slate-500 font-medium">لا توجد فواتير</p>
                                </td>
                            </tr>
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
                                const formattedAmount = amount.toLocaleString('ar-SA');
                                const statusMap: Record<string, { label: string; className: string }> = {
                                    'PAID': { label: 'مدفوعة', className: 'bg-emerald-50 text-emerald-700' },
                                    'PENDING': { label: 'معلقة', className: 'bg-amber-50 text-amber-700' },
                                    'OVERDUE': { label: 'متأخرة', className: 'bg-rose-50 text-rose-700' },
                                    'DRAFT': { label: 'مسودة', className: 'bg-slate-50 text-slate-700' }
                                };
                                const statusInfo = statusMap[inv.status] || { label: inv.status, className: 'bg-slate-50 text-slate-700' };
                                const issueDate = new Date(inv.issueDate).toLocaleDateString('ar-SA');

                                return (
                                    <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4"><span className="text-sm font-black text-slate-900">{inv.number}</span></td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{clientName}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{invoiceType}</span>
                                            </div>
                                        </td>
                                        <td className="p-4"><span className="text-sm font-black text-blue-600">{formattedAmount} {inv.currency || 'ر.س'}</span></td>
                                        <td className="p-4"><span className="text-xs font-bold text-slate-500">{issueDate}</span></td>
                                        <td className="p-4">
                                            <Badge className={cn("text-[10px] font-black border-0 px-3 py-1 rounded-lg", statusInfo.className)}>
                                                {statusInfo.label}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Download className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

// --- Main Page Component ---

export default function BillingManagement() {
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'invoices';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/billing/${value}`);
    };

    // Fetch invoices
    const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{ success: boolean; invoices: Invoice[] }>({
        queryKey: ['/api/rbac-admin/billing/invoices'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/rbac-admin/billing/invoices');
            return res.json();
        }
    });

    // Fetch billing stats
    const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; stats: BillingStats }>({
        queryKey: ['/api/rbac-admin/billing/stats'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/rbac-admin/billing/stats');
            return res.json();
        }
    });

    const invoices = invoicesData?.invoices || [];
    const stats = statsData?.stats;

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20">
                            <CreditCard className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الفواتير والاشتراكات</h1>
                            <p className="text-slate-500 font-medium text-lg">متابعة العمليات المالية وإصدار الفواتير للعملاء</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="glass border-0 rounded-[2rem] p-6 shadow-none">
                            <Skeleton className="h-20 w-full" />
                        </Card>
                    ))
                ) : (
                    [
                        { 
                            title: "إجمالي التحصيل", 
                            value: `${(stats?.totalCollected || 0).toLocaleString('ar-SA')} ر.س`, 
                            icon: Wallet, 
                            color: "text-blue-600", 
                            bg: "bg-blue-50" 
                        },
                        { 
                            title: "فواتير معلقة", 
                            value: `${stats?.pendingInvoices || 0} فاتورة`, 
                            icon: History, 
                            color: "text-amber-600", 
                            bg: "bg-amber-50" 
                        },
                        { 
                            title: "الإيراد الشهري", 
                            value: `${stats?.revenueChange ? (Number(stats.revenueChange) > 0 ? '+' : '') + stats.revenueChange : '0'}٪`, 
                            icon: TrendingUp, 
                            color: "text-emerald-600", 
                            bg: "bg-emerald-50" 
                        },
                    ].map((stat, i) => (
                        <Card key={i} className="glass border-0 rounded-[2rem] p-6 shadow-none hover:bg-white hover:shadow-xl transition-all">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                                    <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="invoices" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الفواتير</TabsTrigger>
                    <TabsTrigger value="subscriptions" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الاشتراكات</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الإعدادات المالية</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <InvoiceTable invoices={invoices} isLoading={invoicesLoading} />
                </TabsContent>

                <TabsContent value="subscriptions" className="space-y-4">
                    <Card className="glass border-0 rounded-[2.5rem] p-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200/50 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white rounded-[2rem] shadow-xl shadow-slate-500/10 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                            <FileText className="h-10 w-10 text-blue-600 opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">إدارة الاشتراكات</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed mt-2">
                            سيتم توفير قائمة بكافة اشتراكات العملاء وتفاصيل تجديدها قريباً.
                        </p>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card className="glass border-0 rounded-[2.5rem] p-10 shadow-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">إعدادات الفاتورة</h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ضريبة القيمة المضافة (٪)</label>
                                    <Input defaultValue="١٥" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">بادئة رقم الفاتورة</label>
                                    <Input defaultValue="INV-" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-mono" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">بوابة الدفع</h3>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-700">بوابة Moyasar متصلة</span>
                                    </div>
                                    <Button variant="ghost" className="text-xs font-black text-emerald-700 underline">تعديل</Button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                            <Button className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800">حفظ الإعدادات</Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
