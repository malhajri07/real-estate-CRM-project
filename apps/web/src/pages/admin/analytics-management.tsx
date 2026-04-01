import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    BarChart3,
    Users,
    Clock,
    ArrowUpRight,
    Download,
    Eye,
    Zap
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { CHART_COLORS } from "@/config/design-tokens";

// --- Sub-components ---

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/90 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 text-end">
                <p className="font-bold text-foreground mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0 justify-end">
                        <span className="text-foreground font-bold">{entry.value.toLocaleString("en-US")}</span>
                        <span className="text-muted-foreground font-medium">{entry.name}:</span>
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
        queryFn: async () => apiGet(`api/rbac-admin/analytics/overview?timeRange=${timeRange}`)
    });

    const metrics = analyticsData?.metrics;
    const visitorData = analyticsData?.visitorData || [];
    const deviceData = analyticsData?.deviceData || [];
    const pageViews = analyticsData?.pageViews || [];

    return (
        <div className={PAGE_WRAPPER}>
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-primary text-white rounded-xl flex items-center justify-center shadow-xl shadow-primary/10">
                            <BarChart3 className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">تحليلات المنصة</h1>
                            <p className="text-muted-foreground font-medium text-lg">مراقبة أداء النظام وتفاعل المستخدمين في الوقت الفعلي</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-muted/50 p-1 rounded-2xl flex gap-1">
                            <Button
                                variant={timeRange === "24h" ? "default" : "ghost"}
                                onClick={() => setTimeRange("24h")}
                                className={cn("h-10 px-4 rounded-xl font-bold transition-all", timeRange === "24h" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                            >٢٤ ساعة</Button>
                            <Button
                                variant={timeRange === "7d" ? "default" : "ghost"}
                                onClick={() => setTimeRange("7d")}
                                className={cn("h-10 px-4 rounded-xl font-bold transition-all", timeRange === "7d" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                            >٧ أيام</Button>
                            <Button
                                variant={timeRange === "30d" ? "default" : "ghost"}
                                onClick={() => setTimeRange("30d")}
                                className={cn("h-10 px-4 rounded-xl font-bold transition-all", timeRange === "30d" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                            >٣٠ يوم</Button>
                        </div>
                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-border text-muted-foreground/70 hover:text-muted-foreground transition-all">
                            <Download className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </Card>

            <div className={GRID_METRICS}>
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm p-6">
                            <Skeleton className="h-20 w-full" />
                        </Card>
                    ))
                ) : (
                    [
                        { title: "إجمالي الزيارات", value: metrics?.totalVisits || "0", change: "+0%", icon: Eye, color: "text-muted-foreground", bg: "bg-muted/50" },
                        { title: "المستخدمين النشطين", value: metrics?.activeUsers || "0", change: "+0%", icon: Users, color: "text-muted-foreground", bg: "bg-muted/50" },
                        { title: "معدل التحويل", value: metrics?.conversionRate || "0%", change: "+0%", icon: Zap, color: "text-muted-foreground", bg: "bg-muted/50" },
                        { title: "وقت الجلسة", value: metrics?.avgSessionTime || "0 د", change: "+0%", icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
                    ].map((metric, i) => (
                        <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between hover:bg-card hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", metric.bg, metric.color)}>
                                    <metric.icon className="h-6 w-6" />
                                </div>
                                <Badge className={cn(
                                    "text-xs font-bold border-0 px-2 py-0.5 rounded-lg",
                                    metric.change.startsWith("+") ? "bg-primary/10 text-primary" : "bg-rose-50 text-rose-700"
                                )}>
                                    {metric.change}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">{metric.title}</p>
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">{metric.value}</h3>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 lg:col-span-2">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-foreground tracking-tight">نظرة عامة على النشاط</h3>
                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">تتبع الزيارات والمستخدمين يومياً</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary/50" />
                                <span className="text-xs font-bold text-muted-foreground">الزيارات</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary/10" />
                                <span className="text-xs font-bold text-muted-foreground">المستخدمين</span>
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
                                        <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="visits" name="الزيارات" stroke={CHART_COLORS.blue} strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                                <Area type="monotone" dataKey="users" name="المستخدمين" stroke={CHART_COLORS.green} strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">توزيع الأجهزة</h3>
                        <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">نسبة استخدام المنصة حسب الجهاز</p>
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
                                <p className="text-2xl font-bold text-foreground">{deviceData[0]?.value || 0}٪</p>
                                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">{deviceData[0]?.name || ''}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 mt-6">
                        {deviceData.map((device, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }} />
                                    <span className="text-xs font-bold text-foreground/80">{device.name}</span>
                                </div>
                                <span className="text-xs font-bold text-foreground">{device.value}٪</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">الصفحات الأكثر زيارة</h3>
                        <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">ترتيب الصفحات حسب حجم التفاعل</p>
                    </div>
                    <Button variant="ghost" className="text-primary font-bold gap-2">
                        عرض التفاصيل
                        <ArrowUpRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border">
                    <Table className="text-end">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-border">
                                <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">المسار (Path)</TableHead>
                                <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الإجمالي</TableHead>
                                <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">التغيير</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={4} className="p-4">
                                            <Skeleton className="h-12 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : pageViews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-8 text-center">
                                        <p className="text-muted-foreground font-medium">لا توجد بيانات</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageViews.map((page, i) => (
                                <TableRow key={i} className="hover:bg-primary/5 transition-colors group border-border">
                                    <TableCell className="py-4"><span className="text-sm font-bold text-foreground/80">{page.page}</span></TableCell>
                                    <TableCell className="py-4"><span className="text-sm font-bold text-foreground">{page.views}</span></TableCell>
                                    <TableCell className="py-4">
                                        <Badge className={cn(
                                            "text-xs font-bold border-0 px-2 py-0.5 rounded-lg",
                                            page.status === "up" ? "bg-primary/10 text-primary" : "bg-rose-50 text-rose-700"
                                        )}>
                                            {page.change}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full w-[70%]" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
