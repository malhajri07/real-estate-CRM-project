/**
 * ProfessionalSection.tsx — FAL license, specializations, service areas, working hours
 *
 * Grouped into 3 cards instead of 5 to reduce scrolling:
 *  1. FAL License + National ID
 *  2. Bio, Experience, Specializations, Service Areas
 *  3. Working Hours
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Save, ShieldCheck, Briefcase, MapPin, Clock, FileText,
  CheckCircle, AlertTriangle, Calendar, GraduationCap,
} from "lucide-react";

const FAL_TYPE_LABELS: Record<string, string> = {
  BROKERAGE_MARKETING: "وساطة وتسويق",
  PROPERTY_MANAGEMENT: "إدارة أملاك",
  FACILITY_MANAGEMENT: "إدارة مرافق",
  AUCTION: "مزادات عقارية",
  CONSULTING: "استشارات وتحليلات",
  ADVERTISING: "إعلانات عقارية",
};

const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الظهران", "الطائف", "تبوك", "بريدة", "حائل",
  "خميس مشيط", "أبها", "نجران", "جازان", "ينبع", "الجبيل",
  "الأحساء", "القطيف", "عنيزة",
];

const SPECIALTIES = [
  "سكني", "تجاري", "أراضي", "صناعي", "فندقي",
  "مكاتب", "مستودعات", "مزارع", "فلل", "شقق",
];

const professionalSchema = z.object({
  bio: z.string().max(1000).optional(),
  experience: z.coerce.number().int().min(0).max(60).optional().or(z.literal("")),
  falLicenseNumber: z.string().optional(),
  falLicenseType: z.string().optional(),
  falIssuedAt: z.string().optional(),
  falExpiresAt: z.string().optional(),
  nationalIdNumber: z.string().optional(),
  sreiCertified: z.boolean().optional(),
  workingHoursFrom: z.string().optional(),
  workingHoursTo: z.string().optional(),
  workingDays: z.string().optional(),
});

type FormValues = z.infer<typeof professionalSchema>;

interface Props {
  agentProfile: any;
  userMetadata: any;
  onSave: (values: any) => void;
  isSaving: boolean;
}

export default function ProfessionalSection({ agentProfile, userMetadata, onSave, isSaving }: Props) {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const workingHours = (() => {
    try {
      return (userMetadata as any)?.workingHours
        ? JSON.parse((userMetadata as any).workingHours)
        : { from: "09:00", to: "18:00", days: "الأحد - الخميس" };
    } catch {
      return { from: "09:00", to: "18:00", days: "الأحد - الخميس" };
    }
  })();

  const form = useForm<FormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      bio: agentProfile?.bio || "",
      experience: agentProfile?.experience ?? "",
      falLicenseNumber: agentProfile?.falLicenseNumber || "",
      falLicenseType: agentProfile?.falLicenseType || "",
      falIssuedAt: agentProfile?.falIssuedAt ? new Date(agentProfile.falIssuedAt).toISOString().split("T")[0] : "",
      falExpiresAt: agentProfile?.falExpiresAt ? new Date(agentProfile.falExpiresAt).toISOString().split("T")[0] : "",
      nationalIdNumber: agentProfile?.nationalIdNumber || "",
      sreiCertified: agentProfile?.sreiCertified || false,
      workingHoursFrom: workingHours.from,
      workingHoursTo: workingHours.to,
      workingDays: workingHours.days,
    },
  });

  useEffect(() => {
    if (agentProfile?.territories) {
      setSelectedCities(agentProfile.territories.split(",").map((s: string) => s.trim()).filter(Boolean));
    }
    if (agentProfile?.specialties) {
      setSelectedSpecialties(agentProfile.specialties.split(",").map((s: string) => s.trim()).filter(Boolean));
    }
  }, [agentProfile]);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSubmit = (values: FormValues) => {
    onSave({
      bio: values.bio,
      experience: values.experience || undefined,
      territories: selectedCities.join(", "),
      specialties: selectedSpecialties.join(", "),
      falLicenseNumber: values.falLicenseNumber,
      falLicenseType: values.falLicenseType || undefined,
      falIssuedAt: values.falIssuedAt ? new Date(values.falIssuedAt).toISOString() : "",
      falExpiresAt: values.falExpiresAt ? new Date(values.falExpiresAt).toISOString() : "",
      nationalIdNumber: values.nationalIdNumber,
      sreiCertified: values.sreiCertified,
      workingHours: JSON.stringify({
        from: values.workingHoursFrom,
        to: values.workingHoursTo,
        days: values.workingDays,
      }),
    });
  };

  const hasFal = !!agentProfile?.falLicenseNumber;
  const falStatus = agentProfile?.falStatus;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* ── Card 1: FAL License + Identity ── */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 p-2 text-primary"><ShieldCheck size={18} /></span>
                <div>
                  <CardTitle>رخصة فال العقارية</CardTitle>
                  <CardDescription>بيانات ترخيص الهيئة العامة للعقار (REGA)</CardDescription>
                </div>
              </div>
              {hasFal ? (
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                  <CheckCircle size={12} />
                  {falStatus === "VERIFIED" ? "موثّق" : falStatus === "EXPIRED" ? "منتهي" : "مسجّل"}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]">
                  <AlertTriangle size={12} />
                  غير مسجّل
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="falLicenseNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم رخصة فال</FormLabel>
                  <FormControl><Input dir="ltr" className="text-start tabular-nums" placeholder="7001234567" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="falLicenseType" render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الرخصة</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="اختر نوع الرخصة" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FAL_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="falIssuedAt" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Calendar size={14} />تاريخ الإصدار</FormLabel>
                  <FormControl><Input type="date" dir="ltr" className="text-start" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="falExpiresAt" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Calendar size={14} />تاريخ الانتهاء</FormLabel>
                  <FormControl><Input type="date" dir="ltr" className="text-start" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="nationalIdNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهوية الوطنية / الإقامة</FormLabel>
                  <FormControl><Input dir="ltr" className="text-start tabular-nums" placeholder="1xxxxxxxxx" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="sreiCertified" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 h-fit">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-primary shrink-0" />
                    <div>
                      <FormLabel className="mb-0 text-sm">معتمد SREI</FormLabel>
                      <p className="text-[11px] text-muted-foreground">المعهد العقاري السعودي</p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {!hasFal && (
              <div className="rounded-lg bg-[hsl(var(--warning)/0.1)] p-3 text-xs text-[hsl(var(--warning))]">
                <p className="font-bold mb-1">تنبيه: رخصة فال مطلوبة</p>
                <p>حسب نظام الهيئة العامة للعقار، يجب على كل وسيط عقاري تسجيل رخصة فال سارية المفعول.</p>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <FileText size={14} />
              <span>يمكنك الحصول على رخصة فال من <strong className="text-primary">rega.gov.sa</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: Profile + Specializations + Areas ── */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Briefcase size={18} /></span>
              <div>
                <CardTitle>الملف المهني</CardTitle>
                <CardDescription>نبذتك وتخصصاتك ومناطق خدمتك — تظهر للعملاء والوسطاء</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Bio + Experience row */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>نبذة عنك</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="خبرتك في السوق العقاري، تخصصاتك، وإنجازاتك..."
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">{(field.value || "").length}/1000</p>
                </FormItem>
              )} />
              <FormField control={form.control} name="experience" render={({ field }) => (
                <FormItem className="w-32">
                  <FormLabel>سنوات الخبرة</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={60} placeholder="5" {...field} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <Separator />

            {/* Specializations */}
            <div>
              <p className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <Briefcase size={14} className="text-primary" />
                التخصصات
              </p>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((spec) => (
                  <Button
                    key={spec}
                    type="button"
                    size="sm"
                    variant={selectedSpecialties.includes(spec) ? "default" : "outline"}
                    className="h-8 text-xs rounded-full"
                    onClick={() => toggleSpecialty(spec)}
                  >
                    {spec}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Service Areas */}
            <div>
              <p className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                مناطق الخدمة
              </p>
              <div className="flex flex-wrap gap-2">
                {SAUDI_CITIES.map((city) => (
                  <Button
                    key={city}
                    type="button"
                    size="sm"
                    variant={selectedCities.includes(city) ? "default" : "outline"}
                    className="h-8 text-xs rounded-full"
                    onClick={() => toggleCity(city)}
                  >
                    {city}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Working Hours ── */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Clock size={18} /></span>
              <div>
                <CardTitle>أوقات العمل</CardTitle>
                <CardDescription>أوقات تواجدك للعملاء والمواعيد</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="workingDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>أيام العمل</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="الأحد - الخميس">الأحد - الخميس</SelectItem>
                      <SelectItem value="السبت - الأربعاء">السبت - الأربعاء</SelectItem>
                      <SelectItem value="كل الأيام">كل الأيام</SelectItem>
                      <SelectItem value="الأحد - الجمعة">الأحد - الجمعة</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="workingHoursFrom" render={({ field }) => (
                <FormItem>
                  <FormLabel>من الساعة</FormLabel>
                  <FormControl><Input type="time" dir="ltr" className="text-start" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="workingHoursTo" render={({ field }) => (
                <FormItem>
                  <FormLabel>إلى الساعة</FormLabel>
                  <FormControl><Input type="time" dir="ltr" className="text-start" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <Button type="submit" size="lg" disabled={isSaving} className="gap-2">
          <Save size={16} />
          {isSaving ? "جاري الحفظ..." : "حفظ البيانات المهنية"}
        </Button>
      </form>
    </Form>
  );
}
