import { useState } from "react";
import { useLocation } from "wouter";
import { AdminCard, MetricCard } from "@/components/admin";
import { AdminTable, type AdminTableColumn } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Filter,
    Inbox,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    User,
    Loader2,
    LifeBuoy,
    ShieldAlert,
    Timer
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import {
    useSupportTickets,
    useSupportCategories,
    useSupportTemplates,
    useCreateSupportTicket,
    useUpdateTicketStatus,
    type ComplaintStatus,
    type ComplaintPriority
} from "@/lib/supportAdmin";

// --- Helpers ---

const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
        case "OPEN": return <Badge className="bg-red-50 text-red-700 border-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">مفتوحة</Badge>;
        case "IN_PROGRESS": return <Badge className="bg-blue-50 text-blue-700 border-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">قيد المعالجة</Badge>;
        case "RESOLVED": return <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">تم الحل</Badge>;
        case "CLOSED": return <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">مغلقة</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

const getPriorityColor = (priority: ComplaintPriority) => {
    switch (priority) {
        case "URGENT": return "text-red-600 font-bold";
        case "HIGH": return "text-orange-600 font-medium";
        case "MEDIUM": return "text-blue-600";
        case "LOW": return "text-slate-500";
    }
};

// --- Sub-components ---

function ComplaintsSummaryCards() {
    const { data: tickets, isLoading } = useSupportTickets();

    const total = tickets?.length || 0;
    const pending = tickets?.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length || 0;
    const resolved = tickets?.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="إجمالي التذاكر"
                subtitle="دعم فني وشكاوي"
                icon={<LifeBuoy className="w-5 h-5 text-blue-600" />}
                metric={{ today: total, last7Days: total, last30Days: total }}
                loading={isLoading}
            />
            <MetricCard
                title="قيد الانتظار"
                subtitle="تحتاج تدخل سريع"
                icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
                metric={{ today: pending, last7Days: pending, last30Days: pending }}
                loading={isLoading}
            />
            <MetricCard
                title="تذاكر محلولة"
                subtitle="تمت المعالجة"
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                metric={{ today: resolved, last7Days: resolved, last30Days: resolved }}
                loading={isLoading}
            />
            <MetricCard
                title="وقت الاستجابة"
                subtitle="متوسط السرعة"
                icon={<Timer className="w-5 h-5 text-purple-600" />}
                metric={{ today: 24, last7Days: 18, last30Days: 22 }}
                loading={isLoading}
            />
        </div>
    );
}

