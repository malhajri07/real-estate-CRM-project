/**
 * validation.ts - Unverified Listing Validation Utilities
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → unverified-listing/ → utils/ → validation.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Validation utilities for unverified listing page. Provides:
 * - Form validation functions
 * - Step-by-step validation
 * - Validation error handling
 * 
 * Related Files:
 * - apps/web/src/pages/unverified-listing.tsx - Unverified listing page
 */

/**
 * Validation utilities for Unverified Listing Page
 */

import type { ListingFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

export function createValidationFunctions(
  form: ListingFormData,
  currentStep: number,
  toast: ReturnType<typeof useToast>["toast"]
) {
  const validateStep1 = (): boolean => {
    const requiredFields = [
      { key: "title", label: "عنوان الإعلان" },
      { key: "propertyCategory", label: "فئة العقار" },
      { key: "propertyType", label: "نوع العقار" },
      { key: "listingType", label: "نوع العرض" },
      { key: "price", label: "السعر" },
    ];

    for (const field of requiredFields) {
      const value = form[field.key as keyof typeof form];
      if (!value || String(value).trim() === "") {
        toast({
          title: "تحقق من البيانات",
          description: `يرجى تعبئة حقل ${field.label}`,
          variant: "destructive",
        });
        return false;
      }
    }

    const price = Number(form.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "قيمة غير صالحة",
        description: "يرجى إدخال سعر صحيح",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!form.city || form.city.trim() === "") {
      toast({
        title: "تحقق من البيانات",
        description: "يرجى تعبئة حقل المدينة",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    // Step 3 is optional, always valid
    return true;
  };

  const validateStep4 = (): boolean => {
    // Step 4 is optional, always valid
    return true;
  };

  const validateStep5 = (): boolean => {
    // Step 5 is optional, always valid
    return true;
  };

  const validateStep6 = (): boolean => {
    if (!form.mobileNumber || form.mobileNumber.trim().length < 7) {
      toast({
        title: "تحقق من البيانات",
        description: "رقم الجوال مطلوب ويجب أن يكون 7 أحرف على الأقل",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      case 5:
        return validateStep5();
      case 6:
        return validateStep6();
      default:
        return false;
    }
  };

  return {
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    validateStep6,
    validateCurrentStep,
  };
}

