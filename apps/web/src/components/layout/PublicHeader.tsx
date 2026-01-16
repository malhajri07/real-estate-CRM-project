/**
 * PublicHeader.tsx - Public Header Component
 * 
 * Location: apps/web/src/ → Components/ → Layout Components → PublicHeader.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Public header component for unauthenticated pages. Provides:
 * - Public navigation
 * - Login/signup links
 * - Language switcher
 * 
 * Related Files:
 * - apps/web/src/components/layout/PublicLayout.tsx - Uses this header
 * - apps/web/src/pages/landing.tsx - Landing page uses this
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserRole } from "@shared/rbac";
import { useQuery } from "@tanstack/react-query";

interface NavigationLink {
  id: string;
  label: string;
  href: string;
  order: number;
  visible: boolean;
  target?: string;
  icon?: string;
}

const fetchNavigationLinks = async (): Promise<NavigationLink[]> => {
  const res = await fetch("/api/cms/navigation", {
    credentials: "include",
  });
  if (!res.ok) {
    // Fallback to empty array if API fails
    return [];
  }
  return res.json();
};

export default function PublicHeader() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();

  // Fetch navigation links from API
  const { data: navLinksFromAPI = [] } = useQuery({
    queryKey: ["navigation-links"],
    queryFn: fetchNavigationLinks,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Fetch header config
  const { data: headerConfig } = useQuery({
    queryKey: ["header-config"],
    queryFn: async () => {
      const res = await fetch("/api/cms/public/header-config");
      return res.ok ? res.json() : null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const logoSrc = headerConfig?.logoUrl || agarkomLogo;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAuth = !!user;
  const currentPath = location;

  // Determine dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user?.roles) return "/home/platform";

    if (user.roles.includes(UserRole.WEBSITE_ADMIN)) {
      return "/admin/overview/main-dashboard";
    } else if (user.roles.some(role =>
      [UserRole.CORP_OWNER, UserRole.CORP_AGENT, UserRole.INDIV_AGENT, UserRole.SELLER, UserRole.BUYER].includes(role)
    )) {
      return "/home/platform";
    }

    return "/home/platform";
  };

  // Use API navigation links if available, otherwise fallback to hardcoded
  // Always include blog link
  const navLinks = useMemo(() => {
    const blogLink = { href: "/blog", label: "المدونة" };

    if (navLinksFromAPI.length > 0) {
      const apiLinks = navLinksFromAPI
        .filter((link) => link.visible)
        .sort((a, b) => a.order - b.order)
        .map((link) => ({
          href: link.href,
          label: link.label,
        }));

      // Check if blog link already exists in API links
      const hasBlogLink = apiLinks.some((link) => link.href === "/blog");

      // If blog link doesn't exist, add it
      if (!hasBlogLink) {
        return [...apiLinks, blogLink];
      }

      return apiLinks;
    }

    // Fallback to hardcoded links
    return [
      { href: "/map", label: t("nav.search") },
      blogLink,
      { href: "/real-estate-requests", label: "اطلب عقارك" },
      { href: "/unverified-listings", label: "أدرج عقارك للبيع" },
    ];
  }, [navLinksFromAPI, t]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        isScrolled
          ? "bg-white/85 backdrop-blur-2xl border-b border-white/60 shadow-soft"
          : "bg-white/60 backdrop-blur-xl border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex h-[64px] items-center justify-between px-4 sm:px-6 xl:px-8">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-3 rounded-full bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-white/60 transition hover:shadow hover:ring-white"
          >
            <img
              src={logoSrc}
              alt={headerConfig?.siteName || "عقاركم"}
              width={72}
              height={40}
              loading="eager"
              decoding="async"
              className="h-8 w-auto"
            />
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {navLinks.map((link) => {
            const isActive = currentPath.startsWith(link.href);
            // Use Link for internal routes, <a> for hash links or external URLs
            const isHashLink = link.href.startsWith("#");
            const isExternalLink = link.href.startsWith("http");

            if (isHashLink || isExternalLink) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-full transition-colors duration-200",
                    isActive
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-full transition-colors duration-200 cursor-pointer inline-block",
                  isActive
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full border border-slate-200 text-slate-600"
            onClick={() => (window.location.href = isAuth ? getDashboardUrl() : "/rbac-login")}
            aria-label="فتح القائمة أو تسجيل الدخول"
          >
            <Menu className="h-4 w-4" />
          </Button>
          {isAuth ? (
            <Button
              variant="secondary"
              className="hidden md:inline-flex rounded-2xl bg-emerald-600 text-white shadow-soft hover:bg-emerald-700"
              onClick={() => (window.location.href = getDashboardUrl())}
            >
              {t("nav.dashboard")}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden md:inline-flex rounded-2xl text-emerald-600 hover:bg-emerald-50"
                onClick={() => (window.location.href = "/rbac-login")}
              >
                {t("nav.login")}
              </Button>
              <Button
                className="hidden md:inline-flex rounded-2xl bg-emerald-600 text-white shadow-soft hover:bg-emerald-700"
                onClick={() => (window.location.href = "/signup")}
              >
                {t("nav.signup")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
