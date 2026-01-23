/**
 * marketing-request.tsx - Marketing Request Form Page
 * 
 * Location: apps/web/src/ → Pages/ → Public Pages → marketing-request.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Public marketing request submission form. Provides:
 * - Marketing request form
 * - Request submission
 * 
 * Route: /marketing-request
 * 
 * Related Files:
 * - apps/web/src/pages/marketing-requests.tsx - Marketing requests board
 * - apps/api/routes/marketing-requests.ts - Marketing requests API routes
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface FormState {
  title: string;
  summary: string;
  requirements: string;
  propertyType: string;
  listingType: string;
  city: string;
  district: string;
  region: string;
  budgetMin: string;
  budgetMax: string;
  preferredStartDate: string;
  preferredEndDate: string;
  commissionExpectation: string;
  seriousnessTier: "STANDARD" | "SERIOUS" | "ENTERPRISE";
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  propertyId: string;
}

const INITIAL_FORM: FormState = {
  title: "",
  summary: "",
  requirements: "",
  propertyType: "",
  listingType: "",
  city: "",
  district: "",
  region: "",
  budgetMin: "",
  budgetMax: "",
  preferredStartDate: "",
  preferredEndDate: "",
  commissionExpectation: "",
  seriousnessTier: "STANDARD",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  propertyId: "",
};

export default function MarketingRequestSubmissionPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string[] => {
    const nextErrors: string[] = [];
    if (form.title.trim().length < 3) nextErrors.push("يرجى إدخال عنوان واضح للطلب.");
    if (form.summary.trim().length < 20) nextErrors.push("الوصف المختصر يجب أن يكون 20 حرفًا على الأقل.");
    if (!form.propertyType.trim()) nextErrors.push("نوع العقار مطلوب.");
    if (!form.city.trim()) nextErrors.push("المدينة مطلوبة.");
    if (!form.contactName.trim()) nextErrors.push("اسم جهة التواصل مطلوب.");
    if (!form.contactPhone.trim() && !form.contactEmail.trim()) nextErrors.push("يرجى إدخال رقم تواصل أو بريد إلكتروني.");
    if (form.budgetMin && form.budgetMax && Number(form.budgetMin) > Number(form.budgetMax)) {
      nextErrors.push("الحد الأدنى للميزانية لا يمكن أن يتجاوز الحد الأعلى.");
    }
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);
    setMessage(null);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        requirements: form.requirements.trim() || undefined,
        propertyType: form.propertyType.trim(),
        listingType: form.listingType.trim() || undefined,
        city: form.city.trim(),
        district: form.district.trim() || undefined,
        region: form.region.trim() || undefined,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        preferredStartDate: form.preferredStartDate ? new Date(form.preferredStartDate).toISOString() : undefined,
        preferredEndDate: form.preferredEndDate ? new Date(form.preferredEndDate).toISOString() : undefined,
        commissionExpectation: form.commissionExpectation ? Number(form.commissionExpectation) : undefined,
        seriousnessTier: form.seriousnessTier,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        propertyId: form.propertyId.trim() || undefined,
      };

      const response = await fetch("/api/marketing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setMessage("يرجى تسجيل الدخول لإرسال طلب التسويق.");
        return;
      }

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.message || "تعذر إرسال طلب التسويق، حاول مرة أخرى.");
      }

      setMessage("تم إرسال الطلب بنجاح! سيتم مراجعته وإشعار الوسطاء المعتمدين.");
      toast({
        title: "تم استلام طلب التسويق",
        description: "سيتم إخطار الوسطاء المؤهلين بعد مراجعة البيانات.",
      });
      setForm(INITIAL_FORM);
      setTimeout(() => navigate("/home/platform"), 2500);
    } catch (error) {
      console.error("Marketing request submission error", error);
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
      toast({
        title: "تعذر إرسال الطلب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive" as any,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">أرسل طلب تسويق لعقارك</h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            شارك تفاصيل العقار وخطة التسويق المتوقعة ليتمكن الوسطاء المعتمدون من تقديم عروضهم المالية وخطتهم التنفيذية.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-3xl border border-slate-100 p-6 md:p-10 space-y-8">
          {errors.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4" role="alert">
              <strong className="block mb-2">يرجى مراجعة البيانات التالية:</strong>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-4" role="status">
              {message}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm text-slate-600">عنوان الطلب *</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: حملة تسويق لفيلا في حي الياسمين"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">نوع العقار *</span>
              <input
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: فيلا، شقة، أرض"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">نوع العرض</span>
              <input
                name="listingType"
                value={form.listingType}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="بيع، إيجار، استثمار"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">المدينة *</span>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: الرياض"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">الحي</span>
              <input
                name="district"
                value={form.district}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: حي الياسمين"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">المنطقة</span>
              <input
                name="region"
                value={form.region}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: منطقة الرياض"
              />
            </label>
          </section>

          <section className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-600">وصف مختصر للحملة *</span>
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                className="mt-1 w-full min-h-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="عرّفنا بالعقار وأهداف الحملة التسويقية والنتيجة المتوقعة"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">تفاصيل إضافية (اختياري)</span>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                className="mt-1 w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="اذكر المتطلبات الخاصة أو المستندات المساندة"
              />
            </label>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-slate-600">الميزانية التقديرية للحملة</span>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <input
                  name="budgetMin"
                  value={form.budgetMin}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="الحد الأدنى"
                />
                <input
                  name="budgetMax"
                  value={form.budgetMax}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="الحد الأعلى"
                />
              </div>
            </div>
            <div>
              <span className="text-sm text-slate-600">نسبة السعي المتوقعة</span>
              <input
                name="commissionExpectation"
                value={form.commissionExpectation}
                onChange={handleChange}
                type="number"
                min="0"
                step="0.1"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: 2.5"
              />
            </div>
            <div>
              <span className="text-sm text-slate-600">تاريخ البدء المفضل</span>
              <input
                name="preferredStartDate"
                value={form.preferredStartDate}
                onChange={handleChange}
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-sm text-slate-600">تاريخ الانتهاء المتوقع</span>
              <input
                name="preferredEndDate"
                value={form.preferredEndDate}
                onChange={handleChange}
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm text-slate-600">فئة الطلب</span>
              <select
                name="seriousnessTier"
                value={form.seriousnessTier}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="STANDARD">أساسي</option>
                <option value="SERIOUS">جاد (أولوية وسرعة أعلى)</option>
                <option value="ENTERPRISE">مؤسسي (متطلبات متقدمة)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">معرف العقار (اختياري)</span>
              <input
                name="propertyId"
                value={form.propertyId}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="اربط الطلب بعقار مسجل في النظام"
              />
            </label>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm text-slate-600">اسم جهة التواصل *</span>
              <input
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="مثال: أحمد العتيبي"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">رقم التواصل</span>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="05XXXXXXXX"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">البريد الإلكتروني</span>
              <input
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                placeholder="example@email.com"
                type="email"
              />
            </label>
          </section>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "جاري إرسال الطلب..." : "إرسال الطلب للمراجعة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
