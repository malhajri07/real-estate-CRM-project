import { useState } from "react";
import { useLocation } from "wouter";
import { AdminCard, MetricCard } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plug,
    MessageSquare,
    Mail,
    Smartphone,
    Globe,
    Shield,
    CheckCircle2,
    AlertCircle,
    Settings,
    Copy,
    ExternalLink,
    RefreshCw,
    Plus,
    Loader2,
    Activity,
    ShieldCheck,
    Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// --- Sub-components ---

function WhatsAppTab() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none lg:col-span-2">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">WhatsApp Business API</h2>
                                <p className="text-slate-500 font-medium">إعدادات الربط مع واتساب لإرسال الإشعارات والرسائل</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-black uppercase px-3 py-1 rounded-lg">متصل</Badge>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">معرف الحساب (Account ID)</label>
                                <div className="relative group">
                                    <Input value="act_982347239487" readOnly className="h-12 rounded-xl bg-slate-50 border-slate-100 font-mono text-xs" />
                                    <Button size="icon" variant="ghost" className="absolute left-1 top-1 h-10 w-10 text-slate-400 hover:text-blue-600"><Copy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الهاتف المرتبط</label>
                                <Input value="+966 50 123 4567" readOnly className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-slate-700" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">مفتاح الوصول (Access Token)</label>
                            <div className="relative group">
                                <Input type="password" value="••••••••••••••••••••••••••••••" readOnly className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                                <div className="absolute left-1 top-1 flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-blue-600"><RefreshCw className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-blue-600"><Copy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">قطع الاتصال</Button>
                            <Button className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">حفظ الإعدادات</Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="glass border-0 rounded-[2rem] p-8 shadow-none bg-blue-50/30">
                        <div className="mb-6">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                حالة الخدمة
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white">
                                <span className="text-xs font-bold text-slate-500">جودة الربط</span>
                                <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-black">ممتاز</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white">
                                <span className="text-xs font-bold text-slate-500">الرسائل المرسلة اليوم</span>
                                <span className="text-sm font-black text-slate-900">١,٢٥٤</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white">
                                <span className="text-xs font-bold text-slate-500">نسبة وصول الرسائل</span>
                                <span className="text-sm font-black text-slate-900">٩٩.٨٪</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="glass border-0 rounded-[2rem] p-8 shadow-none bg-emerald-50/20">
                        <div className="mb-4">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                قوالب الرسائل
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">إدارة قوالب الرسائل المعتمدة من Meta</p>
                        </div>
                        <Button variant="outline" className="w-full h-10 rounded-xl border-emerald-100 text-emerald-700 font-bold hover:bg-emerald-50 transition-all">عرض القوالب (١٢)</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function EmailTab() {
    return (
        <div className="space-y-8">
            <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none">
                <div className="mb-10 flex items-center gap-4">
                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center">
                        <Mail className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">إعدادات البريد الإلكتروني (SMTP)</h2>
                        <p className="text-slate-500 font-medium">تكوين خادم البريد الخاص بالنظام لإرسال التقارير والإشعارات</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">خادم SMTP</label>
                            <Input placeholder="smtp.sendgrid.net" className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المنفذ (Port)</label>
                                <Input placeholder="587" className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">التشفير</label>
                                <select className="w-full h-12 rounded-xl bg-slate-50 border-slate-100 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
                                    <option>TLS</option>
                                    <option>SSL</option>
                                    <option>بلا تشفير</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المستخدم</label>
                            <Input placeholder="apikey" className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">كلمة المرور</label>
                            <Input type="password" placeholder="••••••••••••••••" className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50 transition-all">اختبار الاتصال</Button>
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold text-slate-600">إلغاء</Button>
                        <Button className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/10">حفظ الإعدادات</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function APITab() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="طلبات الـ API"
                    subtitle="آخر ٢٤ ساعة"
                    icon={<Activity className="w-5 h-5 text-blue-600" />}
                    metric={{ today: 4520, last7Days: 4520, last30Days: 4520 }}
                />
                <MetricCard
                    title="نسبة النجاح"
                    subtitle="أداء النظام"
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    metric={{ today: 99.5, last7Days: 99.5, last30Days: 99.5 }}
                />
                <MetricCard
                    title="وقت الاستجابة"
                    subtitle="ملي ثانية"
                    icon={<Timer className="w-5 h-5 text-purple-600" />}
                    metric={{ today: 124, last7Days: 124, last30Days: 124 }}
                />
                <MetricCard
                    title="مفاتيح نشطة"
                    subtitle="أذونات الوصول"
                    icon={<Lock className="w-5 h-5 text-amber-600" />}
                    metric={{ today: 8, last7Days: 8, last30Days: 8 }}
                />
            </div>

            <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">مفاتيح الوصول (API Keys)</h2>
                        <p className="text-slate-500 font-medium">إدارة مفاتيح الدخول للربط الخارجي والمطورين</p>
                    </div>
                    <Button className="premium-gradient text-white border-0 shadow-lg shadow-blue-500/25 h-12 px-8 rounded-2xl font-bold">
                        <Plus className="h-5 w-5 me-2" />
                        إنشاء مفتاح جديد
                    </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">اسم المفتاح</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">المفتاح</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">تاريخ الإنشاء</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">آخر استخدام</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">الحالة</th>
                                <th className="p-4 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                { name: "Production App", key: "sk_live_••••8932", created: "2024/01/15", lastUsed: "منذ ساعة", status: "ACTIVE" },
                                { name: "Staging Testing", key: "sk_test_••••1245", created: "2024/02/10", lastUsed: "منذ ٣ أيام", status: "ACTIVE" },
                                { name: "Mobile App API", key: "sk_live_••••5567", created: "2023/11/20", lastUsed: "الآن", status: "ACTIVE" },
                            ].map((api, i) => (
                                <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4"><span className="font-bold text-slate-700">{api.name}</span></td>
                                    <td className="p-4"><code className="bg-slate-100 p-1 rounded text-xs text-slate-500 font-mono">{api.key}</code></td>
                                    <td className="p-4"><span className="text-xs font-bold text-slate-400">{api.created}</span></td>
                                    <td className="p-4"><span className="text-xs font-bold text-slate-400">{api.lastUsed}</span></td>
                                    <td className="p-4">
                                        <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-black">نشط</Badge>
                                    </td>
                                    <td className="p-4">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg outline-none"><Settings className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

const Timer = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" />
    </svg>
);

// --- Main Page Component ---

export default function IntegrationsManagement() {
    const [location, setLocation] = useLocation();

    // Determine active tab based on URL
    const activeTab = location.split('/').pop() || 'whatsapp';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/integrations/${value}`);
    };

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-right">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة التكامل والربط</h1>
                        <p className="text-slate-500 font-medium text-lg">إدارة الاتصال مع الخدمات الخارجية والواجهات البرمجية</p>
                    </div>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="whatsapp" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">واتساب</TabsTrigger>
                    <TabsTrigger value="email" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">البريد الإلكتروني</TabsTrigger>
                    <TabsTrigger value="sms" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الرسائل (SMS)</TabsTrigger>
                    <TabsTrigger value="api" className="rounded-xl px-6 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">واجهات الـ API</TabsTrigger>
                </TabsList>

                <TabsContent value="whatsapp" className="space-y-4">
                    <WhatsAppTab />
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                    <EmailTab />
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                    <Card className="glass border-0 rounded-[2.5rem] p-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200/50 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white rounded-[2rem] shadow-xl shadow-slate-500/10 flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                            <Smartphone className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">قريباً: خدمة الرسائل القصيرة (SMS)</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed mt-2">
                            نحن نعمل على توفير خيارات ربط مع مزودي خدمة الـ SMS المحليين والدوليين قريباً.
                        </p>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="space-y-4">
                    <APITab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
