/**
 * useCMSLandingSections Hook
 * 
 * Handles fetching and managing CMS landing page sections
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LandingSection } from "../types";

export function useCMSLandingSections(viewMode: "draft" | "published") {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/landing/sections?status=${viewMode}`);
      if (!response.ok) {
        throw new Error("لم يتم تحميل الأقسام");
      }
      const payload = await response.json();
      const data: LandingSection[] = payload.data ?? [];
      setSections(data);
    } catch (error) {
      logger.error("Error loading sections", {
        context: "useCMSLandingSections",
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      toast.error("تعذر تحميل الأقسام");
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const updateSection = useCallback((updated: LandingSection) => {
    setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
  }, []);

  const updateSectionsOrder = useCallback((newSections: LandingSection[]) => {
    setSections(newSections);
  }, []);

  return {
    sections,
    loading,
    loadSections,
    updateSection,
    updateSectionsOrder,
    setSections, // Expose for direct updates if needed
  };
}

