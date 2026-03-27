import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Users, CheckCircle, TrendingUp, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export interface PreferencesSectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PreferencesSection({ isOpen, onOpenChange }: PreferencesSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CardHeader className="border-b border-white/60 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 p-2 text-primary"><Bell size={18} /></span>
            <div className="text-end">
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>حدد الإشعارات التي ترغب باستلامها عن نشاط المنصة</CardDescription>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:text-foreground/80"
              aria-label="تبديل عرض إعدادات الإشعارات"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-6">
            <Card className="rounded-2xl bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Switch defaultChecked data-testid="toggle-new-leads" />
                <div className="flex-1 pe-4 ps-4">
                  <div className="font-medium text-foreground mb-1">عملاء محتملين جدد</div>
                  <div className="text-sm text-muted-foreground">إشعار عند إضافة عملاء محتملين جدد</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  <Users size={18} />
                </div>
              </div>
            </Card>
            <Card className="rounded-2xl bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Switch defaultChecked data-testid="toggle-task-updates" />
                <div className="flex-1 pe-4 ps-4">
                  <div className="font-medium text-foreground mb-1">تحديثات المهام</div>
                  <div className="text-sm text-muted-foreground">إشعار عند اكتمال أو تحديث المهام</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  <CheckCircle size={18} />
                </div>
              </div>
            </Card>
            <Card className="rounded-2xl bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Switch defaultChecked data-testid="toggle-new-deals" />
                <div className="flex-1 pe-4 ps-4">
                  <div className="font-medium text-foreground mb-1">صفقات جديدة</div>
                  <div className="text-sm text-muted-foreground">إشعار عند إنشاء صفقات جديدة</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <TrendingUp size={18} />
                </div>
              </div>
            </Card>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
