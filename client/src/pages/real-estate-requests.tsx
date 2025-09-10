import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const PROPERTY_TYPES = [
  "شقة","فيلا","دوبلكس","تاون هاوس","استوديو","بيت","عمارة","مكتب","محل","مستودع","أرض"
];

export default function RealEstateRequestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    gender: "",
    requestType: "buy",
    pricePeriod: "",
    propertyTypes: [] as string[],
    propertyKind: "",
    city: "",
    neighborhood: "",
    minPrice: "",
    maxPrice: "",
    minBedrooms: "",
    maxBedrooms: "",
    bedrooms: "",
    bathrooms: "",
    minBathrooms: "",
    minArea: "",
    maxArea: "",
    furnishing: "",
    orientation: "",
    hasElevator: false,
    hasParking: false,
    timeframe: "",
    livingRooms: "",
    driverRooms: "",
    maidRooms: "",
    hasSeparateMajles: false,
    requestDate: new Date().toISOString().slice(0,10),
    notes: "",
  });

  const toggleType = (t: string) => {
    setForm((f) => {
      const set = new Set(f.propertyTypes);
      if (set.has(t)) set.delete(t); else set.add(t);
      return { ...f, propertyTypes: Array.from(set) };
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone) {
      toast({ title: "تحقق من الحقول", description: "الاسم ورقم الجوال مطلوبان" });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail || undefined,
          customerPhone: form.customerPhone || undefined,
          gender: form.gender || undefined,
          requestType: form.requestType,
          pricePeriod: form.requestType === 'rent' && form.pricePeriod ? form.pricePeriod : undefined,
          propertyTypes: form.propertyTypes.length ? form.propertyTypes : undefined,
          propertyKind: form.propertyKind || undefined,
          city: form.city || undefined,
          neighborhood: form.neighborhood || undefined,
          minPrice: form.minPrice || undefined,
          maxPrice: form.maxPrice || undefined,
          minBedrooms: form.minBedrooms || undefined,
          maxBedrooms: form.maxBedrooms || undefined,
          bedrooms: form.bedrooms || undefined,
          bathrooms: form.bathrooms || undefined,
          minBathrooms: form.minBathrooms || undefined,
          minArea: form.minArea || undefined,
          maxArea: form.maxArea || undefined,
          furnishing: form.furnishing || undefined,
          orientation: form.orientation || undefined,
          hasElevator: form.hasElevator || undefined,
          hasParking: form.hasParking || undefined,
          timeframe: form.timeframe || undefined,
          livingRooms: form.livingRooms || undefined,
          driverRooms: form.driverRooms || undefined,
          maidRooms: form.maidRooms || undefined,
          hasSeparateMajles: form.hasSeparateMajles || undefined,
          requestDate: form.requestDate ? new Date(form.requestDate) : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "فشل إرسال الطلب");
      }
      toast({ title: "تم الإرسال", description: "تم إرسال طلبك بنجاح" });
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        gender: "",
        requestType: "buy",
        pricePeriod: "",
        propertyTypes: [],
        propertyKind: "",
        city: "",
        neighborhood: "",
        minPrice: "",
        maxPrice: "",
        minBedrooms: "",
        maxBedrooms: "",
        bedrooms: "",
        bathrooms: "",
        minBathrooms: "",
        minArea: "",
        maxArea: "",
        furnishing: "",
        orientation: "",
        hasElevator: false,
        hasParking: false,
        timeframe: "",
        livingRooms: "",
        driverRooms: "",
        maidRooms: "",
        hasSeparateMajles: false,
        requestDate: new Date().toISOString().slice(0,10),
        notes: "",
      });
      setTimeout(() => setLocation("/listings"), 1200);
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message || "تعذر إرسال الطلب" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10" dir="rtl">
        <h1 className="text-2xl font-semibold mb-2">الطلبات العقارية</h1>
        <p className="text-gray-600 mb-8">املأ التفاصيل التالية لنساعدك في العثور على العقار المناسب.</p>

        <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">الاسم الكامل</label>
              <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
            </div>
            <div>
              <label className="block mb-1 text-sm">رقم الجوال</label>
              <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required />
            </div>
            <div>
              <label className="block mb-1 text-sm">البريد الإلكتروني (اختياري)</label>
              <Input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">الجنس</label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm">نوع الطلب</label>
              <Select value={form.requestType} onValueChange={(v) => setForm({ ...form, requestType: v })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">شراء</SelectItem>
                  <SelectItem value="rent">إيجار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.requestType === 'rent' && (
              <div>
                <label className="block mb-1 text-sm">الفترة السعرية</label>
                <Select value={form.pricePeriod} onValueChange={(v) => setForm({ ...form, pricePeriod: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="yearly">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm">نوع العقار</label>
            <Select value={form.propertyKind} onValueChange={(v) => setForm({ ...form, propertyKind: v })}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">المدينة</label>
              <Input placeholder="الرياض" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">الحي</label>
              <Input placeholder="الملز" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm">الحد الأدنى للسعر</label>
              <Input type="number" inputMode="numeric" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">الحد الأعلى للسعر</label>
              <Input type="number" inputMode="numeric" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">الحد الأدنى للحمامات</label>
              <Input type="number" step="0.5" inputMode="decimal" value={form.minBathrooms} onChange={(e) => setForm({ ...form, minBathrooms: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">غرف النوم (أدنى)</label>
              <Input type="number" inputMode="numeric" value={form.minBedrooms} onChange={(e) => setForm({ ...form, minBedrooms: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">غرف النوم (أعلى)</label>
              <Input type="number" inputMode="numeric" value={form.maxBedrooms} onChange={(e) => setForm({ ...form, maxBedrooms: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm">عدد غرف النوم</label>
              <Input type="number" inputMode="numeric" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">عدد الحمامات</label>
              <Input type="number" step="0.5" inputMode="decimal" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">عدد صالات المعيشة</label>
              <Input type="number" inputMode="numeric" value={form.livingRooms} onChange={(e) => setForm({ ...form, livingRooms: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm">عدد غرف السائق</label>
              <Input type="number" inputMode="numeric" value={form.driverRooms} onChange={(e) => setForm({ ...form, driverRooms: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">عدد غرف الخادمة</label>
              <Input type="number" inputMode="numeric" value={form.maidRooms} onChange={(e) => setForm({ ...form, maidRooms: e.target.value })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <Checkbox checked={form.hasSeparateMajles} onCheckedChange={(v: any) => setForm({ ...form, hasSeparateMajles: Boolean(v) })} />
                يوجد مجالس منفصلة
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">المساحة (م²) - حد أدنى</label>
              <Input type="number" inputMode="numeric" value={form.minArea} onChange={(e) => setForm({ ...form, minArea: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm">المساحة (م²) - حد أعلى</label>
              <Input type="number" inputMode="numeric" value={form.maxArea} onChange={(e) => setForm({ ...form, maxArea: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm">التأثيث</label>
              <Select value={form.furnishing} onValueChange={(v) => setForm({ ...form, furnishing: v })}>
                <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون</SelectItem>
                  <SelectItem value="partial">جزئي</SelectItem>
                  <SelectItem value="full">كامل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm">الاتجاه</label>
              <Select value={form.orientation} onValueChange={(v) => setForm({ ...form, orientation: v })}>
                <SelectTrigger><SelectValue placeholder="غير محدد" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">شمال</SelectItem>
                  <SelectItem value="south">جنوب</SelectItem>
                  <SelectItem value="east">شرق</SelectItem>
                  <SelectItem value="west">غرب</SelectItem>
                  <SelectItem value="corner">زاوية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm">الإطار الزمني</label>
              <Select value={form.timeframe} onValueChange={(v) => setForm({ ...form, timeframe: v })}>
                <SelectTrigger><SelectValue placeholder="غير محدد" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">فوري</SelectItem>
                  <SelectItem value="1-3m">1-3 أشهر</SelectItem>
                  <SelectItem value="3-6m">3-6 أشهر</SelectItem>
                  <SelectItem value="6m+">أكثر من 6 أشهر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <Checkbox checked={form.hasElevator} onCheckedChange={(v: any) => setForm({ ...form, hasElevator: Boolean(v) })} />
              مصعد
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={form.hasParking} onCheckedChange={(v: any) => setForm({ ...form, hasParking: Boolean(v) })} />
              موقف سيارة
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">تاريخ الطلب</label>
              <Input type="date" value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm">ملاحظات إضافية</label>
            <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "جار الإرسال..." : "إرسال الطلب"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
