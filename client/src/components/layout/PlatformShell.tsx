import React, { PropsWithChildren, useEffect, useState, type ReactNode } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';

type PlatformShellProps = PropsWithChildren<{
  onLogout?: () => void;
  title?: string;
  searchPlaceholder?: string;
  headerExtraContent?: ReactNode;
}>;

export default function PlatformShell({ children, onLogout, title, searchPlaceholder, headerExtraContent }: PlatformShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(event.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange as any);

    return () => {
      mediaQuery.removeEventListener('change', handleChange as any);
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="relative flex min-h-screen bg-[#f5f5f7]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden min-w-0',
          sidebarOpen ? 'lg:pr-72' : 'lg:pr-0'
        )}
      >
        <Header
          searchPlaceholder={searchPlaceholder || 'البحث في العملاء أو العقارات...'}
          title={title}
          extraContent={headerExtraContent}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-6 py-8">
            <div className="w-full max-w-10xl mx-auto space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-64 md:w-72 transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-full'
        )}
      >
        <Sidebar onLogout={onLogout} />
      </aside>
    </div>
  );
}
