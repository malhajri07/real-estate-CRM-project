/**
 * AdminSidebar.tsx - Admin Sidebar Component
 * 
 * Location: apps/web/src/ → Components/ → Admin/ → Layout/ → AdminSidebar.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin sidebar navigation component using shadcn Sidebar system. Provides:
 * - Admin navigation menu
 * - Collapsible sidebar groups
 * - Active route highlighting
 * - RTL support
 * 
 * Related Files:
 * - apps/web/src/components/admin/layout/AdminHeader.tsx - Admin header
 * - apps/web/src/config/admin-sidebar.ts - Admin sidebar configuration
 */

import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Shield } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type SidebarSubPage = {
  id: string;
  label: string;
  route: string;
};

export type SidebarItem = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  subPages?: SidebarSubPage[];
};

type AdminSidebarProps = {
  dir: 'rtl' | 'ltr';
  items: SidebarItem[];
  activeItem: string;
  expandedItems: string[];
  onToggleItem: (id: string) => void;
  activeRoute: string;
  onSelectSubPage: (route: string) => void;
};

export function AdminSidebar({
  dir,
  items,
  activeItem,
  expandedItems,
  onToggleItem,
  activeRoute,
  onSelectSubPage,
}: AdminSidebarProps) {
  return (
    <Sidebar side={dir === 'rtl' ? 'right' : 'left'} collapsible="offcanvas">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Admin Panel</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isExpanded = expandedItems.includes(item.id);
                const isActive = activeItem === item.id;
                const Icon = item.icon;

                if (!item.subPages?.length) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        onClick={() => onToggleItem(item.id)}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <Collapsible
                    key={item.id}
                    open={isExpanded}
                    onOpenChange={() => {
                      const willExpand = !isExpanded;
                      onToggleItem(item.id);
                      if (willExpand && item.subPages?.length) {
                        onSelectSubPage(item.subPages[0]?.route || '');
                      }
                    }}
                    asChild
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Icon />
                          <span>{item.label}</span>
                          <ChevronDown className="ms-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subPages?.map((subPage) => (
                            <SidebarMenuSubItem key={subPage.id}>
                              <SidebarMenuSubButton
                                isActive={activeRoute === subPage.route}
                                onClick={() => onSelectSubPage(subPage.route)}
                                asChild
                              >
                                <button type="button">
                                  <span>{subPage.label}</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Version
              </span>
              <span className="text-xs font-semibold">v1.2.4-PRO</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
