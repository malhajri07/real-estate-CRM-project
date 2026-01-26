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
 * 
 * Related Files:
 * - apps/web/src/pages/signup-selection.tsx - Signup type selection
 * - apps/web/src/pages/signup-success.tsx - Signup success page
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

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
  // Certification end date field intentionally removed per new onboarding requirements.
  const [certificationFile, setCertificationFile] = useState<FileList | null>(null);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  // Saudi regions
  const saudiRegions = [
    "الرياض",
    "مكة المكرمة", 
    "المدينة المنورة",
    "المنطقة الشرقية",
    "عسير",
    "تبوك",
    "القصيم",
    "حائل",
    "الحدود الشمالية",
    "جازان",
    "نجران",
    "الباحة",
    "الجوف"
  ];

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    setter(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check terms agreement first
    if (!agreedToTerms) {
      toast({
        title: "الموافقة على الشروط مطلوبة",
        description: "يجب الموافقة على الشروط والأحكام قبل المتابعة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate required fields
    // certificationEndDate removed from required check in line with field removal.
    if (!firstName || !lastName || !saudiId || !mobileNumber || !certificationNumber || !gender || !city || !certificationStartDate) {
      toast({
        title: "خطأ في البيانات",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate account credentials
    const normalizedUsername = (username || '').trim().toLowerCase();
    if (!normalizedUsername || !/^[a-z0-9_.]{3,32}$/.test(normalizedUsername)) {
      toast({
        title: "اسم المستخدم غير صالح",
        description: "اسم المستخدم يجب أن يتكون من 3-32 حرفاً ويحتوي على حروف إنجليزية صغيرة أو أرقام أو (_) أو (.)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "تأكيد كلمة المرور غير مطابق",
        description: "الرجاء التأكد من تطابق كلمتي المرور",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!certificationFile || certificationFile.length === 0) {
      toast({
        title: "مطلوب ملف الترخيص",
        description: "الرجاء رفع ملف ترخيص فال العقاري بصيغة PDF",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate Saudi ID (should be 10 digits)
    const normalizedSaudiId = saudiId.trim();
    if (!/^\d{10}$/.test(normalizedSaudiId)) {
      toast({
        title: "رقم الهوية غير صحيح",
        description: "رقم الهوية الوطنية يجب أن يكون ١٠ أرقام",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate mobile number (Saudi format)
    const normalizedMobile = mobileNumber.trim();
    if (!/^05\d{8}$/.test(normalizedMobile)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "الرجاء إدخال رقم جوال سعودي صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Register auth user (INDIV_AGENT)
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          // Optional temp email for contact only
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

      // Persist session (optional)
      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تم تسجيل المستخدم كوكيل مستقل. سيتم متابعة التحقق من البيانات.",
      });

      // Redirect to success page
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificationFile(e.target.files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-end text-sm text-slate-500">
          <Button
            type="button"
            variant="link"
            className="text-emerald-700 hover:text-emerald-800"
            onClick={() => setLocation('/home')}
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>

        <div className="space-y-3 text-end">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
            تسجيل وسيط عقاري مستقل
          </span>
          <h1 className="text-4xl font-bold text-slate-900">إنشاء حساب فردي لوسيط عقاري</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            أكمل البيانات التالية للانضمام كوسيط عقاري معتمد والاستفادة من أدوات إدارة العملاء والعروض داخل المنصة.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          dir={dir}
          className="relative space-y-10 rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl px-6 py-10 shadow-[0_35px_120px_rgba(148,163,184,0.18)]"
        >
              {/* Account Credentials */}
              <section className="space-y-4">
                <div className="flex flex-col gap-2 text-end md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">بيانات الحساب الأساسية</h2>
                  <span className="text-sm text-slate-400">* الحقول الإلزامية</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                  <Label htmlFor="username" className="block text-sm font-medium text-slate-600">
                    اسم المستخدم *
                  </Label>
                  {/* Placeholder removed per request; label provides sufficient guidance. */}
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    dir="ltr"
                    className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500"
                  />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="block text-sm font-medium text-slate-600">
                      كلمة المرور *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      dir="ltr"
                      className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500 font-password"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600">
                      تأكيد كلمة المرور *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      dir="ltr"
                      className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500 font-password"
                    />
                  </div>
                </div>
              </section>

              {/* Personal Information */}
              <section className="space-y-4 pt-6 border-t border-slate-100">
                <div className="text-end space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">المعلومات الشخصية</h2>
                  <p className="text-sm text-slate-500">
                    ساعدنا في التعرف عليك للتواصل والتحقق من بياناتك المهنية.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="block text-sm font-medium text-slate-600">
                    رقم الجوال *
                  </Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => handleNumericInput(e.target.value, setMobileNumber)}
                    placeholder="05XXXXXXXX"
                    required
                    maxLength={10}
                    className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="block text-sm font-medium text-slate-600">
                      الاسم الأول *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="أدخل الاسم الأول"
                      required
                      className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="block text-sm font-medium text-slate-600">
                      اسم العائلة *
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="أدخل اسم العائلة"
                      required
                      className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="block text-sm font-medium text-slate-600">
                      النوع *
                    </Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white text-end focus:ring-emerald-500">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} align="end" className="z-[100] text-end">
                        <SelectItem value="male" className="flex justify-end text-end">ذكر</SelectItem>
                        <SelectItem value="female" className="flex justify-end text-end">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="block text-sm font-medium text-slate-600">
                      المنطقة *
                    </Label>
                    <Select value={city} onValueChange={setCity} required>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white text-end focus:ring-emerald-500">
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} align="end" className="z-[100] text-end">
                        {saudiRegions.map((region) => (
                          <SelectItem key={region} value={region} className="flex justify-end text-end">
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saudiId" className="block text-sm font-medium text-slate-600">
                    رقم الهوية الوطنية *
                  </Label>
                  <Input
                    id="saudiId"
                    type="text"
                    value={saudiId}
                    onChange={(e) => handleNumericInput(e.target.value, setSaudiId)}
                    placeholder="أدخل رقم الهوية الوطنية (10 أرقام)"
                    required
                    maxLength={10}
                    className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500"
                  />
                </div>
              </section>

              {/* Certification Information */}
              <section className="space-y-4 pt-6 border-t border-slate-100">
                <div className="text-end space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">معلومات رخصة فال</h2>
                  <p className="text-sm text-slate-500">
                    أدخل بيانات الترخيص المهنية للتأكد من أهليتك كممارس معتمد.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificationNumber" className="block text-sm font-medium text-slate-600">
                    رقم رخصة فال العقاري *
                  </Label>
                  <Input
                    id="certificationNumber"
                    type="text"
                    value={certificationNumber}
                    onChange={(e) => setCertificationNumber(e.target.value)}
                    placeholder="أدخل رقم الترخيص"
                    required
                    className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificationStartDate" className="block text-sm font-medium text-slate-600">
                    تاريخ بداية الترخيص *
                  </Label>
                  <Input
                    id="certificationStartDate"
                    type="date"
                    value={certificationStartDate}
                    onChange={(e) => setCertificationStartDate(e.target.value)}
                    required
                    className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificationFile" className="block text-sm font-medium text-slate-600">
                    ملف ترخيص فال العقاري (PDF) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="certificationFile"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      required
                      className="h-12 rounded-2xl border-slate-200 text-end focus-visible:ring-emerald-500 file:mr-10 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 pl-10"
                    />
                    <Upload className="w-4 h-4 text-gray-500 absolute left-3 top-4 pointer-events-none" />
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-end">
                    <p className="text-sm font-medium text-emerald-700">
                      📋 يجب رفع ملف ترخيص فال العقاري بصيغة PDF فقط
                    </p>
                  </div>
                </div>
              </section>

              {/* Terms and Conditions */}
              <section className="space-y-4 pt-6 border-t border-slate-100">
                <div className="text-end space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">الشروط والأحكام</h2>
                  <p className="text-sm text-slate-500">
                    يرجى قراءة الشروط التالية بعناية قبل الموافقة والمتابعة لإكمال التسجيل.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 text-end shadow-sm">
                  <div className="space-y-4 text-sm leading-7 text-slate-700 max-h-80 overflow-y-auto">
                    <h3 className="text-base font-semibold text-slate-900">شروط استخدام منصة عقاراتي للوسطاء العقاريين:</h3>
                    
                    <div className="space-y-3">
                      <p><strong>1. الأهلية والتسجيل:</strong></p>
                      <p>يجب أن يكون المتقدم حاصلاً على ترخيص فال عقاري ساري المفعول وأن يكون مؤهلاً لممارسة الوساطة العقارية في المملكة العربية السعودية وفقاً للأنظمة المعمول بها.</p>
                      
                      <p><strong>2. صحة البيانات والمعلومات:</strong></p>
                      <p>يتعهد المستخدم بتقديم معلومات صحيحة ودقيقة عن هويته الشخصية وترخيصه المهني، وتحديث هذه المعلومات عند الحاجة. أي معلومات مضللة قد تؤدي إلى إلغاء الحساب نهائياً.</p>
                      
                      <p><strong>3. استخدام النظام:</strong></p>
                      <ul className="space-y-2 pr-4">
                        <li>• الالتزام بأخلاقيات المهنة وقواعد السلوك المهني للوسطاء العقاريين</li>
                        <li>• عدم استخدام النظام لأغراض غير مشروعة أو مخالفة للأنظمة</li>
                        <li>• الحفاظ على سرية بيانات العملاء وعدم إساءة استخدامها</li>
                        <li>• عدم نشر إعلانات مضللة أو غير دقيقة للعقارات</li>
                        <li>• الالتزام بالشفافية في جميع التعاملات مع العملاء</li>
                      </ul>

                      <p><strong>4. الترخيص المهني:</strong></p>
                      <p>يجب المحافظة على سريان ترخيص فال العقاري وإشعار المنصة بأي تغيير في حالة الترخيص فوراً. انتهاء صلاحية الترخيص يؤدي إلى تعليق الحساب تلقائياً حتى تجديده.</p>
                      
                      <p><strong>5. العمولات والرسوم:</strong></p>
                      <ul className="space-y-2 pr-4">
                        <li>• رسوم الاشتراك الشهري/السنوي وفقاً للخطة المختارة</li>
                        <li>• عمولة المنصة على الصفقات المنجزة حسب الاتفاقية</li>
                        <li>• جميع المبالغ غير قابلة للاسترداد بعد التأكيد</li>
                        <li>• يحق للمنصة تعديل الرسوم مع إشعار مسبق 30 يوماً</li>
                      </ul>

                      <p><strong>6. حماية البيانات والخصوصية:</strong></p>
                      <p>نلتزم بحماية بياناتك الشخصية ومعلومات عملائك وفقاً لنظام حماية البيانات الشخصية السعودي، ولن نشاركها مع أطراف ثالثة إلا بموافقتك أو وفقاً للمتطلبات القانونية.</p>
                      
                      <p><strong>7. المسؤولية المهنية:</strong></p>
                      <p>تتحمل المسؤولية الكاملة عن جميع تصرفاتك المهنية وتعاملاتك مع العملاء. المنصة غير مسؤولة عن أي نزاعات قد تنشأ بينك وبين عملائك.</p>
                      
                      <p><strong>8. قواعد السلوك:</strong></p>
                      <ul className="space-y-2 pr-4">
                        <li>• احترام حقوق الملكية الفكرية للمنصة</li>
                        <li>• عدم محاولة اختراق أو إلحاق الضرر بالنظام</li>
                        <li>• التعامل بأدب واحترام مع جميع المستخدمين</li>
                        <li>• الالتزام بمعايير الجودة في الخدمات المقدمة</li>
                      </ul>
                      
                      <p><strong>9. إنهاء الحساب:</strong></p>
                      <p>نحتفظ بالحق في إيقاف أو إنهاء حسابك في حالة انتهاك هذه الشروط أو الأنظمة المعمول بها. كما يمكنك إلغاء حسابك في أي وقت مع مراعاة فترة الإشعار المطلوبة.</p>
                      
                      <p><strong>10. التحديثات والتعديلات:</strong></p>
                      <p>نحتفظ بالحق في تعديل هذه الشروط أو تحديث المنصة في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل أو من خلال المنصة.</p>
                      
                      <p><strong>11. القانون المطبق والاختصاص:</strong></p>
                      <p>تخضع هذه الاتفاقية للقوانين واللوائح السعودية، بما في ذلك نظام التطوير العقاري ولائحة أعمال الوساطة العقارية. المحاكم السعودية المختصة لها الاختصاص في حل أي نزاعات.</p>
                      
                      <p><strong>12. الاتصال والدعم:</strong></p>
                      <p>لأي استفسارات أو مشاكل تتعلق بهذه الشروط أو استخدام المنصة، يمكنك التواصل معنا على: support@aqaraty.sa أو هاتف: +966501234567</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row-reverse items-start gap-3">
                  <input
                    id="terms-agreement"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Label htmlFor="terms-agreement" className="text-sm text-slate-600 cursor-pointer leading-7">
                    أوافق على جميع الشروط والأحكام المذكورة أعلاه وأقر بأنني قد قرأتها وفهمتها بالكامل. كما أتعهد بالالتزام بأخلاقيات المهنة وقواعد السلوك للوسطاء العقاريين وأؤكد صحة جميع البيانات المقدمة.
                  </Label>
                </div>
              </section>

              {/* Submit actions live outside the terms section to keep JSX nesting valid. */}
              <div className="pt-8">
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-emerald-600 text-lg font-semibold text-white shadow-[0_20px_60px_rgba(16,185,129,0.18)] transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading || !agreedToTerms}
                >
                  {isLoading ? "جار إرسال الطلب..." : "إنشاء الحساب"}
                </Button>
                {!agreedToTerms && (
                  <p className="mt-2 text-center text-sm text-red-600">يجب الموافقة على الشروط والأحكام قبل المتابعة</p>
                )}
              </div>
          </form>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setLocation("/signup")}
              className="h-12 rounded-2xl border-slate-200 px-8 text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة إلى خيارات التسجيل
            </Button>
          </div>
        </div>
      </div>
  );
}
