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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowRight, Building2, Loader2, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicHeader from "@/components/layout/PublicHeader";
import { cn } from "@/lib/utils";

// Step definitions
const STEPS = [
  { id: 1, title: "بيانات الحساب", description: "مدير الحساب" },
  { id: 2, title: "بيانات الشركة", description: "السجل التجاري والنشاط" },
  { id: 3, title: "مسؤول الاتصال", description: "بيانات التواصل" },
  { id: 4, title: "المستندات", description: "رفع الوثائق الرسمية" },
  { id: 5, title: "الشروط والأحكام", description: "سياسات المنصة" },
];

export default function SignupCorporate() {
  // Account credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [establishmentDate, setEstablishmentDate] = useState("");
  const [employeesCount, setEmployeesCount] = useState("");

  // Contact Person Info
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Documents
  const [commercialRegDoc, setCommercialRegDoc] = useState<FileList | null>(null);
  const [vatCertificate, setVatCertificate] = useState<FileList | null>(null);
  const [companyProfile, setCompanyProfile] = useState<FileList | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const saudiRegions = [
    "الرياض", "مكة المكرمة", "المدينة المنورة", "المنطقة الشرقية", "عسير",
    "تبوك", "القصيم", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف",
  ];

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    setter(digitsOnly);
  };

  // Validation functions
  const validateStep1 = (): boolean => {
    const normalizedUsername = (username || "").trim().toLowerCase();
    if (!normalizedUsername || !/^[a-z0-9_.]{3,32}$/.test(normalizedUsername)) {
      toast({
        title: "اسم المستخدم غير صالح",
        description: "اسم المستخدم يجب أن يتكون من 3-32 حرفاً ويحتوي على حروف إنجليزية صغيرة أو أرقام أو (_) أو (.)",
        variant: "destructive",
      });
      return false;
    }

    if (!password || password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "تأكيد كلمة المرور غير مطابق",
        description: "الرجاء التأكد من تطابق كلمتي المرور",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!companyName || !companyType || !commercialRegistration || !companyCity) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء تعبئة البيانات الأساسية للشركة (الاسم، النوع، السجل، المدينة)",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!contactName || !contactEmail || !contactPhone) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء تعبئة جميع بيانات مسؤول الاتصال",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast({
        title: "البريد الإلكتروني غير صحيح",
        description: "الرجاء إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return false;
    }

    const normalizedPhone = contactPhone.trim();
    if (!/^05\d{8}$/.test(normalizedPhone)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "الرجاء إدخال رقم جوال سعودي صحيح",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    // Documents are technically optional in the API or marked as optional in UI, 
    // but usually CR is required. Let's make at least CR doc optional-but-recommended 
    // or strictly required based on business logic. 
    // Previous code didn't strictly validate files before submit except as a general check.
    // Let's assume they are optional for initial signup step or allow proceeding if UI says "Optional".
    // The previous UI said "المستندات المساندة (اختيارية)". So we return true.
    return true;
  };

  const validateStep5 = (): boolean => {
    if (!agreedToTerms) {
      toast({
        title: "الموافقة مطلوبة",
        description: "يجب الموافقة على الشروط والأحكام للمتابعة",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      case 5: return validateStep5();
      default: return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
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

  const handleStepClick = (stepId: number) => {
    const maxAllowedStep = completedSteps.length + 1;
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (stepId > currentStep) {
      if (stepId <= maxAllowedStep && validateCurrentStep()) {
         if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
         }
         setCurrentStep(stepId);
         window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep5()) return;

    setIsLoading(true);

    try {
      const nameParts = contactName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || "مدير";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "الحساب";
      const normalizedUsername = (username || "").trim().toLowerCase();
      const normalizedPhone = contactPhone.trim();

      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          email: contactEmail,
          password,
          firstName,
          lastName,
          phone: normalizedPhone,
          roles: JSON.stringify(['CORP_OWNER'])
        })
      });

      const raw = await registerRes.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!registerRes.ok || !data?.success) {
        const apiMessage = data?.errors?.[0]?.message || data?.error || data?.message;
        throw new Error(apiMessage || 'فشل في إنشاء الحساب');
      }

      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }

      toast({
        title: "تم إنشاء حساب المالك بنجاح",
        description: "تم تسجيل المستخدم كمالك شركة. سيتم متابعة التحقق من بيانات الشركة.",
      });

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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" dir={dir}>
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <PublicHeader />

      <main className="relative pt-32 pb-20 px-4">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
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
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              ابدأ رحلة النجاح مع <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600">حساب مؤسسي</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
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
              <div className="glass rounded-[32px] p-6 shadow-xl">
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
                                : "bg-gray-100 text-gray-500 border-gray-300"
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
                              isCurrent || isCompleted ? "text-blue-600" : "text-gray-500"
                            )}
                          >
                            {step.title}
                          </div>
                          <div className="text-xs text-gray-400">{step.description}</div>
                        </div>
                        {index < STEPS.length - 1 && (
                          <div className="hidden lg:block absolute right-[23px] top-[48px] h-8 w-0.5 bg-gray-200 -z-10" />
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
              <form
                onSubmit={handleSubmit}
                className="glass rounded-[32px] p-8 md:p-12 shadow-2xl space-y-8"
              >
                {/* Step 1: Account Credentials */}
                {currentStep === 1 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">بيانات الحساب الأساسية</h2>
                        <p className="text-sm text-slate-500">قم بتعيين بيانات الدخول الخاصة بمدير الحساب</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-slate-700">اسم المستخدم <span className="text-red-500">*</span></Label>
                        <Input
                          id="username"
                          type="text"
                          dir="ltr"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">كلمة المرور <span className="text-red-500">*</span></Label>
                        <Input
                          id="password"
                          type="password"
                          dir="ltr"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start font-password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">تأكيد كلمة المرور <span className="text-red-500">*</span></Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          dir="ltr"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start font-password"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 2: Company Information */}
                {currentStep === 2 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">معلومات الشركة</h2>
                        <p className="text-sm text-slate-500">بيانات السجل التجاري والنشاط</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">اسم الشركة <span className="text-red-500">*</span></Label>
                        <Input
                          id="companyName"
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyType" className="text-sm font-medium text-slate-700">نوع الشركة <span className="text-red-500">*</span></Label>
                        <Select value={companyType} onValueChange={setCompanyType} required>
                          <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start">
                            <SelectValue placeholder="اختر نوع الشركة" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="z-[100]">
                            <SelectItem value="llc">شركة ذات مسؤولية محدودة</SelectItem>
                            <SelectItem value="corporation">شركة مساهمة</SelectItem>
                            <SelectItem value="partnership">شركة تضامن</SelectItem>
                            <SelectItem value="sole-proprietorship">مؤسسة فردية</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="commercialRegistration" className="text-sm font-medium text-slate-700">رقم السجل التجاري <span className="text-red-500">*</span></Label>
                        <Input
                          id="commercialRegistration"
                          type="text"
                          value={commercialRegistration}
                          onChange={(e) => handleNumericInput(e.target.value, setCommercialRegistration)}
                          placeholder="10 أرقام"
                          dir="ltr"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxNumber" className="text-sm font-medium text-slate-700">الرقم الضريبي</Label>
                        <Input
                          id="taxNumber"
                          type="text"
                          value={taxNumber}
                          onChange={(e) => handleNumericInput(e.target.value, setTaxNumber)}
                          dir="ltr"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="establishmentDate" className="text-sm font-medium text-slate-700">تاريخ التأسيس</Label>
                        <Input
                          id="establishmentDate"
                          type="date"
                          value={establishmentDate}
                          onChange={(e) => setEstablishmentDate(e.target.value)}
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="employeesCount" className="text-sm font-medium text-slate-700">عدد الموظفين التقريبي</Label>
                        <Input
                          id="employeesCount"
                          type="text"
                          value={employeesCount}
                          onChange={(e) => handleNumericInput(e.target.value, setEmployeesCount)}
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyCity" className="text-sm font-medium text-slate-700">المدينة الرئيسية <span className="text-red-500">*</span></Label>
                        <Select value={companyCity} onValueChange={setCompanyCity} required>
                          <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start">
                            <SelectValue placeholder="اختر المدينة" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="z-[100]">
                            {saudiRegions.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress" className="text-sm font-medium text-slate-700">العنوان الكامل</Label>
                        <Input
                          id="companyAddress"
                          type="text"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          placeholder="المدينة، الحي، الشارع"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyWebsite" className="text-sm font-medium text-slate-700">الموقع الإلكتروني</Label>
                        <Input
                          id="companyWebsite"
                          type="url"
                          dir="ltr"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          placeholder="https://company.sa"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyDescription" className="text-sm font-medium text-slate-700">نبذة عن الشركة</Label>
                      <Textarea
                        id="companyDescription"
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        placeholder="صف مجالات عمل الشركة والخدمات التي تقدمها..."
                        className="min-h-[120px] rounded-2xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                      />
                    </div>
                  </section>
                )}

                {/* Step 3: Contact Person */}
                {currentStep === 3 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">مسؤول الاتصال</h2>
                        <p className="text-sm text-slate-500">بيانات المفوض بالتواصل</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactName" className="text-sm font-medium text-slate-700">الاسم الكامل <span className="text-red-500">*</span></Label>
                        <Input
                          id="contactName"
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPosition" className="text-sm font-medium text-slate-700">المسمى الوظيفي</Label>
                        <Input
                          id="contactPosition"
                          type="text"
                          value={contactPosition}
                          onChange={(e) => setContactPosition(e.target.value)}
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">البريد الإلكتروني <span className="text-red-500">*</span></Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          dir="ltr"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">رقم الجوال <span className="text-red-500">*</span></Label>
                        <Input
                          id="contactPhone"
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => handleNumericInput(e.target.value, setContactPhone)}
                          placeholder="05XXXXXXXX"
                          required
                          maxLength={10}
                          dir="ltr"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 4: Documents */}
                {currentStep === 4 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">4</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">المستندات المساندة</h2>
                        <p className="text-sm text-slate-500">رفع الوثائق الرسمية (اختياري)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="commercialRegDoc" className="text-sm font-medium text-slate-700">صورة السجل التجاري</Label>
                        <div className="relative group">
                          <Input
                            id="commercialRegDoc"
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setCommercialRegDoc(e.target.files)}
                            className="h-12 rounded-xl border-slate-200 bg-white/50 text-end file:ml-3 file:h-full file:rounded-l-none file:rounded-r-xl file:border-0 file:bg-blue-50 file:px-4 file:py-0 file:text-blue-700 file:font-medium hover:file:bg-blue-100 focus:ring-emerald-500 cursor-pointer pl-10 transition-all"
                          />
                          <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vatCertificate" className="text-sm font-medium text-slate-700">شهادة الضريبة</Label>
                        <div className="relative group">
                          <Input
                            id="vatCertificate"
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setVatCertificate(e.target.files)}
                            className="h-12 rounded-xl border-slate-200 bg-white/50 text-end file:ml-3 file:h-full file:rounded-l-none file:rounded-r-xl file:border-0 file:bg-blue-50 file:px-4 file:py-0 file:text-blue-700 file:font-medium hover:file:bg-blue-100 focus:ring-emerald-500 cursor-pointer pl-10 transition-all"
                          />
                          <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyProfile" className="text-sm font-medium text-slate-700">ملف تعريف الشركة</Label>
                        <div className="relative group">
                          <Input
                            id="companyProfile"
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setCompanyProfile(e.target.files)}
                            className="h-12 rounded-xl border-slate-200 bg-white/50 text-end file:ml-3 file:h-full file:rounded-l-none file:rounded-r-xl file:border-0 file:bg-blue-50 file:px-4 file:py-0 file:text-blue-700 file:font-medium hover:file:bg-blue-100 focus:ring-emerald-500 cursor-pointer pl-10 transition-all"
                          />
                          <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
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
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">5</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">الشروط والأحكام</h2>
                        <p className="text-sm text-slate-500">موافقتك على سياسات المنصة</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-inner">
                      <div className="space-y-4 text-sm leading-7 text-slate-600 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-base font-bold text-slate-900 mb-2">شروط استخدام المنصة للمنشآت:</h3>
                        
                        <div className="space-y-3">
                          <p><strong>1. القبول والاتفاقية:</strong> باستخدام المنصة فإنك توافق على شروط الاستخدام وسياسة الخصوصية. إذا لم توافق على البنود فلا يمكنك المتابعة.</p>
                          <p><strong>2. صحة البيانات:</strong> تلتزم الشركة بتقديم معلومات صحيحة وحديثة، وسيؤدي أي تلاعب أو بيانات مضللة إلى إيقاف الحساب.</p>
                          <p><strong>3. حماية الحساب:</strong> أنت مسؤول عن سرية بيانات الدخول والحفاظ على أمانها وعدم مشاركتها مع أي طرف غير مخول.</p>
                          <p><strong>4. الاستخدام المصرح:</strong> يمنع استخدام المنصة في أنشطة مخالفة للقوانين أو انتهاك حقوق الأطراف الأخرى أو إعادة بيع الخدمات دون إذن كتابي.</p>
                          <p><strong>5. المستندات:</strong> قد نطلب مستندات إضافية لإثبات النشاط التجاري أو التراخيص الرسمية.</p>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <div className="relative flex items-center mt-1">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                        أوافق على جميع الشروط والأحكام المذكورة أعلاه وأؤكد صحة البيانات التجارية المقدمة.
                      </span>
                    </label>
                  </section>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="h-12 rounded-2xl border-slate-200 px-8 text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    <ChevronRight className="ml-2 h-4 w-4" />
                    السابق
                  </Button>

                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="h-12 rounded-2xl bg-emerald-600 px-8 text-white hover:bg-emerald-700"
                    >
                      التالي
                      <ChevronLeft className="mr-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading || !agreedToTerms}
                      className="h-12 rounded-2xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        "إرسال طلب التحقق"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
