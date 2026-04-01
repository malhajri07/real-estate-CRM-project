import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Bell,
    Mail,
    MessageSquare,
    Smartphone,
    Send,
    Plus,
    Search,
    Filter,
    Settings,
    Eye,
    History,
    CheckCircle2,
    AlertTriangle,
    Globe,
    Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { ADMIN_BUTTON_PRIMARY } from "@/config/design-tokens";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";

type NotificationTemplate = {
    id: string;
    name: string;
    channels: string[];
    status: string;
    lastUpdated: string;
    category: string;
};

function NotificationTemplates({ templates, isLoading }: { templates: NotificationTemplate[]; isLoading: boolean }) {
    return (
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/30">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input placeholder="البحث عن قالب إشعار..." className="h-12 pe-11 rounded-2xl bg-card border-border focus:ring-primary/20" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-border font-bold text-muted-foreground">
                        <Filter className="h-4 w-4 me-2" />
                        تصفية
                    </Button>
                    <Button className={ADMIN_BUTTON_PRIMARY}>
                        <Plus className="h-5 w-5 me-2" />
                        إنشاء قالب جديد
                    </Button>
                </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="bg-card/50 border border-border rounded-2xl p-6">
                            <Skeleton className="h-32 w-full" />
                        </Card>
                    ))
                ) : templates.length === 0 ? (
                    <div className="col-span-2 p-8 text-center">
                        <p className="text-muted-foreground font-medium">لا توجد قوالب إشعارات</p>
                    </div>
                ) : (
                    templates.map((template) => (
                    <Card key={template.id} className="bg-card/50 border border-border rounded-2xl p-6 hover:bg-card hover:shadow-md transition-all duration-300 group relative overflow-visible">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-muted/50 text-muted-foreground rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Bell className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground tracking-tight">{template.name}</h4>
                                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">{template.category}</p>
                                </div>
                            </div>
                            <Badge className={cn(
                                "text-xs font-bold uppercase px-2 py-0.5 rounded-md border-0",
                                template.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                            )}>
                                {template.status === "Active" ? "نشط" : "مسودة"}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                            {template.channels.map((channel, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-bold border-border bg-muted/30 text-muted-foreground px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    {channel === "Email" && <Mail className="h-3 w-3" />}
                                    {channel === "SMS" && <MessageSquare className="h-3 w-3" />}
                                    {channel === "Push" && <Smartphone className="h-3 w-3" />}
                                    {channel === "WhatsApp" && <Globe className="h-3 w-3" />}
                                    {channel}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                            <span className="text-xs font-bold text-muted-foreground/70">تحديث {template.lastUpdated}</span>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50"><Eye className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50"><Settings className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </Card>
                    ))
                )}
            </div>
        </Card>
    );
}

// --- Main Page Component ---

export default function NotificationsManagement() {
    const showSkeleton = useMinLoadTime();
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'templates';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/notifications/${value}`);
    };

    // Fetch notification templates
    const { data: templatesData, isLoading: templatesLoading } = useQuery<{ success: boolean; templates: NotificationTemplate[] }>({
        queryKey: ['/api/rbac-admin/notifications/templates'],
        queryFn: async () => apiGet('api/rbac-admin/notifications/templates')
    });

    // Fetch notification stats
    const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; stats: { notificationsToday: string; deliveryRate: string; errors: number; avgDeliveryTime: string } }>({
        queryKey: ['/api/rbac-admin/notifications/stats'],
        queryFn: async () => apiGet('api/rbac-admin/notifications/stats')
    });

    const templates = templatesData?.templates || [];
    const stats = statsData?.stats;

    if ((templatesLoading && statsLoading) || showSkeleton) {
        return (
            <div className={PAGE_WRAPPER}>
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
                            <Bell className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">مركز الإشعارات والقوالب</h1>
                            <p className="text-muted-foreground font-medium text-lg">إدارة قوالب التواصل وقواعد الإرسال عبر القنوات المختلفة</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className={GRID_METRICS}>
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm p-6">
                            <Skeleton className="h-20 w-full" />
                        </Card>
                    ))
                ) : (
                    [
                        { title: "إشعارات اليوم", value: stats?.notificationsToday || "0", icon: Send, color: "text-muted-foreground", bg: "bg-muted/50" },
                        { title: "معدل الوصول", value: stats?.deliveryRate || "0%", icon: CheckCircle2, color: "text-muted-foreground", bg: "bg-muted/50" },
                        { title: "أخطاء الإرسال", value: `${stats?.errors || 0} أخطاء`, icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted/50" },
                        { title: "وقت التسليم", value: stats?.avgDeliveryTime || "0 ث", icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
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
                    ))
                )}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="templates" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">قوالب الإشعارات</TabsTrigger>
                    <TabsTrigger value="channels" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">القنوات النشطة</TabsTrigger>
                    <TabsTrigger value="logs" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">سجل الإرسال</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                    <NotificationTemplates templates={templates} isLoading={templatesLoading} />
                </TabsContent>

                <TabsContent value="channels" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Email (SMTP/SendGrid)", status: "Connected", icon: Mail, color: "text-muted-foreground" },
                            { name: "SMS (Twilio/Unifonic)", status: "Connected", icon: MessageSquare, color: "text-muted-foreground" },
                            { name: "Push (Firebase FCM)", status: "Error", icon: Smartphone, color: "text-muted-foreground" },
                        ].map((channel, i) => (
                            <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm p-6 text-center flex flex-col items-center group hover:bg-card hover:shadow-md transition-all duration-300">
                                <div className={cn("h-16 w-16 bg-card rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", channel.color)}>
                                    <channel.icon className="h-8 w-8" />
                                </div>
                                <h4 className="text-lg font-bold text-foreground mb-2">{channel.name}</h4>
                                <Badge className={cn(
                                    "text-xs font-bold uppercase px-3 py-1 rounded-lg border-0",
                                    channel.status === "Connected" ? "bg-primary/10 text-primary" : "bg-rose-50 text-rose-700"
                                )}>
                                    {channel.status === "Connected" ? "متصل" : "خطأ اتصال"}
                                </Badge>
                                <Button variant="ghost" className="mt-6 text-xs font-bold text-muted-foreground/70 hover:text-foreground/80 underline">إعدادات الاتصال</Button>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <Card className="rounded-2xl p-20 text-center bg-muted/30 border-2 border-dashed border-border flex flex-col items-center">
                        <div className="h-20 w-20 bg-card rounded-2xl shadow-xl shadow-slate-500/10 flex items-center justify-center text-muted-foreground/70 mb-6 group-hover:scale-110 transition-transform">
                            <History className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">سجلات إرسال الإشعارات</h3>
                        <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed mt-2">
                            سيتم توفير سجل تفصيلي لعمليات الإرسال وحالة كل إشعار قريباً.
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
