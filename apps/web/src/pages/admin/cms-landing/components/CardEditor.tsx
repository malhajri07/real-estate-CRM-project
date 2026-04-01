import React from "react";
import { Type, Save, Trash2, Smartphone, Globe, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { LandingCard, LandingSection, CardFormState } from "../types";
import { SECTION_LABELS, FEATURE_ICON_OPTIONS, CONTACT_ICON_OPTIONS, HERO_METRIC_COLORS } from "../utils/constants";
import { ListInput } from "./inputs/ListInput";
import { LinkListInput } from "./inputs/LinkListInput";

interface CardEditorProps {
  card: LandingCard;
  section: LandingSection;
  formState: CardFormState;
  onChange: (next: CardFormState) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  section,
  formState,
  onChange,
  onSave,
  onDelete,
  saving,
}) => {
  const setField = (field: keyof CardFormState, value: string | boolean) => {
    onChange({ ...formState, [field]: value });
  };

  const cardTitle =
    formState.title || formState.label || card.title || SECTION_LABELS[section.slug] || "عنصر";

  return (
    <Card className="bg-card/50 border border-border rounded-2xl p-6 hover:bg-card hover:shadow-md hover:shadow-primary/10 transition-all group relative overflow-visible">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 overflow-visible">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted/30 text-muted-foreground/70 rounded-xl flex items-center justify-center group-hover:bg-slate-100 group-hover:text-muted-foreground transition-colors">
            <Type className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-muted-foreground transition-colors">{cardTitle}</h3>
        </div>
        <div className="flex items-center gap-2 overflow-visible">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 rounded-xl border border-border overflow-visible">
            <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">ظهور</span>
            <Switch
              checked={formState.visible}
              onCheckedChange={(checked) => setField("visible", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-muted-foreground/70 hover:bg-primary/5 hover:text-primary transition-all" onClick={onSave} disabled={saving} aria-label="حفظ البطاقة">
            <Save className={cn("h-5 w-5", saving && "animate-spin")} />
          </Button>
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all" onClick={onDelete} aria-label="حذف البطاقة">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {section.slug !== "hero" && section.slug !== "stats" && section.slug !== "navigation" && (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">العنوان</Label>
            <Input
              value={formState.title ?? ""}
              onChange={(event) => setField("title", event.target.value)}
              className="h-12 rounded-xl bg-muted/30/50 border-border focus:ring-primary/20 font-bold"
            />
          </div>
        )}

        {section.slug === "hero" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">القيمة (Value)</Label>
              <Input
                value={formState.value ?? ""}
                onChange={(event) => setField("value", event.target.value)}
                placeholder="مثال: +١٥٤"
                className="h-12 rounded-xl bg-muted/30/50 border-border focus:ring-primary/20 font-bold text-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">الوصف</Label>
              <Input
                value={formState.label ?? ""}
                onChange={(event) => setField("label", event.target.value)}
                placeholder="مثال: عملاء سعداء"
                className="h-12 rounded-xl bg-muted/30/50 border-border focus:ring-primary/20 font-bold"
              />
            </div>
          </div>
        )}

        {["features", "solutions", "pricing", "contact"].includes(section.slug) && (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">المحتوى</Label>
            <Textarea
              value={formState.body ?? ""}
              onChange={(event) => setField("body", event.target.value)}
              rows={3}
              placeholder="أدخل تفاصيل العنصر هنا..."
              className="rounded-xl bg-muted/30/50 border-border focus:ring-primary/20 font-medium text-muted-foreground leading-relaxed"
            />
          </div>
        )}

        {section.slug === "pricing" && (
          <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">السعر</Label>
                <Input
                  type="number"
                  value={formState.price ?? ""}
                  onChange={(event) => setField("price", event.target.value)}
                  className="h-12 rounded-xl bg-card border-border font-bold text-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">المنشور</Label>
                <Select
                  value={formState.period ?? "monthly"}
                  onValueChange={(value: "monthly" | "yearly") => setField("period", value)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-card border-border font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="yearly">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border overflow-visible">
              <span className="text-sm font-bold text-muted-foreground">تحديد كخطة مميزة (جديد)</span>
              <div className="overflow-visible">
                <Switch
                  checked={formState.isPopular ?? false}
                  onCheckedChange={(checked) => setField("isPopular", checked)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {["features", "solutions", "contact"].includes(section.slug) && (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-1">أيقونة العنصر</Label>
            <Select
              value={formState.icon ?? ""}
              onValueChange={(value) => setField("icon", value)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-muted/30/50 border-border font-bold">
                <SelectValue placeholder="اختر أيقونة مناسبة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                {(section.slug === "contact" ? CONTACT_ICON_OPTIONS : FEATURE_ICON_OPTIONS).map((option) => (
                  <SelectItem key={option.value} value={option.value} className="font-bold">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
};

