import { PropsWithChildren, type ReactNode } from "react";
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

  return (
    <div className="flex h-screen bg-gray-50" dir={dir}>
      {/* Sidebar - Fixed position, stable layout */}
      <aside
        className={cn(
          "w-72 bg-white border-r border-gray-200 shadow-lg flex-shrink-0",
          "lg:relative lg:translate-x-0 lg:block",
          dir === "rtl" ? "border-l border-r-0" : "border-r",
          "fixed lg:static inset-y-0 z-50"
        )}
      >
        <PlatformSidebar onLogout={onLogout} />
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header
          searchPlaceholder={searchPlaceholder || t("nav.search")}
          title={title}
          extraContent={headerExtraContent}
          onToggleSidebar={() => {}}
          isSidebarOpen={true}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
