/**
 * header.tsx - Platform Header Component
 *
 * Standard shadcn dashboard header using SidebarTrigger, Separator, Avatar.
 */

import { useState, type ReactNode } from "react";
import type { ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";

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

export default function Header({
  onSearch,
  searchPlaceholder,
  showSearch = true,
  showActions = true,
  extraContent,
  title,
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
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4 transition-[width,height] ease-linear"
     
    >
      {/* Standard shadcn SidebarTrigger */}
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="mx-2 h-4" />

      {/* Title */}
      {title && (
        <span className="text-sm font-bold text-foreground truncate hidden sm:inline">
          {title}
        </span>
      )}

      {/* Search */}
      <div className="flex-1 max-w-xl mx-auto hidden md:block">
        {showSearch && (
          <div className="relative">
            <Input
              type="search"
              placeholder={defaultPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-9 border-0 bg-muted/50 hover:bg-card focus:bg-card ring-1 ring-border ps-10 pe-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/30 rounded-xl"
            />
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ms-auto">
        {extraContent && (
          <div className="hidden items-center gap-2 sm:flex">
            {extraContent}
          </div>
        )}

        {showActions && (
          <>
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-lg"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>الإشعارات</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-1 h-4" />

            {/* User info */}
            <div className="flex items-center gap-2">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-xs font-bold text-foreground leading-none">{username}</span>
                <span className="text-[10px] font-bold text-muted-foreground leading-none mt-0.5">
                  {t("auth.loggedIn") || "متصل"}
                </span>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
