import { PropsWithChildren, useEffect, useState, type ReactNode } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { pageContainer } from "@/lib/design-system";

type PlatformShellProps = PropsWithChildren<{
  onLogout?: () => void;
  title?: string;
  searchPlaceholder?: string;
  headerExtraContent?: ReactNode;
}>;

export default function PlatformShell({ children, onLogout, title, searchPlaceholder, headerExtraContent }: PlatformShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  const { dir, t } = useLanguage();
  const isRTL = dir === "rtl";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(event.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange as any);

    return () => {
      mediaQuery.removeEventListener("change", handleChange as any);
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="relative flex min-h-screen bg-background text-foreground transition-colors"
      dir={dir}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 w-72 max-w-[18rem] transform border-border/50 bg-sidebar/95 shadow-floating backdrop-blur-xl transition-transform duration-300 ease-in-out",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar onLogout={onLogout} />
      </aside>

      <div
        className={cn(
          "flex min-h-screen w-full flex-col transition-[padding] duration-300 ease-in-out",
          isRTL
            ? sidebarOpen
              ? "lg:pr-72"
              : "lg:pr-0"
            : sidebarOpen
              ? "lg:pl-72"
              : "lg:pl-0"
        )}
      >
        <Header
          searchPlaceholder={searchPlaceholder || t("nav.search")}
          title={title}
          extraContent={headerExtraContent}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-y-auto pt-6">
          <div className={pageContainer}>{children}</div>
        </main>
      </div>
    </div>
  );
}