function ComplaintsListTab({ filterStatus }: { filterStatus?: ComplaintStatus | "ALL_OPEN" }) {
    const { data: tickets, isLoading, error } = useSupportTickets();
    const updateStatusMutation = useUpdateTicketStatus();

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    if (error) return <div className="p-8 text-center text-red-500 font-bold">فشل تحميل التذاكر</div>;

    const filteredData = (tickets || []).filter((item) => {
        if (!filterStatus) return true;
        if (filterStatus === "ALL_OPEN") return ["OPEN", "IN_PROGRESS"].includes(item.status);
        return item.status === filterStatus;
    });

    const handleStatusChange = (id: string, newStatus: ComplaintStatus) => {
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    return (
        <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
            <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">قائمة التذاكر</h2>
                    <p className="text-slate-500 font-medium">عرض وإدارة تذاكر الدعم الفني والشكاوى</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group w-full lg:w-72">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input placeholder="بحث برقم التذكرة..." className="pr-10 h-10 rounded-xl bg-white/50 border-slate-100 focus:ring-blue-500/20" />
                    </div>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100 text-slate-500 hover:bg-slate-50 transition-all"><Filter className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100">
                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 tracking-widest py-4">التذكرة</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 tracking-widest py-4">الموضوع</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 tracking-widest py-4">العميل</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 tracking-widest py-4">الأولوية</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase text-slate-400 tracking-widest py-4">الحالة</TableHead>
                            <TableHead className="text-left text-[10px] font-black uppercase text-slate-400 tracking-widest py-4">التاريخ</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-medium font-medium">
                                    لا توجد تذاكر مطابقة
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((ticket) => (
                                <TableRow key={ticket.id} className="border-slate-50 hover:bg-blue-50/30 transition-colors group">
                                    <TableCell className="py-4">
                                        <span className="font-black text-slate-900">#{ticket.id.substring(0, 8)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{ticket.subject}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{ticket.channel}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                {ticket.customer?.firstName?.[0] || <User className="h-3 w-3" />}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">
                                                {ticket.customer ? `${ticket.customer.firstName} ${ticket.customer.lastName}` : "عميل غير مسجل"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", getPriorityColor(ticket.priority))}>
                                            {ticket.priority === 'URGENT' ? 'عاجل جداً' :
                                                ticket.priority === 'HIGH' ? 'مرتفع' :
                                                    ticket.priority === 'MEDIUM' ? 'متوسط' : 'منخفض'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                    <TableCell className="text-left py-4">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                                            {format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: arSA })}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 outline-none"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl">
                                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest pb-1">الإجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem className="rounded-xl font-bold text-slate-600">عرض التفاصيل</DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl font-bold text-emerald-600" onClick={() => handleStatusChange(ticket.id, "RESOLVED")}>تصنيف كمحلول</DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl font-bold text-red-600" onClick={() => handleStatusChange(ticket.id, "CLOSED")}>إغلاق التذكرة</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

function CategoriesTab() {
    const { data: categories, isLoading } = useSupportCategories();

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">فئات الشكاوى</h2>
                        <p className="text-slate-500 font-medium">تصنيف ومراقبة أنواع المشاكل الواردة</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {(categories || []).map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-3 w-3 rounded-full shadow-sm", cat.active ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-300')} />
                                <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                    {cat.ticketCount ?? 0} تذاكر
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-50 transition-all outline-none">
                                    <Settings className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {categories?.length === 0 && (
                        <div className="text-center py-12 text-slate-400 font-medium italic">لا توجد فئات حالياً</div>
                    )}
                    <Button variant="outline" className="w-full h-12 border-dashed border-slate-200 mt-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-100 transition-all">
                        <Plus className="h-4 w-4 me-2" />
                        إضافة فئة جديدة
                    </Button>
                </div>
            </Card>

            <Card className="glass border-0 rounded-[2rem] p-12 shadow-none flex items-center justify-center bg-blue-50/30">
                <div className="text-center space-y-6">
                    <div className="h-20 w-20 bg-white rounded-[2rem] shadow-xl shadow-blue-500/10 flex items-center justify-center text-blue-600 mx-auto">
                        <Filter className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">قواعد التوجيه الآلي</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
                            يمكنك إعداد قواعد ذكية لتوجيه التذاكر تلقائياً للموظفين بناءً على الفئات المختارة لضمان سرعة الاستجابة.
                        </p>
                    </div>
                    <Button className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                        إعداد قواعد التوجيه
                    </Button>
                </div>
            </Card>
        </div>
    );
}

function TemplatesTab() {
    const { data: templates, isLoading } = useSupportTemplates();

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">قوالب الردود الجاهزة</h2>
                        <p className="text-slate-500 font-medium">تسريع عملية الرد على العملاء باستخدام نماذج احترافية</p>
                    </div>
                    <Button className="premium-gradient text-white border-0 shadow-lg shadow-blue-500/25 h-12 px-8 rounded-2xl font-bold">
                        <Plus className="h-5 w-5 me-2" />
                        قالب جديد
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(templates || []).map((tpl) => (
                        <Card key={tpl.id} className="cursor-pointer bg-white/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group overflow-hidden relative">
                            <div className="mb-6 flex justify-between items-start">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <Badge className="bg-slate-50 text-slate-400 border-0 text-[10px] font-black px-2 py-1 rounded-lg">
                                    {tpl.usageCount ?? 0} استخدام
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{tpl.title}</h3>
                                <p className="text-sm font-medium text-slate-500 line-clamp-3 leading-relaxed">
                                    {tpl.content}
                                </p>
                            </div>
                        </Card>
                    ))}
                    {templates?.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Inbox className="h-8 w-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold italic">لا توجد قوالب ردود جاهزة حالياً</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

// --- Main Page Component ---

export default function ComplaintsManagement() {
    const [location, setLocation] = useLocation();

    // Determine active tab based on URL
    const activeTab = location.split('/').pop() || 'all';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/complaints/${value}`);
    };

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-right">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الشكاوى والدعم الفني</h1>
                        <p className="text-slate-500 font-medium text-lg">متابعة تذاكر الدعم، حل مشاكل العملاء، وإعدادات قسم الشكاوى</p>
                    </div>
                    <Button
                        className="premium-gradient text-white border-0 shadow-lg shadow-blue-500/25 h-12 px-8 rounded-2xl font-bold w-full md:w-auto"
                        onClick={() => { }}
                    >
                        <Plus className="h-5 w-5 me-2" />
                        تذكرة دعم جديدة
                    </Button>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="all" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الكل</TabsTrigger>
                    <TabsTrigger value="open" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">المفتوحة</TabsTrigger>
                    <TabsTrigger value="resolved" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">المحلولة</TabsTrigger>
                    <TabsTrigger value="categories" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الفئات</TabsTrigger>
                    <TabsTrigger value="response-templates" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">القوالب</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <ComplaintsSummaryCards />
                    <ComplaintsListTab />
                </TabsContent>

                <TabsContent value="open">
                    <ComplaintsListTab filterStatus="ALL_OPEN" />
                </TabsContent>

                <TabsContent value="resolved">
                    <ComplaintsListTab filterStatus="RESOLVED" />
                </TabsContent>

                <TabsContent value="categories">
                    <CategoriesTab />
                </TabsContent>

                <TabsContent value="response-templates">
                    <TemplatesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
