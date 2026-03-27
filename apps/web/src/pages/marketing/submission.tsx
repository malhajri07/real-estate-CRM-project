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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/70 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-foreground mb-3">أرسل طلب تسويق لعقارك</h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            شارك تفاصيل العقار وخطة التسويق المتوقعة ليتمكن الوسطاء المعتمدون من تقديم عروضهم المالية وخطتهم التنفيذية.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-card shadow-xl rounded-3xl border border-border p-6 md:p-10 space-y-8">
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
            <div className="rounded-2xl border border-primary/20 bg-primary/10 text-primary p-4" role="status">
              {message}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Label className="block">
              <span className="text-sm text-muted-foreground">عنوان الطلب *</span>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="مثال: حملة تسويق لفيلا في حي الياسمين"
                required
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">نوع العقار *</span>
              <Input
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="مثال: فيلا، شقة، أرض"
                required
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">نوع العرض</span>
              <Input
                name="listingType"
                value={form.listingType}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="بيع، إيجار، استثمار"
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">المدينة *</span>
              <Input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="مثال: الرياض"
                required
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">الحي</span>
              <Input
                name="district"
                value={form.district}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="مثال: حي الياسمين"
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">المنطقة</span>
              <Input
                name="region"
                value={form.region}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="مثال: منطقة الرياض"
              />
            </Label>
          </section>

          <section className="space-y-4">
            <Label className="block">
              <span className="text-sm text-muted-foreground">وصف مختصر للحملة *</span>
              <Textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                className="mt-1 w-full min-h-[140px] rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="عرّفنا بالعقار وأهداف الحملة التسويقية والنتيجة المتوقعة"
                required
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">تفاصيل إضافية (اختياري)</span>
              <Textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                className="mt-1 w-full min-h-[120px] rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="اذكر المتطلبات الخاصة أو المستندات المساندة"
              />
            </Label>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-muted-foreground">الميزانية التقديرية للحملة</span>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  name="budgetMin"
                  value={form.budgetMin}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                  placeholder="الحد الأدنى"
                />
                <Input
                  name="budgetMax"
                  value={form.budgetMax}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                  placeholder="الحد الأعلى"
                />
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">نسبة السعي المتوقعة</span>
              <Input
                name="commissionExpectation"
                value={form.commissionExpectation}
                onChange={handleChange}
                type="number"
                min="0"
                step="0.1"
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="مثال: 2.5"
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">تاريخ البدء المفضل</span>
              <Input
                name="preferredStartDate"
                value={form.preferredStartDate}
                onChange={handleChange}
                type="date"
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">تاريخ الانتهاء المتوقع</span>
              <Input
                name="preferredEndDate"
                value={form.preferredEndDate}
                onChange={handleChange}
                type="date"
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="block">
              <Label className="text-sm text-muted-foreground">فئة الطلب</Label>
              <Select value={form.seriousnessTier} onValueChange={(value) => setForm((prev) => ({ ...prev, seriousnessTier: value as FormState["seriousnessTier"] }))}>
                <SelectTrigger className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">أساسي</SelectItem>
                  <SelectItem value="SERIOUS">جاد (أولوية وسرعة أعلى)</SelectItem>
                  <SelectItem value="ENTERPRISE">مؤسسي (متطلبات متقدمة)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Label className="block">
              <span className="text-sm text-muted-foreground">معرف العقار (اختياري)</span>
              <Input
                name="propertyId"
                value={form.propertyId}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="اربط الطلب بعقار مسجل في النظام"
              />
            </Label>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Label className="block">
              <span className="text-sm text-muted-foreground">اسم جهة التواصل *</span>
              <Input
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="مثال: أحمد العتيبي"
                required
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">رقم التواصل</span>
              <Input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="05XXXXXXXX"
              />
            </Label>
            <Label className="block">
              <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
              <Input
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                placeholder="example@email.com"
                type="email"
              />
            </Label>
          </section>

          <div className="pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "جاري إرسال الطلب..." : "إرسال الطلب للمراجعة"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
