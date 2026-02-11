import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    Zap,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Layout,
    MoreHorizontal,
    Code,
    Globe,
    Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
        <Card className="glass border-0 rounded-[2.5rem] overflow-hidden shadow-none">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input placeholder="البحث عن قالب إشعار..." className="h-12 pr-11 rounded-2xl bg-white border-slate-100 focus:ring-blue-500/20" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-bold text-slate-600">
                        <Filter className="h-4 w-4 me-2" />
                        تصفية
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl premium-gradient text-white border-0 font-bold shadow-lg shadow-blue-500/25">
                        <Plus className="h-5 w-5 me-2" />
                        إنشاء قالب جديد
                    </Button>
                </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="bg-white/50 border border-slate-100 rounded-[2rem] p-6">
                            <Skeleton className="h-32 w-full" />
                        </Card>
                    ))
                ) : templates.length === 0 ? (
                    <div className="col-span-2 p-8 text-center">
                        <p className="text-slate-500 font-medium">لا توجد قوالب إشعارات</p>
                    </div>
                ) : (
                    templates.map((template) => (
                    <Card key={template.id} className="bg-white/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-2xl transition-all duration-300 group relative overflow-visible">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Bell className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">{template.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{template.category}</p>
                                </div>
                            </div>
                            <Badge className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-0",
                                template.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}>
                                {template.status === "Active" ? "نشط" : "مسودة"}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                            {template.channels.map((channel, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] font-bold border-slate-100 bg-slate-50/50 text-slate-600 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    {channel === "Email" && <Mail className="h-3 w-3" />}
                                    {channel === "SMS" && <MessageSquare className="h-3 w-3" />}
                                    {channel === "Push" && <Smartphone className="h-3 w-3" />}
                                    {channel === "WhatsApp" && <Globe className="h-3 w-3" />}
                                    {channel}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <span className="text-[10px] font-bold text-slate-400">تحديث {template.lastUpdated}</span>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Settings className="h-4 w-4" /></Button>
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
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'templates';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/notifications/${value}`);
    };

    // Fetch notification templates
    const { data: templatesData, isLoading: templatesLoading } = useQuery<{ success: boolean; templates: NotificationTemplate[] }>({
        queryKey: ['/api/rbac-admin/notifications/templates'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/rbac-admin/notifications/templates');
            return res.json();
        }
    });

    // Fetch notification stats
    const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; stats: { notificationsToday: string; deliveryRate: string; errors: number; avgDeliveryTime: string } }>({
        queryKey: ['/api/rbac-admin/notifications/stats'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/rbac-admin/notifications/stats');
            return res.json();
        }
    });

    const templates = templatesData?.templates || [];
    const stats = statsData?.stats;

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20">
                            <Bell className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">مركز الإشعارات والقوالب</h1>
                            <p className="text-slate-500 font-medium text-lg">إدارة قوالب التواصل وقواعد الإرسال عبر القنوات المختلفة</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="glass border-0 rounded-[2rem] p-6 shadow-none">
                            <Skeleton className="h-20 w-full" />
                        </Card>
                    ))
                ) : (
                    [
                        { title: "إشعارات اليوم", value: stats?.notificationsToday || "0", icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
                        { title: "معدل الوصول", value: stats?.deliveryRate || "0%", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { title: "أخطاء الإرسال", value: `${stats?.errors || 0} أخطاء`, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
                        { title: "وقت التسليم", value: stats?.avgDeliveryTime || "0 ث", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    ].map((stat, i) => (
                        <Card key={i} className="glass border-0 rounded-[2rem] p-6 shadow-none flex items-center gap-4 hover:bg-white hover:shadow-xl transition-all">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                                <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="templates" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">قوالب الإشعارات</TabsTrigger>
                    <TabsTrigger value="channels" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">القنوات النشطة</TabsTrigger>
                    <TabsTrigger value="logs" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">سجل الإرسال</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                    <NotificationTemplates templates={templates} isLoading={templatesLoading} />
                </TabsContent>

                <TabsContent value="channels" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Email (SMTP/SendGrid)", status: "Connected", icon: Mail, color: "text-blue-600" },
                            { name: "SMS (Twilio/Unifonic)", status: "Connected", icon: MessageSquare, color: "text-emerald-600" },
                            { name: "Push (Firebase FCM)", status: "Error", icon: Smartphone, color: "text-rose-600" },
                        ].map((channel, i) => (
                            <Card key={i} className="glass border-0 rounded-[2.5rem] p-8 shadow-none text-center flex flex-col items-center group hover:bg-white hover:shadow-2xl transition-all duration-300">
                                <div className={cn("h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", channel.color)}>
                                    <channel.icon className="h-8 w-8" />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-2">{channel.name}</h4>
                                <Badge className={cn(
                                    "text-[10px] font-black uppercase px-3 py-1 rounded-lg border-0",
                                    channel.status === "Connected" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                )}>
                                    {channel.status === "Connected" ? "متصل" : "خطأ اتصال"}
                                </Badge>
                                <Button variant="ghost" className="mt-6 text-xs font-black text-slate-400 hover:text-blue-600 underline">إعدادات الاتصال</Button>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <Card className="glass border-0 rounded-[2.5rem] p-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200/50 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white rounded-[2rem] shadow-xl shadow-slate-500/10 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                            <History className="h-10 w-10 text-blue-600 opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">سجلات إرسال الإشعارات</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed mt-2">
                            سيتم توفير سجل تفصيلي لعمليات الإرسال وحالة كل إشعار قريباً.
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
