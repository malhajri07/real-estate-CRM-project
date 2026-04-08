/**
 * PaymentsSection.tsx — IBAN, bank details for commission payouts
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Save, Landmark, ShieldCheck } from "lucide-react";

const SAUDI_BANKS = [
  "البنك الأهلي السعودي",
  "بنك الراجحي",
  "البنك السعودي الفرنسي",
  "بنك الرياض",
  "البنك السعودي البريطاني (ساب)",
  "البنك العربي الوطني",
  "بنك الجزيرة",
  "بنك البلاد",
  "بنك الإنماء",
  "البنك السعودي للاستثمار",
  "مصرف الراجحي",
];

const paymentSchema = z.object({
  iban: z.string()
    .regex(/^SA\d{22}$/, "الآيبان السعودي يجب أن يبدأ بـ SA ويتكون من 24 حرف")
    .or(z.literal(""))
    .optional(),
  bankName: z.string().optional(),
});

type FormValues = z.infer<typeof paymentSchema>;

interface Props {
  userMetadata: any;
  onSave: (values: any) => void;
  isSaving: boolean;
}

export default function PaymentsSection({ userMetadata, onSave, isSaving }: Props) {
  const meta = (userMetadata as Record<string, any>) || {};

  const form = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      iban: meta.iban || "",
      bankName: meta.bankName || "",
    },
  });

  useEffect(() => {
    form.reset({
      iban: meta.iban || "",
      bankName: meta.bankName || "",
    });
  }, [userMetadata, form]);

  const handleSubmit = (values: FormValues) => {
    onSave({
      iban: values.iban,
      bankName: values.bankName,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><CreditCard size={18} /></span>
            <div>
              <CardTitle>بيانات الحساب البنكي</CardTitle>
              <CardDescription>لتحويل العمولات والمستحقات المالية</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="bankName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Landmark size={14} />
                    اسم البنك
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر البنك" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SAUDI_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="iban" render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الآيبان (IBAN)</FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      className="text-start tabular-nums font-mono tracking-wider"
                      placeholder="SA0000000000000000000000"
                      maxLength={24}
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">الآيبان السعودي: SA + 22 رقم (إجمالي 24 حرف)</p>
                </FormItem>
              )} />

              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground mb-0.5">أمان بياناتك المالية</p>
                  <p>بيانات الحساب البنكي محفوظة بشكل مشفر ولا يتم مشاركتها مع أي طرف. تُستخدم فقط لتحويل العمولات المستحقة.</p>
                </div>
              </div>

              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save size={16} />
                {isSaving ? "جاري الحفظ..." : "حفظ البيانات المالية"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
