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
import { Layout, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            {sectionLabel}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={onSave} size="sm" disabled={saving}>
              <Save className="h-4 w-4 ml-2" />
              {saving ? "جار الحفظ..." : "حفظ المسودة"}
            </Button>
            <Button
              onClick={onPublish}
              size="sm"
              variant="outline"
              disabled={publishing}
            >
              <Send className="h-4 w-4 ml-2" />
              {publishing ? "جاري النشر..." : "نشر التعديلات"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 bg-muted/40 p-3 rounded-lg overflow-visible">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">إظهار القسم في الصفحة</p>
            <p className="text-xs text-muted-foreground/80">
              يمكن إخفاء القسم مؤقتاً دون حذفه
            </p>
          </div>
          <div className="flex-shrink-0 overflow-visible">
            <Switch
              checked={formState.visible}
              onCheckedChange={(checked) => setField("visible", checked)}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <Label>العنوان الرئيسي</Label>
            <Input
              value={formState.title ?? ""}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="عنوان القسم"
            />
          </div>

          {section.slug !== "footer" && section.slug !== "navigation" && (
            <div>
              <Label>العنوان الفرعي</Label>
              <Input
                value={formState.subtitle ?? ""}
                onChange={(event) => setField("subtitle", event.target.value)}
                placeholder="عنوان فرعي"
              />
            </div>
          )}

          {section.slug === "hero" && (
            <>
              <div>
                <Label>نص الشارة العلوية</Label>
                <Input
                  value={formState.badge ?? ""}
                  onChange={(event) => setField("badge", event.target.value)}
                  placeholder="مثال: منصة عقاراتي"
                />
              </div>
              <div>
                <Label>وصف مختصر</Label>
                <Textarea
                  value={formState.body ?? ""}
                  onChange={(event) => setField("body", event.target.value)}
                  rows={3}
                  placeholder="وصف مختصر يظهر أسفل العنوان"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>زر رئيسي - النص</Label>
                  <Input
                    value={formState.primaryCtaLabel ?? ""}
                    onChange={(event) =>
                      setField("primaryCtaLabel", event.target.value)
                    }
                    placeholder="ابدأ الآن"
                  />
                </div>
                <div>
                  <Label>زر رئيسي - الرابط</Label>
                  <Input
                    value={formState.primaryCtaHref ?? ""}
                    onChange={(event) =>
                      setField("primaryCtaHref", event.target.value)
                    }
                    placeholder="/signup"
                  />
                </div>
                <div>
                  <Label>زر ثانوي - النص</Label>
                  <Input
                    value={formState.secondaryCtaLabel ?? ""}
                    onChange={(event) =>
                      setField("secondaryCtaLabel", event.target.value)
                    }
                    placeholder="تسجيل الدخول"
                  />
                </div>
                <div>
                  <Label>زر ثانوي - الرابط</Label>
                  <Input
                    value={formState.secondaryCtaHref ?? ""}
                    onChange={(event) =>
                      setField("secondaryCtaHref", event.target.value)
                    }
                    placeholder="/rbac-login"
                  />
                </div>
              </div>
              <div>
                <Label>عنوان لوحة المؤشرات</Label>
                <Input
                  value={formState.dashboardTitle ?? ""}
                  onChange={(event) =>
                    setField("dashboardTitle", event.target.value)
                  }
                  placeholder="عنوان يظهر أعلى لوحة المؤشرات"
                />
              </div>
            </>
          )}

          {["features", "solutions", "pricing", "contact"].includes(section.slug) && (
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={formState.description ?? ""}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
                rows={4}
                placeholder="نص يوضح تفاصيل القسم"
              />
            </div>
          )}

          {section.slug === "footer" && (
            <>
              <div>
                <Label>وصف التذييل</Label>
                <Textarea
                  value={formState.body ?? ""}
                  onChange={(event) => setField("body", event.target.value)}
                  rows={4}
                  placeholder="وصف مختصر يظهر في التذييل"
                />
              </div>
              <div>
                <Label>حقوق النشر</Label>
                <Input
                  value={formState.copyright ?? ""}
                  onChange={(event) => setField("copyright", event.target.value)}
                  placeholder="© 2024 منصة عقاراتي. جميع الحقوق محفوظة."
                />
              </div>
              <div>
                <Label>رابط شعار التذييل (URL)</Label>
                <Input
                  value={formState.logoUrl ?? ""}
                  onChange={(event) => setField("logoUrl", event.target.value)}
                  placeholder="/assets/footer-logo.png"
                  dir="ltr"
                />
              </div>
            </>
          )}

          {section.slug === "cta" && (
            <>
              <div>
                <Label>نص الرسالة</Label>
                <Textarea
                  value={formState.body ?? ""}
                  onChange={(event) => setField("body", event.target.value)}
                  rows={3}
                  placeholder="رسالة تشجيعية للانضمام"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>زر الإجراء - النص</Label>
                  <Input
                    value={formState.primaryCtaLabel ?? ""}
                    onChange={(event) =>
                      setField("primaryCtaLabel", event.target.value)
                    }
                    placeholder="سجل الآن"
                  />
                </div>
                <div>
                  <Label>زر الإجراء - الرابط</Label>
                  <Input
                    value={formState.primaryCtaHref ?? ""}
                    onChange={(event) =>
                      setField("primaryCtaHref", event.target.value)
                    }
                    placeholder="/signup"
                  />
                </div>
              </div>
            </>
          )}

          {section.slug === "header" && (
            <>
              <div>
                <Label>اسم الموقع (مهم لـ SEO)</Label>
                <Input
                  value={formState.siteName ?? ""}
                  onChange={(event) => setField("siteName", event.target.value)}
                  placeholder="عقاركم"
                />
              </div>
              <div>
                <Label>رابط الشعار (URL)</Label>
                <Input
                  value={formState.logoUrl ?? ""}
                  onChange={(event) => setField("logoUrl", event.target.value)}
                  placeholder="/assets/logo.png"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">يمكنك استخدام رابط خارجي أو مسار صورة في المشروع</p>
              </div>
            </>
          )}

        </div>
      </CardContent>
    </Card>
  );
};

