import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export interface AccountSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSection({ isOpen, onOpenChange }: AccountSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CardHeader className="border-b border-white/60 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              className="rounded-full border border-border bg-white p-2 text-slate-500 transition hover:text-slate-700"
              aria-label="تبديل عرض إعدادات الأمان"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">كلمة المرور الحالية</Label>
              <Input id="currentPassword" type="password" className="text-subtle" data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">كلمة المرور الجديدة</Label>
              <Input id="newPassword" type="password" className="text-subtle" data-testid="input-new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">تأكيد كلمة المرور الجديدة</Label>
              <Input id="confirmPassword" type="password" className="text-subtle" data-testid="input-confirm-password" />
            </div>
            <Button className="mt-4 flex items-center gap-2" data-testid="button-change-password">
              <Shield size={16} />
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
