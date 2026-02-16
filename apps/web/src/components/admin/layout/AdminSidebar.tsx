/**
 * AdminSidebar.tsx - Admin Sidebar Component
 * 
 * Location: apps/web/src/ → Components/ → Admin/ → Layout/ → AdminSidebar.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin sidebar navigation component. Provides:
 * - Admin navigation menu
 * - Sidebar item types and structure
 * - Navigation helpers
 * 
 * Related Files:
 * - apps/web/src/components/admin/layout/AdminHeader.tsx - Admin header
 * - apps/web/src/config/admin-sidebar.ts - Admin sidebar configuration
 */

import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="glass h-[calc(100vh-5rem)] w-72 flex flex-col sticky top-20 border-e-0 md:rounded-e-[2rem] overflow-hidden" dir={dir}>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <nav className="space-y-2">
          {items.map((item) => {
            const isExpanded = expandedItems.includes(item.id);
            const isActive = activeItem === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id} className="space-y-1.5 animate-in-start">
                <button
                  id={`Admin-${item.id}`}
                  data-admin-key={`Admin-${item.id}`}
                  aria-label={item.label}
                  aria-expanded={isExpanded}
                  className={cn(
                    "w-full group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none select-none",
                    isActive
                      ? "premium-gradient text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                  onClick={() => {
                    const willExpand = !isExpanded;
                    onToggleItem(item.id);
                    if (willExpand && item.subPages?.length) {
                      onSelectSubPage(item.subPages[0]?.route || '');
                    }
                  }}
                >
                  <div className={cn(
                    "flex items-center justify-center p-2 rounded-xl transition-all duration-300",
                    isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-white shadow-sm"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600")} />
                  </div>

                  <span className="flex-1 text-sm font-semibold tracking-tight">{item.label}</span>

                  {item.subPages && item.subPages.length > 0 && (
                    <span className={cn(
                      "transition-transform duration-300",
                      isExpanded ? "rotate-180" : ""
                    )}>
                      {dir === "rtl" ? (
                        <ChevronLeft size={14} className={isActive ? "text-blue-100" : "text-slate-400"} />
                      ) : (
                        <ChevronDown size={14} className={isActive ? "text-blue-100" : "text-slate-400"} />
                      )}
                    </span>
                  )}
                </button>

                {isExpanded && item.subPages && (
                  <div className="ms-6 ps-4 border-s-2 border-slate-100/50 space-y-1 mt-1 pb-2">
                    {item.subPages.map((subPage) => {
                      const isSubActive = activeRoute === subPage.route;
                      return (
                        <button
                          key={subPage.id}
                          id={`Admin-${item.id}-${subPage.id}`}
                          data-admin-key={`Admin-${item.id}-${subPage.id}`}
                          aria-label={`${item.label} - ${subPage.label}`}
                          className={cn(
                            "w-full flex items-center px-4 py-2.5 rounded-xl transition-all text-sm font-medium outline-none select-none text-start",
                            isSubActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-500 hover:bg-slate-100/60 hover:text-slate-900"
                          )}
                          onClick={() => onSelectSubPage(subPage.route)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onSelectSubPage(subPage.route);
                            }
                          }}
                          aria-current={isSubActive ? 'page' : undefined}
                        >
                          <span className="flex-1 leading-tight">{subPage.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer or Version Info */}
      <div className="p-6 pt-0 mt-auto">
        <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Shield size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Version</span>
            <span className="text-xs font-semibold text-slate-900 leading-none">v1.2.4-PRO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
