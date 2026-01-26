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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
              dir === "rtl" ? "text-end" : "text-start",
              isActive ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600",
                isActive && "border-blue-300 bg-blue-100 text-blue-700"
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
    <div className="flex h-full flex-col overflow-y-auto bg-white" dir={dir}>
      <nav className="flex-1 space-y-6 px-4 py-6" aria-label={t("nav.system_title")}>
        <ul className="space-y-4">
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
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-lg border border-transparent bg-transparent px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500",
                    isActiveGroup ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span className="flex items-center gap-3" dir={dir}>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 shadow-sm",
                        isActiveGroup && "border-blue-300 text-blue-600 bg-blue-50"
                      )}
                    >
                      <GroupIcon size={18} />
                    </span>
                    <span className="text-sm font-semibold tracking-tight">{groupLabel}</span>
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-600">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </button>

                <div
                  className={cn(
                    "mt-2 space-y-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50",
                    isExpanded ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="space-y-3 px-2 py-3">
                    {hasSubgroups
                      ? visibleSubgroups?.map((subgroup: PlatformSidebarSubgroupConfig) => {
                        const subgroupLabel = subgroup.label ?? (subgroup.labelKey ? t(subgroup.labelKey) : subgroup.id);
                        return (
                          <div key={subgroup.id} className="space-y-2">
                            {subgroupLabel && (
                              <div className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {subgroupLabel}
                              </div>
                            )}
                            <ul className="space-y-1">{renderItems(subgroup.children, location, dir, t)}</ul>
                          </div>
                        );
                      })
                      : <ul className="space-y-1">{renderItems(group.children ?? [], location, dir, t)}</ul>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {onLogout && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
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
