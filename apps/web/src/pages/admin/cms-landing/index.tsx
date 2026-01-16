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

// Import extracted types, utilities, components, and hooks
import type { LandingSection, LandingCard, SectionFormState, CardFormState } from "./types";
import { SECTION_LABELS } from "./utils/constants";
import { normalizeSectionContent, normalizeCardContent } from "./utils/normalizers";
import { buildSectionPayload, buildCardPayload } from "./utils/builders";
import { defaultCardDraft } from "./utils/defaults";
import { SectionEditor, CardEditor } from "./components";
import { useCMSLandingSections } from "./hooks";

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
      const response = await fetch(`/api/cms/landing/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
      const response = await fetch(`/api/cms/landing/cards/${cardId}`, {
        method: "DELETE",
      });
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
      const response = await fetch("/api/cms/landing/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: selectedSection.id, draftJson: draft }),
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
        await fetch("/api/cms/landing/sections/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orders }),
        });
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
        await fetch("/api/cms/landing/cards/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId: selectedSection.id, orders }),
        });
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
            <div className="mr-auto">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open("/", "_blank")}
              >
                <LinkIcon className="h-4 w-4" />
                عرض الموقع
              </Button>
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
                              className={`w-full p-3 border rounded-lg text-right transition ${selectedSectionId === section.id
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

