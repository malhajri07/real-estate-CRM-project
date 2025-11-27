/**
 * app.tsx - Platform App Wrapper Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → app.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Platform app wrapper page. Provides:
 * - Platform shell layout
 * - Dashboard integration
 * - Authentication handling
 * 
 * Route: /home/platform/app
 * 
 * Related Files:
 * - apps/web/src/pages/dashboard.tsx - Dashboard page
 * - apps/web/src/components/layout/PlatformShell.tsx - Platform shell layout
 */

import React, { Suspense } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';

// Import dashboard components
import Dashboard from '@/pages/dashboard';
import PlatformShell from '@/components/layout/PlatformShell';

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
      <PlatformShell onLogout={handleLogout}>
        <Dashboard />
      </PlatformShell>
    </Suspense>
  );
}
