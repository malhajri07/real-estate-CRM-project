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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowRight, UserRound, Loader2, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicHeader from "@/components/layout/PublicHeader";
import { cn } from "@/lib/utils";

// Step definitions
const STEPS = [
  { id: 1, title: "بيانات الحساب", description: "اسم المستخدم وكلمة المرور" },
  { id: 2, title: "المعلومات الشخصية", description: "الاسم، الجوال، والهوية" },
  { id: 3, title: "الترخيص المهني", description: "رخصة فال العقارية" },
  { id: 4, title: "الشروط والأحكام", description: "الموافقة على السياسات" },
];

export default function SignupIndividual() {
  // Account credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saudiId, setSaudiId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [certificationNumber, setCertificationNumber] = useState("");
  const [certificationStartDate, setCertificationStartDate] = useState("");
  const [certificationFile, setCertificationFile] = useState<FileList | null>(null);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Saudi regions
  const saudiRegions = [
    "الرياض", "مكة المكرمة", "المدينة المنورة", "المنطقة الشرقية", "عسير",
    "تبوك", "القصيم", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف"
  ];

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    setter(digitsOnly);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificationFile(e.target.files);
  };

  // Validation functions per step
  const validateStep1 = (): boolean => {
    const normalizedUsername = (username || '').trim().toLowerCase();
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
    if (!firstName || !lastName || !saudiId || !mobileNumber || !gender || !city) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return false;
    }

    const normalizedMobile = mobileNumber.trim();
    if (!/^05\d{8}$/.test(normalizedMobile)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "الرجاء إدخال رقم جوال سعودي صحيح (05xxxxxxxx)",
        variant: "destructive",
      });
      return false;
    }

    const normalizedSaudiId = saudiId.trim();
    if (!/^\d{10}$/.test(normalizedSaudiId)) {
      toast({
        title: "رقم الهوية غير صحيح",
        description: "رقم الهوية الوطنية يجب أن يكون ١٠ أرقام",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep3 = (): boolean => {
    if (!certificationNumber || !certificationStartDate || !certificationFile || certificationFile.length === 0) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء إدخال جميع بيانات الترخيص وإرفاق الملف",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep4 = (): boolean => {
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
    // Allow going to any completed step OR the immediate next step if current is completed (logic simplified: usually user can go back to any previous step, and forward only if steps are completed)
    // Here: allow jump if stepId <= maxAllowedStep and stepId <= currentStep (wait, allow jumping forward only if intervening steps completed? easier: only allow click if stepId <= maxAllowedStep)
    // Actually simpler: allow clicking any step <= maxAllowedStep.
    
    // But we should also validate current step before leaving it if moving forward?
    // Usually sidebar navigation allows moving freely among visited/completed steps.
    
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (stepId > currentStep) {
      // Trying to move forward via sidebar
      if (stepId <= maxAllowedStep && validateCurrentStep()) {
         // Mark current as complete if we are moving past it
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
    
    if (!validateStep4()) return; // Ensure final step valid

    setIsLoading(true);

    try {
      const normalizedUsername = (username || '').trim().toLowerCase();
      const normalizedMobile = mobileNumber.trim();
      const normalizedSaudiId = saudiId.trim();

      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          email: `${normalizedSaudiId}@temp.aqaraty.sa`,
          password,
          firstName,
          lastName,
          phone: normalizedMobile,
          roles: JSON.stringify(['INDIV_AGENT'])
        })
      });

      const raw = await registerRes.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!registerRes.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'فشل في إنشاء الحساب');
      }

      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تم تسجيل المستخدم كوكيل مستقل. سيتم متابعة التحقق من البيانات.",
      });

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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" dir={dir}>
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <PublicHeader />

      <main className="relative pt-32 pb-20 px-4">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium">
              <UserRound className="w-4 h-4" />
              <span>تسجيل وسيط عقاري مستقل</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              أنشئ حسابك وانضم إلى <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-teal-600">نخبة الوسطاء</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
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
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : isCurrent
                                ? "bg-emerald-100 text-emerald-600 border-emerald-300"
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
                              isCurrent || isCompleted ? "text-emerald-600" : "text-gray-500"
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
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">1</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">بيانات الحساب الأساسية</h2>
                        <p className="text-sm text-slate-500">قم بتعيين بيانات الدخول الخاصة بحسابك</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-slate-700">اسم المستخدم <span className="text-red-500">*</span></Label>
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          dir="ltr"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">كلمة المرور <span className="text-red-500">*</span></Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          dir="ltr"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start font-password"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">تأكيد كلمة المرور <span className="text-red-500">*</span></Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          dir="ltr"
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start font-password"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 2: Personal Information */}
                {currentStep === 2 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">2</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">المعلومات الشخصية</h2>
                        <p className="text-sm text-slate-500">بياناتك الشخصية للتواصل والتحقق</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="mobileNumber" className="text-sm font-medium text-slate-700">رقم الجوال <span className="text-red-500">*</span></Label>
                      <Input
                        id="mobileNumber"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => handleNumericInput(e.target.value, setMobileNumber)}
                        placeholder="05XXXXXXXX"
                        required
                        maxLength={10}
                        dir="ltr"
                        className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">الاسم الأول <span className="text-red-500">*</span></Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">اسم العائلة <span className="text-red-500">*</span></Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium text-slate-700">النوع <span className="text-red-500">*</span></Label>
                        <Select value={gender} onValueChange={setGender} required>
                          <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start">
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="z-[100]">
                            <SelectItem value="male">ذكر</SelectItem>
                            <SelectItem value="female">أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-slate-700">المنطقة <span className="text-red-500">*</span></Label>
                        <Select value={city} onValueChange={setCity} required>
                          <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-start">
                            <SelectValue placeholder="اختر المنطقة" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="z-[100]">
                            {saudiRegions.map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <Label htmlFor="saudiId" className="text-sm font-medium text-slate-700">رقم الهوية الوطنية <span className="text-red-500">*</span></Label>
                      <Input
                        id="saudiId"
                        type="text"
                        value={saudiId}
                        onChange={(e) => handleNumericInput(e.target.value, setSaudiId)}
                        placeholder="10 أرقام"
                        required
                        maxLength={10}
                        dir="ltr"
                        className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end"
                      />
                    </div>
                  </section>
                )}

                {/* Step 3: Certification Information */}
                {currentStep === 3 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">3</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">معلومات رخصة فال</h2>
                        <p className="text-sm text-slate-500">بيانات الترخيص المهني</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificationNumber" className="text-sm font-medium text-slate-700">رقم رخصة فال العقاري <span className="text-red-500">*</span></Label>
                      <Input
                        id="certificationNumber"
                        type="text"
                        value={certificationNumber}
                        onChange={(e) => setCertificationNumber(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2 mt-6">
                      <Label htmlFor="certificationStartDate" className="text-sm font-medium text-slate-700">تاريخ بداية الترخيص <span className="text-red-500">*</span></Label>
                      <Input
                        id="certificationStartDate"
                        type="date"
                        value={certificationStartDate}
                        onChange={(e) => setCertificationStartDate(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end"
                      />
                    </div>

                    <div className="space-y-2 mt-6">
                      <Label htmlFor="certificationFile" className="text-sm font-medium text-slate-700">ملف ترخيص فال العقاري (PDF) <span className="text-red-500">*</span></Label>
                      <div className="relative group">
                        <Input
                          id="certificationFile"
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileChange}
                          required
                          className="h-14 rounded-xl border-slate-200 bg-white/50 text-end focus:ring-emerald-500 file:mr-10 file:h-full file:rounded-l-none file:rounded-r-xl file:border-0 file:bg-emerald-50 file:px-6 file:py-0 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 pl-10 cursor-pointer transition-all"
                        />
                        <Upload className="w-5 h-5 text-emerald-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        يجب رفع ملف بصيغة PDF فقط
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 4: Terms and Conditions */}
                {currentStep === 4 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">4</span>
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">الشروط والأحكام</h2>
                        <p className="text-sm text-slate-500">موافقتك على سياسات المنصة</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-inner">
                      <div className="space-y-4 text-sm leading-7 text-slate-600 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-base font-bold text-slate-900 mb-2">شروط استخدام منصة عقاراتي للوسطاء العقاريين:</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <strong className="block text-slate-900 mb-1">1. الأهلية والتسجيل:</strong>
                            <p>يجب أن يكون المتقدم حاصلاً على ترخيص فال عقاري ساري المفعول وأن يكون مؤهلاً لممارسة الوساطة العقارية في المملكة العربية السعودية وفقاً للأنظمة المعمول بها.</p>
                          </div>
                          
                          <div>
                            <strong className="block text-slate-900 mb-1">2. صحة البيانات والمعلومات:</strong>
                            <p>يتعهد المستخدم بتقديم معلومات صحيحة ودقيقة عن هويته الشخصية وترخيصه المهني، وتحديث هذه المعلومات عند الحاجة. أي معلومات مضللة قد تؤدي إلى إلغاء الحساب نهائياً.</p>
                          </div>

                          <div>
                            <strong className="block text-slate-900 mb-1">3. استخدام النظام:</strong>
                            <ul className="list-disc list-inside space-y-1 marker:text-emerald-500">
                              <li>الالتزام بأخلاقيات المهنة وقواعد السلوك المهني</li>
                              <li>عدم استخدام النظام لأغراض غير مشروعة</li>
                              <li>الحفاظ على سرية بيانات العملاء</li>
                              <li>عدم نشر إعلانات مضللة للعقارات</li>
                            </ul>
                          </div>

                          <div>
                            <strong className="block text-slate-900 mb-1">4. الترخيص المهني:</strong>
                            <p>يجب المحافظة على سريان ترخيص فال العقاري وإشعار المنصة بأي تغيير في حالة الترخيص فوراً.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                      <div className="relative flex items-center mt-1">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                        أوافق على جميع الشروط والأحكام المذكورة أعلاه وأقر بأنني قد قرأتها وفهمتها بالكامل. كما أتعهد بالالتزام بأخلاقيات المهنة وقواعد السلوك للوسطاء العقاريين وأؤكد صحة جميع البيانات المقدمة.
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
                          جاري الإنشاء...
                        </>
                      ) : (
                        "إنشاء الحساب"
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
