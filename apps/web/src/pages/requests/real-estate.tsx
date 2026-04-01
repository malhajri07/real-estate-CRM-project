/**
 * real-estate-requests.tsx - Real Estate Request Form Page
 *
 * Location: apps/web/src/ → Pages/ → Public Pages → real-estate-requests.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * Public real estate service request form. Provides:
 * - Real estate request form
 * - Request submission
 *
 * Route: /real-estate-requests
 *
 * Related Files:
 * - apps/api/routes/requests.ts - Requests API routes
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileEdit, Home, ArrowRight, ChevronsUpDown, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PublicHeader from "@/components/layout/PublicHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const PROPERTY_TYPES = [
  "شقة",
  "فيلا",
  "دوبلكس",
  "تاون هاوس",
  "استوديو",
  "بيت",
  "عمارة",
  "مكتب",
  "محل",
  "مستودع",
  "أرض",
];

const CONTRACT_TYPES = [
  { value: "buy", label: "شراء" },
  { value: "rent", label: "إيجار" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
  { value: "other", label: "أخرى" },
];

const HOUSE_DIRECTIONS = [
  { value: "north", label: "شمال" },
  { value: "south", label: "جنوب" },
  { value: "east", label: "شرق" },
  { value: "west", label: "غرب" },
  { value: "corner", label: "زاوية" },
];

/** Format mobile input to +966xxxxxxxxx as user types */
function formatMobileInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("966")) {
    return `+${digits.slice(0, 12)}`;
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    return `+966${digits.slice(1, 10)}`;
  }
  if (digits.length <= 9) {
    return `+966${digits}`;
  }
  return `+966${digits.slice(-9)}`;
}

const realEstateSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  mobileNumber: z.string().min(1, "رقم الجوال مطلوب"),
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("الرجاء إدخال بريد إلكتروني صحيح"),
  nationality: z.string().min(1, "الجنسية مطلوبة"),
  age: z.string().min(1, "العمر مطلوب"),
  monthlyIncome: z.string().min(1, "الدخل الشهري مطلوب"),
  gender: z.string().min(1, "الجنس مطلوب"),
  typeOfProperty: z.string().min(1, "نوع العقار مطلوب"),
  typeOfContract: z.string().min(1, "نوع العقد مطلوب"),
  numberOfRooms: z.string().min(1, "عدد الغرف مطلوب"),
  numberOfBathrooms: z.string().min(1, "عدد دورات المياه مطلوب"),
  numberOfLivingRooms: z.string().min(1, "عدد صالات المعيشة مطلوب"),
  houseDirection: z.string().optional().default(""),
  budgetSize: z.string().min(1, "الميزانية مطلوبة"),
  hasMaidRoom: z.boolean().default(false),
  hasDriverRoom: z.boolean().default(false),
  kitchenInstalled: z.boolean().default(false),
  hasElevator: z.boolean().default(false),
  parkingAvailable: z.boolean().default(false),
  regionId: z.string().optional().default(""),
  cityId: z.string().optional().default(""),
  city: z.string().min(1, "المدينة مطلوبة"),
  district: z.string().optional().default(""),
  region: z.string().optional().default(""),
  sqm: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type RealEstateFormData = z.infer<typeof realEstateSchema>;

const DEFAULT_VALUES: RealEstateFormData = {
  firstName: "",
  lastName: "",
  mobileNumber: "",
  email: "",
  nationality: "",
  age: "",
  monthlyIncome: "",
  gender: "",
  typeOfProperty: "",
  typeOfContract: "",
  numberOfRooms: "",
  numberOfBathrooms: "",
  numberOfLivingRooms: "",
  houseDirection: "",
  budgetSize: "",
  hasMaidRoom: false,
  hasDriverRoom: false,
  kitchenInstalled: false,
  hasElevator: false,
  parkingAvailable: false,
  regionId: "",
  cityId: "",
  city: "",
  district: "",
  region: "",
  sqm: "",
  notes: "",
};

