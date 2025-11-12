import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Save,
  Send,
  Trash2,
  Move,
  Layout,
  Menu,
  Type,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type SectionStatus = "draft" | "published" | "archived";

interface LandingCard {
  id: string;
  sectionId: string;
  orderIndex: number;
  title?: string;
  body?: string;
  mediaUrl?: string;
  icon?: string;
  ctaLabel?: string;
  ctaHref?: string;
  visible: boolean;
  status: SectionStatus;
  version: number;
  draftJson?: Record<string, any>;
  publishedJson?: Record<string, any>;
  updatedBy?: string;
  updatedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  content?: Record<string, any>;
}

interface LandingSection {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  layoutVariant: string;
  theme?: Record<string, any>;
  orderIndex: number;
  visible: boolean;
  status: SectionStatus;
  version: number;
  draftJson?: Record<string, any>;
  publishedJson?: Record<string, any>;
  updatedBy?: string;
  updatedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  cards?: LandingCard[];
  content?: Record<string, any>;
}

type SectionFormState = {
  title: string;
  subtitle?: string;
  visible: boolean;
  badge?: string;
  body?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  dashboardTitle?: string;
  copyright?: string;
};

type CardFormState = {
  title?: string;
  body?: string;
  icon?: string;
  value?: string;
  label?: string;
  color?: string;
  suffix?: string;
  price?: string;
  period?: "monthly" | "yearly";
  ctaLabel?: string;
  ctaHref?: string;
  isPopular?: boolean;
  featuresText?: string;
  type?: string;
  link?: string;
  category?: string;
  visible: boolean;
};

const SECTION_LABELS: Record<string, string> = {
  hero: "قسم البطل",
  navigation: "القائمة العلوية",
  features: "المميزات",
  solutions: "الحلول",
  stats: "الإحصائيات",
  pricing: "خطط الأسعار",
  contact: "التواصل",
  footer: "تذييل الصفحة",
  cta: "نداء الإجراء",
};

const FEATURE_ICON_OPTIONS = [
  { value: "users", label: "المستخدمون" },
  { value: "building", label: "المباني" },
  { value: "trending-up", label: "النمو" },
  { value: "bar-chart", label: "الرسوم البيانية" },
  { value: "message-square", label: "المراسلة" },
  { value: "shield", label: "الحماية" },
  { value: "camera", label: "التصوير" },
  { value: "file-text", label: "المستندات" },
  { value: "dollar-sign", label: "السعر" },
  { value: "git-branch", label: "التكامل" },
  { value: "check-circle", label: "التحقق" },
  { value: "circle-check-big", label: "التحقق الكبير" },
  { value: "user-plus", label: "إضافة مستخدم" },
  { value: "eye", label: "الرؤية" },
  { value: "notebook-pen", label: "الملاحظات" },
];

const CONTACT_ICON_OPTIONS = [
  { value: "phone", label: "الهاتف" },
  { value: "mail", label: "البريد" },
  { value: "map-pin", label: "الموقع" },
  { value: "clock", label: "الوقت" },
];

const HERO_METRIC_COLORS = ["blue", "green", "orange", "purple", "pink", "emerald"];

function normalizeSectionContent(section: LandingSection): SectionFormState {
  const content = (section.content ?? section.draftJson ?? {}) as Record<string, any>;
  const base: SectionFormState = {
    title: section.title ?? "",
    subtitle: section.subtitle ?? "",
    visible: section.visible ?? true,
  };

  switch (section.slug) {
    case "hero":
      return {
        ...base,
        badge: content.badge ?? "",
        body: content.body ?? "",
        primaryCtaLabel: content.cta?.label ?? "",
        primaryCtaHref: content.cta?.href ?? "",
        secondaryCtaLabel: content.secondaryCta?.label ?? "",
        secondaryCtaHref: content.secondaryCta?.href ?? "",
        dashboardTitle: content.dashboardTitle ?? section.title ?? "",
      };
    case "features":
    case "solutions":
    case "pricing":
    case "contact":
      return {
        ...base,
        description: content.subtitle ?? content.body ?? "",
      };
    case "footer":
      return {
        ...base,
        body: content.body ?? "",
        copyright: content.copyright ?? "",
      };
    case "cta":
      return {
        ...base,
        body: content.body ?? "",
        primaryCtaLabel: content.cta?.label ?? "",
        primaryCtaHref: content.cta?.href ?? "",
      };
    default:
      return base;
  }
}

