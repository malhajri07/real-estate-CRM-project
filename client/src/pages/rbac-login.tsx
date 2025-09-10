import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function RBACLoginPage() {
  const { login, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation('/rbac-dashboard');
    }
  }, [user, setLocation]);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      await login(email, password);
      // Redirect to dashboard after successful login
      setLocation('/rbac-dashboard');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            نظام إدارة العقارات
          </h1>
          <p className="text-gray-600">
            نظام شامل لإدارة العقارات مع صلاحيات متقدمة
          </p>
        </div>
        
        <LoginForm 
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error}
        />
        
        <div className="mt-8 text-center">
          <Alert>
            <AlertDescription>
              <strong>نظام RBAC + ABAC:</strong> نظام إدارة الصلاحيات المتقدم مع دعم 
              الشركات المتعددة والعملاء المحتملين والمطالبات
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