export default function RealEstateRequestsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [seekerId, setSeekerId] = useState<string | null>(null);

  const form = useForm<RealEstateFormData>({
    resolver: zodResolver(realEstateSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  // Ensure back button returns to landing page
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/real-estate-requests') {
      window.history.replaceState({ from: 'landing' }, '', '/');
      window.history.pushState({ from: 'real-estate-requests' }, '', '/real-estate-requests');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.from === 'landing' || window.location.pathname === '/') {
        setLocation('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setLocation]);

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: (RequestInit & { timeout?: number }) = {}
  ) => {
    const { timeout = 15000, ...rest } = init;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(input, { ...rest, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const [regionOpen, setRegionOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

  const watchRegionId = form.watch("regionId");
  const watchCityId = form.watch("cityId");

  const { data: regions } = useQuery<any[]>({
    queryKey: ["/api/locations/regions"],
    queryFn: async () => {
      const res = await fetch("/api/locations/regions");
      if (!res.ok) throw new Error("Failed to fetch regions");
      return res.json();
    },
  });

  const { data: cities } = useQuery<any[]>({
    queryKey: ["/api/locations/cities", watchRegionId],
    queryFn: async () => {
      if (!watchRegionId) return [];
      const res = await fetch(`/api/locations/cities?regionId=${watchRegionId}`);
      if (!res.ok) throw new Error("Failed to fetch cities");
      return res.json();
    },
    enabled: !!watchRegionId,
  });

  const { data: districts } = useQuery<any[]>({
    queryKey: ["/api/locations/districts", watchCityId],
    queryFn: async () => {
      if (!watchCityId) return [];
      const res = await fetch(`/api/locations/districts?cityId=${watchCityId}`);
      if (!res.ok) throw new Error("Failed to fetch districts");
      return res.json();
    },
    enabled: !!watchCityId,
  });

  const onSubmit = async (data: RealEstateFormData) => {
    const age = Number(data.age);
    const monthlyIncome = Number(data.monthlyIncome);
    const numberOfRooms = Number(data.numberOfRooms);
    const numberOfBathrooms = Number(data.numberOfBathrooms);
    const numberOfLivingRooms = Number(data.numberOfLivingRooms);
    const budgetSize = Number(data.budgetSize);

    const optionalText = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };

    const optionalNumber = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed.length) {
        return undefined;
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const numericFields = [
      { label: "العمر", value: age },
      { label: "الدخل الشهري", value: monthlyIncome },
      { label: "عدد الغرف", value: numberOfRooms },
      { label: "عدد دورات المياه", value: numberOfBathrooms },
      { label: "عدد صالات المعيشة", value: numberOfLivingRooms },
      { label: "الميزانية", value: budgetSize },
    ];

    const invalidNumeric = numericFields.find(({ value }) => Number.isNaN(value));
    if (invalidNumeric) {
      toast({
        title: "قيمة غير صالحة",
        description: `يرجى إدخال رقم صحيح في حقل ${invalidNumeric.label}`,
      });
      return;
    }

    const city = data.city.trim();
    const sqmValue = optionalNumber(data.sqm);

    try {
      setLoading(true);
      const response = await fetchWithTimeout("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          mobileNumber: data.mobileNumber.trim(),
          email: data.email.trim(),
          nationality: data.nationality.trim(),
          age,
          monthlyIncome,
          gender: data.gender,
          typeOfProperty: data.typeOfProperty.trim(),
          typeOfContract: data.typeOfContract.trim(),
          numberOfRooms,
          numberOfBathrooms,
          numberOfLivingRooms,
          houseDirection: optionalText(data.houseDirection || ""),
          budgetSize,
          hasMaidRoom: data.hasMaidRoom,
          hasDriverRoom: data.hasDriverRoom,
          kitchenInstalled: data.kitchenInstalled,
          hasElevator: data.hasElevator,
          parkingAvailable: data.parkingAvailable,
          city,
          district: optionalText(data.district || ""),
          region: optionalText(data.region || ""),
          sqm: sqmValue,
          notes: optionalText(data.notes || ""),
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData?.message || "تعذر إنشاء الطلب");
      }

      toast({ title: "تم الإرسال", description: "تم تسجيل طلب الباحث العقاري بنجاح" });
      const extractedSeekerId = responseData?.seekerId || responseData?.id || responseData?.seeker_id || null;
      setSeekerId(extractedSeekerId);
      setSubmitted(true);
      form.reset(DEFAULT_VALUES);
    } catch (error: any) {
      if ((error as Error)?.name === "AbortError") {
        toast({ title: "انتهت المهلة", description: "انتهى وقت الإرسال قبل وصول الرد. حاول مرة أخرى." });
      } else {
        toast({ title: "خطأ", description: (error as Error)?.message || "حدث خطأ غير متوقع" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 font-sans text-foreground overflow-x-hidden" dir={dir}>
        <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
        <PublicHeader />

        <main className="relative pt-32 pb-20 px-4 flex items-center justify-center min-h-[80vh]">
          {/* Background Blobs */}
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="glass rounded-2xl p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-primary to-primary/70" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary"
              >
                <CheckCircle2 className="h-10 w-10" />
              </motion.div>

              <h1 className="text-3xl font-bold text-foreground mb-4">تم استلام طلبك بنجاح</h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg mx-auto">
                شكراً لثقتك بنا. سيقوم أحد الوسطاء المرخصين بالتواصل معك قريباً لمراجعة احتياجاتك وتقديم أفضل الخيارات المتاحة.
              </p>

              {seekerId && (
                <div className="mb-10 inline-block bg-primary/10 border border-primary/20 rounded-2xl px-8 py-4">
                  <p className="text-sm font-semibold text-primary mb-1">رقم الطلب الخاص بك</p>
                  <p className="text-3xl font-bold text-primary font-mono tracking-widest">{seekerId}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/500"
                  onClick={() => setSubmitted(false)}
                >
                  <FileEdit className={cn("me-2", "h-4 w-4")} />
                  تقديم طلب جديد
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-8 border-border hover:bg-muted/30 hover:text-primary hover:border-primary/20"
                  onClick={() => setLocation("/")}
                >
                  <Home className={cn("me-2", "h-4 w-4")} />
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 font-sans text-foreground overflow-x-hidden" dir={dir}>
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <PublicHeader />

      <main className="relative pt-32 pb-20 px-4">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium">
              <Home className="w-4 h-4" />
              <span>استمارة طلب عقار</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              أخبرنا بتفاصيل <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/70">بيت أحلامك</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              أدخل بياناتك وتفضيلاتك، وسيقوم فريقنا الخبير بالبحث عن أفضل الخيارات التي تناسب ميزانيتك واحتياجاتك.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="glass rounded-2xl p-8 md:p-12 shadow-2xl"
              >
                <section className="space-y-8 mb-12">
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">1</span>
                    <h2 className="text-xl font-bold text-foreground">البيانات الشخصية</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">الاسم الأول <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
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
                          <FormLabel className="text-sm font-medium text-foreground/80">اسم العائلة <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">رقم الجوال <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel"
                              className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-end font-mono tracking-wide"
                              dir="ltr"
                              placeholder="+966 5xxxxxxxx"
                              {...field}
                              onChange={(e) => field.onChange(formatMobileInput(e.target.value))}
                            />
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
                          <FormLabel className="text-sm font-medium text-foreground/80">البريد الإلكتروني <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-end" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">الجنسية <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">العمر <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">الدخل الشهري (&#xFDFC;) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">الجنس <span className="text-red-500">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"><SelectValue placeholder="اختر" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GENDER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="space-y-8 mb-12">
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">2</span>
                    <h2 className="text-xl font-bold text-foreground">تفاصيل العقار المطلوب</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="typeOfProperty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">نوع العقار <span className="text-red-500">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"><SelectValue placeholder="اختر نوع العقار" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROPERTY_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="typeOfContract"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">نوع العقد <span className="text-red-500">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"><SelectValue placeholder="شراء أم إيجار؟" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CONTRACT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="numberOfRooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">عدد الغرف <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfBathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">عدد الحمامات <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfLivingRooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">عدد صالات المعيشة <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="houseDirection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">اتجاه المنزل</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"><SelectValue placeholder="غير محدد" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HOUSE_DIRECTIONS.map((direction) => (
                                <SelectItem key={direction.value} value={direction.value}>{direction.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">الميزانية المتاحة (&#xFDFC;) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="space-y-8 mb-12">
                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">3</span>
                    <h2 className="text-xl font-bold text-foreground">الموقع والمواصفات الإضافية</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground/80">المنطقة</Label>
                      <Popover open={regionOpen} onOpenChange={setRegionOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={regionOpen} className={cn("w-full justify-between h-12 rounded-xl", !form.getValues("region") && "text-muted-foreground")}>
                            {form.getValues("region") || "اختر المنطقة"}
                            <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="ابحث عن المنطقة..." />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على المنطقة.</CommandEmpty>
                              <CommandGroup>
                                {(regions || []).map((r: any) => (
                                  <CommandItem
                                    key={r.id}
                                    value={`${r.id} ${r.nameAr || ""} ${r.nameEn || ""}`}
                                    onSelect={() => {
                                      form.setValue("region", r.nameAr || r.nameEn);
                                      form.setValue("regionId", String(r.id));
                                      form.setValue("city", "");
                                      form.setValue("cityId", "");
                                      form.setValue("district", "");
                                      setRegionOpen(false);
                                    }}
                                  >
                                    <Check className={cn("me-2", "h-4 w-4", form.getValues("regionId") === String(r.id) ? "opacity-100" : "opacity-0")} />
                                    {r.nameAr || r.nameEn}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground/80">المدينة <span className="text-red-500">*</span></Label>
                      <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={cityOpen} disabled={!watchRegionId} className={cn("w-full justify-between h-12 rounded-xl", !form.getValues("city") && "text-muted-foreground")}>
                            {form.getValues("city") || "اختر المدينة"}
                            <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="ابحث عن المدينة..." />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على المدينة.</CommandEmpty>
                              <CommandGroup>
                                {(cities || []).map((c: any) => (
                                  <CommandItem
                                    key={c.id}
                                    value={`${c.id} ${c.nameAr || ""} ${c.nameEn || ""}`}
                                    onSelect={() => {
                                      form.setValue("city", c.nameAr || c.nameEn);
                                      form.setValue("cityId", String(c.id));
                                      form.setValue("district", "");
                                      setCityOpen(false);
                                    }}
                                  >
                                    <Check className={cn("me-2", "h-4 w-4", form.getValues("cityId") === String(c.id) ? "opacity-100" : "opacity-0")} />
                                    {c.nameAr || c.nameEn}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground/80">الحي</Label>
                      <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={districtOpen} disabled={!watchCityId} className={cn("w-full justify-between h-12 rounded-xl", !form.getValues("district") && "text-muted-foreground")}>
                            {form.getValues("district") || "اختر الحي"}
                            <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="ابحث عن الحي..." />
                            <CommandList>
                              <CommandEmpty>لم يتم العثور على الحي.</CommandEmpty>
                              <CommandGroup>
                                {(districts || []).map((d: any) => (
                                  <CommandItem
                                    key={d.id}
                                    value={`${d.id} ${d.nameAr || ""} ${d.nameEn || ""}`}
                                    onSelect={() => {
                                      form.setValue("district", d.nameAr || d.nameEn);
                                      setDistrictOpen(false);
                                    }}
                                  >
                                    <Check className={cn("me-2", "h-4 w-4", form.getValues("district") === (d.nameAr || d.nameEn) ? "opacity-100" : "opacity-0")} />
                                    {d.nameAr || d.nameEn}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <FormField
                      control={form.control}
                      name="sqm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/80">المساحة المطلوبة (م&#xB2;)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
                    <FormField
                      control={form.control}
                      name="hasMaidRoom"
                      render={({ field }) => (
                        <FormItem>
                          <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/10 transition-all cursor-pointer">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <span className="text-foreground/80 font-medium">غرفة خادمة</span>
                          </label>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasDriverRoom"
                      render={({ field }) => (
                        <FormItem>
                          <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/10 transition-all cursor-pointer">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <span className="text-foreground/80 font-medium">غرفة سائق</span>
                          </label>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="kitchenInstalled"
                      render={({ field }) => (
                        <FormItem>
                          <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/10 transition-all cursor-pointer">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <span className="text-foreground/80 font-medium">مطبخ مركب</span>
                          </label>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasElevator"
                      render={({ field }) => (
                        <FormItem>
                          <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/10 transition-all cursor-pointer">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <span className="text-foreground/80 font-medium">يوجد مصعد</span>
                          </label>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parkingAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/10 transition-all cursor-pointer">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <span className="text-foreground/80 font-medium">موقف سيارة</span>
                          </label>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground/80">ملاحظات إضافية</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            {...field}
                            className="rounded-2xl bg-card/50 border-border focus:ring-primary/30"
                            placeholder="أي تفاصيل أخرى تود إضافتها..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <div className="flex justify-end pt-6 border-t border-border">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 rounded-full bg-primary/10 px-10 text-lg font-bold text-white shadow-lg shadow-primary/500 hover:bg-primary/10 hover:shadow-primary/500 disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        إرسال الطلب
                        <ArrowRight className={cn("me-2", "h-5 w-5 transform rotate-180")} />
                      </>
                    )}
                  </Button>
                </div>

                {loading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
                    {/* Loader overlay handled by button state mainly, but keep if user wants generic block */}
                  </div>
                )}
              </form>
            </Form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
