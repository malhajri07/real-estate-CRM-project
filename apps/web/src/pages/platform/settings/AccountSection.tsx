/**
 * AccountSection.tsx — Password change + active sessions
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone, Monitor, Clock } from "lucide-react";
import { apiPut } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function AccountSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await apiPut("/api/auth/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast({ title: "تم بنجاح", description: "تم تغيير كلمة المرور بنجاح" });
      form.reset();
    } catch (err: any) {
      const msg = err?.message?.includes("غير صحيحة") ? "كلمة المرور الحالية غير صحيحة" : "فشل تغيير كلمة المرور";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><Shield size={18} /></span>
            <div>
              <CardTitle>كلمة المرور</CardTitle>
              <CardDescription>قم بتحديث كلمة المرور بانتظام لحماية حسابك</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-md">
              <FormField control={form.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الحالية</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الجديدة</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Shield size={16} />
                {isSubmitting ? "جاري التغيير..." : "تغيير كلمة المرور"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><Monitor size={18} /></span>
            <div>
              <CardTitle>الجلسات النشطة</CardTitle>
              <CardDescription>الأجهزة المتصلة حالياً بحسابك</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current session */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Monitor size={20} className="text-primary" />
              <div>
                <p className="text-sm font-bold">هذا الجهاز</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />
                  نشط الآن
                </p>
              </div>
            </div>
            <Badge variant="default" className="gap-1">
              الجلسة الحالية
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            إذا لاحظت أي نشاط مشبوه، قم بتغيير كلمة المرور فوراً.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
