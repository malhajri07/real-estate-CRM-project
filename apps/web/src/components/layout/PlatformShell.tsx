import { PropsWithChildren, type CSSProperties, type ReactNode } from "react";
import Header from "@/components/layout/header";
import PlatformSidebar from "@/components/layout/sidebar";
import {
  Sidebar as ShellSidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { pageContainer } from "@/lib/design-system";

type SidebarCSSVars = CSSProperties & { [key: `--${string}`]: string | number };

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
  const sidebarVars: SidebarCSSVars = {
    "--sidebar-width": "18rem",
  };

  return (
    <SidebarProvider
      dir={dir}
      className="min-h-screen bg-background text-foreground"
      style={sidebarVars}
    >
      <ShellContent
        dir={dir}
        onLogout={onLogout}
        title={title}
        searchPlaceholder={searchPlaceholder || t("nav.search")}
        headerExtraContent={headerExtraContent}
      >
        {children}
      </ShellContent>
    </SidebarProvider>
  );
}

type ShellContentProps = PlatformShellProps & { dir: "rtl" | "ltr" };

function ShellContent({
  children,
  onLogout,
  title,
  searchPlaceholder,
  headerExtraContent,
  dir,
}: ShellContentProps) {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const sidebarIsOpen = isMobile ? openMobile : open;

  return (
    <div className="flex min-h-screen w-full" dir={dir}>
      <ShellSidebar
        side={dir === "rtl" ? "right" : "left"}
        collapsible="offcanvas"
        dir={dir}
        className={cn(
          "bg-sidebar/95 text-sidebar-foreground shadow-floating",
          dir === "rtl" ? "border-l border-border/60" : "border-r border-border/60"
        )}
      >
        <SidebarContent className="px-0">
          <PlatformSidebar onLogout={onLogout} />
        </SidebarContent>
      </ShellSidebar>

      <SidebarInset className="flex min-h-screen flex-1 flex-col bg-background" dir={dir}>
        <Header
          searchPlaceholder={searchPlaceholder}
          title={title}
          extraContent={headerExtraContent}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarIsOpen}
        />
        <main className="flex-1 overflow-y-auto pt-6">
          <div className={pageContainer}>{children}</div>
        </main>
      </SidebarInset>
    </div>
  );
}
