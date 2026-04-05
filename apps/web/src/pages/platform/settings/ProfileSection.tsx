import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Save, Upload, ChevronDown, ShieldCheck, Calendar, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { formatAdminDate } from "@/lib/formatters";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const profileSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  avatar: string;
}

export interface ProfileSectionProps {
  userProfile: UserProfile;
  onSave: (values: ProfileFormValues) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSection({
  userProfile,
  onSave,
  isOpen,
  onOpenChange,
}: ProfileSectionProps) {
  // Fetch full user profile with agent_profiles (FAL data)
  const { data: fullProfile } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiGet("/api/auth/user"),
  });
  const agentProfile = fullProfile?.agent_profiles;

  const FAL_TYPE_LABELS: Record<string, string> = {
    BROKERAGE_MARKETING: "وساطة وتسويق",
    PROPERTY_MANAGEMENT: "إدارة أملاك",
    FACILITY_MANAGEMENT: "إدارة مرافق",
    AUCTION: "مزادات عقارية",
    CONSULTING: "استشارات وتحليلات",
    ADVERTISING: "إعلانات عقارية",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      phone: userProfile.phone,
      title: userProfile.title,
      department: userProfile.department,
    },
  });

  // Sync form when userProfile changes (e.g. after API load)
  useEffect(() => {
    form.reset({
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      phone: userProfile.phone,
      title: userProfile.title,
      department: userProfile.department,
    });
  }, [userProfile, form]);

  const handleSubmit = (values: ProfileFormValues) => {
    onSave(values);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CardHeader className="border-b border-border pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><Users size={18} /></span>
            <div className="text-end">
              <CardTitle>الملف الشخصي للفريق</CardTitle>
              <CardDescription>تحكم ببياناتك الشخصية وصورتك الظاهرة في المنصة</CardDescription>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:text-foreground/80"
              aria-label="تبديل عرض الملف الشخصي"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback className="text-lg">
                  {userProfile.firstName[0]}{userProfile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" className="flex items-center gap-2" data-testid="button-upload-avatar">
                  <Upload size={16} />
                  تغيير الصورة الشخصية
                </Button>
                <p className="text-sm text-muted-foreground">يفضل استخدام صور بحجم 400x400 بكسل أو أكبر</p>
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">الاسم الأول</FormLabel>
                        <FormControl>
                          <Input className="text-subtle" data-testid="input-first-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">اسم العائلة</FormLabel>
                        <FormControl>
                          <Input className="text-subtle" data-testid="input-last-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input type="email" className="text-subtle" data-testid="input-user-email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input type="tel" className="text-subtle" data-testid="input-user-phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">المسمى الوظيفي</FormLabel>
                        <FormControl>
                          <Input className="text-subtle" data-testid="input-user-title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">القسم</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="text-subtle" data-testid="select-department">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4}>
                              <SelectItem value="المبيعات">المبيعات</SelectItem>
                              <SelectItem value="التسويق">التسويق</SelectItem>
                              <SelectItem value="خدمة العملاء">خدمة العملاء</SelectItem>
                              <SelectItem value="التطوير">التطوير</SelectItem>
                              <SelectItem value="الإدارة">الإدارة</SelectItem>
                              <SelectItem value="المالية">المالية</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-start mt-6">
                  <Button type="submit" className="flex items-center gap-2" data-testid="button-save-profile">
                    <Save size={16} />
                    حفظ الملف الشخصي
                  </Button>
                </div>
              </form>
            </Form>
            {/* ── FAL License Compliance Card ── */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="font-bold text-sm">رخصة فال العقارية (REGA)</h3>
              </div>

              <Card className="border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">حالة الترخيص</span>
                    {agentProfile?.falLicenseNumber ? (
                      <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                        <CheckCircle size={12} />
                        {agentProfile.falStatus === "VERIFIED" ? "موثّق" : agentProfile.falStatus === "EXPIRED" ? "منتهي" : "مسجّل"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]">
                        <AlertTriangle size={12} />
                        غير مسجّل
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">رقم رخصة فال</p>
                      <p className="font-bold tabular-nums">{agentProfile?.falLicenseNumber || agentProfile?.licenseNo || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">نوع الرخصة</p>
                      <p className="font-bold">{agentProfile?.falLicenseType ? FAL_TYPE_LABELS[agentProfile.falLicenseType] || agentProfile.falLicenseType : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={12} /> تاريخ الإصدار</p>
                      <p className="font-bold">{agentProfile?.falIssuedAt ? formatAdminDate(agentProfile.falIssuedAt) : agentProfile?.licenseValidTo ? formatAdminDate(agentProfile.licenseValidTo) : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={12} /> تاريخ الانتهاء</p>
                      <p className="font-bold">{agentProfile?.falExpiresAt ? formatAdminDate(agentProfile.falExpiresAt) : agentProfile?.licenseValidTo ? formatAdminDate(agentProfile.licenseValidTo) : "—"}</p>
                    </div>
                  </div>

                  {!agentProfile?.falLicenseNumber && (
                    <div className="rounded-lg bg-[hsl(var(--warning)/0.1)] p-3 text-xs text-[hsl(var(--warning))]">
                      <p className="font-bold mb-1">تنبيه: يجب إدخال بيانات رخصة فال</p>
                      <p>حسب نظام الهيئة العامة للعقار، يجب على كل وسيط عقاري تسجيل رخصة فال السارية.</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <FileText size={14} />
                    <span>يمكنك الحصول على رخصة فال من <strong className="text-primary">rega.gov.sa</strong></span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
