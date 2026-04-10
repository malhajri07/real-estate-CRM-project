/**
 * AccountSection.tsx — Password change + active sessions + login history (E13).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone, Monitor, Clock, History } from "lucide-react";
import { apiGet, apiPut } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

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

      {/* Login History (E13) */}
      <LoginHistory />
    </div>
  );
}

/**
 * Login history section — last 10 login events with device + IP (E13).
 * Source: GET /api/auth/login-history. Consumer: settings security tab.
 */
function LoginHistory() {
  const { data: history } = useQuery<{ id: string; loginAt: string; ipAddress: string | null; device: string }[]>({
    queryKey: ["/api/auth/login-history"],
    queryFn: () => apiGet("/api/auth/login-history"),
  });

  if (!history || history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History size={20} />
          سجل الدخول
        </CardTitle>
        <CardDescription>آخر 10 عمليات تسجيل دخول</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={h.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {h.device === "جوال" ? <Smartphone size={16} className="text-muted-foreground" /> : <Monitor size={16} className="text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{h.device}</p>
                  <p className="text-[11px] text-muted-foreground">{h.ipAddress || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {i === 0 && <Badge variant="default" className="text-[10px]">الأخير</Badge>}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(h.loginAt), { addSuffix: true, locale: ar })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
