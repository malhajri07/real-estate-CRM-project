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
    <Card className="bg-white/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-visible">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 overflow-visible">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <Type className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{cardTitle}</h3>
        </div>
        <div className="flex items-center gap-2 overflow-visible">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 overflow-visible">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ظهور</span>
            <Switch
              checked={formState.visible}
              onCheckedChange={(checked) => setField("visible", checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all" onClick={onSave} disabled={saving}>
            <Save className={cn("h-5 w-5", saving && "animate-spin")} />
          </Button>
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" onClick={onDelete}>
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {section.slug !== "hero" && section.slug !== "stats" && section.slug !== "navigation" && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان</label>
            <Input
              value={formState.title ?? ""}
              onChange={(event) => setField("title", event.target.value)}
              className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-blue-500/20 font-bold"
            />
          </div>
        )}

        {section.slug === "hero" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">القيمة (Value)</label>
              <Input
                value={formState.value ?? ""}
                onChange={(event) => setField("value", event.target.value)}
                placeholder="مثال: +١٥٤"
                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-blue-500/20 font-black text-blue-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الوصف</label>
              <Input
                value={formState.label ?? ""}
                onChange={(event) => setField("label", event.target.value)}
                placeholder="مثال: عملاء سعداء"
                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-blue-500/20 font-bold"
              />
            </div>
          </div>
        )}

        {["features", "solutions", "pricing", "contact"].includes(section.slug) && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المحتوى</label>
            <Textarea
              value={formState.body ?? ""}
              onChange={(event) => setField("body", event.target.value)}
              rows={3}
              placeholder="أدخل تفاصيل العنصر هنا..."
              className="rounded-xl bg-slate-50/50 border-slate-100 focus:ring-blue-500/20 font-medium text-slate-600 leading-relaxed"
            />
          </div>
        )}

        {section.slug === "pricing" && (
          <div className="p-6 bg-blue-50/30 rounded-[1.5rem] border border-blue-100/30 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">السعر</label>
                <Input
                  type="number"
                  value={formState.price ?? ""}
                  onChange={(event) => setField("price", event.target.value)}
                  className="h-12 rounded-xl bg-white border-slate-100 font-black text-blue-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المنشور</label>
                <Select
                  value={formState.period ?? "monthly"}
                  onValueChange={(value: "monthly" | "yearly") => setField("period", value)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white border-slate-100 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="yearly">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 overflow-visible">
              <span className="text-sm font-bold text-slate-700">تحديد كخطة مميزة (جديد)</span>
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">أيقونة العنصر</label>
            <Select
              value={formState.icon ?? ""}
              onValueChange={(value) => setField("icon", value)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold">
                <SelectValue placeholder="اختر أيقونة مناسبة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
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

