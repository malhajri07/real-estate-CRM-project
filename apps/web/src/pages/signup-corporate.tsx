import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function SignupCorporate() {
  // Account credentials for corporate owner
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
    "الجوف",
  ];

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    setter(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!companyName || !companyType || !commercialRegistration || !contactName || !contactEmail || !contactPhone) {
      toast({
        title: "خطأ في البيانات",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast({
        title: "البريد الإلكتروني غير صحيح",
        description: "الرجاء إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const normalizedPhone = contactPhone.trim();
    if (!/^05\d{8}$/.test(normalizedPhone)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "الرجاء إدخال رقم جوال سعودي صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const normalizedUsername = (username || "").trim().toLowerCase();
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

    if (!agreedToTerms) {
      toast({
        title: "الموافقة على الشروط مطلوبة",
        description: "يجب الموافقة على الشروط والأحكام قبل المتابعة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const [firstName, ...rest] = contactName.trim().split(/\s+/);
      const lastName = rest.length > 0 ? rest.join(" ") : "-";

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
        throw new Error(data?.error || data?.message || 'فشل في إنشاء الحساب');
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
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء إرسال طلبك، الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }

    setIsLoading(false);
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

        <div className="space-y-3 text-right">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
            تسجيل شركة عقارية
          </span>
          <h1 className="text-4xl font-bold text-slate-900">إنشاء حساب مؤسسي</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            أدخل بيانات شركتك ومسؤول الاتصال لبدء عملية التحقق والانضمام كشريك مؤسسي في المنصة.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          dir="rtl"
          className="relative space-y-10 rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl px-6 py-10 shadow-[0_35px_120px_rgba(148,163,184,0.18)]"
        >
          <section className="space-y-4">
            <div className="flex flex-col gap-2 text-right md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-slate-900">بيانات الحساب الأساسية</h2>
              <span className="text-sm text-slate-400">* الحقول الإلزامية</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="username" className="block text-sm font-medium text-slate-600">
                  اسم المستخدم *
                </Label>
                <Input
                  id="username"
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="block text-sm font-medium text-slate-600">
                  كلمة المرور *
                </Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500 font-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600">
                  تأكيد كلمة المرور *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500 font-password"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-6">
            <div className="space-y-1 text-right">
              <h2 className="text-xl font-semibold text-slate-900">معلومات الشركة</h2>
              <p className="text-sm text-slate-500">
                استخدم بيانات السجل التجاري الرسمية لضمان التحقق السريع للحساب.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="block text-sm font-medium text-slate-600">
                  اسم الشركة *
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="أدخل اسم الشركة"
                  required
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyType" className="block text-sm font-medium text-slate-600">
                  نوع الشركة *
                </Label>
                <Select value={companyType} onValueChange={setCompanyType} required>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white text-right focus:ring-emerald-500">
                    <SelectValue placeholder="اختر نوع الشركة" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} align="end" className="z-[100]">
                    <SelectItem value="llc">شركة ذات مسؤولية محدودة</SelectItem>
                    <SelectItem value="corporation">شركة مساهمة</SelectItem>
                    <SelectItem value="partnership">شركة تضامن</SelectItem>
                    <SelectItem value="sole-proprietorship">مؤسسة فردية</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="commercialRegistration" className="block text-sm font-medium text-slate-600">
                  رقم السجل التجاري *
                </Label>
                <Input
                  id="commercialRegistration"
                  type="text"
                  value={commercialRegistration}
                  onChange={(e) => handleNumericInput(e.target.value, setCommercialRegistration)}
                  placeholder="10 أرقام"
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber" className="block text-sm font-medium text-slate-600">
                  الرقم الضريبي
                </Label>
                <Input
                  id="taxNumber"
                  type="text"
                  value={taxNumber}
                  onChange={(e) => handleNumericInput(e.target.value, setTaxNumber)}
                  placeholder="الرقم الضريبي إن وجد"
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="establishmentDate" className="block text-sm font-medium text-slate-600">
                  تاريخ التأسيس
                </Label>
                <Input
                  id="establishmentDate"
                  type="date"
                  value={establishmentDate}
                  onChange={(e) => setEstablishmentDate(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeesCount" className="block text-sm font-medium text-slate-600">
                  عدد الموظفين التقريبي
                </Label>
                <Input
                  id="employeesCount"
                  type="text"
                  value={employeesCount}
                  onChange={(e) => handleNumericInput(e.target.value, setEmployeesCount)}
                  placeholder="عدد الموظفين"
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyCity" className="block text-sm font-medium text-slate-600">
                  المدينة الرئيسية *
                </Label>
                <Select value={companyCity} onValueChange={setCompanyCity} required>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white text-right focus:ring-emerald-500">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} align="end" className="z-[100]">
                    {saudiRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyAddress" className="block text-sm font-medium text-slate-600">
                  العنوان الكامل
                </Label>
                <Input
                  id="companyAddress"
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="المدينة، الحي، الشارع"
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite" className="block text-sm font-medium text-slate-600">
                  الموقع الإلكتروني
                </Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  dir="ltr"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://company.sa"
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyDescription" className="block text-sm font-medium text-slate-600">
                نبذة عن الشركة
              </Label>
              <Textarea
                id="companyDescription"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="صف مجالات عمل الشركة والخدمات التي تقدمها"
                className="min-h-[120px] rounded-3xl border-slate-200 text-right focus-visible:ring-emerald-500"
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-6">
            <div className="space-y-1 text-right">
              <h2 className="text-xl font-semibold text-slate-900">مسؤول الاتصال الرئيسي</h2>
              <p className="text-sm text-slate-500">سيتم استخدام هذه البيانات للتواصل وإرسال تحديثات الحساب.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="block text-sm font-medium text-slate-600">
                  الاسم الكامل *
                </Label>
                <Input
                  id="contactName"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="اسم الشخص المسؤول"
                  required
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPosition" className="block text-sm font-medium text-slate-600">
                  المسمى الوظيفي
                </Label>
                <Input
                  id="contactPosition"
                  type="text"
                  value={contactPosition}
                  onChange={(e) => setContactPosition(e.target.value)}
                  placeholder="مثال: المدير التنفيذي"
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="block text-sm font-medium text-slate-600">
                  البريد الإلكتروني *
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  dir="ltr"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="example@company.com"
                  required
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="block text-sm font-medium text-slate-600">
                  رقم الجوال *
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => handleNumericInput(e.target.value, setContactPhone)}
                  placeholder="05XXXXXXXX"
                  required
                  maxLength={10}
                  className="h-12 rounded-2xl border-slate-200 text-right focus-visible:ring-emerald-500"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-6">
            <div className="space-y-1 text-right">
              <h2 className="text-xl font-semibold text-slate-900">المستندات المساندة (اختيارية)</h2>
              <p className="text-sm text-slate-500">يساعد رفع المستندات في تسريع عملية الموافقة والتحقق.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="commercialRegDoc" className="block text-sm font-medium text-slate-600">
                  صورة السجل التجاري
                </Label>
                <div className="relative">
                  <Input
                    id="commercialRegDoc"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setCommercialRegDoc(e.target.files)}
                    className="h-12 rounded-2xl border-slate-200 text-right file:ml-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-emerald-700 file:font-medium focus-visible:ring-emerald-500"
                  />
                  <Upload className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatCertificate" className="block text-sm font-medium text-slate-600">
                  شهادة التسجيل في ضريبة القيمة المضافة
                </Label>
                <div className="relative">
                  <Input
                    id="vatCertificate"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setVatCertificate(e.target.files)}
                    className="h-12 rounded-2xl border-slate-200 text-right file:ml-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-emerald-700 file:font-medium focus-visible:ring-emerald-500"
                  />
                  <Upload className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyProfile" className="block text-sm font-medium text-slate-600">
                  ملف تعريف الشركة
                </Label>
                <div className="relative">
                  <Input
                    id="companyProfile"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setCompanyProfile(e.target.files)}
                    className="h-12 rounded-2xl border-slate-200 text-right file:ml-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-emerald-700 file:font-medium focus-visible:ring-emerald-500"
                  />
                  <Upload className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-700">
              📁 جميع الملفات يجب أن تكون بصيغة PDF وبحجم لا يتجاوز 5MB
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-6">
            <div className="space-y-1 text-right">
              <h2 className="text-xl font-semibold text-slate-900">الشروط والأحكام</h2>
              <p className="text-sm text-slate-500">يرجى قراءة الشروط بعناية قبل الاستمرار في التسجيل.</p>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm leading-7 text-slate-600 space-y-3">
              <p><strong>1. القبول والاتفاقية:</strong> باستخدام المنصة فإنك توافق على شروط الاستخدام وسياسة الخصوصية. إذا لم توافق على البنود فلا يمكنك المتابعة.</p>
              <p><strong>2. صحة البيانات:</strong> تلتزم الشركة بتقديم معلومات صحيحة وحديثة، وسيؤدي أي تلاعب أو بيانات مضللة إلى إيقاف الحساب.</p>
              <p><strong>3. حماية الحساب:</strong> أنت مسؤول عن سرية بيانات الدخول والحفاظ على أمانها وعدم مشاركتها مع أي طرف غير مخول.</p>
              <p><strong>4. الاستخدام المصرح:</strong> يمنع استخدام المنصة في أنشطة مخالفة للقوانين أو انتهاك حقوق الأطراف الأخرى أو إعادة بيع الخدمات دون إذن كتابي.</p>
              <p><strong>5. المستندات:</strong> قد نطلب مستندات إضافية لإثبات النشاط التجاري أو التراخيص الرسمية. عدم توفيرها قد يؤخر أو يلغي عملية التحقق.</p>
              <p><strong>6. الإنهاء:</strong> يحق للمنصة إيقاف الحساب في حال مخالفة الشروط أو إساءة الاستخدام. يمكنك طلب إيقاف الحساب في أي وقت.</p>
              <p><strong>7. التواصل:</strong> سيتم التواصل معك عبر البريد الإلكتروني المسجل أو رقم الجوال لإشعارات التحقق أو التحديثات.</p>
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
                أوافق على جميع الشروط والأحكام المذكورة وأؤكد صحة البيانات التجارية المقدمة.
              </Label>
            </div>
          </section>

          <div className="pt-6">
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-emerald-600 text-lg font-semibold text-white shadow-[0_20px_60px_rgba(16,185,129,0.18)] transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || !agreedToTerms}
            >
              {isLoading ? "جار إرسال الطلب..." : "إرسال طلب التحقق"}
            </Button>
            {!agreedToTerms && (
              <p className="mt-2 text-center text-sm text-red-600">يجب الموافقة على الشروط والأحكام قبل المتابعة</p>
            )}
          </div>

          <section className="space-y-3 border-t border-slate-100 pt-8 text-right">
            <h3 className="text-lg font-semibold text-slate-900">بعد إرسال الطلب</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 text-sm text-slate-600 shadow-sm">
                📬 سيقوم فريق المراجعة بدراسة الطلب خلال 48 ساعة والتواصل في حال الحاجة إلى مستندات إضافية.
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 text-sm text-slate-600 shadow-sm">
                🔐 عند الموافقة سيتم تفعيل الحساب المؤسسي وإرسال بيانات تسجيل الدخول إلى البريد الإلكتروني.
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 text-sm text-slate-600 shadow-sm">
                🤝 يمكنكم بعدها دعوة الموظفين والوكلاء وإدارة أعمالكم العقارية عبر لوحة التحكم المتقدمة.
              </div>
            </div>
          </section>
        </form>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/signup")}
            className="mt-8 h-12 rounded-2xl border-slate-200 px-8 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى خيارات التسجيل
          </Button>
        </div>
      </div>
    </div>
  );
}
