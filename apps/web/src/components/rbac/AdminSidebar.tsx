/**
 * AdminSidebar.tsx - Admin Sidebar Component
 * 
 * Location: apps/web/src/ → Components/ → Feature Components → rbac/ → AdminSidebar.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin sidebar navigation component. Provides:
 * - Admin navigation menu
 * - Sidebar item types and structure
 * - Navigation helpers
 * 
 * Related Files:
 * - apps/web/src/components/rbac/AdminHeader.tsx - Admin header
 * - apps/web/src/config/admin-sidebar.ts - Admin sidebar configuration
 */

import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
    <div className="w-full md:w-64 h-full bg-white shadow-sm md:border-l border-t md:border-t-0 border-gray-200 flex-shrink-0 overflow-y-auto min-h-0 self-stretch flex flex-col" dir={dir}>
      <div className="p-6">
        <nav className="space-y-1.5 pb-6">
          {items.map((item) => {
            const isExpanded = expandedItems.includes(item.id);
            const isActive = activeItem === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  id={`Admin-${item.id}`}
                  data-admin-key={`Admin-${item.id}`}
                  aria-label={item.label}
                  aria-expanded={isExpanded}
                  className={`cursor-pointer select-none w-full flex items-center px-5 py-3 rounded-lg text-right transition-colors outline-none focus-visible:ring-2 ring-slate-300 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => {
                    const willExpand = !isExpanded;
                    onToggleItem(item.id);
                    if (willExpand && item.subPages?.length) {
                      onSelectSubPage(item.subPages[0]?.route || '');
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      const willExpand = !isExpanded;
                      onToggleItem(item.id);
                      if (willExpand && item.subPages?.length) {
                        onSelectSubPage(item.subPages[0]?.route || '');
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    {/* Swap icon ordering so the primary icon now sits opposite the chevron indicator (per request). */}
                    <Icon className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    <span className="flex-1 text-right text-sm font-medium">{item.label}</span>
                    <span className={dir === 'rtl' ? 'mr-0 ml-auto' : 'ml-0 mr-auto'}>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </button>

                {isExpanded && item.subPages && (
                  <div className="mr-3 space-y-1">
                    {item.subPages.map((subPage) => (
                      <button
                        key={subPage.id}
                        id={`Admin-${item.id}-${subPage.id}`}
                        data-admin-key={`Admin-${item.id}-${subPage.id}`}
                        aria-label={`${item.label} - ${subPage.label}`}
                        className={`cursor-pointer select-none w-full flex items-center px-5 py-2 rounded-md text-right transition-colors text-sm outline-none focus-visible:ring-2 ring-slate-300 ${
                          activeRoute === subPage.route
                            ? 'bg-blue-100 text-blue-800 border-r-2 border-blue-600'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                        onClick={() => onSelectSubPage(subPage.route)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelectSubPage(subPage.route);
                          }
                        }}
                        aria-current={activeRoute === subPage.route ? 'page' : undefined}
                      >
                        <span className="flex-1 text-right">{subPage.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