function buildSectionPayload(section: LandingSection, form: SectionFormState) {
  const baseDraft = {
    layoutVariant: section.layoutVariant,
    visibility: form.visible,
  } as Record<string, any>;

  let draftJson: Record<string, any> = baseDraft;

  switch (section.slug) {
    case "hero":
      draftJson = {
        ...baseDraft,
        badge: form.badge ?? "",
        title: form.title ?? "",
        subtitle: form.subtitle ?? "",
        body: form.body ?? "",
        cta: {
          label: form.primaryCtaLabel ?? "",
          href: form.primaryCtaHref ?? "",
        },
        secondaryCta: {
          label: form.secondaryCtaLabel ?? "",
          href: form.secondaryCtaHref ?? "",
        },
        dashboardTitle: form.dashboardTitle ?? form.title ?? "",
      };
      break;
    case "features":
    case "solutions":
    case "pricing":
    case "contact":
      draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        subtitle: form.subtitle ?? "",
        description: form.description ?? "",
        body: form.description ?? "",
      };
      break;
    case "footer":
      draftJson = {
        ...baseDraft,
        body: form.body ?? "",
        copyright: form.copyright ?? "",
      };
      break;
    case "cta":
      draftJson = {
        ...baseDraft,
        body: form.body ?? "",
        cta: {
          label: form.primaryCtaLabel ?? "",
          href: form.primaryCtaHref ?? "",
        },
      };
      break;
    default:
      draftJson = { ...baseDraft, title: form.title ?? "", subtitle: form.subtitle ?? "" };
      break;
  }

  return {
    title: form.title ?? "",
    subtitle: form.subtitle ?? "",
    visible: form.visible,
    draftJson,
  };
}

function normalizeCardContent(sectionSlug: string, card: LandingCard): CardFormState {
  const content = (card.content ?? card.draftJson ?? {}) as Record<string, any>;
  const base: CardFormState = {
    title: card.title ?? "",
    body: card.body ?? "",
    icon: card.icon ?? content.icon ?? "",
    ctaLabel: card.ctaLabel ?? content.cta?.label ?? "",
    ctaHref: card.ctaHref ?? content.cta?.href ?? "",
    visible: card.visible ?? true,
  };

  switch (sectionSlug) {
    case "hero":
      return {
        ...base,
        value: content.value ?? card.title ?? "",
        label: content.label ?? card.body ?? "",
        color: content.color ?? "blue",
      };
    case "features":
      return {
        ...base,
        body: content.body ?? card.body ?? "",
      };
    case "solutions":
      return {
        ...base,
        body: content.body ?? card.body ?? "",
        featuresText: Array.isArray(content.features)
          ? content.features
              .map((feature: any) =>
                typeof feature === "string" ? feature : feature?.text ?? ""
              )
              .filter(Boolean)
              .join("\n")
          : "",
      };
    case "stats":
      return {
        ...base,
        value: content.value ?? "",
        label: content.label ?? "",
        suffix: content.suffix ?? "",
      };
    case "pricing":
      return {
        ...base,
        price:
          typeof content.price === "number"
            ? String(content.price)
            : card.body && !Number.isNaN(Number(card.body))
            ? card.body
            : "",
        period: content.period ?? "monthly",
        isPopular: Boolean(content.isPopular ?? card.status === "published"),
        featuresText: Array.isArray(content.features)
          ? content.features
              .map((feature: any) =>
                typeof feature === "string" ? feature : feature?.text ?? ""
              )
              .filter(Boolean)
              .join("\n")
          : "",
      };
    case "contact":
      return {
        ...base,
        type: content.type ?? "",
        title: content.title ?? card.title ?? "",
        body: content.body ?? card.body ?? "",
        icon: content.icon ?? card.icon ?? "",
      };
    case "navigation":
      return {
        title: content.label ?? card.title ?? "",
        link: content.href ?? card.ctaHref ?? "",
        visible: card.visible ?? true,
      };
    case "footer":
      return {
        ...base,
        category: content.category ?? card.title ?? "",
        featuresText: Array.isArray(content.links)
          ? content.links
              .map((link: any) =>
                link?.text && link?.href ? `${link.text}|${link.href}` : ""
              )
              .filter(Boolean)
              .join("\n")
          : "",
      };
    default:
      return base;
  }
}

