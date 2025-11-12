import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface SEOSettings {
  pagePath: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robotsMeta?: string;
  canonicalUrl?: string;
}

const fetchSEOSettings = async (pagePath: string): Promise<SEOSettings | null> => {
  try {
    const res = await fetch(`/api/cms/seo${pagePath}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

/**
 * Hook to apply SEO meta tags from CMS to the current page
 */
export function useSEO(pagePath?: string, fallbackTitle?: string, fallbackDescription?: string) {
  const [location] = useLocation();
  const currentPath = pagePath || location;

  const { data: seoSettings } = useQuery({
    queryKey: ["seo-settings", currentPath],
    queryFn: () => fetchSEOSettings(currentPath),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  useEffect(() => {
    const title = seoSettings?.metaTitle || fallbackTitle;
    const description = seoSettings?.metaDescription || fallbackDescription;
    const keywords = seoSettings?.metaKeywords;
    const ogTitle = seoSettings?.ogTitle || title;
    const ogDescription = seoSettings?.ogDescription || description;
    const ogImage = seoSettings?.ogImage;
    const ogType = seoSettings?.ogType || "website";
    const twitterCard = seoSettings?.twitterCard || "summary_large_image";
    const twitterTitle = seoSettings?.twitterTitle || title;
    const twitterDescription = seoSettings?.twitterDescription || description;
    const twitterImage = seoSettings?.twitterImage || ogImage;
    const robotsMeta = seoSettings?.robotsMeta;
    const canonicalUrl = seoSettings?.canonicalUrl || window.location.href;

    // Update document title
    if (title) {
      document.title = `${title} · عقاركم`;
    }

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string | undefined, attribute: string = "name") => {
      if (!content) return;
      
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Update meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);
    updateMetaTag("robots", robotsMeta);

    // Open Graph tags
    updateMetaTag("og:title", ogTitle, "property");
    updateMetaTag("og:description", ogDescription, "property");
    updateMetaTag("og:image", ogImage, "property");
    updateMetaTag("og:type", ogType, "property");
    updateMetaTag("og:url", canonicalUrl, "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", twitterCard, "name");
    updateMetaTag("twitter:title", twitterTitle, "name");
    updateMetaTag("twitter:description", twitterDescription, "name");
    updateMetaTag("twitter:image", twitterImage, "name");

    // Canonical URL
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [seoSettings, fallbackTitle, fallbackDescription]);

  return seoSettings;
}

