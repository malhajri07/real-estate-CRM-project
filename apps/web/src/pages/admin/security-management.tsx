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
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { ADMIN_BUTTON_PRIMARY, STATUS_COLORS } from "@/config/design-tokens";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";

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
        queryKey: ["/api/rbac-admin/activities"],
        queryFn: async () => apiGet<AuditLog[]>("api/rbac-admin/activities")
    });

    return (
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input placeholder="البحث في سجلات الأمان..." className="h-12 ps-11 rounded-2xl bg-card border-border focus:ring-primary/20" />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-border font-bold text-muted-foreground">
                        <History className="h-4 w-4 me-2" />
                        سجل النشاط الكامل
                    </Button>
                </div>
            </div>
            <Table className="text-end">
                <TableHeader className="bg-muted/50">
                    <TableRow className="border-border">
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">المستخدم</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الإجراء</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الوقت</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الخطر</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">جاري تحميل السجلات...</TableCell>
                        </TableRow>
                    ) : isError ? (
                        <TableRow>
                            <TableCell colSpan={5} className="p-6 text-center text-destructive">فشل تحميل السجلات</TableCell>
                        </TableRow>
                    ) : logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد سجلات نشاط</TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-primary/5 transition-colors group border-border">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground">{log.user[0]}</div>
                                        <span className="text-sm font-bold text-foreground/80">{log.user}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">{log.action}</span>
                                        <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter">{log.target}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4"><span className="text-xs font-bold text-muted-foreground">{new Date(log.time).toLocaleString('ar-SA')}</span></TableCell>
                                <TableCell className="py-4">
                                    <Badge className={cn(
                                        "text-xs font-bold border-0 px-3 py-1 rounded-lg",
                                        log.risk === "Low" ? "bg-primary/10 text-primary" :
                                            log.risk === "Medium" ? "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]" :
                                                `${STATUS_COLORS.error.bg} ${STATUS_COLORS.error.text}`
                                    )}>
                                        {log.risk === "Low" ? "منخفض" : log.risk === "Medium" ? "متوسط" : "مرتفع"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-4">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all">
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
    const showSkeleton = useMinLoadTime();
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'access-control';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/security/${value}`);
    };

    if (showSkeleton) {
        return (
            <div className={PAGE_WRAPPER}>
                <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight mb-6">مركز الأمن والتحكم</h1>
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
                            <Shield className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">مركز الأمن والتحكم</h1>
                            <p className="text-muted-foreground font-medium text-lg">إدارة صلاحيات الوصول ومراقبة أمن المنصة والبيانات</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className={GRID_METRICS}>
                {[
                    { title: "حالة النظام", value: "آمن", icon: ShieldCheck, color: "text-muted-foreground", bg: "bg-muted/50" },
                    { title: "ثغرات مكتشفة", value: "٠ ثغرات", icon: ShieldAlert, color: "text-muted-foreground", bg: "bg-muted/50" },
                    { title: "هجمات محجوبة", value: "١٢٨ هجمة", icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted/50" },
                    { title: "الأجهزة النشطة", value: "٤٢ جهاز", icon: Smartphone, color: "text-muted-foreground", bg: "bg-muted/50" },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm p-6 flex items-center gap-4 hover:bg-card hover:shadow-md transition-all">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">{stat.title}</p>
                            <h3 className="text-xl font-bold text-foreground">{stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="access-control" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">التحكم في الوصول</TabsTrigger>
                    <TabsTrigger value="audit-logs" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">سجلات الأمان</TabsTrigger>
                    <TabsTrigger value="authentication" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">المصادقة</TabsTrigger>
                </TabsList>

                <TabsContent value="access-control" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground tracking-tight">إعدادات الجلسة</h3>
                                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">التحكم في جلسات المستخدمين</p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-card/50 rounded-3xl border border-border group hover:shadow-md hover:shadow-primary/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-muted/50 text-muted-foreground rounded-xl flex items-center justify-center"><Terminal className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">فرض المصادقة الثنائية</p>
                                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter">للمشرفين فقط</p>
                                        </div>
                                    </div>
                                    <Switch className="data-[state=checked]:bg-primary" />
                                </div>
                                <div className="flex items-center justify-between p-6 bg-card/50 rounded-3xl border border-border group hover:shadow-md hover:shadow-primary/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-muted/30 text-muted-foreground/70 rounded-xl flex items-center justify-center"><Fingerprint className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">تسجيل الدخول الواضح</p>
                                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter">منع تعدد المتصفحات</p>
                                        </div>
                                    </div>
                                    <Switch checked className="data-[state=checked]:bg-primary" />
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground tracking-tight">وضع الحماية</h3>
                                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">تفعيل إجراءات الأمان المشددة</p>
                            </div>
                            <div className="p-8 bg-primary/5 shadow-inner rounded-2xl border border-primary/20 relative overflow-hidden group">
                                <Zap className="absolute top-0 right-0 h-32 w-32 text-muted-foreground opacity-5 -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                                <div className="relative z-10 text-center">
                                    <div className="h-14 w-14 bg-card rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/10 mx-auto mb-4 text-muted-foreground"><ShieldAlert className="h-8 w-8" /></div>
                                    <h4 className="text-lg font-bold text-foreground mb-2">تفعيل وضع الصيانة</h4>
                                    <p className="text-xs font-bold text-muted-foreground max-w-[200px] mx-auto leading-relaxed">منع كافة المستخدمين من دخول المنصة مؤقتاً لأغراض أمنية طارئة.</p>
                                    <Button className={`${ADMIN_BUTTON_PRIMARY} mt-6`}>تفعيل الآن</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="audit-logs" className="space-y-4">
                    <SecurityAuditLogs />
                </TabsContent>

                <TabsContent value="authentication" className="space-y-4">
                    <Card className="rounded-2xl p-20 text-center bg-muted/30 border-2 border-dashed border-border flex flex-col items-center">
                        <div className="h-20 w-20 bg-card rounded-2xl shadow-xl shadow-slate-500/10 flex items-center justify-center text-muted-foreground/70 mb-6 group-hover:scale-110 transition-transform">
                            <Key className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">إعدادات المصادقة</h3>
                        <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed mt-2">
                            سيتم توفير خيارات إضافية للمصادقة مثل SSO و OAuth قريباً.
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
