import { useState, type ReactNode } from "react";
import type { ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Bell, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showActions?: boolean;
  extraContent?: ReactNode;
  title?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const HEADER_VARIANTS = {
  hidden: { opacity: 0, y: -18 },
  visible: { opacity: 1, y: 0 },
};

export default function Header({
  onSearch,
  searchPlaceholder,
  showSearch = true,
  showActions = true,
  extraContent,
  title,
  onToggleSidebar,
  isSidebarOpen,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { dir, t } = useLanguage();
  const { user } = useAuth();

  const defaultPlaceholder = searchPlaceholder || t("form.search") || "البحث...";

  const searchAlignment = dir === "rtl"
    ? "pr-12 pl-4 text-right placeholder:text-right"
    : "pl-12 pr-4 text-left placeholder:text-left";
  const searchIconPosition = dir === "rtl" ? "right-4" : "left-4";

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const notificationCount = 3;

  const username = user?.name || user?.username || user?.email?.split("@")[0] || "المستخدم";

  return (
    <motion.header
      variants={HEADER_VARIANTS}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      aria-label={title || "الشريط العلوي"}
    >
      <div className="mx-auto flex h-[4.25rem] w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8" dir={dir}>
        {onToggleSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? t("header.toggleSidebarClose") : t("header.toggleSidebarOpen")}
            className="inline-flex rounded-full border border-border/60 bg-card/70 text-muted-foreground shadow-outline transition hover:bg-card/90 focus-visible:ring-primary/40 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {title && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
              {t("app.subtitle") || "Aqarkom Platform"}
            </span>
            <h1 className="truncate text-lg font-semibold text-foreground lg:text-xl">{title}</h1>
          </div>
        )}

        {showSearch && (
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder={defaultPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className={cn(
                "h-11 w-full rounded-full border border-border/70 bg-card/80 pr-4 text-sm shadow-outline transition focus:border-primary/40 focus:ring-primary/40",
                searchAlignment
              )}
            />
            <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60", searchIconPosition)} />
          </div>
        )}

        {extraContent && (
          <div className="hidden items-center gap-2 sm:flex" dir={dir}>
            {extraContent}
          </div>
        )}

        {showActions && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full border border-border/60 bg-card/70 text-muted-foreground shadow-outline transition hover:bg-card/90 focus-visible:ring-primary/40"
              aria-label={t("header.notifications")}
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-medium text-primary-foreground shadow-floating">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 shadow-outline">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className={cn("hidden flex-col sm:flex", dir === "rtl" ? "text-right" : "text-left")}>
                <span className="text-sm font-medium text-foreground">{username}</span>
                <span className="text-[0.65rem] text-muted-foreground/80">{t("auth.loggedIn") || "مرحباً بعودتك"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );
}
