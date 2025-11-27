/**
 * Default values for CMS Landing Page
 */

import type { LandingSection } from "../types";

/**
 * Returns default card draft content based on section type
 */
export function defaultCardDraft(section: LandingSection) {
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
        value: "1000",
        label: "إحصائية",
        suffix: "+",
      };
    case "pricing":
      return {
        title: "خطة جديدة",
        body: "وصف الخطة",
        price: "0",
        period: "monthly" as const,
        isPopular: false,
        features: [],
      };
    case "contact":
      return {
        type: "phone",
        title: "اتصل بنا",
        body: "معلومات الاتصال",
        icon: "phone",
      };
    case "navigation":
      return {
        label: "رابط جديد",
        href: "/",
      };
    case "footer":
      return {
        category: "فئة جديدة",
        links: [],
      };
    default:
      return {};
  }
}

