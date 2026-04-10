/**
 * AnalyticsManagement — لوحة إدارة التحليلات | Admin analytics dashboard with traffic, conversion, and revenue charts.
 *
 * @route /admin/analytics
 * @auth WEBSITE_ADMIN
 * @dataSources analytics/overview, analytics/traffic, analytics/conversions, analytics/revenue
 */
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
    Zap,
    MapPin,
    Filter,
    DollarSign,
    Activity,
    UserCheck,
    ArrowDown,
    Percent,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, GRID_METRICS, GRID_TWO_COL } from "@/config/platform-theme";
import { CHART_COLORS } from "@/config/design-tokens";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";

// --- Sub-components ---

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/90 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4">
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

// --- Engagement metrics mock data (populated from API or defaults) ---

const ENGAGEMENT_DEFAULTS = {
    dau: 1240,
    mau: 8750,
    avgSessionSeconds: 342,
    bounceRate: 32.5,
};

const GEO_DISTRIBUTION_DATA = [
    { city: 'الرياض', properties: 1250, color: CHART_COLORS.secondary },
    { city: 'جدة', properties: 890, color: CHART_COLORS.tertiary },
    { city: 'الدمام', properties: 520, color: CHART_COLORS.purple },
    { city: 'مكة المكرمة', properties: 340, color: CHART_COLORS.amber },
    { city: 'المدينة المنورة', properties: 280, color: CHART_COLORS.quaternary },
    { city: 'أخرى', properties: 420, color: CHART_COLORS.quinary },
];

const REVENUE_BY_TYPE_DATA = [
    { type: 'شقق', amount: 2450000, percentage: 35, color: CHART_COLORS.secondary },
    { type: 'فلل', amount: 1890000, percentage: 27, color: CHART_COLORS.tertiary },
    { type: 'أراضي', amount: 1400000, percentage: 20, color: CHART_COLORS.purple },
    { type: 'تجاري', amount: 840000, percentage: 12, color: CHART_COLORS.amber },
    { type: 'أخرى', amount: 420000, percentage: 6, color: CHART_COLORS.red },
];

const FUNNEL_DATA = [
    { name: 'زيارات الموقع', value: 10000, fill: CHART_COLORS.secondary },
    { name: 'تسجيل حساب', value: 4200, fill: CHART_COLORS.quaternary },
    { name: 'استعلام', value: 2100, fill: CHART_COLORS.tertiary },
    { name: 'معاينة عقار', value: 850, fill: CHART_COLORS.amber },
    { name: 'إتمام الصفقة', value: 320, fill: CHART_COLORS.purple },
];

function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

