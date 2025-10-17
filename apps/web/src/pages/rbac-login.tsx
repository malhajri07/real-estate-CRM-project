import React, { useState } from 'react';
import { useAuth, UserRole } from '@/components/auth/AuthProvider';
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
      // The AuthProvider's login function will handle navigation after successful login
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const isAuthenticating = isLoading && !user;

  const goHome = () => {
    setLocation('/');
  };

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
  } else if (user) {
    primaryCard = (
      <Card className="rounded-[32px] border border-white/80 bg-white/85 backdrop-blur-xl shadow-[0_40px_120px_rgba(15,23,42,0.08)]">
        <CardHeader className="text-right space-y-2 border-b border-slate-100 bg-white/60">
          <CardTitle className="text-2xl font-semibold text-slate-900">
            مرحباً، {user.name}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 leading-6">
            يمكنك المتابعة إلى لوحة التحكم أو تسجيل الخروج من هنا.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          <Button
            onClick={handleGoToDashboard}
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold shadow-[0_20px_45px_rgba(16,185,129,0.25)] hover:bg-emerald-700"
          >
            الانتقال إلى لوحة التحكم
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
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
