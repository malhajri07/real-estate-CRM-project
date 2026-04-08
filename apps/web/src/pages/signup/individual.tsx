/**
 * signup-individual.tsx - Individual Agent Signup Page
 *
 * Location: apps/web/src/ → Pages/ → Public Pages → signup-individual.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * Individual agent signup page. Provides:
 * - Individual agent registration form
 * - KYC document upload
 * - Account creation
 *
 * Route: /signup/individual
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, UserRound, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicHeader from "@/components/layout/PublicHeader";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Step definitions
const STEPS = [
  { id: 1, title: "بيانات الحساب", description: "اسم المستخدم وكلمة المرور" },
  { id: 2, title: "المعلومات الشخصية", description: "الاسم، الجوال، والهوية" },
  { id: 3, title: "رخصة فال (REGA)", description: "بيانات الترخيص من الهيئة العامة للعقار" },
  { id: 4, title: "الشروط والأحكام", description: "الموافقة على السياسات" },
];

const STEP_FIELDS = {
  1: ["username", "password", "confirmPassword"] as const,
  2: ["firstName", "lastName", "mobileNumber", "gender", "city", "saudiId"] as const,
  3: ["certificationNumber", "falLicenseType", "certificationStartDate", "certificationFile", "sreiCertified"] as const,
  4: ["agreedToTerms"] as const,
};

const individualSchema = z.object({
  username: z.string()
    .min(3, "اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل")
    .max(32, "اسم المستخدم لا يتجاوز 32 حرفاً")
    .regex(/^[a-z0-9_.]+$/, "اسم المستخدم يجب أن يحتوي على حروف إنجليزية صغيرة أو أرقام أو (_) أو (.) فقط")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  saudiId: z.string().regex(/^[12]\d{9}$/, "رقم الهوية يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام"),
  mobileNumber: z.string().regex(/^05\d{8}$/, "الرجاء إدخال رقم جوال سعودي صحيح (05xxxxxxxx)"),
  gender: z.string().min(1, "النوع مطلوب"),
  city: z.string().min(1, "المنطقة مطلوبة"),
  certificationNumber: z.string().regex(/^\d{10}$/, "رقم رخصة فال يجب أن يتكون من 10 أرقام"),
  falLicenseType: z.string().min(1, "نوع رخصة فال مطلوب"),
  certificationStartDate: z.string().min(1, "تاريخ إصدار الرخصة مطلوب"),
  certificationFile: z
    .instanceof(FileList)
    .refine((files) => files && files.length > 0, "يجب إرفاق ملف الرخصة"),
  sreiCertified: z.boolean().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "يجب الموافقة على الشروط والأحكام للمتابعة" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "الرجاء التأكد من تطابق كلمتي المرور",
  path: ["confirmPassword"],
});

type IndividualFormData = z.infer<typeof individualSchema>;

export default function SignupIndividual() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const form = useForm<IndividualFormData>({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      saudiId: "",
      mobileNumber: "",
      gender: "",
      city: "",
      certificationNumber: "",
      falLicenseType: "",
      certificationStartDate: "",
      certificationFile: undefined as unknown as FileList,
      sreiCertified: false,
      agreedToTerms: undefined as unknown as true,
    },
    mode: "onTouched",
  });

  // Saudi regions
  const saudiRegions = [
    "الرياض", "مكة المكرمة", "المدينة المنورة", "المنطقة الشرقية", "عسير",
    "تبوك", "القصيم", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف"
  ];

  const handleNumericInput = (value: string, onChange: (val: string) => void) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    onChange(digitsOnly);
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const fields = STEP_FIELDS[currentStep as keyof typeof STEP_FIELDS];
    const result = await form.trigger(fields as any);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = async (stepId: number) => {
    const maxAllowedStep = completedSteps.length + 1;
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (stepId > currentStep) {
      if (stepId <= maxAllowedStep) {
        const isValid = await validateCurrentStep();
        if (isValid) {
          if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
          }
          setCurrentStep(stepId);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }
  };

  const onSubmit = async (data: IndividualFormData) => {
    setIsLoading(true);

    try {
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          email: `${data.username}@aqarkom.sa`,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.mobileNumber,
          roles: JSON.stringify(['INDIV_AGENT']),
          saudiId: data.saudiId,
          falLicenseNumber: data.certificationNumber,
          falLicenseType: data.falLicenseType,
          falIssuedAt: data.certificationStartDate,
          sreiCertified: data.sreiCertified || false,
        })
      });

      const raw = await registerRes.text();
      const responseData = raw ? JSON.parse(raw) : {};
      if (!registerRes.ok || !responseData?.success) {
        throw new Error(responseData?.error || responseData?.message || 'فشل في إنشاء الحساب');
      }

      if (responseData.token && responseData.user) {
        localStorage.setItem('auth_token', responseData.token);
        localStorage.setItem('user_data', JSON.stringify(responseData.user));
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تم تسجيل المستخدم كوكيل مستقل. سيتم متابعة التحقق من البيانات.",
      });

      form.reset();
      setLocation("/signup/success");
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إرسال طلبك، الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans text-foreground overflow-x-hidden">
            <PublicHeader />

      <main className="relative pt-32 pb-20 px-4">
        {/* Background Blobs */}



        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium">
              <UserRound className="w-4 h-4" />
              <span>تسجيل وسيط عقاري مستقل</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              أنشئ حسابك وانضم إلى <span className="text-primary">نخبة الوسطاء</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              خطوات بسيطة تفصلك عن الانضمام لأكبر منصة عقارية في المملكة.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Progress Indicator - Sticky Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 lg:sticky lg:top-32"
            >
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex flex-row lg:flex-col items-start gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                  {STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = currentStep === step.id;
                    const isAccessible = step.id <= completedSteps.length + 1;

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-center gap-3 flex-shrink-0 cursor-pointer transition-all w-full",
                          !isAccessible && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => isAccessible && handleStepClick(step.id)}
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all border-2",
                            isCompleted
                              ? "bg-primary text-primary-foreground border-primary"
                              : isCurrent
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-muted/50 text-muted-foreground border-slate-300"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </div>
                        <div className="hidden md:block">
                          <div
                            className={cn(
                              "text-sm font-bold",
                              isCurrent || isCompleted ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground/70">{step.description}</div>
                        </div>
                        {index < STEPS.length - 1 && (
                          <div className="hidden lg:block absolute end-[23px] top-[48px] h-8 w-0.5 bg-border -z-10" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-9"
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="rounded-xl border bg-card p-8 md:p-12 shadow-md space-y-8"
                >
                  {/* Step 1: Account Credentials */}
                  {currentStep === 1 && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">1</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">بيانات الحساب الأساسية</h2>
                          <p className="text-sm text-muted-foreground">قم بتعيين بيانات الدخول الخاصة بحسابك</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">اسم المستخدم <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">كلمة المرور <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="••••••••"
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-start font-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-sm font-medium text-foreground/80">تأكيد كلمة المرور <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="••••••••"
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-start font-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>
                  )}

                  {/* Step 2: Personal Information */}
                  {currentStep === 2 && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">2</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">المعلومات الشخصية</h2>
                          <p className="text-sm text-muted-foreground">بياناتك الشخصية للتواصل والتحقق</p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem className="mb-6">
                            <FormLabel className="text-sm font-medium text-foreground/80">رقم الجوال <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="05XXXXXXXX"
                                maxLength={10}
                                dir="ltr"
                                className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                onChange={(e) => handleNumericInput(e.target.value, field.onChange)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">الاسم الأول <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                />
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
                              <FormLabel className="text-sm font-medium text-foreground/80">اسم العائلة <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">النوع <span className="text-destructive">*</span></FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30">
                                    <SelectValue placeholder="اختر النوع" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                                  <SelectItem value="male">ذكر</SelectItem>
                                  <SelectItem value="female">أنثى</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">المنطقة <span className="text-destructive">*</span></FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30">
                                    <SelectValue placeholder="اختر المنطقة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                                  {saudiRegions.map((region) => (
                                    <SelectItem key={region} value={region}>{region}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="saudiId"
                        render={({ field }) => (
                          <FormItem className="mt-6">
                            <FormLabel className="text-sm font-medium text-foreground/80">رقم الهوية الوطنية <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="10 أرقام"
                                maxLength={10}
                                dir="ltr"
                                className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                onChange={(e) => handleNumericInput(e.target.value, field.onChange)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>
                  )}

                  {/* Step 3: FAL License (REGA) */}
                  {currentStep === 3 && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">3</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">رخصة فال العقارية</h2>
                          <p className="text-sm text-muted-foreground">بيانات الترخيص من الهيئة العامة للعقار (REGA)</p>
                        </div>
                      </div>

                      {/* REGA compliance notice */}
                      <div className="rounded-xl bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.2)] p-4 text-sm text-[hsl(var(--warning))]">
                        <p className="font-bold mb-1">متطلبات نظام الوساطة العقارية</p>
                        <p>يجب على كل وسيط عقاري الحصول على رخصة فال سارية المفعول من الهيئة العامة للعقار (REGA) لممارسة نشاط الوساطة والتسويق العقاري في المملكة العربية السعودية.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="certificationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">رقم رخصة فال <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="10 أرقام"
                                  maxLength={10}
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                  onChange={(e) => handleNumericInput(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <p className="text-[10px] text-muted-foreground mt-1">رقم الرخصة المكون من 10 أرقام الصادر من الهيئة العامة للعقار</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="falLicenseType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">نوع الرخصة <span className="text-destructive">*</span></FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30">
                                    <SelectValue placeholder="اختر نوع الرخصة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                                  <SelectItem value="BROKERAGE_MARKETING">وساطة وتسويق عقاري</SelectItem>
                                  <SelectItem value="PROPERTY_MANAGEMENT">إدارة أملاك</SelectItem>
                                  <SelectItem value="FACILITY_MANAGEMENT">إدارة مرافق</SelectItem>
                                  <SelectItem value="AUCTION">مزادات عقارية</SelectItem>
                                  <SelectItem value="CONSULTING">استشارات وتحليلات عقارية</SelectItem>
                                  <SelectItem value="ADVERTISING">إعلانات عقارية</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="certificationStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/80">تاريخ إصدار الرخصة <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="certificationFile"
                        render={({ field: { onChange, value, ...fieldRest } }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/80">صورة رخصة فال (PDF) <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Input
                                  {...fieldRest}
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => onChange(e.target.files)}
                                  className="h-14 rounded-xl border-border bg-card/50 text-end focus:ring-primary/30 file:me-10 file:h-full file:rounded-s-none file:rounded-e-xl file:border-0 file:bg-primary/10 file:px-6 file:py-0 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/10 ps-10 cursor-pointer transition-all"
                                />
                                <Upload className="w-5 h-5 text-primary absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </FormControl>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                              يجب رفع صورة واضحة من رخصة فال بصيغة PDF
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sreiCertified"
                        render={({ field }) => (
                          <FormItem>
                            <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={field.onChange}
                                  className="h-5 w-5 mt-0.5"
                                />
                              </FormControl>
                              <div>
                                <span className="text-sm font-medium text-foreground">اجتياز برنامج المعهد العقاري السعودي (SREI)</span>
                                <p className="text-xs text-muted-foreground mt-0.5">أقر بأنني أكملت التدريب المطلوب من المعهد العقاري السعودي بنسبة 60% على الأقل</p>
                              </div>
                            </label>
                          </FormItem>
                        )}
                      />
                    </section>
                  )}

                  {/* Step 4: Terms and Conditions */}
                  {currentStep === 4 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">4</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">الشروط والأحكام</h2>
                          <p className="text-sm text-muted-foreground">موافقتك على سياسات المنصة</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-inner">
                        <div className="space-y-4 text-sm leading-7 text-muted-foreground max-h-60 overflow-y-auto pe-2 custom-scrollbar">
                          <h3 className="text-base font-bold text-foreground mb-2">شروط استخدام منصة عقاراتي للوسطاء العقاريين:</h3>

                          <div className="space-y-4">
                            <div>
                              <strong className="block text-foreground mb-1">1. الأهلية والتسجيل:</strong>
                              <p>يجب أن يكون المتقدم حاصلاً على ترخيص فال عقاري ساري المفعول وأن يكون مؤهلاً لممارسة الوساطة العقارية في المملكة العربية السعودية وفقاً للأنظمة المعمول بها.</p>
                            </div>

                            <div>
                              <strong className="block text-foreground mb-1">2. صحة البيانات والمعلومات:</strong>
                              <p>يتعهد المستخدم بتقديم معلومات صحيحة ودقيقة عن هويته الشخصية وترخيصه المهني، وتحديث هذه المعلومات عند الحاجة. أي معلومات مضللة قد تؤدي إلى إلغاء الحساب نهائياً.</p>
                            </div>

                            <div>
                              <strong className="block text-foreground mb-1">3. استخدام النظام:</strong>
                              <ul className="list-disc list-inside space-y-1 marker:text-primary">
                                <li>الالتزام بأخلاقيات المهنة وقواعد السلوك المهني</li>
                                <li>عدم استخدام النظام لأغراض غير مشروعة</li>
                                <li>الحفاظ على سرية بيانات العملاء</li>
                                <li>عدم نشر إعلانات مضللة للعقارات</li>
                              </ul>
                            </div>

                            <div>
                              <strong className="block text-foreground mb-1">4. الترخيص المهني:</strong>
                              <p>يجب المحافظة على سريان ترخيص فال العقاري وإشعار المنصة بأي تغيير في حالة الترخيص فوراً.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="agreedToTerms"
                        render={({ field }) => (
                          <FormItem>
                            <label className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/10 transition-all cursor-pointer group">
                              <div className="relative flex items-center mt-1">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value === true}
                                    onCheckedChange={field.onChange}
                                    className="h-5 w-5"
                                  />
                                </FormControl>
                              </div>
                              <span className="text-sm font-medium text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors">
                                أوافق على جميع الشروط والأحكام المذكورة أعلاه وأقر بأنني قد قرأتها وفهمتها بالكامل. كما أتعهد بالالتزام بأخلاقيات المهنة وقواعد السلوك للوسطاء العقاريين وأؤكد صحة جميع البيانات المقدمة.
                              </span>
                            </label>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="h-12 rounded-2xl border-border px-8 text-muted-foreground transition-colors hover:bg-muted/50"
                    >
                      <ChevronRight className={cn("me-2", "h-4 w-4")} />
                      السابق
                    </Button>

                    {currentStep < STEPS.length ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="h-12 rounded-2xl bg-primary/10 px-8 text-white hover:bg-primary/10"
                      >
                        التالي
                        <ChevronLeft className={cn(dir === "rtl" ? "me-2" : "ms-2", "h-4 w-4")} />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isLoading || form.watch("agreedToTerms") !== true}
                        className="h-12 rounded-2xl bg-primary/10 px-8 text-white shadow-lg shadow-primary/20 hover:bg-primary/10 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            جاري الإنشاء...
                          </>
                        ) : (
                          "إنشاء الحساب"
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
