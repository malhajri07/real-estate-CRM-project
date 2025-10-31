import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@shared/rbac';
import LoginForm from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import agarkomLogo from '@assets/Aqarkom (3)_1756501849666.png';
import { useLocation } from 'wouter';

export default function RBACLoginPage() {
  const { login, logout, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const handleGoToDashboard = () => {
    // Check if user has admin role
    const isAdmin = user?.roles?.includes(UserRole.WEBSITE_ADMIN);
    setLocation(isAdmin ? '/admin/overview/main-dashboard' : '/home/platform');
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      setError(null);
      setIsRedirecting(true);
      // The AuthProvider's login function will handle navigation after successful login
      await login(username, password);
      // Don't reset isRedirecting here - let it stay true to show loading during redirect
      // The AuthProvider will redirect, and the useEffect below will catch it
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
      // Use window.location for a hard redirect to ensure it works even if routing changes
      window.location.href = targetPath;
    }
  }, [user, isAuthenticating]);

  // If user is logged in, show loading screen while redirect happens
  // This prevents showing the "user logged in" card or any intermediate UI
  if (user && !isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">جاري التوجيه...</p>
        </div>
      </div>
    );
  }

  // Show loading screen while redirecting after login attempt
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">جاري التحقق من حالة الدخول...</p>
        </div>
      </div>
    );
  }

  let primaryCard: React.ReactNode;

  if (isAuthenticating) {
    primaryCard = (
      <Card className="rounded-[32px] border border-white/80 bg-white/85 backdrop-blur-xl shadow-[0_40px_120px_rgba(15,23,42,0.08)]">
        <CardContent className="py-12 text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">جاري التحقق من حالة الدخول...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="bg-white/90 backdrop-blur-xl border-b border-white/60 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[82px]">
            <Button
              onClick={goHome}
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              العودة للرئيسية
            </Button>
            <button
              onClick={goHome}
              className="flex flex-row-reverse items-center"
            >
              <span className="sr-only">الانتقال إلى الصفحة الرئيسية</span>
              <img
                src={agarkomLogo}
                alt="شعار منصة عقاراتي"
                width={114}
                height={64}
                loading="eager"
                decoding="async"
                className="h-16 w-auto object-contain"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {primaryCard}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-slate-500">
              لا تملك حساباً بعد؟
              <button 
                onClick={() => setLocation('/signup')}
                className="mr-2 font-semibold text-emerald-600 hover:text-emerald-700 underline bg-transparent border-none cursor-pointer"
              >
                إنشاء حساب جديد
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="px-4 pb-10">
        <div className="max-w-5xl mx-auto text-center text-xs text-slate-400">
          جميع الحقوق محفوظة © {new Date().getFullYear()} منصة عقاراتي
        </div>
      </footer>
    </div>
  );
}
