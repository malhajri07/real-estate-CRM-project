/**
 * SectionEditor.tsx - Section Editor Component
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → cms-landing/ → components/ → SectionEditor.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Form component for editing landing page sections. Provides:
 * - Section editing interface
 * - Section content management
 * - Section CRUD operations
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/index.tsx - CMS landing editor
 * - apps/web/src/pages/admin/cms-landing/components/CardEditor.tsx - Card editor
 */

/**
 * SectionEditor Component
 * 
 * Form component for editing landing page sections
 */

import React from "react";
import { Layout, Save, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LandingSection, SectionFormState } from "../types";
import { SECTION_LABELS } from "../utils/constants";

interface SectionEditorProps {
  section: LandingSection;
  formState: SectionFormState;
  onChange: (next: SectionFormState) => void;
  onSave: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  formState,
  onChange,
  onSave,
  onPublish,
  saving,
  publishing,
}) => {
  const sectionLabel = SECTION_LABELS[section.slug] ?? "Section";

  const setField = (field: keyof SectionFormState, value: string | boolean) => {
    onChange({ ...formState, [field]: value });
  };

  return (
    <Card className="glass border-0 rounded-[2.5rem] p-8 shadow-none relative overflow-visible">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 overflow-visible">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Layout className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{sectionLabel}</h2>
            <p className="text-slate-500 font-medium text-sm">تعديل محتوى وإعدادات القسم</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={onSave}
            disabled={saving}
            className="h-11 px-6 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm flex-1 md:flex-none"
          >
            <Save className="h-4 w-4 me-2" />
            {saving ? "جار الحفظ..." : "حفظ المسودة"}
          </Button>
          <Button
            onClick={onPublish}
            disabled={publishing}
            className="h-11 px-6 rounded-xl premium-gradient text-white border-0 font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1 md:flex-none"
          >
            <Send className="h-4 w-4 me-2" />
            {publishing ? "جاري النشر..." : "نشر التعديلات"}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 group transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 overflow-visible">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-slate-900 tracking-tight">ظهور القسم</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">إظهار أو إخفاء هذا القسم من الصفحة الرئيسية</p>
            </div>
          </div>
          <div className="overflow-visible">
            <Switch
              checked={formState.visible}
              onCheckedChange={(checked) => setField("visible", checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>

        <div className="grid gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان الرئيسي للقسم</label>
            <Input
              value={formState.title ?? ""}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="أدخل عنواناً جذاباً..."
              className="h-14 rounded-2xl bg-white/50 border-slate-100 focus:ring-blue-500/20 text-lg font-black text-slate-900 placeholder:text-slate-300"
            />
          </div>

          {section.slug !== "footer" && section.slug !== "navigation" && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان الفرعي</label>
              <Input
                value={formState.subtitle ?? ""}
                onChange={(event) => setField("subtitle", event.target.value)}
                placeholder="أضف سياقاً إضافياً للعنوان..."
                className="h-14 rounded-2xl bg-white/50 border-slate-100 focus:ring-blue-500/20 font-bold text-slate-600 placeholder:text-slate-300"
              />
            </div>
          )}

          {section.slug === "hero" && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">نص الشارة العلوية (Badge)</label>
                <Input
                  value={formState.badge ?? ""}
                  onChange={(event) => setField("badge", event.target.value)}
                  placeholder="مثال: الإصدار الجديد ٢.٠"
                  className="h-14 rounded-2xl bg-white/50 border-slate-100 focus:ring-blue-500/20 font-black text-blue-600 placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">وصف الفقرة الرئيسية</label>
                <Textarea
                  value={formState.body ?? ""}
                  onChange={(event) => setField("body", event.target.value)}
                  rows={4}
                  placeholder="وصف مختصر ومؤثر لمهمة المنصة..."
                  className="rounded-2xl bg-white/50 border-slate-100 focus:ring-blue-500/20 font-medium text-slate-600 leading-relaxed placeholder:text-slate-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الزر الرئيسي - النص</label>
                  <Input
                    value={formState.primaryCtaLabel ?? ""}
                    onChange={(event) =>
                      setField("primaryCtaLabel", event.target.value)
                    }
                    placeholder="ابدأ رحلتك"
                    className="h-12 rounded-xl bg-white border-slate-100 focus:ring-blue-500/20 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الزر الرئيسي - الرابط (URL)</label>
                  <Input
                    value={formState.primaryCtaHref ?? ""}
                    onChange={(event) =>
                      setField("primaryCtaHref", event.target.value)
                    }
                    placeholder="/signup"
                    dir="ltr"
                    className="h-12 rounded-xl bg-white border-slate-100 focus:ring-blue-500/20 font-mono text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {["features", "solutions", "pricing", "contact"].includes(section.slug) && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">وصف القسم التفصيلي</label>
              <Textarea
                value={formState.description ?? ""}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
                rows={4}
                placeholder="اشرح لعملائك أهمية هذا القسم وما سيستفيدونه منه..."
                className="rounded-2xl bg-white/50 border-slate-100 focus:ring-blue-500/20 font-medium text-slate-600 leading-relaxed placeholder:text-slate-300"
              />
            </div>
          )}

          {section.slug === "footer" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رسالة التذييل</label>
                <Textarea
                  value={formState.body ?? ""}
                  onChange={(event) => setField("body", event.target.value)}
                  rows={4}
                  placeholder="كلمة أخيرة للزوار في نهاية الصفحة..."
                  className="rounded-2xl bg-white/50 border-slate-100 focus:ring-blue-500/20 font-medium text-slate-600"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">حقوق النشر والملكية (Copyright)</label>
                <Input
                  value={formState.copyright ?? ""}
                  onChange={(event) => setField("copyright", event.target.value)}
                  placeholder="© ٢٠٢٤ جميع الحقوق محفوظة"
                  className="h-12 rounded-xl bg-white/50 border-slate-100 font-bold text-slate-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

