import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import agarkomLogo from '@assets/Aqarkom (3)_1756501849666.png';

export default function RBACLoginPage() {
  const { login, logout, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const hasAdminRole = (rolesLike: any): boolean => {
    try {
      if (!rolesLike) return false;
      // Normalize to array of strings
      const arr = Array.isArray(rolesLike)
        ? rolesLike
        : typeof rolesLike === 'string'
          ? (() => { try { const j = JSON.parse(rolesLike); return Array.isArray(j) ? j : [rolesLike]; } catch { return [rolesLike]; } })()
          : rolesLike.roles || rolesLike.user?.roles || [];
      const flat = Array.isArray(arr) ? arr.flat(Infinity) : [];
      const joined = JSON.stringify(flat);
      return joined.includes('WEBSITE_ADMIN');
    } catch {
      return false;
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleGoToDashboard = () => {
    try {
      const stored = localStorage.getItem('user_data');
      const parsed = stored ? JSON.parse(stored) : null;
      const roles = (user as any)?.roles || parsed?.roles;
      const isAdmin = hasAdminRole(roles);
      window.location.href = isAdmin ? 'http://localhost:3000/home/admin' : 'http://localhost:3000/home/platform';
    } catch {
      window.location.href = 'http://localhost:3000/home/platform';
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      setError(null);
      await login(username, password);
      // After successful login, route admins to /home/admin, others to /home/platform (both on 3000)
      try {
        const stored = localStorage.getItem('user_data');
        const parsed = stored ? JSON.parse(stored) : null;
        const roles = parsed?.roles || (user as any)?.roles;
        const isAdmin = hasAdminRole(roles);
        window.location.href = isAdmin ? 'http://localhost:3000/home/admin' : 'http://localhost:3000/home/platform';
      } catch {
        window.location.href = 'http://localhost:3000/home/platform';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const isAuthenticating = isLoading && !user;

  const goHome = () => {
    window.location.href = '/home';
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
              <img src={agarkomLogo} alt="شعار منصة عقاراتي" className="h-16 object-contain" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4 text-right">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              تسجيل الدخول إلى منصة عقاراتي
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              استخدم حسابك للوصول إلى أدوات إدارة العملاء والعقارات، أو أنشئ حساباً جديداً للبدء الآن.
            </p>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-md">
              {primaryCard}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-right">
            <p className="text-sm text-slate-500">
              لا تملك حساباً بعد؟
              <a href="/signup" className="mr-2 font-semibold text-emerald-600 hover:text-emerald-700">
                إنشاء حساب جديد
              </a>
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
