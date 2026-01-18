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
    AlertCircle,
    Archive,
    CheckCircle2,
    Clock,
    Filter,
    Inbox,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Mock Data ---

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

// --- Types ---

type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface SupportTicket {
    id: string;
    subject: string;
    description: string | null;
    priority: ComplaintPriority;
    status: ComplaintStatus;
    channel: string;
    createdAt: string;
    updatedAt: string;
    createdBy: { firstName: string | null; lastName: string | null; } | null;
    assignedTo: { firstName: string | null; lastName: string | null; } | null;
    customer: any;
}

const fetchTickets = async (): Promise<SupportTicket[]> => {
    const res = await fetch("/api/support");
    if (!res.ok) throw new Error("Failed to fetch tickets");
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
};

const CATEGORIES = [
    { id: 1, name: "الدعم الفني", count: 12, active: true },
    { id: 2, name: "الفواتير والمدفوعات", count: 5, active: true },
    { id: 3, name: "الاشتراكات", count: 8, active: true },
    { id: 4, name: "استفسارات عامة", count: 20, active: true },
];

const TEMPLATES = [
    { id: 1, title: "رد تلقائي - استلام التذكرة", usage: 145 },
    { id: 2, title: "طلب معلومات إضافية", usage: 56 },
    { id: 3, title: "تأكيد حل المشكلة", usage: 89 },
    { id: 4, title: "اعتذار عن التأخير", usage: 12 },
];

// --- Helpers ---

const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
        case "OPEN": return <Badge variant="destructive">مفتوحة</Badge>;
        case "IN_PROGRESS": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">قيد المعالجة</Badge>;
        case "RESOLVED": return <Badge variant="default" className="bg-green-600 hover:bg-green-700">تم الحل</Badge>;
        case "CLOSED": return <Badge variant="outline">مغلقة</Badge>;
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
    const { data: tickets, isLoading } = useQuery({
        queryKey: ["support-tickets"],
        queryFn: fetchTickets,
    });

    if (isLoading || !tickets) return <div className="mb-4 h-24 bg-slate-50 animate-pulse rounded-lg" />;

    const total = tickets.length;
    const pending = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
    const resolved = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;

    return (
        <div className="grid grid-cols-4 gap-4 mb-4">
            <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Inbox className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-600 font-medium">إجمالي التذاكر</p>
                        <p className="text-2xl font-bold text-blue-900">{total}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-100">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-orange-600 font-medium">قيد الانتظار</p>
                        <p className="text-2xl font-bold text-orange-900">{pending}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-green-600 font-medium">تم الحل</p>
                        <p className="text-2xl font-bold text-green-900">{resolved}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-600 font-medium">متوسط وقت الرد</p>
                        <p className="text-2xl font-bold text-slate-900">-</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ComplaintsListTab({ filterStatus }: { filterStatus?: ComplaintStatus | "ALL_OPEN" }) {
    const { data: tickets, isLoading } = useQuery({
        queryKey: ["support-tickets"],
        queryFn: fetchTickets,
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">جار تحميل التذاكر...</div>;

    const filteredData = (tickets || []).filter((item) => {
        if (!filterStatus) return true;
        if (filterStatus === "ALL_OPEN") return ["OPEN", "IN_PROGRESS"].includes(item.status);
        return item.status === filterStatus;
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>قائمة التذاكر</CardTitle>
                    <CardDescription>عرض وإدارة تذاكر الدعم الفني والشكاوى</CardDescription>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث برقم التذكرة أو الموضوع..." className="pr-8" />
                    </div>
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                    <Button><Plus className="ml-2 h-4 w-4" /> تذكرة جديدة</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">رقم التذكرة</TableHead>
                            <TableHead>الموضوع</TableHead>
                            <TableHead>العميل</TableHead>
                            <TableHead>الأولوية</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>المسؤول</TableHead>
                            <TableHead className="text-left">التاريخ</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                    لا توجد تذاكر مطابقة
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium">{ticket.id.substring(0, 8)}...</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{ticket.subject}</span>
                                            <span className="text-xs text-muted-foreground">{ticket.channel}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="h-3 w-3 text-slate-500" />
                                            </div>
                                            {ticket.customer?.firstName || "عميل غير مسجل"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority === 'URGENT' ? 'عاجل جداً' :
                                                ticket.priority === 'HIGH' ? 'مرتفع' :
                                                    ticket.priority === 'MEDIUM' ? 'متوسط' : 'منخفض'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                    <TableCell>
                                        {ticket.assignedTo ? (
                                            <Badge variant="secondary" className="font-normal">
                                                {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">غير مسند</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-left text-muted-foreground text-sm">
                                        {format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: arSA })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                                                <DropdownMenuItem>تغيير الحالة</DropdownMenuItem>
                                                <DropdownMenuItem>إسناد لموظف</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function CategoriesTab() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>فئات الشكاوى</CardTitle>
                    <CardDescription>تصنيف ونراقب أنواع المشاكل الواردة</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {CATEGORIES.map((cat) => (
                            <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="font-medium">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary">{cat.count} تذاكر</Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full border-dashed mt-4">
                            <Plus className="mr-2 h-4 w-4" /> إضافة فئة جديدة
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex items-center justify-center p-6 bg-slate-50 border-dashed">
                <div className="text-center space-y-2">
                    <Filter className="h-10 w-10 text-slate-300 mx-auto" />
                    <h3 className="font-medium text-slate-900">قواعد التوجيه الآلي</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        يمكنك إعداد قواعد لتوجيه التذاكر تلقائياً للموظفين بناءً على الفئة المختارة.
                    </p>
                    <Button variant="secondary" className="mt-2">إعداد القواعد</Button>
                </div>
            </Card>
        </div>
    );
}

function TemplatesTab() {
    return (
        <div className="grid grid-cols-1 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>قوالب الردود الجاهزة</CardTitle>
                        <CardDescription>تسريع عملية الرد على العملاء باستخدام نماذج محفوظة</CardDescription>
                    </div>
                    <Button><Plus className="ml-2 h-4 w-4" /> قالب جديد</Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TEMPLATES.map((tpl) => (
                            <Card key={tpl.id} className="cursor-pointer hover:border-blue-500 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <MessageSquare className="h-5 w-5 text-slate-500" />
                                        <Badge variant="secondary" className="text-xs">{tpl.usage} استخدام</Badge>
                                    </div>
                                    <CardTitle className="text-base mt-2">{tpl.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground line-clamp-3">
                                        عزيزي العميل، شكراً لتواصلك معنا. لقد تم استلام طلبك ورقم التذكرة هو...
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
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
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">إدارة الشكاوى والدعم الفني</h1>
                <p className="text-muted-foreground">
                    متابعة تذاكر الدعم، حل مشاكل العملاء، وإعدادات قسم الشكاوى.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">جميع الشكاوى</TabsTrigger>
                    <TabsTrigger value="open">المفتوحة</TabsTrigger>
                    <TabsTrigger value="resolved">المحلولة</TabsTrigger>
                    <TabsTrigger value="categories">الفئات</TabsTrigger>
                    <TabsTrigger value="response-templates">القوالب</TabsTrigger>
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
