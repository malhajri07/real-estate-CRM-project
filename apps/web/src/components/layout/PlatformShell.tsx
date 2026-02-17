/**
 * PlatformShell.tsx - Platform Shell Layout Component
 * 
 * Location: apps/web/src/ → Components/ → Layout Components → PlatformShell.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Platform shell layout wrapper for authenticated pages. Provides:
 * - Header and sidebar layout
 * - Navigation structure
 * - Responsive layout management
 * 
 * Related Files:
 * - apps/web/src/components/layout/header.tsx - Header component
 * - apps/web/src/components/layout/sidebar.tsx - Sidebar component
 */

import { PropsWithChildren, type ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/layout/header";
import PlatformSidebar from "@/components/layout/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { getHeaderConfigForPath } from "@/config/platform-header-config";
import { cn } from "@/lib/utils";

type PlatformShellProps = PropsWithChildren<{
  onLogout?: () => void;
  title?: string;
  searchPlaceholder?: string;
  headerExtraContent?: ReactNode;
}>;

export default function PlatformShell({
  children,
  onLogout,
  title: titleOverride,
  searchPlaceholder: searchPlaceholderOverride,
  headerExtraContent,
}: PlatformShellProps) {
  const { dir, t } = useLanguage();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const headerConfig = getHeaderConfigForPath(location);
  const title = titleOverride ?? t(headerConfig.titleKey);
  const searchPlaceholder = searchPlaceholderOverride ?? (headerConfig.searchPlaceholderKey ? t(headerConfig.searchPlaceholderKey) : t("nav.search"));
  const showSearch = headerConfig.showSearch ?? true;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden" dir={dir}>
      {/* Global Background with Clean Apple Style */}
      <div className="absolute inset-0 bg-[#F5F5F7] z-0" />

      {/* Sidebar Overlay - Only on mobile when sidebar is open (z-[60] below sidebar z-[65] so sidebar stays tappable) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Header - Fixed at Top */}
      <Header
        searchPlaceholder={searchPlaceholder}
        title={title}
        showSearch={showSearch}
        extraContent={headerExtraContent}
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 pt-20 relative z-10">
        {/* Sidebar - Fixed on Desktop */}
        <aside
          className={cn(
            "w-72 flex-shrink-0 z-[65]",
            "fixed inset-y-0 start-0 lg:top-20", 
            "transition-transform duration-300 ease-in-out",
            dir === "rtl"
              ? isSidebarOpen 
                ? "translate-x-0" 
                : "translate-x-full lg:translate-x-0"
              : isSidebarOpen 
                ? "translate-x-0" 
                : "-translate-x-full lg:translate-x-0",
             dir === "rtl" ? "right-0 lg:right-auto lg:left-auto" : "left-0 lg:left-auto"
          )}
        >
          <PlatformSidebar onLogout={onLogout} />
        </aside>

        {/* Main Content - centered with max-width */}
        <main className="flex-1 lg:ms-72 p-4 sm:p-6 lg:p-8 w-full flex flex-col items-center min-w-0 transition-all duration-300">
          <div className="w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
