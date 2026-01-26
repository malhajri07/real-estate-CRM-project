import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings,
    Globe,
    Palette,
    Code,
    Save,
    RefreshCcw,
    Sparkles,
    Shield,
    Database,
    Cloud,
    Mail,
    Smartphone,
    Languages,
    Image as ImageIcon,
    Layout,
    CheckCircle2,
    Activity,
    Server,
    Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Main Page Component ---

export default function SystemSettings() {
    const [location, setLocation] = useLocation();
    const activeTab = location.split('/').pop() || 'general';
    const [saving, setSaving] = useState(false);

    const handleTabChange = (value: string) => {
        setLocation(`/admin/system/${value}`);
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
    };

    return (
        <div className="space-y-8 animate-in-start" dir="rtl">
            <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group relative overflow-hidden">
                <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20">
                            <Settings className="h-8 w-8" />
                        </div>
                        <div className="text-center md:text-end">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">إعدادات النظام</h1>
                            <p className="text-slate-500 font-medium text-lg">تخصيص وتهيئة الخيارات الأساسية للمنصة</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/10 transition-all hover:scale-105 active:scale-95"
                    >
                        {saving ? <RefreshCcw className="h-5 w-5 animate-spin me-2" /> : <Save className="h-5 w-5 me-2" />}
                        {saving ? "جارِ الحفظ..." : "حفظ التغييرات"}
                    </Button>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="general" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الإعدادات العامة</TabsTrigger>
                    <TabsTrigger value="branding" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">الهوية البصرية</TabsTrigger>
                    <TabsTrigger value="integrations" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">خدمات الربط</TabsTrigger>
                    <TabsTrigger value="advanced" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all">إعدادات متقدمة</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">معلومات الموقع</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">المعلومات الأساسية للمنصة</p>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المنصة</Label>
                                    <Input defaultValue="عقاراتي بلس" className="h-12 rounded-xl bg-white border-slate-100 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">وصف المنصة (SEO)</Label>
                                    <Textarea defaultValue="أفضل منصة لإدارة وتسويق العقارات في المملكة العربية السعودية" className="rounded-xl bg-white border-slate-100 font-medium h-24" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني للإشعارات</Label>
                                    <Input defaultValue="admin@aqarati.com" className="h-12 rounded-xl bg-white border-slate-100 font-mono" dir="ltr" />
                                </div>
                            </div>
                        </Card>

                        <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">التوقيت واللغة</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تهيئة التخصيص الإقليمي</p>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اللغة الافتراضية</Label>
                                    <Select defaultValue="ar">
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            <SelectItem value="ar">العربية (RTL)</SelectItem>
                                            <SelectItem value="en">English (LTR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المنطقة الزمنية</Label>
                                    <Select defaultValue="asia/riyadh">
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            <SelectItem value="asia/riyadh">(GMT+03:00) الرياض</SelectItem>
                                            <SelectItem value="asia/dubai">(GMT+04:00) دبي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 group transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-500/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Globe className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">تفعيل تعدد اللغات</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">السماح للمستخدمين بتغيير اللغة</p>
                                        </div>
                                    </div>
                                    <Switch checked className="data-[state=checked]:bg-blue-600" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">الشعارات</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">إدارة الصور والرموز البصرية</p>
                            </div>
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col items-center gap-4 group cursor-pointer hover:bg-white transition-all">
                                    <div className="h-20 w-48 bg-white rounded-2xl shadow-sm flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:border-blue-300 transition-all overflow-hidden relative">
                                        <ImageIcon className="h-8 w-8 text-slate-300 group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-all" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-slate-900">الشعار الرئيسي</p>
                                        <p className="text-[10px] font-bold text-slate-400">يفضل خلفية شفافة PNG</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100"><ImageIcon className="h-5 w-5 text-slate-300" /></div>
                                        <span className="text-[10px] font-black text-slate-900">أيقونة الموقع</span>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100"><ImageIcon className="h-5 w-5 text-slate-300" /></div>
                                        <span className="text-[10px] font-black text-slate-900">شعار الجوال</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">الألوان والسمات</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تخصيص ألوان الواجهة</p>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اللون الرئيسي (Primary Color)</Label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {["#3b82f6", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b"].map((color) => (
                                            <button key={color} className={cn("h-10 rounded-xl transition-all hover:scale-110 active:scale-95", color === "#3b82f6" ? "ring-4 ring-slate-100" : "")} style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">نمط الحواف (Radius)</Label>
                                    <Select defaultValue="large">
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            <SelectItem value="none">بدون حواف</SelectItem>
                                            <SelectItem value="medium">متوسط (12px)</SelectItem>
                                            <SelectItem value="large">كبير (24px)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">خدمات الرسائل</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">SMS & WhatsApp APIs</p>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-0 px-3 py-1 rounded-lg font-black text-[10px]">متصل</Badge>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API Key (Twilio/Unifonic)</Label>
                                    <Input value="••••••••••••••••••••••••" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-mono" dir="ltr" disabled />
                                </div>
                                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50">اختبار الاتصال</Button>
                            </div>
                        </Card>

                        <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">خرائط جوجل</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Google Maps Platform</p>
                                </div>
                                <Badge className="bg-rose-50 text-rose-700 border-0 px-3 py-1 rounded-lg font-black text-[10px]">تحقق مطلوب</Badge>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Maps API Key</Label>
                                    <Input placeholder="أدخل مفتاح التحقق..." className="h-12 rounded-xl bg-white border-slate-100 font-mono" dir="ltr" />
                                </div>
                                <p className="text-[10px] font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">يستخدم هذا المفتاح لعرض الخرائط في صفحات العقارات والبحث الجغرافي.</p>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-8">
                    <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none space-y-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">صيانة النظام</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">عمليات قواعد البيانات والذاكرة المؤقتة</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4 group hover:bg-white hover:shadow-xl transition-all">
                                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><RefreshCcw className="h-6 w-6" /></div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900">مسح الذاكرة المؤقتة</h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1">تحديث كافة البيانات المخزنة مؤقتاً في Redis</p>
                                </div>
                                <Button size="sm" variant="outline" className="h-9 w-full rounded-xl border-slate-200 font-bold">تنفيذ الآن</Button>
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4 group hover:bg-white hover:shadow-xl transition-all">
                                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors"><Database className="h-6 w-6" /></div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900">نسخة احتياطية</h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1">تصدير كامل لقاعدة البيانات الحالية</p>
                                </div>
                                <Button size="sm" variant="outline" className="h-9 w-full rounded-xl border-slate-200 font-bold">بدء التصدير</Button>
                            </div>
                            <div className="p-6 bg-rose-50/30 rounded-3xl border border-rose-100 space-y-4 group hover:bg-white hover:shadow-xl transition-all">
                                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-rose-600 "><Zap className="h-6 w-6" /></div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 text-rose-700">وضع التصحيح (Debug)</h4>
                                    <p className="text-[10px] font-medium text-rose-500 mt-1">تفعيل تسجيل الأخطاء التفصيلي</p>
                                </div>
                                <Switch className="data-[state=checked]:bg-rose-600" />
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
