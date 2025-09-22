import React, { PropsWithChildren } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';

type PlatformShellProps = PropsWithChildren<{
  onLogout?: () => void;
  title?: string;
  searchPlaceholder?: string;
}>;

export default function PlatformShell({ children, onLogout, title, searchPlaceholder }: PlatformShellProps) {
  return (
    <div className="flex min-h-screen h-screen bg-[#f5f5f7] overflow-hidden">
      <div className="flex-1 flex flex-col pr-64 md:pr-72 overflow-hidden">
        <Header searchPlaceholder={searchPlaceholder || 'البحث في العملاء أو العقارات...'} title={title} />
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-6 py-8">
            <div className="w-full max-w-10xl mx-auto space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>
      <div className="w-64 md:w-72 fixed right-0 inset-y-0 z-50">
        <Sidebar onLogout={onLogout} />
      </div>
    </div>
  );
}
