/**
 * sidebar.tsx - Platform Sidebar Component
 * 
 * Location: apps/web/src/ → Components/ → Layout Components → sidebar.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Platform sidebar navigation component using shadcn Sidebar system. Provides:
 * - Navigation menu with collapsible groups
 * - Active route highlighting
 * - Role-based visibility
 * - Built-in mobile support via Sheet
 * - RTL support with side="right"
 * 
 * Related Files:
 * - apps/web/src/components/layout/PlatformShell.tsx - Uses this sidebar
 * - apps/web/src/config/platform-sidebar.ts - Sidebar configuration
 * - apps/web/src/components/ui/sidebar.tsx - shadcn sidebar primitives
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  platformSidebarConfig,
  type PlatformSidebarChildConfig,
  type PlatformSidebarGroupConfig,
  type PlatformSidebarSubgroupConfig,
} from "@/config/platform-sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const PATH_PREFETCH_KEYS: Record<string, unknown[][]> = {
  "/home/platform/leads": [["/api/leads"]],
  "/home/platform/properties": [["/api/listings?pageSize=all"]],
  "/home/platform/notifications": [["/api/leads"], ["/api/campaigns"]],
  "/home/platform/clients": [["/api/leads"]],
  "/home/platform/dashboard": [["/api/reports/dashboard/metrics"]],
};

export default function PlatformSidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { t, dir } = useLanguage();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const prefetchOnHover = (path: string) => {
    const keys = PATH_PREFETCH_KEYS[path];
    if (!keys) return;
    keys.forEach((queryKey) => {
      queryClient.prefetchQuery({ queryKey });
    });
  };

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
      group.subgroups.forEach((subgroup) => {
        visibleChildren.push(...getVisibleChildren(subgroup.children));
      });
    }
    return visibleChildren;
  };

  const visibleGroups = platformSidebarConfig.filter((group) => {
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
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const renderNavItem = (item: PlatformSidebarChildConfig, isSubpage = false) => {
    const ItemIcon = item.icon;
    const itemLabel = item.label ?? (item.labelKey ? t(item.labelKey) : item.id);
    const isActive = routeMatches(item, location);

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={itemLabel}
          className={isSubpage ? "text-xs py-1.5" : "text-sm font-bold py-2"}
        >
          <Link
            href={item.path}
            onMouseEnter={() => prefetchOnHover(item.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <ItemIcon size={isSubpage ? 14 : 16} />
            <span>{itemLabel}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar side={dir === "rtl" ? "right" : "left"} collapsible="icon" dir={dir}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 truncate">
            {t("app.name") || "عقاركم"}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleGroups.map((group) => {
          const visibleItems = groupChildren(group);
          const isStandalone = visibleItems.length === 1 && !group.subgroups?.length;

          if (isStandalone) {
            return (
              <SidebarGroup key={group.id}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {renderNavItem(visibleItems[0])}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          const GroupIcon = group.icon;
          const groupLabel = group.label ?? (group.labelKey ? t(group.labelKey) : group.id);
          const isExpanded = expandedGroups.includes(group.id);
          const hasSubgroups = Boolean(group.subgroups?.length);

          const visibleSubgroups = group.subgroups?.filter(
            (subgroup) => getVisibleChildren(subgroup.children).length > 0
          );

          return (
            <Collapsible
              key={group.id}
              open={isExpanded}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="w-full flex items-center gap-2">
                    <GroupIcon size={16} />
                    <span className="flex-1 text-start">{groupLabel}</span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    {hasSubgroups
                      ? visibleSubgroups?.map((subgroup: PlatformSidebarSubgroupConfig) => {
                          const subgroupLabel =
                            subgroup.label ?? (subgroup.labelKey ? t(subgroup.labelKey) : subgroup.id);
                          return (
                            <div key={subgroup.id}>
                              {subgroupLabel && (
                                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
                                  {subgroupLabel}
                                </div>
                              )}
                              <SidebarMenu>
                                {getVisibleChildren(subgroup.children).map((item) => renderNavItem(item, true))}
                              </SidebarMenu>
                            </div>
                          );
                        })
                      : (
                        <SidebarMenu>
                          {getVisibleChildren(group.children).map((item) => renderNavItem(item, false))}
                        </SidebarMenu>
                      )}
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      {onLogout && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onLogout}
                data-testid="button-logout"
                tooltip={t("auth.logout") || "تسجيل الخروج"}
              >
                <LogOut size={16} />
                <span>{t("auth.logout") || "تسجيل الخروج"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
