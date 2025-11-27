/**
 * LandingStudio.tsx - Landing Page Studio Component
 * 
 * Location: apps/web/src/ → Components/ → CMS Components → LandingStudio.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Landing page studio component for CMS. Provides:
 * - Landing page section editing
 * - Visual editor interface
 * - Section management
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/ - CMS landing editor pages
 * - apps/api/routes/cms-landing.ts - CMS landing API routes
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Send, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

// Types
type SectionDraft = {
  title?: string;
  subtitle?: string;
  body?: string;
  layoutVariant?: string;
  theme?: Record<string, unknown>;
  visibility?: boolean;
  [key: string]: unknown;
};

type CardDraft = {
  title?: string;
  body?: string;
  mediaUrl?: string;
  icon?: string;
  cta?: { label?: string; href?: string; style?: string };
  visibility?: boolean;
  [key: string]: unknown;
};

type CmsCard = {
  id: string;
  sectionId: string;
  orderIndex: number;
  status: string;
  visible: boolean;
  version: number;
  title?: string;
  body?: string;
  mediaUrl?: string;
  icon?: string;
  ctaLabel?: string;
  ctaHref?: string;
  content?: CardDraft | null;
  draftJson?: CardDraft | null;
  publishedJson?: CardDraft | null;
};

type CmsSection = {
  id: string;
  slug: string;
  orderIndex: number;
  status: string;
  visible: boolean;
  version: number;
  layoutVariant: string;
  title?: string;
  subtitle?: string;
  content?: SectionDraft | null;
  draftJson?: SectionDraft | null;
  publishedJson?: SectionDraft | null;
  cards?: CmsCard[];
};

type ViewMode = "draft" | "published" | "publish";

const layoutOptions = [
  { value: "hero", label: "Hero" },
  { value: "grid", label: "Grid" },
  { value: "pricing", label: "Pricing" },
  { value: "logos", label: "Logos" },
  { value: "cta", label: "CTA" },
  { value: "custom", label: "Custom" },
];

function emptySectionDraft(): SectionDraft {
  return {
    title: "",
    subtitle: "",
    body: "",
    layoutVariant: "custom",
    theme: {},
    visibility: true,
  };
}

function emptyCardDraft(): CardDraft {
  return {
    title: "",
    body: "",
    mediaUrl: "",
    icon: "",
    cta: { label: "", href: "", style: "primary" },
    visibility: true,
  };
}

export function LandingStudio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ data: CmsSection[] }>({
    queryKey: ["/api/cms/landing/sections?status=draft"],
  });

  const sections = data?.data ?? [];
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? sections[0],
    [sections, selectedSectionId]
  );

  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(emptySectionDraft());
  const [viewMode, setViewMode] = useState<ViewMode>("draft");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const selectedCard =
    selectedSection?.cards?.find((card) => card.id === selectedCardId) ?? selectedSection?.cards?.[0];
  const [cardDraft, setCardDraft] = useState<CardDraft>(emptyCardDraft());

  useEffect(() => {
    if (!selectedSection) return;
    const draft = (selectedSection.draftJson ?? selectedSection.content ?? emptySectionDraft()) as SectionDraft;
    setSectionDraft({
      ...emptySectionDraft(),
      ...draft,
      visibility: draft.visibility ?? selectedSection.visible ?? true,
    });
  }, [selectedSection?.id]);

  useEffect(() => {
    if (!selectedCard) return;
    const draft = (selectedCard.draftJson ?? selectedCard.content ?? emptyCardDraft()) as CardDraft;
    setCardDraft({
      ...emptyCardDraft(),
      ...draft,
      visibility: draft.visibility ?? selectedCard.visible ?? true,
      mediaUrl: draft.mediaUrl ?? selectedCard.mediaUrl ?? "",
    });
  }, [selectedCard?.id]);

  const saveSectionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSection) throw new Error("No section selected");
      await apiRequest("PUT", `/api/cms/landing/sections/${selectedSection.id}`, {
        draftJson: sectionDraft,
        title: sectionDraft.title,
        subtitle: sectionDraft.subtitle,
        layoutVariant: sectionDraft.layoutVariant,
        theme: sectionDraft.theme,
        visible: sectionDraft.visibility,
        status: "draft",
      });
    },
    onSuccess: async () => {
      toast({ title: "تم حفظ القسم", description: "تم تحديث محتوى القسم." });
      await refetch();
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error?.message ?? "تعذر حفظ القسم", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>تعذر تحميل المحتوى. يرجى المحاولة لاحقاً.</AlertDescription>
      </Alert>
    );
  }

  if (!selectedSection) {
    return (
      <div className="text-center text-sm text-slate-500">
        لا توجد أقسام متاحة. استخدم زر إنشاء قسم جديد لبدء إدارة المحتوى.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة المحتوى</h1>
          <p className="text-gray-600">إدارة أقسام الصفحة الرئيسية والمحتوى</p>
        </div>

        {/* Main Content */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
          <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
              {selectedSection.slug}
            </CardTitle>
                <CardDescription className="text-gray-600">
                  قم بتحديث محتوى القسم واضغط حفظ المسودة قبل النشر
            </CardDescription>
          </div>
              <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSectionDraft(
                  (selectedSection.draftJson ?? selectedSection.content ?? emptySectionDraft()) as SectionDraft
                );
                toast({
                  title: "تم الاستعادة",
                  description: "تم استرجاع البيانات من المسودة الحالية.",
                });
              }}
            >
              استرجاع
            </Button>
            <Button
              size="sm"
                  variant="outline"
              onClick={() => refetch()}
              disabled={saveSectionMutation.isPending}
            >
              إعادة تحميل
            </Button>
            <Button
              size="sm"
              onClick={() => saveSectionMutation.mutate()}
              disabled={saveSectionMutation.isPending}
            >
              {saveSectionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              حفظ المسودة
            </Button>
              </div>
          </div>
        </CardHeader>

          <CardContent className="p-6">
            {/* Section Tabs */}
            <Tabs value={selectedSection.id} onValueChange={(value) => setSelectedSectionId(value)} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                {sections.map((section, index) => (
                  <TabsTrigger 
                    key={section.id} 
                    value={section.id}
                    className="flex items-center gap-2"
                  >
                    <span>{section.slug}</span>
                    <Badge 
                      variant={section.status === "published" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {section.status}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Content Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="mb-6">
              <TabsTrigger value="draft">المسودة</TabsTrigger>
              <TabsTrigger value="published">المحتوى المنشور</TabsTrigger>
                <TabsTrigger value="publish">النشر</TabsTrigger>
            </TabsList>

            <TabsContent value="draft">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">العنوان</label>
                    <Input
                      value={sectionDraft.title ?? ""}
                      onChange={(event) =>
                        setSectionDraft((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="العنوان الرئيسي للقسم"
                    />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">الوصف المختصر</label>
                    <Input
                      value={sectionDraft.subtitle ?? ""}
                      onChange={(event) =>
                        setSectionDraft((current) => ({ ...current, subtitle: event.target.value }))
                      }
                      placeholder="الوصف أو الجملة التعريفية"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">النص الرئيسي</label>
                  <Textarea
                    value={sectionDraft.body ?? ""}
                    onChange={(event) =>
                      setSectionDraft((current) => ({ ...current, body: event.target.value }))
                    }
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="published">
                <div className="text-center py-8">
                  <p className="text-gray-500">محتوى منشور - سيتم عرض المحتوى المنشور هنا</p>
                </div>
              </TabsContent>

              <TabsContent value="publish">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">إجراءات النشر</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      اعتمد المحتوى بعد مراجعة الفرق المختصة
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>الإصدار الحالي:</span>
                      <Badge variant="outline">v{selectedSection.version}</Badge>
                </div>
              </div>

                  <div className="flex gap-4">
                    <Button className="flex-1">
          نشر القسم
        </Button>
                    <Button variant="outline" className="flex-1">
          أرشفة القسم
        </Button>
                  </div>
                  
                  <Alert>
          <AlertDescription>
                      عند النشر سيتم تحديث الصفحة العامة وتسجيل المراجعة في سجل التدقيق
          </AlertDescription>
        </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
