import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileEdit, Home } from "lucide-react";
import { useLocation } from "wouter";

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

export default function RealEstateRequestsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [seekerId, setSeekerId] = useState<string | null>(null);

  // Ensure back button returns to landing page
  useEffect(() => {
    // Always ensure landing page is in history before this page
    // This makes the back button return to landing page
    const currentPath = window.location.pathname;
    if (currentPath === '/real-estate-requests') {
      // Replace current history entry with landing page
      window.history.replaceState({ from: 'landing' }, '', '/');
      // Then push the real-estate-requests page
      window.history.pushState({ from: 'real-estate-requests' }, '', '/real-estate-requests');
    }

    // Handle browser back button
    const handlePopState = (event: PopStateEvent) => {
      // If we're going back to landing page
      if (event.state?.from === 'landing' || window.location.pathname === '/') {
        // Use router to navigate (which will handle the route change)
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

  const [form, setForm] = useState({
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
    city: "",
    district: "",
    region: "",
    sqm: "",
    notes: "",
  });

  const validateRequiredFields = () => {
    const requiredFields: Array<{ key: keyof typeof form; label: string }> = [
      { key: "firstName", label: "الاسم الأول" },
      { key: "lastName", label: "اسم العائلة" },
      { key: "mobileNumber", label: "رقم الجوال" },
      { key: "email", label: "البريد الإلكتروني" },
      { key: "nationality", label: "الجنسية" },
      { key: "age", label: "العمر" },
      { key: "monthlyIncome", label: "الدخل الشهري" },
      { key: "gender", label: "الجنس" },
      { key: "typeOfProperty", label: "نوع العقار" },
      { key: "typeOfContract", label: "نوع العقد" },
      { key: "numberOfRooms", label: "عدد الغرف" },
      { key: "numberOfBathrooms", label: "عدد دورات المياه" },
      { key: "numberOfLivingRooms", label: "عدد صالات المعيشة" },
      { key: "city", label: "المدينة" },
      { key: "budgetSize", label: "الميزانية" },
    ];

    const missingField = requiredFields.find(({ key }) => {
      const value = form[key];
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missingField) {
      toast({
        title: "تحقق من البيانات",
        description: `يرجى تعبئة حقل ${missingField.label}`,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateRequiredFields()) {
      return;
    }

    const age = Number(form.age);
    const monthlyIncome = Number(form.monthlyIncome);
    const numberOfRooms = Number(form.numberOfRooms);
    const numberOfBathrooms = Number(form.numberOfBathrooms);
    const numberOfLivingRooms = Number(form.numberOfLivingRooms);
    const budgetSize = Number(form.budgetSize);

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

    const city = form.city.trim();
    const sqmValue = optionalNumber(form.sqm);

    try {
      setLoading(true);
      const response = await fetchWithTimeout("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          mobileNumber: form.mobileNumber.trim(),
          email: form.email.trim(),
          nationality: form.nationality.trim(),
          age,
          monthlyIncome,
          gender: form.gender,
          typeOfProperty: form.typeOfProperty.trim(),
          typeOfContract: form.typeOfContract.trim(),
          numberOfRooms,
          numberOfBathrooms,
          numberOfLivingRooms,
          houseDirection: optionalText(form.houseDirection),
          budgetSize,
          hasMaidRoom: form.hasMaidRoom,
          hasDriverRoom: form.hasDriverRoom,
          kitchenInstalled: form.kitchenInstalled,
          hasElevator: form.hasElevator,
          parkingAvailable: form.parkingAvailable,
          city,
          district: optionalText(form.district),
          region: optionalText(form.region),
          sqm: sqmValue,
          notes: optionalText(form.notes),
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData?.message || "تعذر إنشاء الطلب");
      }

      toast({ title: "تم الإرسال", description: "تم تسجيل طلب الباحث العقاري بنجاح" });
      // Extract seekerId from response (check multiple possible fields)
      const extractedSeekerId = responseData?.seekerId || responseData?.id || responseData?.seeker_id || null;
      setSeekerId(extractedSeekerId);
      setSubmitted(true);
      setForm({
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
        city: "",
        district: "",
        region: "",
        sqm: "",
        notes: "",
      });
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6 rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl p-10 shadow-[0_35px_120px_rgba(16,185,129,0.18)] text-right">
            <div className="flex items-center justify-end gap-4">
              <div className="rounded-3xl bg-emerald-100 p-4 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">تم استلام طلبك بنجاح</h1>
                <p className="mt-2 text-slate-500 leading-7">
                  شكراً لثقتك بنا. سيقوم أحد الوسطاء المرخصين بالتواصل معك قريباً لمراجعة احتياجاتك وتقديم أفضل الخيارات المتاحة.
                </p>
                {seekerId && (
                  <div className="mt-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4">
                    <p className="text-base font-semibold text-emerald-800 mb-2">رقم الطلب الخاص بك:</p>
                    <p className="text-2xl font-bold text-emerald-600 tracking-wider font-mono">
                      {seekerId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-4 pt-6">
              <Button
                variant="outline"
                className="rounded-2xl border-slate-300 text-slate-600 hover:bg-slate-100"
                onClick={() => setLocation("/home")}
              >
                <Home className="ml-2 h-4 w-4" />
                العودة للصفحة الرئيسية
              </Button>
              <Button
                className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setSubmitted(false)}
              >
                <FileEdit className="ml-2 h-4 w-4" />
                تقديم طلب جديد
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-3 text-right">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
            استمارة الباحث العقاري
          </span>
          <h1 className="text-4xl font-bold text-slate-900">أخبرنا بتفاصيل العقار الذي تبحث عنه</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            أدخل بياناتك وتفضيلاتك، وسيقوم فريقنا بالتواصل معك خلال وقت قصير لتزويدك بأفضل العروض المتاحة.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative space-y-10 rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl px-6 py-10 shadow-[0_35px_120px_rgba(148,163,184,0.18)]"
        >
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">البيانات الشخصية</h2>
              <span className="text-sm text-slate-400">* الحقول الإلزامية</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">الاسم الأول *</label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">اسم العائلة *</label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">رقم الجوال *</label>
                <Input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">البريد الإلكتروني *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">الجنسية *</label>
                <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">العمر *</label>
                <Input type="number" min={0} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">الدخل الشهري (﷼) *</label>
                <Input type="number" min={0} value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">الجنس *</label>
                <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">تفاصيل العقار المطلوب</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">نوع العقار *</label>
                <Select value={form.typeOfProperty} onValueChange={(value) => setForm({ ...form, typeOfProperty: value })}>
                  <SelectTrigger><SelectValue placeholder="اختر نوع العقار" /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm">نوع العقد *</label>
                <Select value={form.typeOfContract} onValueChange={(value) => setForm({ ...form, typeOfContract: value })}>
                  <SelectTrigger><SelectValue placeholder="شراء أم إيجار؟" /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm">عدد الغرف *</label>
                <Input type="number" min={0} value={form.numberOfRooms} onChange={(e) => setForm({ ...form, numberOfRooms: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">عدد الحمامات *</label>
                <Input type="number" min={0} value={form.numberOfBathrooms} onChange={(e) => setForm({ ...form, numberOfBathrooms: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">عدد صالات المعيشة *</label>
                <Input type="number" min={0} value={form.numberOfLivingRooms} onChange={(e) => setForm({ ...form, numberOfLivingRooms: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">اتجاه المنزل</label>
                <Select value={form.houseDirection} onValueChange={(value) => setForm({ ...form, houseDirection: value })}>
                  <SelectTrigger><SelectValue placeholder="غير محدد" /></SelectTrigger>
                  <SelectContent>
                    {HOUSE_DIRECTIONS.map((direction) => (
                      <SelectItem key={direction.value} value={direction.value}>{direction.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm">الميزانية المتاحة (﷼) *</label>
                <Input type="number" min={0} value={form.budgetSize} onChange={(e) => setForm({ ...form, budgetSize: e.target.value })} required />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">الموقع والمواصفات الإضافية</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">المدينة *</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">الحي</label>
                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">المنطقة</label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">المساحة المطلوبة (م²)</label>
                <Input type="number" min={0} value={form.sqm} onChange={(e) => setForm({ ...form, sqm: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.hasMaidRoom} onCheckedChange={(value) => setForm({ ...form, hasMaidRoom: Boolean(value) })} />
                يحتوي على غرفة خادمة
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.hasDriverRoom} onCheckedChange={(value) => setForm({ ...form, hasDriverRoom: Boolean(value) })} />
                يحتوي على غرفة سائق
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.kitchenInstalled} onCheckedChange={(value) => setForm({ ...form, kitchenInstalled: Boolean(value) })} />
                مطبخ مركب
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.hasElevator} onCheckedChange={(value) => setForm({ ...form, hasElevator: Boolean(value) })} />
                يوجد مصعد
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.parkingAvailable} onCheckedChange={(value) => setForm({ ...form, parkingAvailable: Boolean(value) })} />
                يوجد موقف سيارة
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm">ملاحظات إضافية</label>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-2xl"
              />
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-2xl bg-emerald-600 px-8 text-lg font-semibold text-white shadow-[0_20px_45px_rgba(16,185,129,0.25)] hover:bg-emerald-700 hover:shadow-[0_25px_60px_rgba(16,185,129,0.28)] disabled:opacity-60"
            >
              {loading ? "جاري الإرسال..." : "إرسال الطلب"}
            </Button>
          </div>

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[32px] bg-white/70 backdrop-blur-md">
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <p className="text-sm font-medium">جارٍ إرسال طلبك، يرجى الانتظار...</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