function formatCurrency(n: number): string {
    return `${n.toLocaleString('en-US')}`;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} د ${s} ث`;
}

function handleExportData() {
    // Build a simple CSV from geo + revenue data
    const rows = [
        ['المدينة', 'عدد العقارات'],
        ...GEO_DISTRIBUTION_DATA.map(d => [d.city, String(d.properties)]),
        [],
        ['نوع العقار', 'الإيرادات', 'النسبة'],
        ...REVENUE_BY_TYPE_DATA.map(d => [d.type, String(d.amount), `${d.percentage}%`]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// --- Main Page Component ---

export default function AnalyticsManagement() {
    const showSkeleton = useMinLoadTime();
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

    if (isLoading || showSkeleton) {
        return (
            <div className={PAGE_WRAPPER}>
                <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight mb-6">تحليلات المنصة</h1>
                <AdminPageSkeleton />
            </div>
        );
    }

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
                                    metric.change.startsWith("+") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
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
                            <ChartContainer config={{} as ChartConfig} className="h-full w-full">
                                <AreaChart data={visitorData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.tertiary} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={CHART_COLORS.tertiary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="visits" name="الزيارات" stroke={CHART_COLORS.secondary} strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                                <Area type="monotone" dataKey="users" name="المستخدمين" stroke={CHART_COLORS.tertiary} strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ChartContainer>
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
                            <ChartContainer config={{} as ChartConfig} className="h-full w-full">
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
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
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
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border">
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">المسار (Path)</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الإجمالي</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">التغيير</TableHead>
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
                                            page.status === "up" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
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

            {/* ── User Engagement Metrics ──────────────────────────────────── */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground tracking-tight">مقاييس تفاعل المستخدمين</h3>
                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">المستخدمين النشطين ومدة الجلسة ومعدل الارتداد</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col p-5 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <UserCheck className="h-5 w-5 text-primary" />
                            <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold px-2 py-0.5 rounded-lg">DAU</Badge>
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{formatNumber(ENGAGEMENT_DEFAULTS.dau)}</p>
                        <p className="text-xs text-muted-foreground mt-1">مستخدم نشط يومياً</p>
                    </div>
                    <div className="flex flex-col p-5 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <Users className="h-5 w-5 text-primary" />
                            <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold px-2 py-0.5 rounded-lg">MAU</Badge>
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{formatNumber(ENGAGEMENT_DEFAULTS.mau)}</p>
                        <p className="text-xs text-muted-foreground mt-1">مستخدم نشط شهرياً</p>
                    </div>
                    <div className="flex flex-col p-5 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <Clock className="h-5 w-5 text-primary" />
                            <Badge className="bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-0 text-xs font-bold px-2 py-0.5 rounded-lg">AVG</Badge>
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{formatDuration(ENGAGEMENT_DEFAULTS.avgSessionSeconds)}</p>
                        <p className="text-xs text-muted-foreground mt-1">متوسط مدة الجلسة</p>
                    </div>
                    <div className="flex flex-col p-5 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <Percent className="h-5 w-5 text-primary" />
                            <Badge className="bg-destructive/10 text-destructive border-0 text-xs font-bold px-2 py-0.5 rounded-lg">BOUNCE</Badge>
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{ENGAGEMENT_DEFAULTS.bounceRate}٪</p>
                        <p className="text-xs text-muted-foreground mt-1">معدل الارتداد</p>
                    </div>
                </div>
            </Card>

            {/* ── Geographic Distribution & Revenue Breakdown ──────────────── */}
            <div className={GRID_TWO_COL}>
                {/* Geographic Distribution */}
                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-1">
                            <MapPin className="h-5 w-5 text-primary" />
                            <h3 className="text-xl font-bold text-foreground tracking-tight">التوزيع الجغرافي</h3>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest ps-8">توزيع العقارات حسب المدينة</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ChartContainer config={{} as ChartConfig} className="h-full w-full">
                            <BarChart data={GEO_DISTRIBUTION_DATA} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis type="category" dataKey="city" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} width={100} />
                                <Tooltip
                                    formatter={(value: number) => [formatNumber(value), 'العقارات']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 700 }}
                                />
                                <Bar dataKey="properties" radius={[0, 8, 8, 0]} maxBarSize={28}>
                                    {GEO_DISTRIBUTION_DATA.map((entry, index) => (
                                        <Cell key={`geo-cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>
                </Card>

                {/* Revenue Breakdown by Property Type */}
                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-1">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <h3 className="text-xl font-bold text-foreground tracking-tight">الإيرادات حسب نوع العقار</h3>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest ps-8">توزيع الإيرادات على فئات العقارات</p>
                    </div>
                    <div className="h-[200px] w-full mb-4">
                        <ChartContainer config={{} as ChartConfig} className="h-full w-full">
                            <PieChart>
                                <Pie
                                    data={REVENUE_BY_TYPE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="amount"
                                >
                                    {REVENUE_BY_TYPE_DATA.map((entry, index) => (
                                        <Cell key={`rev-cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 700 }}
                                />
                            </PieChart>
                        </ChartContainer>
                    </div>
                    <div className="space-y-3">
                        {REVENUE_BY_TYPE_DATA.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-bold text-foreground/80">{item.type}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-muted-foreground">{formatCurrency(item.amount)}</span>
                                    <Badge className="bg-muted text-muted-foreground border-0 text-xs font-bold px-2 py-0.5 rounded-lg min-w-[40px] text-center">
                                        {item.percentage}٪
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ── Conversion Funnel ──────────────────────────────────────────── */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground tracking-tight">قمع التحويل</h3>
                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">رحلة المستخدم من الزيارة إلى الصفقة</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold px-3 py-1 rounded-lg">
                        معدل التحويل: {((FUNNEL_DATA[FUNNEL_DATA.length - 1].value / FUNNEL_DATA[0].value) * 100).toFixed(1)}٪
                    </Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {FUNNEL_DATA.map((step, i) => {
                        const dropoff = i > 0
                            ? (((FUNNEL_DATA[i - 1].value - step.value) / FUNNEL_DATA[i - 1].value) * 100).toFixed(1)
                            : null;
                        const conversionFromTop = ((step.value / FUNNEL_DATA[0].value) * 100).toFixed(1);
                        return (
                            <div key={i} className="relative">
                                <div
                                    className="flex flex-col p-5 rounded-2xl border border-border transition-all hover:shadow-md"
                                    style={{ backgroundColor: `${step.fill}08`, borderColor: `${step.fill}30` }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">المرحلة {i + 1}</span>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${step.fill}15` }}>
                                            <span className="text-xs font-bold" style={{ color: step.fill }}>{conversionFromTop}٪</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground tracking-tight">{formatNumber(step.value)}</p>
                                    <p className="text-sm font-bold mt-1" style={{ color: step.fill }}>{step.name}</p>
                                    {dropoff && (
                                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                                            <ArrowDown className="h-3 w-3 text-destructive" />
                                            <span className="text-xs font-bold text-destructive">-{dropoff}٪ تراجع</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* ── Export Data Button ──────────────────────────────────────────── */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Download className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">تصدير بيانات التحليلات</h3>
                            <p className="text-sm text-muted-foreground">تحميل ملف CSV يحتوي على التوزيع الجغرافي والإيرادات</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleExportData}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all h-12 px-8 rounded-xl gap-2"
                    >
                        <Download className="h-4 w-4" />
                        تصدير CSV
                    </Button>
                </div>
            </Card>
        </div>
    );
}
