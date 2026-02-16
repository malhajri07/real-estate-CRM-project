/**
 * header.tsx - Platform Header Component
 * 
 * Location: apps/web/src/ → Components/ → Layout Components → header.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Platform header component for authenticated pages. Provides:
 * - Navigation and search
 * - User menu and notifications
 * - Responsive mobile menu
 * 
 * Related Files:
 * - apps/web/src/components/layout/PlatformShell.tsx - Uses this header
 * - apps/web/src/components/layout/sidebar.tsx - Sidebar component
 */

import { useState, type ReactNode } from "react";
import type { ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { HEADER_STYLES } from "@/config/platform-theme";
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

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });
  const notificationCount = Array.isArray(notifications)
    ? notifications.filter((n: { read?: boolean; readAt?: string }) => !n?.read && !n?.readAt).length
    : 0;

  const username = user?.name || user?.username || user?.email?.split("@")[0] || "المستخدم";

  return (
    <motion.header
      variants={HEADER_VARIANTS}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass fixed inset-x-0 top-0 z-50 h-20 transition-all duration-300 border-b-0 shadow-none"
      aria-label={title || "الشريط العلوي"}
    >
      <div className="w-full px-6 sm:px-8 lg:px-12 h-full" dir={dir}>
        <div className="flex items-center justify-between h-full gap-4">
          {onToggleSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? t("header.toggleSidebarClose") : t("header.toggleSidebarOpen")}
              className={cn("inline-flex border border-white/60 bg-white/50 text-slate-600 shadow-sm transition hover:bg-white/80 hover:text-slate-900 focus-visible:ring-emerald-500/40 lg:hidden rounded-2xl h-11 w-11")}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}


          <div className="flex-1 max-w-2xl mx-auto hidden md:block">
            {showSearch && (
              <div className="relative">
                <Input
                  type="search"
                  placeholder={defaultPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-11 border-0 bg-slate-100/50 hover:bg-white focus:bg-white ring-1 ring-slate-200/60 ps-12 pe-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 text-start placeholder:text-start rounded-2xl"
                />
                <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {extraContent && (
              <div className="hidden items-center gap-2 sm:flex" dir={dir}>
                {extraContent}
              </div>
            )}

            {showActions && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-11 w-11 p-0 hover:bg-slate-100/80 rounded-2xl transition-colors"
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                  {notificationCount > 0 && (
                    <span className="absolute top-2.5 end-2.5 h-4 w-4 bg-red-500 border-2 border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>
                
                <div className="flex items-center gap-3 ps-3 border-s border-slate-200/50">
                  <div className="hidden flex-col items-end sm:flex">
                    <span className="text-xs font-semibold text-slate-900 leading-none mb-1">{username}</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider leading-none">{t("auth.loggedIn") || "مرحباً بعودتك"}</span>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <User className="h-5 w-5" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
