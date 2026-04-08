/**
 * PreferencesSection.tsx — Expanded notification preferences (9 categories)
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bell, Save, Users, CheckCircle, TrendingUp,
  Handshake, FileSignature, Calendar, Building,
  Clock, CreditCard,
} from "lucide-react";
import { apiGet, apiPut } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

const preferencesSchema = z.object({
  newLeads: z.boolean(),
  taskUpdates: z.boolean(),
  newDeals: z.boolean(),
  brokerRequests: z.boolean(),
  agreementSigned: z.boolean(),
  appointmentReminders: z.boolean(),
  propertyInquiries: z.boolean(),
  listingExpiry: z.boolean(),
  commissionPayouts: z.boolean(),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

const NOTIFICATION_GROUPS = [
  {
    title: "العملاء والصفقات",
    items: [
      { key: "newLeads" as const, icon: Users, label: "عملاء محتملين جدد", desc: "إشعار عند إضافة عميل محتمل جديد لقائمتك" },
      { key: "newDeals" as const, icon: TrendingUp, label: "صفقات جديدة", desc: "إشعار عند إنشاء صفقة جديدة أو تغيير حالتها" },
      { key: "taskUpdates" as const, icon: CheckCircle, label: "تحديثات المهام", desc: "إشعار عند اكتمال أو تحديث المهام المسندة إليك" },
    ],
  },
  {
    title: "التعاون والعقود",
    items: [
      { key: "brokerRequests" as const, icon: Handshake, label: "طلبات التعاون", desc: "إشعار عند وجود طلب تعاون جديد أو قبول طلبك" },
      { key: "agreementSigned" as const, icon: FileSignature, label: "توقيع العقود", desc: "إشعار عند توقيع عقد التعاون من أحد الأطراف" },
    ],
  },
  {
    title: "المواعيد والعقارات",
    items: [
      { key: "appointmentReminders" as const, icon: Calendar, label: "تذكير المواعيد", desc: "تذكير قبل المواعيد المجدولة بساعة" },
      { key: "propertyInquiries" as const, icon: Building, label: "استفسارات العقارات", desc: "إشعار عند وجود استفسار على عقاراتك المعروضة" },
      { key: "listingExpiry" as const, icon: Clock, label: "انتهاء الإعلانات", desc: "تنبيه قبل انتهاء صلاحية إعلاناتك العقارية" },
    ],
  },
  {
    title: "المالية",
    items: [
      { key: "commissionPayouts" as const, icon: CreditCard, label: "العمولات والمستحقات", desc: "إشعار عند تحويل عمولة أو تحديث مستحقاتك" },
    ],
  },
];

export default function PreferencesSection() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      newLeads: true,
      taskUpdates: true,
      newDeals: true,
      brokerRequests: true,
      agreementSigned: true,
      appointmentReminders: true,
      propertyInquiries: true,
      listingExpiry: true,
      commissionPayouts: true,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const data: any = await apiGet("/api/auth/preferences");
        if (data?.preferences) {
          form.reset({
            newLeads: data.preferences.newLeads ?? true,
            taskUpdates: data.preferences.taskUpdates ?? true,
            newDeals: data.preferences.newDeals ?? true,
            brokerRequests: data.preferences.brokerRequests ?? true,
            agreementSigned: data.preferences.agreementSigned ?? true,
            appointmentReminders: data.preferences.appointmentReminders ?? true,
            propertyInquiries: data.preferences.propertyInquiries ?? true,
            listingExpiry: data.preferences.listingExpiry ?? true,
            commissionPayouts: data.preferences.commissionPayouts ?? true,
          });
        }
      } catch {
        // Use defaults
      }
    })();
  }, [form]);

  const handleSubmit = async (values: PreferencesFormValues) => {
    setIsSaving(true);
    try {
      await apiPut("/api/auth/preferences", values);
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث إعدادات الإشعارات" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary/10 p-2 text-primary"><Bell size={18} /></span>
          <div>
            <CardTitle>إعدادات الإشعارات</CardTitle>
            <CardDescription>حدد الإشعارات التي ترغب باستلامها</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {NOTIFICATION_GROUPS.map((group, gi) => (
              <div key={gi} className="space-y-3">
                <h4 className="text-sm font-bold text-muted-foreground">{group.title}</h4>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-muted-foreground shrink-0">
                          <item.icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name={item.key}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-y-0">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                {gi < NOTIFICATION_GROUPS.length - 1 && <Separator />}
              </div>
            ))}

            <Button type="submit" disabled={isSaving} className="gap-2">
              <Save size={16} />
              {isSaving ? "جاري الحفظ..." : "حفظ إعدادات الإشعارات"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
