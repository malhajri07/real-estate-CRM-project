/**
 * post-listing.tsx — Post Property Listing (REGA-compliant 4-step wizard)
 *
 * Collects all 15 REGA-mandated fields for property advertisements plus
 * Saudi-specific regulatory data (FAL license, deed number, National Address).
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { PostListingSkeleton } from "@/components/skeletons/page-skeletons";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/ui/page-header";
import { apiPost } from "@/lib/apiClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, MapPin, Banknote, Bed, Bath, Maximize, ChevronDown,
  ImagePlus, CheckCircle2, ArrowRight, ArrowLeft, Home, Tag,
  Sofa, Layers, FileText, ShieldCheck, Car, ArrowUp, Armchair,
  Zap, Droplets, Flame, Wifi, Phone,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة" },
  { value: "villa", label: "فيلا" },
  { value: "duplex", label: "دوبلكس" },
  { value: "land", label: "أرض" },
  { value: "commercial", label: "تجاري" },
  { value: "office", label: "مكتب" },
  { value: "warehouse", label: "مستودع" },
  { value: "building", label: "عمارة" },
  { value: "chalet", label: "شاليه" },
  { value: "farm", label: "مزرعة" },
];

const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
];

const CATEGORIES = [
  { value: "residential", label: "سكني" },
  { value: "commercial", label: "تجاري" },
  { value: "industrial", label: "صناعي" },
  { value: "agricultural", label: "زراعي" },
  { value: "mixed_use", label: "متعدد الاستخدام" },
];

const FACADE_DIRECTIONS = [
  { value: "NORTH", label: "شمال" },
  { value: "SOUTH", label: "جنوب" },
  { value: "EAST", label: "شرق" },
  { value: "WEST", label: "غرب" },
  { value: "NORTH_EAST", label: "شمال شرق" },
  { value: "NORTH_WEST", label: "شمال غرب" },
  { value: "SOUTH_EAST", label: "جنوب شرق" },
  { value: "SOUTH_WEST", label: "جنوب غرب" },
  { value: "THREE_STREETS", label: "ثلاث شوارع" },
  { value: "FOUR_STREETS", label: "أربع شوارع" },
];

const LEGAL_STATUSES = [
  { value: "FREE", label: "صك حر" },
  { value: "MORTGAGED", label: "مرهون" },
  { value: "UNDER_DISPUTE", label: "تحت النزاع" },
  { value: "ENDOWMENT", label: "وقف" },
];

const FURNISHED_OPTIONS = [
  { value: "furnished", label: "مفروش" },
  { value: "semi_furnished", label: "مفروش جزئياً" },
  { value: "unfurnished", label: "بدون أثاث" },
];

const RENTAL_PERIODS = [
  { value: "monthly", label: "شهري" },
  { value: "quarterly", label: "ربع سنوي" },
  { value: "semi_annual", label: "نصف سنوي" },
  { value: "annual", label: "سنوي" },
];

const SERVICES = [
  { key: "electricity", label: "كهرباء", icon: Zap },
  { key: "water", label: "مياه", icon: Droplets },
  { key: "sewage", label: "صرف صحي", icon: Droplets },
  { key: "gas", label: "غاز", icon: Flame },
  { key: "fiber", label: "ألياف بصرية", icon: Wifi },
];

const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الظهران", "تبوك", "الطائف", "بريدة", "خميس مشيط",
  "حائل", "نجران", "جازان", "ينبع", "أبها", "الجبيل", "الأحساء",
  "القطيف", "عنيزة", "سكاكا", "الباحة", "عرعر",
];

// ── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  // Step 1: Basic Info
  title: z.string().min(3, "العنوان مطلوب (3 أحرف على الأقل)"),
  description: z.string().min(10, "الوصف مطلوب (10 أحرف على الأقل)"),
  propertyType: z.string().min(1, "نوع العقار مطلوب"),
  listingType: z.string().min(1, "نوع الإعلان مطلوب"),
  propertyCategory: z.string().min(1, "التصنيف مطلوب"),
  // Step 2: Location
  city: z.string().min(1, "المدينة مطلوبة"),
  district: z.string().min(1, "الحي مطلوب"),
  street: z.string().optional(),
  address: z.string().optional(),
  nationalAddressBuildingNo: z.string().regex(/^\d{4}$/, "رقم المبنى 4 أرقام").optional().or(z.literal("")),
  nationalAddressPostalCode: z.string().regex(/^\d{5}$/, "الرمز البريدي 5 أرقام").optional().or(z.literal("")),
  nationalAddressAdditionalNo: z.string().regex(/^\d{4}$/, "الرقم الإضافي 4 أرقام").optional().or(z.literal("")),
  // Step 3: Specs & Features
  price: z.string().min(1, "السعر مطلوب"),
  area: z.string().min(1, "المساحة مطلوبة"),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  livingRooms: z.string().optional(),
  floorNumber: z.string().optional(),
  totalFloors: z.string().optional(),
  buildingAge: z.string().optional(),
  facadeDirection: z.string().optional(),
  furnished: z.string().optional(),
  rentalPeriod: z.string().optional(),
  hasParking: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  services: z.array(z.string()).optional(),
  // Step 4: Regulatory (REGA)
  regaAdLicenseNumber: z.string().min(1, "رقم ترخيص الإعلان مطلوب"),
  deedNumber: z.string().optional(),
  legalStatus: z.string().optional(),
  contactNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, title: "معلومات العقار", icon: Building2 },
  { id: 2, title: "الموقع والعنوان", icon: MapPin },
  { id: 3, title: "المواصفات والسعر", icon: Layers },
  { id: 4, title: "التنظيمية (REGA)", icon: ShieldCheck },
];

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ["title", "description", "propertyType", "listingType", "propertyCategory"],
  2: ["city", "district"],
  3: ["price", "area"],
  4: ["regaAdLicenseNumber"],
};

// ── Component ───────────────────────────────────────────────────────────────

export default function PostListingPage() {
  const showSkeleton = useMinLoadTime();
  const { dir } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", description: "", propertyType: "apartment", listingType: "sale",
      propertyCategory: "residential", city: "", district: "", street: "", address: "",
      nationalAddressBuildingNo: "", nationalAddressPostalCode: "", nationalAddressAdditionalNo: "",
      price: "", area: "", bedrooms: "", bathrooms: "", livingRooms: "",
      floorNumber: "", totalFloors: "", buildingAge: "", facadeDirection: "",
      furnished: "", rentalPeriod: "", hasParking: false, hasElevator: false,
      services: [],
      regaAdLicenseNumber: "", deedNumber: "", legalStatus: "", contactNumber: "",
    },
  });

  const progress = (step / STEPS.length) * 100;
  const isRent = form.watch("listingType") === "rent";
  const isLand = form.watch("propertyType") === "land" || form.watch("propertyType") === "farm";
  const priceVal = Number(form.watch("price")) || 0;
  const areaVal = Number(form.watch("area")) || 0;
  const pricePerSqm = areaVal > 0 ? Math.round(priceVal / areaVal) : 0;

  const nextStep = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields);
    if (valid) setStep(s => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await apiPost("/api/listings", {
        ...data,
        price: Number(data.price) || 0,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
        livingRooms: data.livingRooms ? Number(data.livingRooms) : undefined,
        squareFeet: data.area ? Number(data.area) : undefined,
        buildingAge: data.buildingAge ? Number(data.buildingAge) : undefined,
        floorNumber: data.floorNumber ? Number(data.floorNumber) : undefined,
        totalFloors: data.totalFloors ? Number(data.totalFloors) : undefined,
        availableServices: (data.services || []).join(","),
        status: "draft",
      });
      setSuccess(true);
      toast({ title: "تم بنجاح", description: "تم إرسال الإعلان للمراجعة" });
    } catch {
      toast({ title: "خطأ", description: "تعذر إرسال الإعلان", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={PAGE_WRAPPER}>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground mb-2">تم إرسال الإعلان بنجاح</h2>
            <p className="text-muted-foreground">سيتم مراجعة إعلانك من قبل فريق الإدارة وإشعارك عند الموافقة</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setSuccess(false); form.reset(); setStep(1); }}>إضافة إعلان آخر</Button>
            <Button onClick={() => setLocation("/home/platform/properties")}>عرض العقارات</Button>
          </div>
        </div>
      </div>
    );
  }

  if (showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="إضافة إعلان عقاري" subtitle="أنشئ إعلان عقاري متوافق مع متطلبات الهيئة العامة للعقار (REGA)" />
        <PostListingSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="إضافة إعلان عقاري" subtitle="أنشئ إعلان عقاري متوافق مع متطلبات الهيئة العامة للعقار (REGA)" />

      {/* Step Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors ${
                  isDone ? "bg-primary border-primary text-primary-foreground" :
                  isActive ? "border-primary text-primary bg-primary/10" :
                  "border-border text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-sm font-bold hidden sm:inline ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
                {s.id < STEPS.length && <Separator className="w-6 sm:w-12 mx-1" />}
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>

          {/* ═══════════ Step 1: Basic Info ═══════════ */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle>معلومات العقار الأساسية</CardTitle>
                    <CardDescription>عنوان ووصف ونوع العقار</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الإعلان *</FormLabel>
                    <FormControl><Input {...field} placeholder="مثال: شقة فاخرة 3 غرف في حي الياسمين — الرياض" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف العقار *</FormLabel>
                    <FormControl><Textarea {...field} placeholder="اكتب وصفاً تفصيلياً يشمل المميزات والتشطيبات والموقع..." rows={4} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="propertyType" render={() => (
                    <FormItem>
                      <FormLabel>نوع العقار *</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                            <span className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" />{PROPERTY_TYPES.find(t => t.value === form.watch("propertyType"))?.label || "اختر"}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {PROPERTY_TYPES.map(t => (<DropdownMenuItem key={t.value} onClick={() => form.setValue("propertyType", t.value, { shouldValidate: true })}>{t.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="listingType" render={() => (
                    <FormItem>
                      <FormLabel>الغرض من الإعلان *</FormLabel>
                      <div className="flex gap-2">
                        {LISTING_TYPES.map(lt => (
                          <Button key={lt.value} type="button" variant={form.watch("listingType") === lt.value ? "default" : "outline"} className="flex-1" onClick={() => form.setValue("listingType", lt.value, { shouldValidate: true })}>
                            {lt.label}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="propertyCategory" render={() => (
                    <FormItem>
                      <FormLabel>التصنيف *</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                            <span className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" />{CATEGORIES.find(c => c.value === form.watch("propertyCategory"))?.label || "اختر"}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {CATEGORIES.map(c => (<DropdownMenuItem key={c.value} onClick={() => form.setValue("propertyCategory", c.value, { shouldValidate: true })}>{c.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════════ Step 2: Location & National Address ═══════════ */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle>الموقع والعنوان الوطني</CardTitle>
                    <CardDescription>حدد موقع العقار بدقة حسب نظام العنوان الوطني السعودي</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={() => (
                    <FormItem>
                      <FormLabel>المدينة *</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                            {form.watch("city") || "اختر المدينة"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                          {SAUDI_CITIES.map(c => (<DropdownMenuItem key={c} onClick={() => form.setValue("city", c, { shouldValidate: true })}>{c}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="district" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحي *</FormLabel>
                      <FormControl><Input {...field} placeholder="مثال: الياسمين" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="street" render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشارع</FormLabel>
                    <FormControl><Input {...field} placeholder="مثال: شارع الأمير سلطان" /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان التفصيلي</FormLabel>
                    <FormControl><Input {...field} placeholder="وصف إضافي للموقع أو معالم قريبة" /></FormControl>
                  </FormItem>
                )} />

                {/* National Address */}
                <Separator />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">العنوان الوطني (Saudi Post)</p>
                  <p className="text-xs text-muted-foreground mb-4">بيانات العنوان الوطني تساعد في تحديد الموقع بدقة متر واحد</p>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="nationalAddressBuildingNo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم المبنى</FormLabel>
                        <FormControl><Input {...field} placeholder="1234" maxLength={4} dir="ltr" className="text-center tabular-nums" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nationalAddressPostalCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرمز البريدي</FormLabel>
                        <FormControl><Input {...field} placeholder="12345" maxLength={5} dir="ltr" className="text-center tabular-nums" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nationalAddressAdditionalNo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرقم الإضافي</FormLabel>
                        <FormControl><Input {...field} placeholder="6789" maxLength={4} dir="ltr" className="text-center tabular-nums" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 h-40 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold">خريطة الموقع (قريباً)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════════ Step 3: Specs, Features & Price ═══════════ */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Layers className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle>المواصفات والسعر</CardTitle>
                    <CardDescription>تفاصيل العقار والمميزات والتسعير</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price & Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRent ? "الإيجار" : "السعر"} *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} type="number" placeholder="0" className="pe-16 text-lg font-bold" />
                          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold"></span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المساحة (م²) *</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Auto-calculated price/sqm */}
                {pricePerSqm > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-4 py-2">
                    <Banknote className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">سعر المتر المربع:</span>
                    <span className="font-bold text-primary">{pricePerSqm.toLocaleString("en-US")} م²</span>
                  </div>
                )}

                {/* Rental period (only for rent) */}
                {isRent && (
                  <FormField control={form.control} name="rentalPeriod" render={() => (
                    <FormItem>
                      <FormLabel>فترة الإيجار</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {RENTAL_PERIODS.map(rp => (
                          <Button key={rp.value} type="button" size="sm" variant={form.watch("rentalPeriod") === rp.value ? "default" : "outline"} onClick={() => form.setValue("rentalPeriod", rp.value)}>
                            {rp.label}
                          </Button>
                        ))}
                      </div>
                    </FormItem>
                  )} />
                )}

                <Separator />

                {/* Room counts (hidden for land) */}
                {!isLand && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <FormField control={form.control} name="bedrooms" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> غرف النوم</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bathrooms" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> الحمامات</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="livingRooms" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Sofa className="h-3.5 w-3.5" /> الصالات</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="floorNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><ArrowUp className="h-3.5 w-3.5" /> الطابق</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="totalFloors" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> عدد الأدوار</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* Building details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="facadeDirection" render={() => (
                    <FormItem>
                      <FormLabel>واجهة العقار</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                            {FACADE_DIRECTIONS.find(d => d.value === form.watch("facadeDirection"))?.label || "اختر الواجهة"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {FACADE_DIRECTIONS.map(d => (<DropdownMenuItem key={d.value} onClick={() => form.setValue("facadeDirection", d.value)}>{d.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormItem>
                  )} />
                  {!isLand && (
                    <>
                      <FormField control={form.control} name="buildingAge" render={({ field }) => (
                        <FormItem>
                          <FormLabel>عمر المبنى (سنوات)</FormLabel>
                          <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="furnished" render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><Armchair className="h-3.5 w-3.5" /> التأثيث</FormLabel>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                                {FURNISHED_OPTIONS.find(f => f.value === form.watch("furnished"))?.label || "اختر"}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {FURNISHED_OPTIONS.map(f => (<DropdownMenuItem key={f.value} onClick={() => form.setValue("furnished", f.value)}>{f.label}</DropdownMenuItem>))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </FormItem>
                      )} />
                    </>
                  )}
                </div>

                {/* Feature toggles */}
                {!isLand && (
                  <div className="flex flex-wrap gap-4">
                    <FormField control={form.control} name="hasParking" render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">مواقف سيارات</span>
                      </label>
                    )} />
                    <FormField control={form.control} name="hasElevator" render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        <ArrowUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">مصعد</span>
                      </label>
                    )} />
                  </div>
                )}

                <Separator />

                {/* Available Services — checkboxes */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">الخدمات المتوفرة</p>
                  <div className="flex flex-wrap gap-4">
                    {SERVICES.map(svc => {
                      const SvcIcon = svc.icon;
                      const currentServices = form.watch("services") || [];
                      const isChecked = currentServices.includes(svc.key);
                      return (
                        <label key={svc.key} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...currentServices, svc.key]
                                : currentServices.filter(s => s !== svc.key);
                              form.setValue("services", updated);
                            }}
                          />
                          <SvcIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{svc.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Image upload */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">صور العقار</p>
                  <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer">
                    <ImagePlus className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm font-bold">اسحب الصور هنا أو انقر للرفع</p>
                    <p className="text-xs mt-1">PNG, JPG حتى 10 ميجابايت لكل صورة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════════ Step 4: REGA Regulatory ═══════════ */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle>المتطلبات التنظيمية</CardTitle>
                    <CardDescription>بيانات مطلوبة حسب نظام الهيئة العامة للعقار (REGA)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* REGA notice */}
                <div className="rounded-xl bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.2)] p-4 text-sm text-[hsl(var(--warning))]">
                  <p className="font-bold mb-1">متطلبات ترخيص الإعلان العقاري</p>
                  <p className="text-xs leading-relaxed">حسب المادة 3 من نظام الوساطة العقارية، يجب أن يتضمن كل إعلان عقاري: رقم رخصة فال، رقم ترخيص الإعلان، اسم المعلن، ورقم التواصل. غرامة المخالفة: 2,000 لكل إعلان.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="regaAdLicenseNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> رقم ترخيص الإعلان العقاري *</FormLabel>
                      <FormControl><Input {...field} placeholder="رقم الترخيص الصادر من REGA (50 SAR)" /></FormControl>
                      <p className="text-[10px] text-muted-foreground">يصدر من بوابة الخدمات الإلكترونية للهيئة العامة للعقار</p>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> رقم التواصل</FormLabel>
                      <FormControl><Input {...field} type="tel" dir="ltr" placeholder="05XXXXXXXX" className="text-end" /></FormControl>
                      <p className="text-[10px] text-muted-foreground">سيظهر في الإعلان كرقم تواصل المعلن</p>
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="deedNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> رقم الصك</FormLabel>
                      <FormControl><Input {...field} placeholder="رقم صك الملكية" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="legalStatus" render={() => (
                    <FormItem>
                      <FormLabel>الحالة القانونية للعقار</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                            {LEGAL_STATUSES.find(s => s.value === form.watch("legalStatus"))?.label || "اختر الحالة"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {LEGAL_STATUSES.map(s => (<DropdownMenuItem key={s.value} onClick={() => form.setValue("legalStatus", s.value)}>{s.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormItem>
                  )} />
                </div>

                <Separator />

                {/* Listing Summary */}
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="pt-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">ملخص الإعلان</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                      <div className="text-muted-foreground">العنوان:</div>
                      <div className="font-bold">{form.watch("title") || "—"}</div>
                      <div className="text-muted-foreground">النوع:</div>
                      <div className="flex gap-1">
                        <Badge variant="secondary">{PROPERTY_TYPES.find(t => t.value === form.watch("propertyType"))?.label}</Badge>
                        <Badge variant="outline">{LISTING_TYPES.find(t => t.value === form.watch("listingType"))?.label}</Badge>
                      </div>
                      <div className="text-muted-foreground">الموقع:</div>
                      <div className="font-bold">{[form.watch("city"), form.watch("district")].filter(Boolean).join(" · ") || "—"}</div>
                      <div className="text-muted-foreground">المساحة:</div>
                      <div className="font-bold">{form.watch("area") ? `${Number(form.watch("area")).toLocaleString("en-US")} م²` : "—"}</div>
                      <div className="text-muted-foreground">السعر:</div>
                      <div className="font-bold text-primary">{priceVal ? `${priceVal.toLocaleString("en-US")}` : "—"}</div>
                      {pricePerSqm > 0 && (
                        <>
                          <div className="text-muted-foreground">سعر المتر:</div>
                          <div className="font-bold">{pricePerSqm.toLocaleString("en-US")} م²</div>
                        </>
                      )}
                      <div className="text-muted-foreground">ترخيص الإعلان:</div>
                      <div className="font-bold">{form.watch("regaAdLicenseNumber") || <span className="text-destructive">مطلوب</span>}</div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1} className="gap-2">
              <ArrowRight className="h-4 w-4" /> السابق
            </Button>
            <div className="text-sm text-muted-foreground font-bold">الخطوة {step} من {STEPS.length}</div>
            {step < STEPS.length ? (
              <Button type="button" onClick={nextStep} className="gap-2">التالي <ArrowLeft className="h-4 w-4" /></Button>
            ) : (
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? "جاري الإرسال..." : "إرسال للمراجعة"}
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
