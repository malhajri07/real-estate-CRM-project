import { Fragment } from "react";
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
    Layers,
    Check,
    Plus,
    Settings,
    Shield,
    Zap,
    Crown,
    CheckCircle2,
    MinusCircle,
    BarChart3,
    Search,
    Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { ADMIN_BUTTON_PRIMARY } from "@/config/design-tokens";

// --- Sub-components ---

const PLANS = ["الخطة الأساسية", "الخطة المتقدمة", "الخطة الاحترافية"];
const PLAN_ICONS = [Shield, Zap, Crown];
const PLAN_COLORS = ["text-muted-foreground/70", "text-primary", "text-[hsl(var(--warning))]"];

const FEATURE_CATEGORIES = [
    {
        name: "إدارة العقارات",
        features: [
            { id: 1, name: "إضافة إعلانات غير محدودة", basic: false, pro: true, enterprise: true },
            { id: 2, name: "تصوير احترافي للوحدات", basic: false, pro: false, enterprise: true },
            { id: 3, name: "نظام إدارة المواعيد", basic: true, pro: true, enterprise: true },
            { id: 4, name: "تصدير التقارير العقارية", basic: false, pro: true, enterprise: true },
        ]
    },
    {
        name: "التسويق والمبيعات",
        features: [
            { id: 5, name: "ربط مع وسائل التواصل الاجتماعي", basic: true, pro: true, enterprise: true },
            { id: 6, name: "نظام تتبع العملاء (CRM)", basic: false, pro: true, enterprise: true },
            { id: 7, name: "حملات البريد الإلكتروني", basic: false, pro: false, enterprise: true },
            { id: 8, name: "تحليلات الأداء المتقدمة", basic: false, pro: true, enterprise: true },
        ]
    }
];

function ComparisonMatrix() {
    return (
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <Table className="text-end">
                <TableHeader>
                    <TableRow className="bg-muted/30 border-border">
                        <TableHead className="p-6 w-[40%]">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-foreground tracking-tight">مصفوفة المزايا</h3>
                                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">مقارنة الخصائص بين الخطط</p>
                            </div>
                        </TableHead>
                        {PLANS.map((plan, i) => {
                            const Icon = PLAN_ICONS[i];
                            return (
                                <TableHead key={plan} className="p-6 text-center border-r border-border">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={cn("h-12 w-12 rounded-2xl bg-card shadow-sm flex items-center justify-center transition-transform hover:scale-110 duration-300", PLAN_COLORS[i])}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-sm font-bold text-foreground">{plan}</span>
                                    </div>
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {FEATURE_CATEGORIES.map((category) => (
                        <Fragment key={category.name}>
                            <TableRow className="bg-primary/5 border-0">
                                <TableCell colSpan={4} className="p-4 px-8">
                                    <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">{category.name}</span>
                                </TableCell>
                            </TableRow>
                            {category.features.map((feature) => (
                                <TableRow key={feature.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                                    <TableCell className="p-6 px-8 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-muted group-hover:bg-primary/60 transition-colors" />
                                        <span className="text-sm font-bold text-foreground/80">{feature.name}</span>
                                    </TableCell>
                                    <TableCell className="p-6 text-center border-r border-border">
                                        <StatusIcon enabled={feature.basic} />
                                    </TableCell>
                                    <TableCell className="p-6 text-center border-r border-border">
                                        <StatusIcon enabled={feature.pro} />
                                    </TableCell>
                                    <TableCell className="p-6 text-center border-r border-border">
                                        <StatusIcon enabled={feature.enterprise} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
            <div className="p-6 bg-muted/30 flex justify-between items-center">
                <p className="text-xs font-bold text-muted-foreground/70">آخر تحديث للمصفوفة: منذ ساعتين</p>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-10 rounded-xl border-border font-bold text-muted-foreground">إلغاء</Button>
                    <Button className="h-10 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">حفظ التغييرات</Button>
                </div>
            </div>
        </Card>
    );
}

function StatusIcon({ enabled }: { enabled: boolean }) {
    return (
        <div className="flex justify-center">
            {enabled ? (
                <div className="h-8 w-8 bg-muted/50 text-muted-foreground rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4" />
                </div>
            ) : (
                <div className="h-8 w-8 bg-muted/30 text-muted-foreground rounded-full flex items-center justify-center">
                    <MinusCircle className="h-4 w-4" />
                </div>
            )}
        </div>
    );
}

const FEATURE_LIST = [
    { id: 1, name: "إدارة العقارات المتقدمة", users: 125, status: "Active" },
    { id: 2, name: "تتبع العمولات", users: 84, status: "Active" },
    { id: 3, name: "نظام التقييم العقاري", users: 42, status: "Draft" },
    { id: 4, name: "تصدير التقارير الضريبية", users: 210, status: "Active" },
];

function FeaturesList() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input placeholder="البحث عن ميزة..." className="h-12 pe-11 rounded-xl bg-card border-border focus:ring-primary/20" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-12 px-6 rounded-xl gap-2 font-bold text-muted-foreground border-border">
                        <Filter className="h-4 w-4" />
                        تصفية
                    </Button>
                    <Button className={cn(ADMIN_BUTTON_PRIMARY, "gap-2 flex-1 md:flex-none")}>
                        <Plus className="h-5 w-5" />
                        إضافة ميزة جديدة
                    </Button>
                </div>
            </div>

            <div className={GRID_METRICS}>
                {FEATURE_LIST.map((feature) => (
                    <Card key={feature.id} className="rounded-2xl border border-border bg-card shadow-sm p-6 group transition-all hover:shadow-md hover:-translate-y-1 duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 bg-muted/50 text-muted-foreground rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6" />
                            </div>
                            <Badge className={cn(
                                "text-xs font-bold uppercase px-2 py-0.5 rounded-md border-0",
                                feature.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                            )}>
                                {feature.status === "Active" ? "نشط" : "مسودة"}
                            </Badge>
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-2">{feature.name}</h4>
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground/70 border-t border-border pt-4 mt-2">
                            <span>{feature.users} مستخدم نشط</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50 transition-all"><Settings className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/50 transition-all"><BarChart3 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// --- Main Page Component ---

export default function FeaturesManagement() {
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'comparison';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/features/${value}`);
    };

    return (
        <div className={PAGE_WRAPPER}>
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-primary text-white rounded-xl flex items-center justify-center shadow-xl shadow-primary/20">
                            <Layers className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">إدارة ميزات النظام</h1>
                            <p className="text-muted-foreground font-medium text-lg">تحكم في توافر المزايا وربطها بخطط الاشتراك المختلفة</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="comparison" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">مصفوفة المقارنة</TabsTrigger>
                    <TabsTrigger value="requests" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">طلبات الميزات</TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">خطط التسعير</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-4">
                    <ComparisonMatrix />
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <FeaturesList />
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <Card className="rounded-2xl p-20 text-center bg-muted/30 border-2 border-dashed border-border flex flex-col items-center">
                        <div className="h-20 w-20 bg-card rounded-2xl shadow-xl shadow-slate-500/10 flex items-center justify-center text-muted-foreground/70 mb-6 group-hover:scale-110 transition-transform">
                            <Crown className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">قريباً: إدارة خطط التسعير</h3>
                        <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed mt-2">
                            ستمكنك هذه الواجهة قريباً من تعديل أسعار الخطط وفترات الاشتراك بشكل مرن.
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
