/**
 * CardEditor.tsx - Card Editor Component
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → cms-landing/ → components/ → CardEditor.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Form component for editing landing page cards. Provides:
 * - Card editing interface
 * - Card content management
 * - Card CRUD operations
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/index.tsx - CMS landing editor
 * - apps/web/src/pages/admin/cms-landing/components/SectionEditor.tsx - Section editor
 */

/**
 * CardEditor Component
 * 
 * Form component for editing landing page cards
 */

import React from "react";
import { Type, Save, Trash2 } from "lucide-react";
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
import type { LandingCard, LandingSection, CardFormState } from "../types";
import { SECTION_LABELS, FEATURE_ICON_OPTIONS, CONTACT_ICON_OPTIONS, HERO_METRIC_COLORS } from "../utils/constants";

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
    formState.title || formState.label || card.title || SECTION_LABELS[section.slug] || "Card";

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 overflow-visible">
          <CardTitle className="flex items-center gap-2 text-base flex-1">
            <Type className="h-4 w-4" />
            {cardTitle}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0 overflow-visible">
            <Switch
              checked={formState.visible}
              onCheckedChange={(checked) => setField("visible", checked)}
              aria-label="Toggle visibility"
            />
            <Button size="sm" variant="outline" onClick={onSave} disabled={saving}>
              <Save className="h-4 w-4 ml-1" />
              {saving ? "جار الحفظ..." : "حفظ"}
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {section.slug !== "hero" && section.slug !== "stats" && section.slug !== "navigation" && (
          <div>
            <Label>العنوان</Label>
            <Input
              value={formState.title ?? ""}
              onChange={(event) => setField("title", event.target.value)}
            />
          </div>
        )}

        {section.slug === "hero" && (
          <>
            <div>
              <Label>القيمة</Label>
              <Input
                value={formState.value ?? ""}
                onChange={(event) => setField("value", event.target.value)}
                placeholder="قيمة المؤشر (مثال: 1.2M ﷼)"
              />
            </div>
            <div>
              <Label>الوصف المختصر</Label>
              <Input
                value={formState.label ?? ""}
                onChange={(event) => setField("label", event.target.value)}
                placeholder="نص يظهر أسفل المؤشر"
              />
            </div>
            <div>
              <Label>لون الشارة</Label>
              <Select
                value={formState.color ?? "blue"}
                onValueChange={(value) => setField("color", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اللون" />
                </SelectTrigger>
                <SelectContent>
                  {HERO_METRIC_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {["features", "solutions", "pricing", "contact"].includes(section.slug) && (
          <div>
            <Label>الوصف</Label>
            <Textarea
              value={formState.body ?? ""}
              onChange={(event) => setField("body", event.target.value)}
              rows={3}
            />
          </div>
        )}

        {section.slug === "solutions" && (
          <div>
            <Label>قائمة المزايا (كل سطر يمثل ميزة)</Label>
            <Textarea
              value={formState.featuresText ?? ""}
              onChange={(event) => setField("featuresText", event.target.value)}
              rows={4}
              placeholder={"ميزة 1\nميزة 2\nميزة 3"}
            />
          </div>
        )}

        {section.slug === "pricing" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>السعر</Label>
                <Input
                  type="number"
                  value={formState.price ?? ""}
                  onChange={(event) => setField("price", event.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label>الدورة</Label>
                <Select
                  value={formState.period ?? "monthly"}
                  onValueChange={(value: "monthly" | "yearly") => setField("period", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الاشتراك" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="yearly">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">الخطة المميزة</Label>
                <Switch
                  checked={formState.isPopular ?? false}
                  onCheckedChange={(checked) => setField("isPopular", checked)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>زر الإجراء - النص</Label>
                <Input
                  value={formState.ctaLabel ?? ""}
                  onChange={(event) => setField("ctaLabel", event.target.value)}
                />
              </div>
              <div>
                <Label>زر الإجراء - الرابط</Label>
                <Input
                  value={formState.ctaHref ?? ""}
                  onChange={(event) => setField("ctaHref", event.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>المزايا (سطر لكل ميزة)</Label>
              <Textarea
                value={formState.featuresText ?? ""}
                onChange={(event) => setField("featuresText", event.target.value)}
                rows={5}
                placeholder={"ميزة 1\nميزة 2\nميزة 3"}
              />
            </div>
          </>
        )}

        {section.slug === "contact" && (
          <>
            <div>
              <Label>نوع جهة الاتصال</Label>
              <Select
                value={formState.type ?? ""}
                onValueChange={(value) => setField("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">هاتف</SelectItem>
                  <SelectItem value="email">بريد إلكتروني</SelectItem>
                  <SelectItem value="location">الموقع</SelectItem>
                  <SelectItem value="support">الدعم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الرمز</Label>
              <Select
                value={formState.icon ?? ""}
                onValueChange={(value) => setField("icon", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر رمزاً" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {section.slug === "navigation" && (
          <>
            <div>
              <Label>عنوان الرابط</Label>
              <Input
                value={formState.title ?? ""}
                onChange={(event) => setField("title", event.target.value)}
              />
            </div>
            <div>
              <Label>الرابط</Label>
              <Input
                value={formState.link ?? ""}
                onChange={(event) => setField("link", event.target.value)}
              />
            </div>
          </>
        )}

        {section.slug === "footer" && (
          <>
            <div>
              <Label>عنوان المجموعة</Label>
              <Input
                value={formState.category ?? formState.title ?? ""}
                onChange={(event) => setField("category", event.target.value)}
              />
            </div>
            <div>
              <Label>الروابط (اكتب النص والرابط مفصولين بـ | في كل سطر)</Label>
              <Textarea
                value={formState.featuresText ?? ""}
                onChange={(event) => setField("featuresText", event.target.value)}
                rows={4}
                placeholder={"الرئيسية|#home\nالمميزات|#features"}
              />
            </div>
          </>
        )}

        {["features", "solutions"].includes(section.slug) && (
          <div>
            <Label>الرمز</Label>
            <Select
              value={formState.icon ?? ""}
              onValueChange={(value) => setField("icon", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر رمزاً" />
              </SelectTrigger>
              <SelectContent>
                {FEATURE_ICON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {section.slug === "stats" && (
          <>
            <div>
              <Label>القيمة</Label>
              <Input
                value={formState.value ?? ""}
                onChange={(event) => setField("value", event.target.value)}
                placeholder="1000"
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Input
                value={formState.label ?? ""}
                onChange={(event) => setField("label", event.target.value)}
                placeholder="إحصائية"
              />
            </div>
            <div>
              <Label>اللاحقة</Label>
              <Input
                value={formState.suffix ?? ""}
                onChange={(event) => setField("suffix", event.target.value)}
                placeholder="+"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

