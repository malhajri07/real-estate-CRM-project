/**
 * cms-landing/index.tsx - CMS Landing Page Editor
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → cms-landing/ → index.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Main component for managing landing page content via CMS. Provides:
 * - Landing page section management
 * - Drag-and-drop section ordering
 * - Section and card editing
 * - Draft and published state management
 * 
 * Route: /admin/content/landing-pages
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/components/ - CMS landing components
 * - apps/web/src/pages/admin/cms-landing/hooks/ - CMS landing hooks
 * - apps/web/src/pages/admin/cms-landing/utils/ - CMS landing utilities
 * - apps/api/routes/cms-landing.ts - CMS landing API routes
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Menu, Type, Sparkles, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

// Import extracted types, utilities, components, and hooks
import type { LandingSection, LandingCard, SectionFormState, CardFormState } from "./types";
import { SECTION_LABELS } from "./utils/constants";
import { normalizeSectionContent, normalizeCardContent } from "./utils/normalizers";
import { buildSectionPayload, buildCardPayload } from "./utils/builders";
import { defaultCardDraft } from "./utils/defaults";
import { SectionEditor, CardEditor } from "./components";
import { useCMSLandingSections } from "./hooks";
import { apiRequest } from "@/lib/queryClient";

interface CMSLandingPageProps {
  embedded?: boolean;
}

const CMSLandingPage: React.FC<CMSLandingPageProps> = ({ embedded = false }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"draft" | "published">("draft");
  const [sectionForm, setSectionForm] = useState<SectionFormState | null>(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionPublishing, setSectionPublishing] = useState(false);
  const [cardForms, setCardForms] = useState<Record<string, CardFormState>>({});
  const [cardSaving, setCardSaving] = useState<Record<string, boolean>>({});

  // Use extracted hook for section data
  const { sections, loading, updateSection, updateSectionsOrder, setSections } = useCMSLandingSections(viewMode);

  // Helper to update sections with a function
  const updateSections = useCallback((updater: (prev: LandingSection[]) => LandingSection[]) => {
    updateSectionsOrder(updater(sections));
  }, [sections, updateSectionsOrder]);

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return sections.find((section) => section.id === selectedSectionId) ?? null;
  }, [sections, selectedSectionId]);

  // Auto-select first section when sections load
  useEffect(() => {
    if (!selectedSectionId && sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  // Update forms when section changes
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

  const updateSectionState = (updated: LandingSection) => {
    updateSection(updated);
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
      const response = await apiRequest("PUT", `/api/cms/landing/sections/${selectedSection.id}`, payload);
      if (!response.ok) {
        throw new Error("فشل حفظ القسم");
      }
      const updatedSection = await response.json();
      updateSectionState(updatedSection);
      toast.success("تم حفظ القسم");

      // If section is published, notify landing page to refresh
      if (updatedSection.status === "published") {
        window.dispatchEvent(new Event('cms:landing-updated'));
        localStorage.setItem('cmsLandingUpdatedAt', Date.now().toString());
      }
    } catch (error) {
      logger.error("Error saving section", {
        context: "CMSLandingPage",
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      toast.error("تعذر حفظ القسم");
    } finally {
      setSectionSaving(false);
    }
  };

  const handlePublishSection = async () => {
    if (!selectedSection) return;
    setSectionPublishing(true);
    try {
      const response = await apiRequest(
        "POST",
        `/api/cms/landing/sections/${selectedSection.id}/publish`,
        { publishCards: true }
      );
      if (!response.ok) {
        throw new Error("فشل نشر القسم");
      }
      const updated = await response.json();
      updateSectionState(updated);
      toast.success("تم نشر القسم بنجاح");

      // Notify landing page to refresh
      window.dispatchEvent(new Event('cms:landing-updated'));
      localStorage.setItem('cmsLandingUpdatedAt', Date.now().toString());
    } catch (error) {
      logger.error("Error publishing section", {
        context: "CMSLandingPage",
        data: { error: error instanceof Error ? error.message : String(error) }
      });
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
      const response = await apiRequest("PUT", `/api/cms/landing/cards/${card.id}`, payload);
      if (!response.ok) {
        throw new Error("فشل حفظ البطاقة");
      }
      const updatedCard: LandingCard = await response.json();

      updateSections((prev) =>
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

      // If card is published, notify landing page to refresh
      if (updatedCard.status === "published") {
        window.dispatchEvent(new Event('cms:landing-updated'));
        localStorage.setItem('cmsLandingUpdatedAt', Date.now().toString());
      }
    } catch (error) {
      logger.error("Error saving card", {
        context: "CMSLandingPage",
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      toast.error("تعذر حفظ البطاقة");
    } finally {
      setCardSaving((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await apiRequest("DELETE", `/api/cms/landing/cards/${cardId}`);
      if (!response.ok) {
        throw new Error("فشل حذف البطاقة");
      }
      updateSections((prev) =>
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
      logger.error("Error deleting card", {
        context: "CMSLandingPage",
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      toast.error("تعذر حذف البطاقة");
    }
  };

  const handleAddCard = async () => {
    if (!selectedSection) return;
    try {
      const draft = defaultCardDraft(selectedSection);
      const response = await apiRequest("POST", "/api/cms/landing/cards", {
        sectionId: selectedSection.id,
        draftJson: draft,
      });
      if (!response.ok) {
        throw new Error("فشل إنشاء بطاقة جديدة");
      }
      const newCard: LandingCard = await response.json();

      updateSections((prev) =>
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
      logger.error("Error adding card", {
        context: "CMSLandingPage",
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      toast.error("تعذر إضافة البطاقة");
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === "sections" && destination.droppableId === "sections") {
      const updated = Array.from(sections);
      const [moved] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, moved);
      updateSectionsOrder(updated);

      const orders = updated.map((section, index) => ({
        id: section.id,
        orderIndex: index,
      }));

      try {
        await apiRequest("PUT", "/api/cms/landing/sections/reorder", { orders });
        toast.success("تم تحديث ترتيب الأقسام");
      } catch (error) {
        logger.error("Error reordering sections", {
          context: "CMSLandingPage",
          data: { error: error instanceof Error ? error.message : String(error) }
        });
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

      updateSections((prev) =>
        prev.map((section) => {
          if (section.id !== selectedSection.id) return section;
          return { ...section, cards };
        })
      );

      const orders = cards.map((card, index) => ({
        id: card.id,
        orderIndex: index,
      }));

      try {
        await apiRequest("PUT", "/api/cms/landing/cards/reorder", { sectionId: selectedSection.id, orders });
        toast.success("تم تحديث ترتيب البطاقات");
      } catch (error) {
        logger.error("Error reordering cards", {
          context: "CMSLandingPage",
          data: { error: error instanceof Error ? error.message : String(error) }
        });
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

  const outerClasses = embedded ? "bg-transparent" : "min-h-screen animate-in-start";
  const innerClasses = embedded ? "space-y-8" : "space-y-8 p-0";

  return (
    <div className={outerClasses} dir="rtl">
      <div className={innerClasses}>
        <div className="px-8 pt-8 flex flex-col gap-6">
          <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group relative overflow-hidden">
            <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="text-center md:text-end">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة محتوى صفحة الهبوط</h1>
                  <p className="text-slate-500 font-medium text-lg">قم بتحديث النصوص والأيقونات والعناصر المرئية بكل سهولة</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-12 px-8 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3"
                onClick={() => window.open("/", "_blank")}
              >
                <LinkIcon className="h-4 w-4" />
                عرض الموقع المباشر
              </Button>
            </div>
          </Card>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "draft" | "published")} className="w-full lg:w-auto">
              <TabsList className="bg-slate-100/50 p-1 rounded-2xl border-0 h-14 w-full lg:w-auto">
                <TabsTrigger value="draft" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all flex-1 lg:flex-none">المسودة (قيد التحرير)</TabsTrigger>
                <TabsTrigger value="published" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-bold transition-all flex-1 lg:flex-none">المنشور حالياً</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-50 text-blue-700 border-0 text-[10px] font-black uppercase px-3 py-1 rounded-lg">إصدار ٢.٤.٠</Badge>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-8 pb-12">
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4"
                >
                  <Card className="glass border-0 rounded-[2.5rem] p-6 shadow-none sticky top-8">
                    <div className="mb-6 px-2">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                        أقسام الصفحة
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {sections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(dragProvided, snapshot) => (
                            <button
                              type="button"
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setSelectedSectionId(section.id)}
                              className={cn(
                                "w-full p-4 rounded-2xl text-end transition-all duration-300 group relative overflow-hidden",
                                selectedSectionId === section.id
                                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                                  : "bg-white/50 border border-slate-100 text-slate-600 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5",
                                snapshot.isDragging && "shadow-2xl ring-2 ring-blue-500/20"
                              )}
                            >
                              <div className="flex items-center justify-between relative z-10">
                                <div className="flex flex-col items-start gap-1">
                                  <span className={cn(
                                    "text-sm font-black tracking-tight transition-colors",
                                    selectedSectionId === section.id ? "text-white" : "text-slate-900 group-hover:text-blue-600"
                                  )}>
                                    {SECTION_LABELS[section.slug] ?? section.title}
                                  </span>
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-tighter opacity-70",
                                    selectedSectionId === section.id ? "text-slate-300" : "text-slate-400"
                                  )}>
                                    {section.slug.replace(/-/g, ' ')}
                                  </span>
                                </div>
                                <Badge className={cn(
                                  "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-0 shrink-0",
                                  section.status === "published"
                                    ? (selectedSectionId === section.id ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-700")
                                    : (selectedSectionId === section.id ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500")
                                )}>
                                  {section.status === "published" ? "منشور" : "مسودة"}
                                </Badge>
                              </div>
                            </button>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
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

