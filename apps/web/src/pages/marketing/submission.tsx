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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPost } from "@/lib/apiClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const marketingSchema = z.object({
  title: z.string().min(3, "يرجى إدخال عنوان واضح للطلب (3 أحرف على الأقل)"),
  summary: z.string().min(20, "الوصف المختصر يجب أن يكون 20 حرفًا على الأقل"),
  requirements: z.string().optional().default(""),
  propertyType: z.string().min(1, "نوع العقار مطلوب"),
  listingType: z.string().optional().default(""),
  city: z.string().min(1, "المدينة مطلوبة"),
  district: z.string().optional().default(""),
  region: z.string().optional().default(""),
  budgetMin: z.string().optional().default(""),
  budgetMax: z.string().optional().default(""),
  preferredStartDate: z.string().optional().default(""),
  preferredEndDate: z.string().optional().default(""),
  commissionExpectation: z.string().optional().default(""),
  seriousnessTier: z.enum(["STANDARD", "SERIOUS", "ENTERPRISE"]).default("STANDARD"),
  contactName: z.string().min(1, "اسم جهة التواصل مطلوب"),
  contactPhone: z.string().optional().default(""),
  contactEmail: z.string().optional().default(""),
  propertyId: z.string().optional().default(""),
}).refine(
  (data) => data.contactPhone?.trim() || data.contactEmail?.trim(),
  {
    message: "يرجى إدخال رقم تواصل أو بريد إلكتروني",
    path: ["contactPhone"],
  }
).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return Number(data.budgetMin) <= Number(data.budgetMax);
    }
    return true;
  },
  {
    message: "الحد الأدنى للميزانية لا يمكن أن يتجاوز الحد الأعلى",
    path: ["budgetMin"],
  }
);

type MarketingFormData = z.infer<typeof marketingSchema>;

const DEFAULT_VALUES: MarketingFormData = {
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
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<MarketingFormData>({
    resolver: zodResolver(marketingSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const onSubmit = async (data: MarketingFormData) => {
    setMessage(null);
    setSubmitting(true);

    try {
      const payload = {
        title: data.title.trim(),
        summary: data.summary.trim(),
        requirements: data.requirements?.trim() || undefined,
        propertyType: data.propertyType.trim(),
        listingType: data.listingType?.trim() || undefined,
        city: data.city.trim(),
        district: data.district?.trim() || undefined,
        region: data.region?.trim() || undefined,
        budgetMin: data.budgetMin ? Number(data.budgetMin) : undefined,
        budgetMax: data.budgetMax ? Number(data.budgetMax) : undefined,
        preferredStartDate: data.preferredStartDate ? new Date(data.preferredStartDate).toISOString() : undefined,
        preferredEndDate: data.preferredEndDate ? new Date(data.preferredEndDate).toISOString() : undefined,
        commissionExpectation: data.commissionExpectation ? Number(data.commissionExpectation) : undefined,
        seriousnessTier: data.seriousnessTier,
        contactName: data.contactName.trim(),
        contactPhone: data.contactPhone?.trim() || undefined,
        contactEmail: data.contactEmail?.trim() || undefined,
        propertyId: data.propertyId?.trim() || undefined,
      };

      try {
        await apiPost("/api/marketing-requests", payload);
      } catch (err: any) {
        if (err?.message?.startsWith("401")) {
          setMessage("يرجى تسجيل الدخول لإرسال طلب التسويق.");
          return;
        }
        throw new Error("تعذر إرسال طلب التسويق، حاول مرة أخرى.");
      }

      setMessage("تم إرسال الطلب بنجاح! سيتم مراجعته وإشعار الوسطاء المعتمدين.");
      toast({
        title: "تم استلام طلب التسويق",
        description: "سيتم إخطار الوسطاء المؤهلين بعد مراجعة البيانات.",
      });
      form.reset(DEFAULT_VALUES);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card shadow-xl rounded-3xl border border-border p-6 md:p-10 space-y-8">
            {Object.keys(form.formState.errors).length > 0 && form.formState.isSubmitted && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive p-4" role="alert">
                <strong className="block mb-2">يرجى مراجعة البيانات التالية:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {Object.values(form.formState.errors).map((error, idx) => (
                    <li key={idx}>{error?.message as string}</li>
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
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">عنوان الطلب *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="مثال: حملة تسويق لفيلا في حي الياسمين"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">نوع العقار *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="مثال: فيلا، شقة، أرض"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">نوع العرض</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="بيع، إيجار، استثمار"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">المدينة *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="مثال: الرياض"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">الحي</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="مثال: حي الياسمين"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">المنطقة</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="مثال: منطقة الرياض"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">وصف مختصر للحملة *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="mt-1 w-full min-h-[140px] rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="عرّفنا بالعقار وأهداف الحملة التسويقية والنتيجة المتوقعة"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">تفاصيل إضافية (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="mt-1 w-full min-h-[120px] rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="اذكر المتطلبات الخاصة أو المستندات المساندة"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-muted-foreground">الميزانية التقديرية للحملة</span>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <FormField
                    control={form.control}
                    name="budgetMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                            placeholder="الحد الأدنى"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budgetMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                            placeholder="الحد الأعلى"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="commissionExpectation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">نسبة السعي المتوقعة</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.1"
                        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="مثال: 2.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">تاريخ البدء المفضل</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">تاريخ الانتهاء المتوقع</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="seriousnessTier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">فئة الطلب</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STANDARD">أساسي</SelectItem>
                        <SelectItem value="SERIOUS">جاد (أولوية وسرعة أعلى)</SelectItem>
                        <SelectItem value="ENTERPRISE">مؤسسي (متطلبات متقدمة)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">معرف العقار (اختياري)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="اربط الطلب بعقار مسجل في النظام"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">اسم جهة التواصل *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="مثال: أحمد العتيبي"
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
                    <FormLabel className="text-sm text-muted-foreground">رقم التواصل</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="05XXXXXXXX"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm focus:border-primary/20 focus:outline-none"
                        placeholder="example@email.com"
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="pt-6 border-t border-border">
              <Button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "جاري إرسال الطلب..." : "إرسال الطلب للمراجعة"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
