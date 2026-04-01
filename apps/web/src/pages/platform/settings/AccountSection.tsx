import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
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

export interface AccountSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSection({ isOpen, onOpenChange }: AccountSectionProps) {
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
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CardHeader className="border-b border-border pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><Shield size={18} /></span>
            <div className="text-end">
              <CardTitle>الأمان وكلمة المرور</CardTitle>
              <CardDescription>قم بتحديث كلمة المرور الخاصة بك بانتظام لحماية الحساب</CardDescription>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:text-foreground/80"
              aria-label="تبديل عرض إعدادات الأمان"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-foreground/80">كلمة المرور الحالية</FormLabel>
                      <FormControl>
                        <Input type="password" className="text-subtle" data-testid="input-current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-foreground/80">كلمة المرور الجديدة</FormLabel>
                      <FormControl>
                        <Input type="password" className="text-subtle" data-testid="input-new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-foreground/80">تأكيد كلمة المرور الجديدة</FormLabel>
                      <FormControl>
                        <Input type="password" className="text-subtle" data-testid="input-confirm-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="mt-4 flex items-center gap-2" disabled={isSubmitting} data-testid="button-change-password">
                  <Shield size={16} />
                  {isSubmitting ? "جاري التغيير..." : "تغيير كلمة المرور"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
