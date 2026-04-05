import { useLocation } from "wouter";
import { MetricCard } from "@/components/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CheckCircle2,
    Filter,
    Inbox,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    User,
    LifeBuoy,
    ShieldAlert,
    Timer
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { ADMIN_BUTTON_PRIMARY } from "@/config/design-tokens";
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
import { TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from "@/constants/labels";

// --- Helpers ---

const getStatusBadge = (status: ComplaintStatus) => {
    const key = status.toLowerCase();
    const label = TICKET_STATUS_LABELS[key] ?? status;
    const cls = TICKET_STATUS_BADGE_CLASS[key] ?? "status-badge-inactive";
    return <Badge className={`border ${cls} text-xs font-bold uppercase px-2 py-0.5 rounded-md`}>{label}</Badge>;
};

const getPriorityColor = (priority: ComplaintPriority) => {
    switch (priority) {
        case "URGENT": return "text-destructive font-bold";
        case "HIGH": return "text-[hsl(var(--warning))] font-medium";
        case "MEDIUM": return "text-primary";
        case "LOW": return "text-muted-foreground";
    }
};

// --- Sub-components ---

function ComplaintsSummaryCards() {
    const { data: tickets, isLoading } = useSupportTickets();

    const total = tickets?.length || 0;
    const pending = tickets?.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length || 0;
    const resolved = tickets?.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length || 0;

    return (
        <div className={`${GRID_METRICS} mb-8`}>
            <MetricCard
                title="إجمالي التذاكر"
                subtitle="دعم فني وشكاوي"
                icon={<LifeBuoy className="w-5 h-5 text-muted-foreground" />}
                metric={{ today: total, last7Days: total, last30Days: total }}
                loading={isLoading}
            />
            <MetricCard
                title="قيد الانتظار"
                subtitle="تحتاج تدخل سريع"
                icon={<ShieldAlert className="w-5 h-5 text-muted-foreground" />}
                metric={{ today: pending, last7Days: pending, last30Days: pending }}
                loading={isLoading}
            />
            <MetricCard
                title="تذاكر محلولة"
                subtitle="تمت المعالجة"
                icon={<CheckCircle2 className="w-5 h-5 text-muted-foreground" />}
                metric={{ today: resolved, last7Days: resolved, last30Days: resolved }}
                loading={isLoading}
            />
            <MetricCard
                title="وقت الاستجابة"
                subtitle="متوسط السرعة"
                icon={<Timer className="w-5 h-5 text-muted-foreground" />}
                metric={{ today: 24, last7Days: 18, last30Days: 22 }}
                loading={isLoading}
            />
        </div>
    );
}

function ComplaintsListTab({ filterStatus }: { filterStatus?: ComplaintStatus | "ALL_OPEN" }) {
    const showSkeleton = useMinLoadTime();
    const { data: tickets, isLoading, error } = useSupportTickets();
    const updateStatusMutation = useUpdateTicketStatus();

    if (isLoading || showSkeleton) return <AdminPageSkeleton />;
    if (error) return <div className="p-6 text-center text-destructive font-bold">فشل تحميل التذاكر</div>;

    const filteredData = (tickets || []).filter((item) => {
        if (!filterStatus) return true;
        if (filterStatus === "ALL_OPEN") return ["OPEN", "IN_PROGRESS"].includes(item.status);
        return item.status === filterStatus;
    });

    const handleStatusChange = (id: string, newStatus: ComplaintStatus) => {
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    return (
        <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
            <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">قائمة التذاكر</h2>
                    <p className="text-muted-foreground font-medium">عرض وإدارة تذاكر الدعم الفني والشكاوى</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group w-full lg:w-72">
                        <Search className="absolute end-3 top-3 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                        <Input placeholder="بحث برقم التذكرة..." className="pe-10 h-10 rounded-xl bg-card/50 border-border focus:ring-primary/20" />
                    </div>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border text-muted-foreground hover:bg-muted/30 transition-all"><Filter className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white/40">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border">
                            <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">التذكرة</TableHead>
                            <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الموضوع</TableHead>
                            <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">العميل</TableHead>
                            <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الأولوية</TableHead>
                            <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الحالة</TableHead>
                            <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">التاريخ</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-medium font-medium">
                                    لا توجد تذاكر مطابقة
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((ticket) => (
                                <TableRow key={ticket.id} className="border-border hover:bg-muted/50 transition-colors group">
                                    <TableCell className="py-4">
                                        <span className="font-bold text-foreground">#{ticket.id.substring(0, 8)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground/80 group-hover:text-foreground transition-colors">{ticket.subject}</span>
                                            <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter mt-0.5">{ticket.channel}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground font-bold text-xs">
                                                {ticket.customer?.firstName?.[0] || <User className="h-3 w-3" />}
                                            </div>
                                            <span className="text-sm font-bold text-foreground/80">
                                                {ticket.customer ? `${ticket.customer.firstName} ${ticket.customer.lastName}` : "عميل غير مسجل"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn("text-xs font-bold uppercase tracking-widest", getPriorityColor(ticket.priority))}>
                                            {ticket.priority === 'URGENT' ? 'عاجل جداً' :
                                                ticket.priority === 'HIGH' ? 'مرتفع' :
                                                    ticket.priority === 'MEDIUM' ? 'متوسط' : 'منخفض'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-xs font-bold text-muted-foreground/70 uppercase">
                                            {format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: arSA })}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50 hover:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-border shadow-2xl">
                                                <DropdownMenuLabel className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest pb-1">الإجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem className="rounded-xl font-bold text-muted-foreground">عرض التفاصيل</DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl font-bold text-primary" onClick={() => handleStatusChange(ticket.id, "RESOLVED")}>تصنيف كمحلول</DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl font-bold text-destructive" onClick={() => handleStatusChange(ticket.id, "CLOSED")}>إغلاق التذكرة</DropdownMenuItem>
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
    const showSkeleton = useMinLoadTime();
    const { data: categories, isLoading } = useSupportCategories();

    if (isLoading || showSkeleton) return <AdminPageSkeleton />;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">فئات الشكاوى</h2>
                        <p className="text-muted-foreground font-medium">تصنيف ومراقبة أنواع المشاكل الواردة</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {(categories || []).map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-4 bg-card/50 border border-border rounded-2xl hover:bg-card hover:shadow-md hover:shadow-primary/10 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-3 w-3 rounded-full shadow-sm", cat.active ? 'bg-primary/10 shadow-primary/20' : 'bg-muted-foreground/30')} />
                                <span className="font-bold text-foreground/80 group-hover:text-foreground/80 transition-colors">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="secondary" className="status-badge-info border text-xs font-bold px-2.5 py-1 rounded-lg">
                                    {cat.ticketCount ?? 0} تذاكر
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/30 transition-all outline-none">
                                    <Settings className="h-4 w-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {categories?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground/70 font-medium italic">لا توجد فئات حالياً</div>
                    )}
                    <Button variant="outline" className="w-full h-12 border-dashed border-border mt-6 rounded-2xl font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground/80 hover:border-border transition-all">
                        <Plus className="h-4 w-4 me-2" />
                        إضافة فئة جديدة
                    </Button>
                </div>
            </Card>

            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-6">
                    <div className="h-20 w-20 bg-card rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center text-primary mx-auto">
                        <Filter className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">قواعد التوجيه الآلي</h3>
                        <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed">
                            يمكنك إعداد قواعد ذكية لتوجيه التذاكر تلقائياً للموظفين بناءً على الفئات المختارة لضمان سرعة الاستجابة.
                        </p>
                    </div>
                    <Button className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                        إعداد قواعد التوجيه
                    </Button>
                </div>
            </Card>
        </div>
    );
}

function TemplatesTab() {
    const showSkeleton = useMinLoadTime();
    const { data: templates, isLoading } = useSupportTemplates();

    if (isLoading || showSkeleton) return <AdminPageSkeleton />;

    return (
        <div className="space-y-6">
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">قوالب الردود الجاهزة</h2>
                        <p className="text-muted-foreground font-medium">تسريع عملية الرد على العملاء باستخدام نماذج احترافية</p>
                    </div>
                    <Button className={ADMIN_BUTTON_PRIMARY}>
                        <Plus className="h-5 w-5 me-2" />
                        قالب جديد
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(templates || []).map((tpl) => (
                        <Card key={tpl.id} className="cursor-pointer bg-card/50 border border-border rounded-2xl p-6 hover:bg-card hover:shadow-md hover:shadow-primary/10 transition-all group overflow-hidden relative">
                            <div className="mb-6 flex justify-between items-start">
                                <div className="icon-container-sm transition-transform group-hover:scale-110">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <Badge className="bg-muted/30 text-muted-foreground/70 border-0 text-xs font-bold px-2 py-1 rounded-lg">
                                    {tpl.usageCount ?? 0} استخدام
                                </Badge>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors truncate">{tpl.title}</h3>
                                <p className="text-sm font-medium text-muted-foreground line-clamp-3 leading-relaxed">
                                    {tpl.content}
                                </p>
                            </div>
                        </Card>
                    ))}
                    {templates?.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Inbox className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground/70 font-bold italic">لا توجد قوالب ردود جاهزة حالياً</p>
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
        <div className={PAGE_WRAPPER}>
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-end">
                        <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">إدارة الشكاوى والدعم الفني</h1>
                        <p className="text-muted-foreground font-medium text-lg">متابعة تذاكر الدعم، حل مشاكل العملاء، وإعدادات قسم الشكاوى</p>
                    </div>
                    <Button
                        className={`${ADMIN_BUTTON_PRIMARY} w-full md:w-auto`}
                    >
                        <Plus className="h-5 w-5 me-2" />
                        تذكرة دعم جديدة
                    </Button>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="all" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الكل</TabsTrigger>
                    <TabsTrigger value="open" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">المفتوحة</TabsTrigger>
                    <TabsTrigger value="resolved" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">المحلولة</TabsTrigger>
                    <TabsTrigger value="categories" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الفئات</TabsTrigger>
                    <TabsTrigger value="response-templates" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">القوالب</TabsTrigger>
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
