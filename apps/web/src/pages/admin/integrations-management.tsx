import { useLocation } from "wouter";
import { MetricCard } from "@/components/admin";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MessageSquare,
    Mail,
    Smartphone,
    CheckCircle2,
    Settings,
    Copy,
    RefreshCw,
    Plus,
    Activity,
    ShieldCheck,
    Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, GRID_METRICS } from "@/config/platform-theme";
import { ADMIN_BUTTON_PRIMARY } from "@/config/design-tokens";
import { Label } from "@/components/ui/label";

// --- Sub-components ---

function WhatsAppTab() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 lg:col-span-2">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-muted/50 text-muted-foreground rounded-xl flex items-center justify-center">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">WhatsApp Business API</h2>
                                <p className="text-muted-foreground font-medium">إعدادات الربط مع واتساب لإرسال الإشعارات والرسائل</p>
                            </div>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold uppercase px-3 py-1 rounded-lg">متصل</Badge>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">معرف الحساب (Account ID)</Label>
                                <div className="relative group">
                                    <Input value="act_982347239487" readOnly className="h-12 rounded-xl bg-muted/30 border-border font-mono text-xs" />
                                    <Button size="icon" variant="ghost" className="absolute left-1 top-1 h-10 w-10 text-muted-foreground/70 hover:text-muted-foreground"><Copy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">رقم الهاتف المرتبط</Label>
                                <Input value="+966 50 123 4567" readOnly className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground/80" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">مفتاح الوصول (Access Token)</Label>
                            <div className="relative group">
                                <Input type="password" value="••••••••••••••••••••••••••••••" readOnly className="h-12 rounded-xl bg-muted/30 border-border" />
                                <div className="absolute left-1 top-1 flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground/70 hover:text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground/70 hover:text-muted-foreground"><Copy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" className="h-12 px-6 rounded-xl border-border font-bold text-muted-foreground hover:bg-muted/30 transition-all">قطع الاتصال</Button>
                            <Button className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">حفظ الإعدادات</Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 bg-primary/5">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-muted-foreground" />
                                حالة الخدمة
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-card/60 rounded-xl border border-border">
                                <span className="text-xs font-bold text-muted-foreground">جودة الربط</span>
                                <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold">ممتاز</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-card/60 rounded-xl border border-border">
                                <span className="text-xs font-bold text-muted-foreground">الرسائل المرسلة اليوم</span>
                                <span className="text-sm font-bold text-foreground">١,٢٥٤</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-card/60 rounded-xl border border-border">
                                <span className="text-xs font-bold text-muted-foreground">نسبة وصول الرسائل</span>
                                <span className="text-sm font-bold text-foreground">٩٩.٨٪</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 bg-primary/10">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                قوالب الرسائل
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">إدارة قوالب الرسائل المعتمدة من Meta</p>
                        </div>
                        <Button variant="outline" className="w-full h-10 rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/10 transition-all">عرض القوالب (١٢)</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function EmailTab() {
    return (
        <div className="space-y-6">
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-10 flex items-center gap-4">
                    <div className="h-16 w-16 bg-muted/50 text-muted-foreground rounded-xl flex items-center justify-center">
                        <Mail className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">إعدادات البريد الإلكتروني (SMTP)</h2>
                        <p className="text-muted-foreground font-medium">تكوين خادم البريد الخاص بالنظام لإرسال التقارير والإشعارات</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">خادم SMTP</Label>
                            <Input placeholder="smtp.sendgrid.net" className="h-12 rounded-xl bg-muted/30 border-border" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">المنفذ (Port)</Label>
                                <Input placeholder="587" className="h-12 rounded-xl bg-muted/30 border-border" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">التشفير</Label>
                                <Select defaultValue="tls">
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground/80">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border">
                                        <SelectItem value="tls">TLS</SelectItem>
                                        <SelectItem value="ssl">SSL</SelectItem>
                                        <SelectItem value="none">بلا تشفير</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">اسم المستخدم</Label>
                            <Input placeholder="apikey" className="h-12 rounded-xl bg-muted/30 border-border" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">كلمة المرور</Label>
                            <Input type="password" placeholder="••••••••••••••••" className="h-12 rounded-xl bg-muted/30 border-border" />
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
                    <Button variant="ghost" className="text-muted-foreground font-bold hover:bg-muted/50 transition-all">اختبار الاتصال</Button>
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-border font-bold text-muted-foreground">إلغاء</Button>
                        <Button className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">حفظ الإعدادات</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function APITab() {
    return (
        <div className="space-y-6">
            <div className={GRID_METRICS}>
                <MetricCard
                    title="طلبات الـ API"
                    subtitle="آخر ٢٤ ساعة"
                    icon={<Activity className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: 4520, last7Days: 4520, last30Days: 4520 }}
                />
                <MetricCard
                    title="نسبة النجاح"
                    subtitle="أداء النظام"
                    icon={<CheckCircle2 className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: 99.5, last7Days: 99.5, last30Days: 99.5 }}
                />
                <MetricCard
                    title="وقت الاستجابة"
                    subtitle="ملي ثانية"
                    icon={<Timer className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: 124, last7Days: 124, last30Days: 124 }}
                />
                <MetricCard
                    title="مفاتيح نشطة"
                    subtitle="أذونات الوصول"
                    icon={<Lock className="w-5 h-5 text-muted-foreground" />}
                    metric={{ today: 8, last7Days: 8, last30Days: 8 }}
                />
            </div>

            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">مفاتيح الوصول (API Keys)</h2>
                        <p className="text-muted-foreground font-medium">إدارة مفاتيح الدخول للربط الخارجي والمطورين</p>
                    </div>
                    <Button className={ADMIN_BUTTON_PRIMARY}>
                        <Plus className="h-5 w-5 me-2" />
                        إنشاء مفتاح جديد
                    </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-white/40">
                    <Table className="text-end">
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border">
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">اسم المفتاح</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">المفتاح</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">تاريخ الإنشاء</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">آخر استخدام</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الحالة</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { name: "Production App", key: "sk_live_••••8932", created: "2024/01/15", lastUsed: "منذ ساعة", status: "ACTIVE" },
                                { name: "Staging Testing", key: "sk_test_••••1245", created: "2024/02/10", lastUsed: "منذ ٣ أيام", status: "ACTIVE" },
                                { name: "Mobile App API", key: "sk_live_••••5567", created: "2023/11/20", lastUsed: "الآن", status: "ACTIVE" },
                            ].map((api, i) => (
                                <TableRow key={i} className="hover:bg-primary/5 transition-colors group border-border">
                                    <TableCell className="py-4"><span className="font-bold text-foreground/80">{api.name}</span></TableCell>
                                    <TableCell className="py-4"><code className="bg-muted/50 p-1 rounded text-xs text-muted-foreground font-mono">{api.key}</code></TableCell>
                                    <TableCell className="py-4"><span className="text-xs font-bold text-muted-foreground/70">{api.created}</span></TableCell>
                                    <TableCell className="py-4"><span className="text-xs font-bold text-muted-foreground/70">{api.lastUsed}</span></TableCell>
                                    <TableCell className="py-4">
                                        <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold">نشط</Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg outline-none"><Settings className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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

    const activeTab = location.split('/').pop() || 'whatsapp';

    const handleTabChange = (value: string) => {
        setLocation(`/admin/integrations/${value}`);
    };

    return (
        <div className={PAGE_WRAPPER}>
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-end">
                        <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">إدارة التكامل والربط</h1>
                        <p className="text-muted-foreground font-medium text-lg">إدارة الاتصال مع الخدمات الخارجية والواجهات البرمجية</p>
                    </div>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
                    <TabsTrigger value="whatsapp" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">واتساب</TabsTrigger>
                    <TabsTrigger value="email" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">البريد الإلكتروني</TabsTrigger>
                    <TabsTrigger value="sms" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">الرسائل (SMS)</TabsTrigger>
                    <TabsTrigger value="api" className="rounded-xl px-6 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">واجهات الـ API</TabsTrigger>
                </TabsList>

                <TabsContent value="whatsapp" className="space-y-4">
                    <WhatsAppTab />
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                    <EmailTab />
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                    <Card className="rounded-2xl p-20 text-center bg-muted/30 border-2 border-dashed border-border flex flex-col items-center">
                        <div className="h-20 w-20 bg-card rounded-2xl shadow-xl shadow-slate-500/10 flex items-center justify-center text-muted-foreground/70 mb-6 group-hover:scale-110 transition-transform">
                            <Smartphone className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">قريباً: خدمة الرسائل القصيرة (SMS)</h3>
                        <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed mt-2">
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
