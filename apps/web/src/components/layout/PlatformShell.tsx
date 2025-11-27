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
import Header from "@/components/layout/header";
import PlatformSidebar from "@/components/layout/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
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
  title,
  searchPlaceholder,
  headerExtraContent,
}: PlatformShellProps) {
  const { dir, t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir={dir}>
      {/* Sidebar Overlay - Only on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Hidden by default on mobile, visible on desktop */}
      <aside
        className={cn(
          "w-72 bg-white border-r border-gray-200 shadow-lg flex-shrink-0",
          "fixed lg:static inset-y-0 z-50",
          "transform transition-transform duration-300 ease-in-out",
          // Mobile: slide in/out based on state
          // Desktop: always visible (static positioning, no transform)
          dir === "rtl"
            ? isSidebarOpen 
              ? "translate-x-0 lg:translate-x-0" 
              : "translate-x-full lg:translate-x-0"
            : isSidebarOpen 
              ? "translate-x-0 lg:translate-x-0" 
              : "-translate-x-full lg:translate-x-0",
          dir === "rtl" 
            ? "border-l border-r-0 right-0 lg:right-auto" 
            : "border-r left-0 lg:left-auto"
        )}
      >
        <PlatformSidebar onLogout={onLogout} />
      </aside>

      {/* Main content area - Full width on mobile, with proper spacing on desktop */}
      <div className="flex flex-col flex-1 min-w-0 w-full lg:w-auto">
        {/* Header */}
        <Header
          searchPlaceholder={searchPlaceholder || t("nav.search")}
          title={title}
          extraContent={headerExtraContent}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
