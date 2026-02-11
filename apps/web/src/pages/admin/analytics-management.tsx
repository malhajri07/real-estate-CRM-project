import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart3,
    TrendingUp,
    Users,
    MousePointer2,
    Globe,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download,
    Eye,
    Zap,
    Layout,
    Activity
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { cn } from "@/lib/utils";

// --- Sub-components ---

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-4 text-end">
                <p className="font-black text-slate-900 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0 justify-end">
                        <span className="text-slate-900 font-bold">{entry.value.toLocaleString()}</span>
                        <span className="text-slate-500 font-medium">{entry.name}:</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

// --- Main Page Component ---

export default function AnalyticsManagement() {
    const [timeRange, setTimeRange] = useState("7d");

    const { data: analyticsData, isLoading } = useQuery<{
        success: boolean;
        metrics: {
            totalVisits: string;
            activeUsers: string;
            conversionRate: string;
            avgSessionTime: string;
        };
        visitorData: Array<{ name: string; visits: number; users: number }>;
        deviceData: Array<{ name: string; value: number; color: string }>;
        pageViews: Array<{ page: string; views: string; change: string; status: string }>;
    }>({
        queryKey: ['/api/rbac-admin/analytics/overview', timeRange],
        queryFn: async () => {
            const res = await apiRequest('GET', `/api/rbac-admin/analytics/overview?timeRange=${timeRange}`);
            return res.json();
        }
    });

    const metrics = analyticsData?.metrics;
    const visitorData = analyticsData?.visitorData || [];
    const deviceData = analyticsData?.deviceData || [];
    const pageViews = analyticsData?.pageViews || [];

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20">
                            <BarChart3 className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">تحليلات المنصة</h1>
                            <p className="text-slate-500 font-medium text-lg">مراقبة أداء النظام وتفاعل المستخدمين في الوقت الفعلي</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100/50 p-1 rounded-2xl flex gap-1">
                            <Button
                                variant={timeRange === "24h" ? "default" : "ghost"}
                                onClick={() => setTimeRange("24h")}
                                className={cn("h-10 px-4 rounded-xl font-bold transition-all", timeRange === "24h" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
                            >٢٤ ساعة</Button>
                            <Button
                                variant={timeRange === "7d" ? "default" : "ghost"}
                                onClick={() => setTimeRange("7d")}
                                className={cn("h-10 px-4 rounded-xl font-bold transition-all", timeRange === "7d" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
                            >٧ أيام</Button>
                            <Button
                                variant={timeRange === "30d" ? "default" : "ghost"}
                                onClick={() => setTimeRange("30d")}
                                className={cn("h-10 px-4 rounded-xl font-bold transition-all", timeRange === "30d" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
                            >٣٠ يوم</Button>
                        </div>
                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
                            <Download className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="glass border-0 rounded-[2rem] p-6 shadow-none">
                            <Skeleton className="h-20 w-full" />
                        </Card>
                    ))
                ) : (
                    [
                        { title: "إجمالي الزيارات", value: metrics?.totalVisits || "0", change: "+0%", icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
                        { title: "المستخدمين النشطين", value: metrics?.activeUsers || "0", change: "+0%", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { title: "معدل التحويل", value: metrics?.conversionRate || "0%", change: "+0%", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                        { title: "وقت الجلسة", value: metrics?.avgSessionTime || "0 د", change: "+0%", icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((metric, i) => (
                        <Card key={i} className="glass border-0 rounded-[2rem] p-6 shadow-none flex flex-col justify-between hover:bg-white hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", metric.bg, metric.color)}>
                                    <metric.icon className="h-6 w-6" />
                                </div>
                                <Badge className={cn(
                                    "text-[10px] font-black border-0 px-2 py-0.5 rounded-lg",
                                    metric.change.startsWith("+") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                )}>
                                    {metric.change}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{metric.title}</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{metric.value}</h3>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none lg:col-span-2">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">نظرة عامة على النشاط</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تتبع الزيارات والمستخدمين يومياً</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-xs font-bold text-slate-500">الزيارات</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-500">المستخدمين</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visitorData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="visits" name="الزيارات" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                                <Area type="monotone" dataKey="users" name="المستخدمين" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">توزيع الأجهزة</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">نسبة استخدام المنصة حسب الجهاز</p>
                    </div>
                    <div className="h-[250px] w-full relative">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {deviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        {deviceData.length > 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-2xl font-black text-slate-900">{deviceData[0]?.value || 0}٪</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deviceData[0]?.name || ''}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 mt-6">
                        {deviceData.map((device, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }} />
                                    <span className="text-xs font-bold text-slate-700">{device.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{device.value}٪</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">الصفحات الأكثر زيارة</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ترتيب الصفحات حسب حجم التفاعل</p>
                    </div>
                    <Button variant="ghost" className="text-blue-600 font-bold gap-2">
                        عرض التفاصيل
                        <ArrowUpRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-end">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">المسار (Path)</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">الإجمالي</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">التغيير</th>
                                <th className="p-4 w-[100px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={4} className="p-4">
                                            <Skeleton className="h-12 w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : pageViews.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <p className="text-slate-500 font-medium">لا توجد بيانات</p>
                                    </td>
                                </tr>
                            ) : (
                                pageViews.map((page, i) => (
                                <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4"><span className="text-sm font-bold text-slate-700">{page.page}</span></td>
                                    <td className="p-4"><span className="text-sm font-black text-slate-900">{page.views}</span></td>
                                    <td className="p-4">
                                        <Badge className={cn(
                                            "text-[10px] font-bold border-0 px-2 py-0.5 rounded-lg",
                                            page.status === "up" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                        )}>
                                            {page.change}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full w-[70%]" />
                                        </div>
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
