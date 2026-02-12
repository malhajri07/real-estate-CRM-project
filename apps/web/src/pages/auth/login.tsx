/**
 * rbac-login.tsx - Login Page
 * 
 * Location: apps/web/src/ → Pages/ → Public Pages → rbac-login.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * RBAC login page for user authentication. Provides:
 * - User login form
 * - Authentication handling
 * - Role-based redirects
 * 
 * Route: /rbac-login or /login
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@shared/rbac';
import LoginForm from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import agarkomLogo from '@assets/Aqarkom (3)_1756501849666.png';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function RBACLoginPage() {
  const { login, logout, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { dir } = useLanguage();

  const handleGoToDashboard = () => {
    // Check if user has admin role
    const isAdmin = user?.roles?.includes(UserRole.WEBSITE_ADMIN);
    setLocation(isAdmin ? '/admin/overview/main-dashboard' : '/home/platform');
  };

  const handleLogin = async (username: string, password: string, rememberMe: boolean) => {
    try {
      setError(null);
      setIsRedirecting(true);
      // The AuthProvider's login function will handle navigation after successful login
      await login(username, password, rememberMe);
      // Don't reset isRedirecting here - let it stay true to show loading during redirect
    } catch (err) {
      setIsRedirecting(false);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const isAuthenticating = isLoading && !user;

  const goHome = () => {
    setLocation('/');
  };

  // Redirect effect: If user is logged in (from login or session), redirect immediately
  useEffect(() => {
    if (user && !isAuthenticating) {
      const isAdmin = user.roles?.includes(UserRole.WEBSITE_ADMIN);
      const targetPath = isAdmin ? '/admin/overview/main-dashboard' : '/home/platform';
      setLocation(targetPath);
    }
  }, [user, isAuthenticating, setLocation]);

  // Loading Screen
  if ((user && !isAuthenticating) || isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir={dir}>
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">
            {isRedirecting ? 'جاري التحقق من البيانات...' : 'جاري التوجيه...'}
          </p>
        </div>
      </div>
    );
  }

  let primaryCard: React.ReactNode;

  if (isAuthenticating) {
    primaryCard = (
      <Card className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="py-16 text-center space-y-6">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-600">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  } else {
    primaryCard = (
      <LoginForm
        onLogin={handleLogin}
        isLoading={isLoading}
        error={error || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative" dir={dir}>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent opacity-60" />
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-emerald-100/30 blur-3xl" />
        <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-3xl" />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <Button
          onClick={goHome}
          variant="ghost"
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-white/50 rounded-full px-4 py-2 transition-all"
        >
          <ArrowRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", dir === 'rtl' ? "rotate-180 group-hover:-translate-x-1" : "")} />
          <span className="font-medium">العودة للرئيسية</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[440px] z-10 space-y-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <img
            src={agarkomLogo}
            alt="Aqarkom Logo"
            className="h-20 w-auto object-contain drop-shadow-sm mb-4"
          />
        </div>

        {/* Login Card */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          {primaryCard}
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <p className="text-sm text-slate-500">
            لا تملك حساباً بعد؟{' '}
            <button
              onClick={() => setLocation('/signup')}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              إنشاء حساب جديد
            </button>
          </p>
          
          <div className="pt-8 text-xs text-slate-400 font-medium">
            جميع الحقوق محفوظة © {new Date().getFullYear()} منصة عقاراتي
          </div>
        </div>
      </div>
    </div>
  );
}
