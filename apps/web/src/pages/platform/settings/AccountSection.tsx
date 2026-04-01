import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { apiPut } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

export interface AccountSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSection({ isOpen, onOpenChange }: AccountSectionProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة وتأكيدها غير متطابقين", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiPut("/api/auth/password", { currentPassword, newPassword });
      toast({ title: "تم بنجاح", description: "تم تغيير كلمة المرور بنجاح" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="block text-sm font-medium text-foreground/80">كلمة المرور الحالية</Label>
              <Input id="currentPassword" type="password" className="text-subtle" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="block text-sm font-medium text-foreground/80">كلمة المرور الجديدة</Label>
              <Input id="newPassword" type="password" className="text-subtle" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} data-testid="input-new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground/80">تأكيد كلمة المرور الجديدة</Label>
              <Input id="confirmPassword" type="password" className="text-subtle" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} data-testid="input-confirm-password" />
            </div>
            <Button className="mt-4 flex items-center gap-2" onClick={handleChangePassword} disabled={isSubmitting} data-testid="button-change-password">
              <Shield size={16} />
              {isSubmitting ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