function buildCardPayload(
  sectionSlug: string,
  form: CardFormState,
  section: LandingSection
) {
  const baseDraft = {
    layoutVariant: section.layoutVariant,
    visibility: form.visible,
  } as Record<string, any>;

  let payload: Record<string, any> = {
    visible: form.visible,
  };

  switch (sectionSlug) {
    case "hero": {
      const draftJson = {
        ...baseDraft,
        value: form.value ?? "",
        label: form.label ?? form.title ?? "",
        color: form.color ?? "blue",
      };
      payload = {
        ...payload,
        title: form.value ?? "",
        body: form.label ?? "",
        draftJson,
      };
      break;
    }
    case "features": {
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
        icon: form.icon ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "solutions": {
      const features = (form.featuresText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ text }));
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
        icon: form.icon ?? "",
        features,
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "stats": {
      const draftJson = {
        ...baseDraft,
        value: form.value ?? "",
        label: form.label ?? "",
        suffix: form.suffix ?? "",
      };
      payload = {
        ...payload,
        title: form.label ?? "",
        body: form.value ?? "",
        draftJson,
      };
      break;
    }
    case "pricing": {
      const features = (form.featuresText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ text }));
      const priceNumber = Number(form.price);
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
        price: Number.isFinite(priceNumber) ? priceNumber : 0,
        period: form.period ?? "monthly",
        isPopular: Boolean(form.isPopular),
        cta: {
          label: form.ctaLabel ?? "",
          href: form.ctaHref ?? "",
        },
        features,
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "contact": {
      const draftJson = {
        ...baseDraft,
        type: form.type ?? "",
        title: form.title ?? "",
        body: form.body ?? "",
        icon: form.icon ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "navigation": {
      const draftJson = {
        ...baseDraft,
        label: form.title ?? "",
        href: form.link ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        draftJson,
      };
      break;
    }
    case "footer": {
      const links = (form.featuresText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((entry) => {
          const [text, href] = entry.split("|").map((value) => value?.trim() ?? "");
          return { text, href };
        })
        .filter((item) => item.text);
      const draftJson = {
        ...baseDraft,
        category: form.category ?? form.title ?? "",
        links,
      };
      payload = {
        ...payload,
        title: form.category ?? form.title ?? "",
        draftJson,
      };
      break;
    }
    default: {
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
    }
  }

  return payload;
}

function defaultCardDraft(section: LandingSection) {
  switch (section.slug) {
    case "hero":
      return {
        value: "1.2M ﷼",
        label: "مؤشر",
        color: "blue",
      };
    case "features":
      return {
        title: "ميزة جديدة",
        body: "وصف الميزة",
        icon: "users",
      };
    case "solutions":
      return {
        title: "حل متخصص",
        body: "وصف الحل",
        icon: "shield",
        features: [],
      };
    case "stats":
      return {
        value: "100+",
        label: "إحصائية",
      };
    case "pricing":
      return {
        title: "خطة جديدة",
        body: "وصف الخطة",
        price: 0,
        period: "monthly",
        isPopular: false,
        cta: { label: "انطلق الآن", href: "/signup" },
        features: [],
      };
    case "contact":
      return {
        type: "phone",
        title: "الهاتف",
        body: "+966",
        icon: "phone",
      };
    case "navigation":
      return {
        label: "رابط جديد",
        href: "#",
      };
    case "footer":
      return {
        category: "روابط",
        links: [],
      };
    default:
      return {
        title: "عنصر جديد",
        body: "",
      };
  }
}

interface SectionEditorProps {
  section: LandingSection;
  formState: SectionFormState;
  onChange: (next: SectionFormState) => void;
  onSave: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
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
        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">إظهار القسم في الصفحة</p>
            <p className="text-xs text-muted-foreground/80">
              يمكن إخفاء القسم مؤقتاً دون حذفه
            </p>
          </div>
          <Switch
            checked={formState.visible}
            onCheckedChange={(checked) => setField("visible", checked)}
          />
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
        </div>
      </CardContent>
    </Card>
  );
};

interface CardEditorProps {
  card: LandingCard;
  section: LandingSection;
  formState: CardFormState;
  onChange: (next: CardFormState) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
}

const CardEditor: React.FC<CardEditorProps> = ({
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4" />
            {cardTitle}
          </CardTitle>
          <div className="flex items-center gap-2">
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
                <Label className="text-sm">الخطة المميزة</Label>
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
      </CardContent>
    </Card>
  );
};

interface CMSLandingPageProps {
  embedded?: boolean;
}

const CMSLandingPage: React.FC<CMSLandingPageProps> = ({ embedded = false }) => {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"draft" | "published">("draft");
  const [sectionForm, setSectionForm] = useState<SectionFormState | null>(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionPublishing, setSectionPublishing] = useState(false);
  const [cardForms, setCardForms] = useState<Record<string, CardFormState>>({});
  const [cardSaving, setCardSaving] = useState<Record<string, boolean>>({});

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return sections.find((section) => section.id === selectedSectionId) ?? null;
  }, [sections, selectedSectionId]);

  useEffect(() => {
    loadSections();
  }, [viewMode]);

  useEffect(() => {
    if (selectedSection) {
      const normalized = normalizeSectionContent(selectedSection);
      setSectionForm(normalized);
      if (Array.isArray(selectedSection.cards)) {
        const nextCardForms: Record<string, CardFormState> = {};
        selectedSection.cards.forEach((card) => {
          nextCardForms[card.id] = normalizeCardContent(selectedSection.slug, card);
        });
        setCardForms(nextCardForms);
      } else {
        setCardForms({});
      }
    }
  }, [selectedSection]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/landing/sections?status=${viewMode}`);
      if (!response.ok) {
        throw new Error("لم يتم تحميل الأقسام");
      }
      const payload = await response.json();
      const data: LandingSection[] = payload.data ?? [];
      setSections(data);
      if (!selectedSectionId && data.length > 0) {
        setSelectedSectionId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading sections:", error);
      toast.error("تعذر تحميل الأقسام");
    } finally {
      setLoading(false);
    }
  };

  const updateSectionState = (updated: LandingSection) => {
    setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
    if (selectedSectionId === updated.id) {
      setSectionForm(normalizeSectionContent(updated));
      const nextCardForms: Record<string, CardFormState> = {};
      (updated.cards ?? []).forEach((card) => {
        nextCardForms[card.id] = normalizeCardContent(updated.slug, card);
      });
      setCardForms(nextCardForms);
    }
  };

  const handleSaveSection = async () => {
    if (!selectedSection || !sectionForm) return;
    setSectionSaving(true);
    try {
      const payload = buildSectionPayload(selectedSection, sectionForm);
      const response = await fetch(`/api/cms/landing/sections/${selectedSection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("فشل حفظ القسم");
      }
      const updatedSection = await response.json();
      updateSectionState(updatedSection);
      toast.success("تم حفظ القسم");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("تعذر حفظ القسم");
    } finally {
      setSectionSaving(false);
    }
  };

  const handlePublishSection = async () => {
    if (!selectedSection) return;
    setSectionPublishing(true);
    try {
      const response = await fetch(
        `/api/cms/landing/sections/${selectedSection.id}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publishCards: true }),
        }
      );
      if (!response.ok) {
        throw new Error("فشل نشر القسم");
      }
      const updated = await response.json();
      updateSectionState(updated);
      toast.success("تم نشر القسم بنجاح");
    } catch (error) {
      console.error("Error publishing section:", error);
      toast.error("تعذر نشر القسم");
    } finally {
      setSectionPublishing(false);
    }
  };

  const handleSaveCard = async (card: LandingCard) => {
    if (!selectedSection) return;
    const form = cardForms[card.id];
    if (!form) return;

    setCardSaving((prev) => ({ ...prev, [card.id]: true }));
    try {
      const payload = buildCardPayload(selectedSection.slug, form, selectedSection);
      const response = await fetch(`/api/cms/landing/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("فشل حفظ البطاقة");
      }
      const updatedCard: LandingCard = await response.json();

      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== selectedSection.id) return section;
          const nextCards = (section.cards ?? []).map((existing) =>
            existing.id === card.id ? updatedCard : existing
          );
          return { ...section, cards: nextCards };
        })
      );

      setCardForms((prev) => ({
        ...prev,
        [card.id]: normalizeCardContent(selectedSection.slug, updatedCard),
      }));

      toast.success("تم حفظ البطاقة");
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error("تعذر حفظ البطاقة");
    } finally {
      setCardSaving((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cms/landing/cards/${cardId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("فشل حذف البطاقة");
      }
      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== selectedSectionId) return section;
          return {
            ...section,
            cards: (section.cards ?? []).filter((card) => card.id !== cardId),
          };
        })
      );
      setCardForms((prev) => {
        const clone = { ...prev };
        delete clone[cardId];
        return clone;
      });
      toast.success("تم حذف البطاقة");
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("تعذر حذف البطاقة");
    }
  };

  const handleAddCard = async () => {
    if (!selectedSection) return;
    try {
      const draft = defaultCardDraft(selectedSection);
      const response = await fetch("/api/cms/landing/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: selectedSection.id, draftJson: draft }),
      });
      if (!response.ok) {
        throw new Error("فشل إنشاء بطاقة جديدة");
      }
      const newCard: LandingCard = await response.json();

      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== selectedSection.id) return section;
          return {
            ...section,
            cards: [...(section.cards ?? []), newCard],
          };
        })
      );

      setCardForms((prev) => ({
        ...prev,
        [newCard.id]: normalizeCardContent(selectedSection.slug, newCard),
      }));

      toast.success("تمت إضافة بطاقة جديدة");
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("تعذر إضافة البطاقة");
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === "sections" && destination.droppableId === "sections") {
      const updated = Array.from(sections);
      const [moved] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, moved);
      setSections(updated);

      const orders = updated.map((section, index) => ({
        id: section.id,
        orderIndex: index,
      }));

      try {
        await fetch("/api/cms/landing/sections/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orders }),
        });
        toast.success("تم تحديث ترتيب الأقسام");
      } catch (error) {
        console.error("Error reordering sections:", error);
        toast.error("تعذر تحديث الترتيب");
      }
    }

    if (
      source.droppableId === "cards" &&
      destination.droppableId === "cards" &&
      selectedSection
    ) {
      const cards = Array.from(selectedSection.cards ?? []);
      const [moved] = cards.splice(source.index, 1);
      cards.splice(destination.index, 0, moved);
      setSections((prev) =>
        prev.map((section) =>
          section.id === selectedSection.id ? { ...section, cards } : section
        )
      );

      const orders = cards.map((card, index) => ({
        id: card.id,
        orderIndex: index,
      }));

      try {
        await fetch("/api/cms/landing/cards/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId: selectedSection.id, orders }),
        });
        toast.success("تم تحديث ترتيب البطاقات");
      } catch (error) {
        console.error("Error reordering cards:", error);
        toast.error("تعذر تحديث ترتيب البطاقات");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-lg font-medium text-muted-foreground">
          جار تحميل محتوى إدارة الصفحة...
        </div>
      </div>
    );
  }

  const outerClasses = embedded ? "bg-transparent py-6" : "min-h-screen bg-slate-50 py-10";
  const innerClasses = embedded ? "max-w-7xl mx-auto space-y-6" : "max-w-7xl mx-auto px-6 space-y-8";

  return (
    <div className={outerClasses}>
      <div className={innerClasses}>
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                إدارة محتوى صفحة الهبوط
              </h1>
              <p className="text-sm text-muted-foreground">
                قم بتحديث كل النصوص والأيقونات والعناصر المرئية لصفحة الهبوط بكل سهولة.
              </p>
            </div>
          </div>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "draft" | "published")}>
            <TabsList>
              <TabsTrigger value="draft">المسودة (قيد التحرير)</TabsTrigger>
              <TabsTrigger value="published">المنشور حالياً</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  <Card className="sticky top-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Menu className="h-4 w-4" />
                        أقسام الصفحة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {sections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(dragProvided, snapshot) => (
                            <button
                              type="button"
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setSelectedSectionId(section.id)}
                              className={`w-full p-3 border rounded-lg text-right transition ${
                                selectedSectionId === section.id
                                  ? "border-primary/60 bg-primary/10 text-primary"
                                  : "border-muted bg-white text-foreground"
                              } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-sm font-medium">
                                    {SECTION_LABELS[section.slug] ?? section.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {section.title}
                                  </span>
                                </div>
                                <Badge variant={section.status === "published" ? "default" : "secondary"}>
                                  {section.status === "published" ? "منشور" : "مسودة"}
                                </Badge>
                              </div>
                            </button>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>

            <div className="lg:col-span-3 space-y-6">
              {selectedSection && sectionForm ? (
                <>
                  <SectionEditor
                    section={selectedSection}
                    formState={sectionForm}
                    onChange={setSectionForm}
                    onSave={handleSaveSection}
                    onPublish={handlePublishSection}
                    saving={sectionSaving}
                    publishing={sectionPublishing}
                  />

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Type className="h-4 w-4" />
                        عناصر القسم ({selectedSection.cards?.length ?? 0})
                      </CardTitle>
                      <Button size="sm" onClick={handleAddCard}>
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة عنصر
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {(selectedSection.cards?.length ?? 0) > 0 ? (
                        <Droppable droppableId="cards">
                          {(providedCards) => (
                            <div
                              ref={providedCards.innerRef}
                              {...providedCards.droppableProps}
                              className="space-y-4"
                            >
                              {(selectedSection.cards ?? []).map((card, index) => {
                                const form = cardForms[card.id] ?? normalizeCardContent(selectedSection.slug, card);
                                return (
                                  <Draggable key={card.id} draggableId={card.id} index={index}>
                                    {(cardProvided, snapshot) => (
                                      <div
                                        ref={cardProvided.innerRef}
                                        {...cardProvided.draggableProps}
                                        {...cardProvided.dragHandleProps}
                                        className={snapshot.isDragging ? "shadow-lg" : ""}
                                      >
                                        <CardEditor
                                          card={card}
                                          section={selectedSection}
                                          formState={form}
                                          onChange={(next) =>
                                            setCardForms((prev) => ({ ...prev, [card.id]: next }))
                                          }
                                          onSave={() => handleSaveCard(card)}
                                          onDelete={() => handleDeleteCard(card.id)}
                                          saving={Boolean(cardSaving[card.id])}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {providedCards.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          لم يتم إضافة عناصر إلى هذا القسم بعد.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    قم باختيار قسم من القائمة الجانبية لبدء التعديل
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default CMSLandingPage;
