import { useLocation } from "wouter";
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
    Shield,
    Key,
    ShieldCheck,
    AlertTriangle,
    History,
    Fingerprint,
    Eye,
    ShieldAlert,
    Search,
    Terminal,
    Smartphone,
    Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";

// --- Types ---
interface AuditLog {
    id: string;
    user: string;
    action: string;
    target: string;
    time: string;
    risk: "Low" | "Medium" | "High";
}

function SecurityAuditLogs() {
    const { data: logs = [], isLoading, isError } = useQuery<AuditLog[]>({
        queryKey: ["admin-activities"],
        queryFn: async () => apiGet<AuditLog[]>("api/rbac-admin/activities")
    });

    return (
        <Card className="glass border-0 rounded-3xl overflow-hidden shadow-none">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input placeholder="البحث في سجلات الأمان..." className="h-12 ps-11 rounded-2xl bg-white border-slate-100 focus:ring-blue-500/20" />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-border font-bold text-slate-600">
                        <History className="h-4 w-4 me-2" />
                        سجل النشاط الكامل
                    </Button>
                </div>
            </div>
            <Table className="text-end">
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100">
                        <TableHead className="text-end text-xs font-bold uppercase text-slate-400 tracking-widest py-4">المستخدم</TableHead>
                        <TableHead className="text-end text-xs font-bold uppercase text-slate-400 tracking-widest py-4">الإجراء</TableHead>
                        <TableHead className="text-end text-xs font-bold uppercase text-slate-400 tracking-widest py-4">الوقت</TableHead>
                        <TableHead className="text-end text-xs font-bold uppercase text-slate-400 tracking-widest py-4">الخطر</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="p-8 text-center text-slate-500">جاري تحميل السجلات...</TableCell>
                        </TableRow>
                    ) : isError ? (
                        <TableRow>
                            <TableCell colSpan={5} className="p-8 text-center text-red-500">فشل تحميل السجلات</TableCell>
                        </TableRow>
                    ) : logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="p-8 text-center text-slate-500">لا توجد سجلات نشاط</TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-blue-50/30 transition-colors group border-slate-50">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{log.user[0]}</div>
                                        <span className="text-sm font-bold text-slate-700">{log.user}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{log.action}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{log.target}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4"><span className="text-xs font-bold text-slate-500">{new Date(log.time).toLocaleString('ar-SA')}</span></TableCell>
                                <TableCell className="py-4">
                                    <Badge className={cn(
                                        "text-xs font-bold border-0 px-3 py-1 rounded-lg",
                                        log.risk === "Low" ? "bg-emerald-50 text-emerald-700" :
                                            log.risk === "Medium" ? "bg-amber-50 text-amber-700" :
                                                "bg-rose-50 text-rose-700"
                                    )}>
                                        {log.risk === "Low" ? "منخفض" : log.risk === "Medium" ? "متوسط" : "مرتفع"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-4">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

// --- Main Page Component ---

export default function SecurityManagement() {
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'access-control';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/security/${value}`);
    };

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-2xl p-8 shadow-none group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                            <Shield className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">مركز الأمن والتحكم</h1>
                            <p className="text-slate-500 font-medium text-lg">إدارة صلاحيات الوصول ومراقبة أمن المنصة والبيانات</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "حالة النظام", value: "آمن", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { title: "ثغرات مكتشفة", value: "٠ ثغرات", icon: ShieldAlert, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "هجمات محجوبة", value: "١٢٨ هجمة", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
                    { title: "الأجهزة النشطة", value: "٤٢ جهاز", icon: Smartphone, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                    <Card key={i} className="glass border-0 rounded-2xl p-6 shadow-none flex items-center gap-4 hover:bg-white hover:shadow-xl transition-all">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                            <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="access-control" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">التحكم في الوصول</TabsTrigger>
                    <TabsTrigger value="audit-logs" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">سجلات الأمان</TabsTrigger>
                    <TabsTrigger value="authentication" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">المصادقة</TabsTrigger>
                </TabsList>

                <TabsContent value="access-control" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-0 rounded-3xl p-8 shadow-none space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">إعدادات الجلسة</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">التحكم في جلسات المستخدمين</p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-white/50 rounded-3xl border border-slate-100 group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Terminal className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">فرض المصادقة الثنائية</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">للمشرفين فقط</p>
                                        </div>
                                    </div>
                                    <Switch className="data-[state=checked]:bg-blue-600" />
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/50 rounded-3xl border border-slate-100 group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center"><Fingerprint className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">تسجيل الدخول الواضح</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">منع تعدد المتصفحات</p>
                                        </div>
                                    </div>
                                    <Switch checked className="data-[state=checked]:bg-blue-600" />
                                </div>
                            </div>
                        </Card>

                        <Card className="glass border-0 rounded-3xl p-8 shadow-none space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">وضع الحماية</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تفعيل إجراءات الأمان المشددة</p>
                            </div>
                            <div className="p-8 bg-blue-50 shadow-inner rounded-2xl border border-blue-100 relative overflow-hidden group">
                                <Zap className="absolute top-0 right-0 h-32 w-32 text-blue-600 opacity-5 -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                                <div className="relative z-10 text-center">
                                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 mx-auto mb-4 text-blue-600"><ShieldAlert className="h-8 w-8" /></div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">تفعيل وضع الصيانة</h4>
                                    <p className="text-xs font-bold text-slate-500 max-w-[200px] mx-auto leading-relaxed">منع كافة المستخدمين من دخول المنصة مؤقتاً لأغراض أمنية طارئة.</p>
                                    <Button className="mt-6 h-12 px-8 rounded-2xl premium-gradient text-white border-0 font-bold shadow-lg shadow-blue-500/25">تفعيل الآن</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="audit-logs" className="space-y-4">
                    <SecurityAuditLogs />
                </TabsContent>

                <TabsContent value="authentication" className="space-y-4">
                    <Card className="glass border-0 rounded-3xl p-20 text-center bg-slate-50/50 border-2 border-dashed border-border/50 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white rounded-2xl shadow-xl shadow-slate-500/10 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                            <Key className="h-10 w-10 text-blue-600 opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">إعدادات المصادقة</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed mt-2">
                            سيتم توفير خيارات إضافية للمصادقة مثل SSO و OAuth قريباً.
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
