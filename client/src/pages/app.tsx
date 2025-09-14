import React, { Suspense } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

// Import dashboard components
import Dashboard from '@/pages/dashboard';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';

/**
 * Platform Dashboard Page
 * 
 * This page contains the full real estate dashboard with:
 * - Main dashboard with metrics and charts
 * - Sidebar navigation
 * - Header with search functionality
 * - Authentication integration
 */
export default function AppPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation('/home');
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
      <div className="flex h-screen bg-slate-50 dark:bg-gray-900" dir="rtl">
        {/* Main content column (adds right padding equal to sidebar width) */}
        <div className="flex-1 flex flex-col pr-64 md:pr-72">
          <Header searchPlaceholder="البحث في العملاء أو العقارات..." />
          <div className="flex-1 overflow-y-auto">
            <Dashboard />
          </div>
        </div>
        {/* Fixed right sidebar */}
        <Sidebar onLogout={handleLogout} />
      </div>
    </Suspense>
  );
}
