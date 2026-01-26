import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Layers,
    Check,
    X,
    Plus,
    Settings,
    Shield,
    Zap,
    Crown,
    CheckCircle2,
    PlusCircle,
    MinusCircle,
    BarChart3,
    ArrowUpRight,
    Search,
    Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// --- Sub-components ---

const PLANS = ["الخطة الأساسية", "الخطة المتقدمة", "الخطة الاحترافية"];
const PLAN_ICONS = [Shield, Zap, Crown];
const PLAN_COLORS = ["text-slate-400", "text-blue-600", "text-amber-500"];

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
        <Card className="glass border-0 rounded-[2.5rem] overflow-hidden shadow-none">
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="p-8 w-[40%]">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">مصفوفة المزايا</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">مقارنة الخصائص بين الخطط</p>
                                </div>
                            </th>
                            {PLANS.map((plan, i) => {
                                const Icon = PLAN_ICONS[i];
                                return (
                                    <th key={plan} className="p-8 text-center border-r border-slate-100">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className={cn("h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center transition-transform hover:scale-110 duration-300", PLAN_COLORS[i])}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{plan}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {FEATURE_CATEGORIES.map((category) => (
                            <React.Fragment key={category.name}>
                                <tr className="bg-blue-50/30">
                                    <td colSpan={4} className="p-4 px-8">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{category.name}</span>
                                    </td>
                                </tr>
                                {category.features.map((feature) => (
                                    <tr key={feature.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6 px-8 flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                                            <span className="text-sm font-bold text-slate-700">{feature.name}</span>
                                        </td>
                                        <td className="p-6 text-center border-r border-slate-100">
                                            <StatusIcon enabled={feature.basic} />
                                        </td>
                                        <td className="p-6 text-center border-r border-slate-100">
                                            <StatusIcon enabled={feature.pro} />
                                        </td>
                                        <td className="p-6 text-center border-r border-slate-100">
                                            <StatusIcon enabled={feature.enterprise} />
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-8 bg-slate-50/50 flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400">آخر تحديث للمصفوفة: منذ ساعتين</p>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold text-slate-600">إلغاء</Button>
                    <Button className="h-10 px-8 rounded-xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/10">حفظ التغييرات</Button>
                </div>
            </div>
        </Card>
    );
}

function StatusIcon({ enabled }: { enabled: boolean }) {
    return (
        <div className="flex justify-center">
            {enabled ? (
                <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4" />
                </div>
            ) : (
                <div className="h-8 w-8 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input placeholder="البحث عن ميزة..." className="h-12 pr-11 rounded-[1.25rem] bg-white border-slate-200 focus:ring-blue-500/20" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-12 px-6 rounded-[1.25rem] gap-2 font-bold text-slate-600 border-slate-200">
                        <Filter className="h-4 w-4" />
                        تصفية
                    </Button>
                    <Button className="h-12 px-8 rounded-[1.25rem] premium-gradient text-white border-0 shadow-lg shadow-blue-500/25 font-bold gap-2 flex-1 md:flex-none">
                        <Plus className="h-5 w-5" />
                        إضافة ميزة جديدة
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURE_LIST.map((feature) => (
                    <Card key={feature.id} className="glass border-0 rounded-[2rem] p-6 shadow-none group transition-all hover:bg-white hover:shadow-2xl hover:-translate-y-1 duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6" />
                            </div>
                            <Badge className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-0",
                                feature.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}>
                                {feature.status === "Active" ? "نشط" : "مسودة"}
                            </Badge>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">{feature.name}</h4>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-50 pt-4 mt-2">
                            <span>{feature.users} مستخدم نشط</span>
                            <div className="flex gap-2">
                                <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Settings className="h-4 w-4" /></button>
                                <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><BarChart3 className="h-4 w-4" /></button>
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
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20">
                            <Layers className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-right">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة ميزات النظام</h1>
                            <p className="text-slate-500 font-medium text-lg">تحكم في توافر المزايا وربطها بخطط الاشتراك المختلفة</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="comparison" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">مصفوفة المقارنة</TabsTrigger>
                    <TabsTrigger value="requests" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">طلبات الميزات</TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">خطط التسعير</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-4">
                    <ComparisonMatrix />
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <FeaturesList />
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <Card className="glass border-0 rounded-[2.5rem] p-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200/50 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white rounded-[2rem] shadow-xl shadow-slate-500/10 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                            <Crown className="h-10 w-10 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">قريباً: إدارة خطط التسعير</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed mt-2">
                            ستمكنك هذه الواجهة قريباً من تعديل أسعار الخطط وفترات الاشتراك بشكل مرن.
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
