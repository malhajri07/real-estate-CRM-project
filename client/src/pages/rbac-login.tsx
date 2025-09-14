import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';

export default function RBACLoginPage() {
  const { login, logout, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  const handleGoToDashboard = () => {
    window.location.href = '/home/platform';
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      setError(null);
      await login(username, password);
      // Redirect to port 5001 (Express server) after successful login
      window.location.href = '/home/platform';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, show dashboard access options
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              مرحباً، {user.name}
            </h1>
            <p className="text-gray-600">
              أنت مسجل الدخول بالفعل
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleGoToDashboard}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            >
              الانتقال إلى لوحة التحكم
            </Button>
            
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 py-3"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <LoginForm 
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
