/**
 * sidebar.tsx - Platform Sidebar Component
 * 
 * Location: apps/web/src/ → Components/ → Layout Components → sidebar.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Platform sidebar navigation component. Provides:
 * - Navigation menu
 * - Collapsible sections
 * - Active route highlighting
 * 
 * Related Files:
 * - apps/web/src/components/layout/PlatformShell.tsx - Uses this sidebar
 * - apps/web/src/config/platform-sidebar.ts - Sidebar configuration
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  platformSidebarConfig,
  type PlatformSidebarChildConfig,
  type PlatformSidebarGroupConfig,
  type PlatformSidebarSubgroupConfig
} from "@/config/platform-sidebar";

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

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { t, dir } = useLanguage();
  const { hasRole } = useAuth();

  const isItemVisible = (item: PlatformSidebarChildConfig): boolean => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  };

  const getVisibleChildren = (items?: PlatformSidebarChildConfig[]) => {
    if (!items) return [];
    return items.filter(isItemVisible);
  };

  const groupChildren = (group: PlatformSidebarGroupConfig): PlatformSidebarChildConfig[] => {
    const visibleChildren: PlatformSidebarChildConfig[] = [];

    if (group.children?.length) {
      visibleChildren.push(...getVisibleChildren(group.children));
    }

    if (group.subgroups?.length) {
      group.subgroups.forEach(subgroup => {
        visibleChildren.push(...getVisibleChildren(subgroup.children));
      });
    }

    return visibleChildren;
  };

  // Filter groups to only show those with visible children
  const visibleGroups = platformSidebarConfig.filter(group => {
    return groupChildren(group).length > 0;
  });

  const findActiveGroupId = (currentLocation: string) => {
    for (const group of visibleGroups) {
      if (groupChildren(group).some((child) => routeMatches(child, currentLocation))) {
        return group.id;
      }
    }
    return null;
  };

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const activeGroupId = findActiveGroupId(location);
    if (activeGroupId) return [activeGroupId];
    return visibleGroups.length ? [visibleGroups[0].id] : [];
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  };

  const renderItems = (
    items: PlatformSidebarChildConfig[],
    location: string,
    dir: "rtl" | "ltr",
    t: (key: string) => string
  ) =>
    items.filter(isItemVisible).map((item) => {
      const ItemIcon = item.icon;
      const itemLabel = item.label ?? (item.labelKey ? t(item.labelKey) : item.id);
      const isActive = routeMatches(item, location);

      return (
        <li key={item.id}>
          <Link
            href={item.path}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
              dir === "rtl" ? "text-end" : "text-start",
              isActive 
                ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 shadow-sm" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-emerald-500",
                dir === "rtl" ? "-right-0.5" : "-left-0.5"
              )} />
            )}
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
                isActive 
                  ? "border-emerald-200 bg-white text-emerald-600 shadow-sm" 
                  : "border-slate-200 bg-white text-slate-500 group-hover:border-emerald-200 group-hover:text-emerald-600"
              )}
            >
              <ItemIcon size={16} />
            </span>
            <span className="flex-1 truncate">{itemLabel}</span>
          </Link>
        </li>
      );
    });

  return (
    <div className="glass h-[calc(100vh-5rem)] w-72 flex flex-col sticky top-20 border-e-0 md:rounded-e-[2rem] overflow-hidden" dir={dir}>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* App Name */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            {t("app.name") || "عقاركم"}
          </span>
        </div>

        <nav className="space-y-2" aria-label={t("nav.system_title")}>
          <ul className="space-y-2">
            {visibleGroups.map((group) => {
              const GroupIcon = group.icon;
              const groupLabel = group.label ?? (group.labelKey ? t(group.labelKey) : group.id);
              const isExpanded = expandedGroups.includes(group.id);
              const isActiveGroup = groupChildren(group).some((child) => routeMatches(child, location));
              const hasSubgroups = Boolean(group.subgroups?.length);

              // Filter subgroups individually too
              const visibleSubgroups = group.subgroups?.filter(subgroup =>
                getVisibleChildren(subgroup.children).length > 0
              );

              return (
                <li key={group.id} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    className={cn(
                      "w-full group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none select-none",
                      isActiveGroup 
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center p-2 rounded-xl transition-all duration-300",
                      isActiveGroup 
                        ? "bg-white/20" 
                        : "bg-slate-100 group-hover:bg-white shadow-sm"
                    )}>
                      <GroupIcon size={20} className={cn(isActiveGroup ? "text-white" : "text-slate-500 group-hover:text-emerald-600")} />
                    </div>
                    <span className="flex-1 text-sm font-semibold tracking-tight text-start">{groupLabel}</span>
                    <span className={cn(
                      "transition-transform duration-300",
                      isExpanded && "rotate-180"
                    )}>
                      <ChevronDown size={14} className={isActiveGroup ? "text-emerald-100" : "text-slate-400"} />
                    </span>
                  </button>

                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
                    )}
                  >
                    <div className="ms-6 ps-4 border-s-2 border-slate-100/50 space-y-1 pb-2">
                      {hasSubgroups
                        ? visibleSubgroups?.map((subgroup: PlatformSidebarSubgroupConfig) => {
                          const subgroupLabel = subgroup.label ?? (subgroup.labelKey ? t(subgroup.labelKey) : subgroup.id);
                          return (
                            <div key={subgroup.id} className="space-y-1">
                              {subgroupLabel && (
                                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {subgroupLabel}
                                </div>
                              )}
                              <ul className="space-y-1">
                                {subgroup.children.filter(isItemVisible).map((item) => {
                                  const itemLabel = item.label ?? (item.labelKey ? t(item.labelKey) : item.id);
                                  const isActive = routeMatches(item, location);
                                  return (
                                    <li key={item.id}>
                                      <Link
                                        href={item.path}
                                        className={cn(
                                          "w-full flex items-center px-4 py-2.5 rounded-xl transition-all text-sm font-medium outline-none select-none text-start",
                                          isActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "text-slate-500 hover:bg-slate-100/60 hover:text-slate-900"
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                      >
                                        <span className="flex-1 leading-tight">{itemLabel}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })
                        : <ul className="space-y-1">
                            {group.children?.filter(isItemVisible).map((item) => {
                              const itemLabel = item.label ?? (item.labelKey ? t(item.labelKey) : item.id);
                              const isActive = routeMatches(item, location);
                              return (
                                <li key={item.id}>
                                  <Link
                                    href={item.path}
                                    className={cn(
                                      "w-full flex items-center px-4 py-2.5 rounded-xl transition-all text-sm font-medium outline-none select-none text-start",
                                      isActive
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-slate-500 hover:bg-slate-100/60 hover:text-slate-900"
                                    )}
                                    aria-current={isActive ? "page" : undefined}
                                  >
                                    <span className="flex-1 leading-tight">{itemLabel}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {onLogout && (
            <div className="pt-4 border-t border-slate-100/50 mt-4">
              <button
                onClick={onLogout}
                className="w-full group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none select-none text-red-600 hover:bg-red-50"
                data-testid="button-logout"
              >
                <div className="flex items-center justify-center p-2 rounded-xl bg-red-50 group-hover:bg-red-100 transition-all duration-300">
                  <LogOut size={20} className="text-red-500 group-hover:text-red-600" />
                </div>
                <span className="flex-1 text-sm font-semibold tracking-tight text-start">{t("auth.logout") || "تسجيل الخروج"}</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
