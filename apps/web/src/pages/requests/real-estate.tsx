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
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileEdit, Home, ArrowRight, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PublicHeader from "@/components/layout/PublicHeader";
import { cn } from "@/lib/utils";

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

  const [regionOpen, setRegionOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

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
    regionId: "",
    cityId: "",
    city: "",
    district: "",
    region: "",
    sqm: "",
    notes: "",
  });

  const { data: regions } = useQuery<any[]>({
    queryKey: ["/api/locations/regions"],
    queryFn: async () => {
      const res = await fetch("/api/locations/regions");
      if (!res.ok) throw new Error("Failed to fetch regions");
      return res.json();
    },
  });

  const { data: cities } = useQuery<any[]>({
    queryKey: ["/api/locations/cities", form.regionId],
    queryFn: async () => {
      if (!form.regionId) return [];
      const res = await fetch(`/api/locations/cities?regionId=${form.regionId}`);
      if (!res.ok) throw new Error("Failed to fetch cities");
      return res.json();
    },
    enabled: !!form.regionId,
  });

  const { data: districts } = useQuery<any[]>({
    queryKey: ["/api/locations/districts", form.cityId],
    queryFn: async () => {
      if (!form.cityId) return [];
      const res = await fetch(`/api/locations/districts?cityId=${form.cityId}`);
      if (!res.ok) throw new Error("Failed to fetch districts");
      return res.json();
    },
    enabled: !!form.cityId,
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
        regionId: "",
        cityId: "",
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
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" dir="rtl">
        <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
        <PublicHeader />

        <main className="relative pt-32 pb-20 px-4 flex items-center justify-center min-h-[80vh]">
          {/* Background Blobs */}
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="glass rounded-[32px] p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600"
              >
                <CheckCircle2 className="h-10 w-10" />
              </motion.div>

              <h1 className="text-3xl font-bold text-slate-900 mb-4">تم استلام طلبك بنجاح</h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-lg mx-auto">
                شكراً لثقتك بنا. سيقوم أحد الوسطاء المرخصين بالتواصل معك قريباً لمراجعة احتياجاتك وتقديم أفضل الخيارات المتاحة.
              </p>

              {seekerId && (
                <div className="mb-10 inline-block bg-emerald-50/50 border border-emerald-100 rounded-2xl px-8 py-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-1">رقم الطلب الخاص بك</p>
                  <p className="text-3xl font-bold text-emerald-600 font-mono tracking-widest">{seekerId}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="rounded-xl h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                  onClick={() => setSubmitted(false)}
                >
                  <FileEdit className="ml-2 h-4 w-4" />
                  تقديم طلب جديد
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-8 border-slate-200 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-200"
                  onClick={() => setLocation("/")}
                >
                  <Home className="ml-2 h-4 w-4" />
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <PublicHeader />

      <main className="relative pt-32 pb-20 px-4">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium">
              <Home className="w-4 h-4" />
              <span>استمارة طلب عقار</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              أخبرنا بتفاصيل <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-teal-600">بيت أحلامك</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
              أدخل بياناتك وتفضيلاتك، وسيقوم فريقنا الخبير بالبحث عن أفضل الخيارات التي تناسب ميزانيتك واحتياجاتك.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <form
              onSubmit={handleSubmit}
              className="glass rounded-[32px] p-8 md:p-12 shadow-2xl"
            >
              <section className="space-y-8 mb-12">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">1</span>
                  <h2 className="text-xl font-bold text-slate-900">البيانات الشخصية</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">الاسم الأول <span className="text-red-500">*</span></label>
                    <Input className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">اسم العائلة <span className="text-red-500">*</span></label>
                    <Input className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">رقم الجوال <span className="text-red-500">*</span></label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end font-mono tracking-wide"
                      dir="ltr"
                      placeholder="+966 5xxxxxxxx"
                      value={form.mobileNumber}
                      onChange={(e) => setForm({ ...form, mobileNumber: formatMobileInput(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <Input type="email" className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500 text-end" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">الجنسية <span className="text-red-500">*</span></label>
                    <Input className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">العمر <span className="text-red-500">*</span></label>
                    <Input type="number" min={0} className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">الدخل الشهري (﷼) <span className="text-red-500">*</span></label>
                    <Input type="number" min={0} className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">الجنس <span className="text-red-500">*</span></label>
                    <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-8 mb-12">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">2</span>
                  <h2 className="text-xl font-bold text-slate-900">تفاصيل العقار المطلوب</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">نوع العقار <span className="text-red-500">*</span></label>
                    <Select value={form.typeOfProperty} onValueChange={(value) => setForm({ ...form, typeOfProperty: value })}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="اختر نوع العقار" /></SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">نوع العقد <span className="text-red-500">*</span></label>
                    <Select value={form.typeOfContract} onValueChange={(value) => setForm({ ...form, typeOfContract: value })}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="شراء أم إيجار؟" /></SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">عدد الغرف <span className="text-red-500">*</span></label>
                    <Input type="number" min={0} className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.numberOfRooms} onChange={(e) => setForm({ ...form, numberOfRooms: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">عدد الحمامات <span className="text-red-500">*</span></label>
                    <Input type="number" min={0} className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.numberOfBathrooms} onChange={(e) => setForm({ ...form, numberOfBathrooms: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">عدد صالات المعيشة <span className="text-red-500">*</span></label>
                    <Input type="number" min={0} className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.numberOfLivingRooms} onChange={(e) => setForm({ ...form, numberOfLivingRooms: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">اتجاه المنزل</label>
                    <Select value={form.houseDirection} onValueChange={(value) => setForm({ ...form, houseDirection: value })}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="غير محدد" /></SelectTrigger>
                      <SelectContent>
                        {HOUSE_DIRECTIONS.map((direction) => (
                          <SelectItem key={direction.value} value={direction.value}>{direction.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">الميزانية المتاحة (﷼) <span className="text-red-500">*</span></label>
                    <Input type="number" min={0} className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.budgetSize} onChange={(e) => setForm({ ...form, budgetSize: e.target.value })} required />
                  </div>
                </div>
              </section>

              <section className="space-y-8 mb-12">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">3</span>
                  <h2 className="text-xl font-bold text-slate-900">الموقع والمواصفات الإضافية</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">المنطقة</label>
                    <Popover open={regionOpen} onOpenChange={setRegionOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={regionOpen} className={cn("w-full justify-between h-12 rounded-xl", !form.region && "text-muted-foreground")}>
                          {form.region || "اختر المنطقة"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                    setForm({ ...form, region: r.nameAr || r.nameEn, regionId: String(r.id), city: "", cityId: "", district: "" });
                                    setRegionOpen(false);
                                  }}
                                >
                                  <Check className={cn("ml-2 h-4 w-4", form.regionId === String(r.id) ? "opacity-100" : "opacity-0")} />
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
                    <label className="text-sm font-medium text-slate-700">المدينة <span className="text-red-500">*</span></label>
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={cityOpen} disabled={!form.regionId} className={cn("w-full justify-between h-12 rounded-xl", !form.city && "text-muted-foreground")}>
                          {form.city || "اختر المدينة"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                    setForm({ ...form, city: c.nameAr || c.nameEn, cityId: String(c.id), district: "" });
                                    setCityOpen(false);
                                  }}
                                >
                                  <Check className={cn("ml-2 h-4 w-4", form.cityId === String(c.id) ? "opacity-100" : "opacity-0")} />
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
                    <label className="text-sm font-medium text-slate-700">الحي</label>
                    <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={districtOpen} disabled={!form.cityId} className={cn("w-full justify-between h-12 rounded-xl", !form.district && "text-muted-foreground")}>
                          {form.district || "اختر الحي"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                    setForm({ ...form, district: d.nameAr || d.nameEn });
                                    setDistrictOpen(false);
                                  }}
                                >
                                  <Check className={cn("ml-2 h-4 w-4", form.district === (d.nameAr || d.nameEn) ? "opacity-100" : "opacity-0")} />
                                  {d.nameAr || d.nameEn}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">المساحة المطلوبة (م²)</label>
                    <Input type="number" min={0} className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-emerald-500" value={form.sqm} onChange={(e) => setForm({ ...form, sqm: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer">
                    <Checkbox checked={form.hasMaidRoom} onCheckedChange={(value) => setForm({ ...form, hasMaidRoom: Boolean(value) })} />
                    <span className="text-slate-700 font-medium">غرفة خادمة</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer">
                    <Checkbox checked={form.hasDriverRoom} onCheckedChange={(value) => setForm({ ...form, hasDriverRoom: Boolean(value) })} />
                    <span className="text-slate-700 font-medium">غرفة سائق</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer">
                    <Checkbox checked={form.kitchenInstalled} onCheckedChange={(value) => setForm({ ...form, kitchenInstalled: Boolean(value) })} />
                    <span className="text-slate-700 font-medium">مطبخ مركب</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer">
                    <Checkbox checked={form.hasElevator} onCheckedChange={(value) => setForm({ ...form, hasElevator: Boolean(value) })} />
                    <span className="text-slate-700 font-medium">يوجد مصعد</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer">
                    <Checkbox checked={form.parkingAvailable} onCheckedChange={(value) => setForm({ ...form, parkingAvailable: Boolean(value) })} />
                    <span className="text-slate-700 font-medium">موقف سيارة</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">ملاحظات إضافية</label>
                  <Textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="rounded-2xl bg-white/50 border-slate-200 focus:ring-emerald-500"
                    placeholder="أي تفاصيل أخرى تود إضافتها..."
                  />
                </div>
              </section>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 rounded-full bg-emerald-600 px-10 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 disabled:opacity-60 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      إرسال الطلب
                      <ArrowRight className="mr-2 h-5 w-5 transform rotate-180" />
                    </>
                  )}
                </Button>
              </div>

              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[32px] bg-white/80 backdrop-blur-sm">
                  {/* Loader overlay handled by button state mainly, but keep if user wants generic block */}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
