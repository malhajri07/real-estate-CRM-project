/**
 * signup-corporate.tsx - Corporate Signup Page
 *
 * Location: apps/web/src/ → Pages/ → Public Pages → signup-corporate.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * Corporate signup page. Provides:
 * - Corporate account registration form
 * - Company information input
 * - Account creation
 *
 * Route: /signup/corporate
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Building2, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
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
  { id: 1, title: "بيانات الحساب", description: "مدير الحساب" },
  { id: 2, title: "بيانات الشركة", description: "السجل التجاري والنشاط" },
  { id: 3, title: "مسؤول الاتصال", description: "بيانات التواصل" },
  { id: 4, title: "المستندات", description: "رفع الوثائق الرسمية" },
  { id: 5, title: "الشروط والأحكام", description: "سياسات المنصة" },
];

const STEP_FIELDS = {
  1: ["username", "password", "confirmPassword"] as const,
  2: ["companyName", "companyType", "commercialRegistration", "companyCity", "taxNumber", "establishmentDate", "employeesCount", "companyAddress", "companyWebsite", "companyDescription"] as const,
  3: ["contactName", "contactPosition", "contactEmail", "contactPhone"] as const,
  4: ["commercialRegDoc", "vatCertificate", "companyProfile"] as const,
  5: ["agreedToTerms"] as const,
};

const corporateSchema = z.object({
  // Step 1 - Account
  username: z.string()
    .min(3, "اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل")
    .max(32, "اسم المستخدم لا يتجاوز 32 حرفاً")
    .regex(/^[a-z0-9_.]+$/, "اسم المستخدم يجب أن يحتوي على حروف إنجليزية صغيرة أو أرقام أو (_) أو (.) فقط")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  // Step 2 - Company
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  companyType: z.string().min(1, "نوع الشركة مطلوب"),
  commercialRegistration: z.string().min(1, "رقم السجل التجاري مطلوب"),
  taxNumber: z.string().optional().default(""),
  companyAddress: z.string().optional().default(""),
  companyCity: z.string().min(1, "المدينة الرئيسية مطلوبة"),
  companyWebsite: z.string().optional().default(""),
  companyDescription: z.string().optional().default(""),
  establishmentDate: z.string().optional().default(""),
  employeesCount: z.string().optional().default(""),
  // Step 3 - Contact
  contactName: z.string().min(1, "الاسم الكامل مطلوب"),
  contactPosition: z.string().optional().default(""),
  contactEmail: z.string().min(1, "البريد الإلكتروني مطلوب").email("الرجاء إدخال بريد إلكتروني صحيح"),
  contactPhone: z.string().regex(/^05\d{8}$/, "الرجاء إدخال رقم جوال سعودي صحيح (05xxxxxxxx)"),
  // Step 4 - Documents (optional)
  commercialRegDoc: z.instanceof(FileList).optional().nullable(),
  vatCertificate: z.instanceof(FileList).optional().nullable(),
  companyProfile: z.instanceof(FileList).optional().nullable(),
  // Step 5 - Terms
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "يجب الموافقة على الشروط والأحكام للمتابعة" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "الرجاء التأكد من تطابق كلمتي المرور",
  path: ["confirmPassword"],
});

type CorporateFormData = z.infer<typeof corporateSchema>;

export default function SignupCorporate() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const form = useForm<CorporateFormData>({
    resolver: zodResolver(corporateSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      companyType: "",
      commercialRegistration: "",
      taxNumber: "",
      companyAddress: "",
      companyCity: "",
      companyWebsite: "",
      companyDescription: "",
      establishmentDate: "",
      employeesCount: "",
      contactName: "",
      contactPosition: "",
      contactEmail: "",
      contactPhone: "",
      commercialRegDoc: null,
      vatCertificate: null,
      companyProfile: null,
      agreedToTerms: undefined as unknown as true,
    },
    mode: "onTouched",
  });

  const saudiRegions = [
    "الرياض", "مكة المكرمة", "المدينة المنورة", "المنطقة الشرقية", "عسير",
    "تبوك", "القصيم", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف",
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

  const onSubmit = async (data: CorporateFormData) => {
    setIsLoading(true);

    try {
      const nameParts = data.contactName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || "مدير";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "الحساب";

      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          email: data.contactEmail,
          password: data.password,
          firstName,
          lastName,
          phone: data.contactPhone,
          roles: JSON.stringify(['CORP_OWNER'])
        })
      });

      const raw = await registerRes.text();
      const responseData = raw ? JSON.parse(raw) : {};
      if (!registerRes.ok || !responseData?.success) {
        const apiMessage = responseData?.errors?.[0]?.message || responseData?.error || responseData?.message;
        throw new Error(apiMessage || 'فشل في إنشاء الحساب');
      }

      if (responseData.token && responseData.user) {
        localStorage.setItem('auth_token', responseData.token);
        localStorage.setItem('user_data', JSON.stringify(responseData.user));
      }

      toast({
        title: "تم إنشاء حساب المالك بنجاح",
        description: "تم تسجيل المستخدم كمالك شركة. سيتم متابعة التحقق من بيانات الشركة.",
      });

      form.reset();
      setLocation("/signup/kyc-submitted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ أثناء إرسال طلبك، الرجاء المحاولة مرة أخرى";
      toast({
        title: "خطأ في إرسال الطلب",
        description: message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans text-foreground overflow-x-hidden" dir={dir}>
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <PublicHeader />

      <main className="relative pt-32 pb-20 px-4">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium">
              <Building2 className="w-4 h-4" />
              <span>تسجيل منشأة عقارية</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              ابدأ رحلة النجاح مع <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600">حساب مؤسسي</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              خطوات بسيطة لتسجيل منشأتك والبدء في إدارة أعمالك العقارية باحترافية.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 lg:sticky lg:top-32"
            >
              <div className="glass rounded-2xl p-6 shadow-xl">
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
                            "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all border-2",
                            isCompleted
                              ? "bg-blue-600 text-white border-blue-600"
                              : isCurrent
                                ? "bg-blue-100 text-blue-600 border-blue-300"
                                : "bg-muted/50 text-muted-foreground border-slate-300"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </div>
                        <div className="hidden md:block text-start">
                          <div
                            className={cn(
                              "text-sm font-semibold",
                              isCurrent || isCompleted ? "text-blue-600" : "text-muted-foreground"
                            )}
                          >
                            {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground/70">{step.description}</div>
                        </div>
                        {index < STEPS.length - 1 && (
                          <div className="hidden lg:block absolute end-[23px] top-[48px] h-8 w-0.5 bg-slate-200 -z-10" />
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
                  className="glass rounded-2xl p-8 md:p-12 shadow-2xl space-y-8"
                >
                  {/* Step 1: Account Credentials */}
                  {currentStep === 1 && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">بيانات الحساب الأساسية</h2>
                          <p className="text-sm text-muted-foreground">قم بتعيين بيانات الدخول الخاصة بمدير الحساب</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">اسم المستخدم <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-start"
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
                              <FormLabel className="text-sm font-medium text-foreground/80">كلمة المرور <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  dir="ltr"
                                  placeholder="••••••••"
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
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">تأكيد كلمة المرور <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  dir="ltr"
                                  placeholder="••••••••"
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

                  {/* Step 2: Company Information */}
                  {currentStep === 2 && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">معلومات الشركة</h2>
                          <p className="text-sm text-muted-foreground">بيانات السجل التجاري والنشاط</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">اسم الشركة <span className="text-red-500">*</span></FormLabel>
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
                          name="companyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">نوع الشركة <span className="text-red-500">*</span></FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-start">
                                    <SelectValue placeholder="اختر نوع الشركة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                                  <SelectItem value="llc">شركة ذات مسؤولية محدودة</SelectItem>
                                  <SelectItem value="corporation">شركة مساهمة</SelectItem>
                                  <SelectItem value="partnership">شركة تضامن</SelectItem>
                                  <SelectItem value="sole-proprietorship">مؤسسة فردية</SelectItem>
                                  <SelectItem value="other">أخرى</SelectItem>
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
                          name="commercialRegistration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">رقم السجل التجاري <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="10 أرقام"
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-end"
                                  onChange={(e) => handleNumericInput(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="taxNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">الرقم الضريبي</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-end"
                                  onChange={(e) => handleNumericInput(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="establishmentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">تاريخ التأسيس</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="date"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-end"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="employeesCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">عدد الموظفين التقريبي</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                  onChange={(e) => handleNumericInput(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="companyCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">المدينة الرئيسية <span className="text-red-500">*</span></FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-start">
                                    <SelectValue placeholder="اختر المدينة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                                  {saudiRegions.map((region) => (
                                    <SelectItem key={region} value={region}>
                                      {region}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="companyAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">العنوان الكامل</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="المدينة، الحي، الشارع"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="companyWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">الموقع الإلكتروني</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="url"
                                  dir="ltr"
                                  placeholder="https://company.sa"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-start"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="companyDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/80">نبذة عن الشركة</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="صف مجالات عمل الشركة والخدمات التي تقدمها..."
                                className="min-h-[120px] rounded-2xl bg-card/50 border-border focus:ring-primary/30"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>
                  )}

                  {/* Step 3: Contact Person */}
                  {currentStep === 3 && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">مسؤول الاتصال</h2>
                          <p className="text-sm text-muted-foreground">بيانات المفوض بالتواصل</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">الاسم الكامل <span className="text-red-500">*</span></FormLabel>
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
                          name="contactPosition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">المسمى الوظيفي</FormLabel>
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

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">البريد الإلكتروني <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-start"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">رقم الجوال <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="05XXXXXXXX"
                                  maxLength={10}
                                  dir="ltr"
                                  className="h-12 rounded-xl bg-card/50 border-border focus:ring-primary/30 text-end"
                                  onChange={(e) => handleNumericInput(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>
                  )}

                  {/* Step 4: Documents */}
                  {currentStep === 4 && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">4</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">المستندات المساندة</h2>
                          <p className="text-sm text-muted-foreground">رفع الوثائق الرسمية (اختياري)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="commercialRegDoc"
                          render={({ field: { onChange, value, ...fieldRest } }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">صورة السجل التجاري</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Input
                                    {...fieldRest}
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => onChange(e.target.files)}
                                    className="h-12 rounded-xl border-border bg-card/50 text-end file:ms-3 file:h-full file:rounded-s-none file:rounded-e-xl file:border-0 file:bg-blue-50 file:px-4 file:py-0 file:text-blue-700 file:font-medium hover:file:bg-blue-100 focus:ring-primary/30 cursor-pointer ps-10 transition-all"
                                  />
                                  <Upload className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-hover:text-blue-600 transition-colors pointer-events-none" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vatCertificate"
                          render={({ field: { onChange, value, ...fieldRest } }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">شهادة الضريبة</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Input
                                    {...fieldRest}
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => onChange(e.target.files)}
                                    className="h-12 rounded-xl border-border bg-card/50 text-end file:ms-3 file:h-full file:rounded-s-none file:rounded-e-xl file:border-0 file:bg-blue-50 file:px-4 file:py-0 file:text-blue-700 file:font-medium hover:file:bg-blue-100 focus:ring-primary/30 cursor-pointer ps-10 transition-all"
                                  />
                                  <Upload className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-hover:text-blue-600 transition-colors pointer-events-none" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="companyProfile"
                          render={({ field: { onChange, value, ...fieldRest } }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground/80">ملف تعريف الشركة</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Input
                                    {...fieldRest}
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => onChange(e.target.files)}
                                    className="h-12 rounded-xl border-border bg-card/50 text-end file:ms-3 file:h-full file:rounded-s-none file:rounded-e-xl file:border-0 file:bg-blue-50 file:px-4 file:py-0 file:text-blue-700 file:font-medium hover:file:bg-blue-100 focus:ring-primary/30 cursor-pointer ps-10 transition-all"
                                  />
                                  <Upload className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-hover:text-blue-600 transition-colors pointer-events-none" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        جميع الملفات يجب أن تكون بصيغة PDF وبحجم لا يتجاوز 5MB
                      </div>
                    </section>
                  )}

                  {/* Step 5: Terms and Conditions */}
                  {currentStep === 5 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-4 pb-4 border-b border-border">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">5</span>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">الشروط والأحكام</h2>
                          <p className="text-sm text-muted-foreground">موافقتك على سياسات المنصة</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-inner">
                        <div className="space-y-4 text-sm leading-7 text-muted-foreground max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          <h3 className="text-base font-bold text-foreground mb-2">شروط استخدام المنصة للمنشآت:</h3>

                          <div className="space-y-3">
                            <p><strong>1. القبول والاتفاقية:</strong> باستخدام المنصة فإنك توافق على شروط الاستخدام وسياسة الخصوصية. إذا لم توافق على البنود فلا يمكنك المتابعة.</p>
                            <p><strong>2. صحة البيانات:</strong> تلتزم الشركة بتقديم معلومات صحيحة وحديثة، وسيؤدي أي تلاعب أو بيانات مضللة إلى إيقاف الحساب.</p>
                            <p><strong>3. حماية الحساب:</strong> أنت مسؤول عن سرية بيانات الدخول والحفاظ على أمانها وعدم مشاركتها مع أي طرف غير مخول.</p>
                            <p><strong>4. الاستخدام المصرح:</strong> يمنع استخدام المنصة في أنشطة مخالفة للقوانين أو انتهاك حقوق الأطراف الأخرى أو إعادة بيع الخدمات دون إذن كتابي.</p>
                            <p><strong>5. المستندات:</strong> قد نطلب مستندات إضافية لإثبات النشاط التجاري أو التراخيص الرسمية.</p>
                          </div>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="agreedToTerms"
                        render={({ field }) => (
                          <FormItem>
                            <label className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
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
                                أوافق على جميع الشروط والأحكام المذكورة أعلاه وأؤكد صحة البيانات التجارية المقدمة.
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
                            جاري الإرسال...
                          </>
                        ) : (
                          "إرسال طلب التحقق"
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
