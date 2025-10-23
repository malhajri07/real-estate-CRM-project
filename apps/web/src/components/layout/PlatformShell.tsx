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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dir, t } = useLanguage();
  const isRTL = dir === "rtl";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        setSidebarOpen(false);
      }
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
      className={cn(
        "relative flex min-h-screen bg-background text-foreground transition-colors",
        isRTL ? "flex-row-reverse" : "flex-row"
      )}
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
          "fixed inset-y-0 z-50 flex w-72 max-w-[18rem] transform flex-col border-border/50 bg-sidebar/95 shadow-floating backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
        )}
      >
        <Sidebar onLogout={onLogout} />
      </aside>

      <div className="flex min-h-screen w-full flex-col lg:flex-1">
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

      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-72 shrink-0 border-border/50 bg-sidebar/95 shadow-floating lg:flex lg:flex-col",
          isRTL ? "border-l" : "border-r"
        )}
      >
        <Sidebar onLogout={onLogout} />
      </aside>
    </div>
  );
}
