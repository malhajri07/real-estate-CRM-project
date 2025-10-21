import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { platformSidebarConfig, type PlatformSidebarChildConfig } from "@/config/platform-sidebar";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

interface SidebarProps {
  onLogout?: () => void;
}

const routeMatches = (item: PlatformSidebarChildConfig, currentLocation: string) => {
  if (!currentLocation) return false;
  if (currentLocation === item.path) return true;
  if (item.matchPaths?.includes(currentLocation)) return true;
  if (item.matchPrefixes?.some((prefix) => currentLocation.startsWith(prefix))) return true;
  return false;
};

const findActiveGroupId = (currentLocation: string) => {
  for (const group of platformSidebarConfig) {
    if (group.children.some((child) => routeMatches(child, currentLocation))) {
      return group.id;
    }
  }
  return null;
};

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { t, dir } = useLanguage();

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const activeGroupId = findActiveGroupId(location);
    if (activeGroupId) return [activeGroupId];
    return platformSidebarConfig.length ? [platformSidebarConfig[0].id] : [];
  });

  useEffect(() => {
    const activeGroupId = findActiveGroupId(location);
    if (activeGroupId) {
      setExpandedGroups((prev) => (prev.includes(activeGroupId) ? prev : [...prev, activeGroupId]));
    }
  }, [location]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-sidebar/95 bg-subtle-grid bg-[length:36px_36px] pb-8 pt-6 text-sidebar-foreground">
      <div className="px-6">
        <div className="flex items-center justify-center rounded-2xl border border-border/40 bg-card/80 py-6 shadow-outline backdrop-blur">
          <img
            src={agarkomLogo}
            alt="عقاركم"
            width={164}
            height={92}
            loading="lazy"
            decoding="async"
            className="h-20 w-auto object-contain"
          />
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-6 px-4">
        <ul className="space-y-4">
          {platformSidebarConfig.map((group) => {
            const GroupIcon = group.icon;
            const groupLabel = group.label ?? (group.labelKey ? t(group.labelKey) : group.id);
            const isExpanded = expandedGroups.includes(group.id);
            const isActiveGroup = group.children.some((child) => routeMatches(child, location));

            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-2xl border border-transparent bg-transparent px-4 py-3 text-sm font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isActiveGroup ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-sidebar-muted/70"
                  )}
                >
                  <span className="flex items-center gap-3" dir={dir}>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/80 text-muted-foreground shadow-outline",
                        isActiveGroup && "border-primary/40 text-primary"
                      )}
                    >
                      <GroupIcon size={18} />
                    </span>
                    <span className="text-sm font-semibold tracking-tight">{groupLabel}</span>
                  </span>
                  <span className="text-muted-foreground transition-transform duration-200 group-hover:text-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </button>

                <div
                  className={cn(
                    "mt-2 space-y-1 overflow-hidden rounded-2xl border border-border/40 bg-card/75 backdrop-blur transition-all duration-300",
                    isExpanded ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <ul
                    className={cn(
                      "space-y-1 px-2 py-3 transition-opacity duration-300",
                      isExpanded ? "opacity-100" : "opacity-0"
                    )}
                  >
                    {group.children.map((item) => {
                      const ItemIcon = item.icon;
                      const itemLabel = item.label ?? (item.labelKey ? t(item.labelKey) : item.id);
                      const isActive = routeMatches(item, location);

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.path}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                              dir === "rtl" ? "text-right" : "text-left",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-floating"
                                : "text-muted-foreground hover:bg-sidebar-muted/80 hover:text-foreground"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card/80 text-muted-foreground",
                                isActive && "border-transparent bg-primary/90 text-primary-foreground"
                              )}
                            >
                              <ItemIcon size={16} />
                            </span>
                            <span className="flex-1 truncate">{itemLabel}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>

        {onLogout && (
          <div className="rounded-2xl border border-border/40 bg-card/80 p-4 shadow-outline backdrop-blur">
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("auth.logout") || "تسجيل الخروج"}</span>
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
