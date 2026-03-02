/**
 * PlatformShell.tsx - Platform Shell Layout Component
 * 
 * Location: apps/web/src/ → Components/ → Layout Components → PlatformShell.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Platform shell layout wrapper for authenticated pages. Uses shadcn
 * SidebarProvider for layout context and SidebarInset for main content.
 * Mobile sidebar is handled automatically via Sheet in the shadcn system.
 * 
 * Related Files:
 * - apps/web/src/components/layout/header.tsx - Header component
 * - apps/web/src/components/layout/sidebar.tsx - Sidebar component
 * - apps/web/src/components/ui/sidebar.tsx - shadcn sidebar primitives
 */

import { PropsWithChildren, type ReactNode } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import PlatformSidebar from "@/components/layout/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { getHeaderConfigForPath } from "@/config/platform-header-config";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type PlatformShellProps = PropsWithChildren<{
  onLogout?: () => void;
  title?: string;
  searchPlaceholder?: string;
  headerExtraContent?: ReactNode;
}>;

function PlatformShellContent({
  children,
  onLogout,
  title: titleOverride,
  searchPlaceholder: searchPlaceholderOverride,
  headerExtraContent,
}: PlatformShellProps) {
  const { dir, t } = useLanguage();
  const [location] = useLocation();
  const { toggleSidebar, openMobile } = useSidebar();

  const headerConfig = getHeaderConfigForPath(location);
  const title = titleOverride ?? t(headerConfig.titleKey);
  const searchPlaceholder =
    searchPlaceholderOverride ??
    (headerConfig.searchPlaceholderKey ? t(headerConfig.searchPlaceholderKey) : t("nav.search"));
  const showSearch = headerConfig.showSearch ?? true;

  return (
    <>
      <PlatformSidebar onLogout={onLogout} />
      <SidebarInset>
        <Header
          searchPlaceholder={searchPlaceholder}
          title={title}
          showSearch={showSearch}
          extraContent={headerExtraContent}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={openMobile}
        />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

export default function PlatformShell(props: PlatformShellProps) {
  const { dir } = useLanguage();

  return (
    <SidebarProvider dir={dir}>
      <PlatformShellContent {...props} />
    </SidebarProvider>
  );
}
