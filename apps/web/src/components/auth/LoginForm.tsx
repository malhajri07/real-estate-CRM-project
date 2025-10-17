/**
 * LoginForm.tsx - Authentication Login Form Component
 * 
 * This component provides a user-friendly login form with:
 * - Email and password input fields
 * - Password visibility toggle
 * - Form validation and error handling
 * - Loading states during authentication
 * - RTL (Right-to-Left) layout support for Arabic
 * - Demo account credentials for testing
 * 
 * The form integrates with the AuthProvider context through the onLogin callback
 * and handles all authentication UI states including loading, errors, and success.
 * 
 * Dependencies:
 * - AuthProvider context for authentication state
 * - UI components from shadcn/ui library
 * - Lucide React icons for visual elements
 * 
 * Routes affected: Login page, RBAC login page
 * Pages that use this: /login, /rbac-login
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

/**
 * LoginFormProps Interface
 * 
 * Defines the props for the LoginForm component:
 * - onLogin: Callback function to handle login submission
 * - isLoading: Boolean to show loading state during authentication
 * - error: Error message to display if authentication fails
 */
interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

/**
 * LoginForm Component - Main login form component
 * 
 * This component renders a complete login form with:
 * - Email and password input fields
 * - Password visibility toggle functionality
 * - Form validation and submission handling
 * - Loading states and error display
 * - Demo account credentials for testing
 * 
 * State Management:
 * - email: User's email input
 * - password: User's password input
 * - showPassword: Toggle for password visibility
 * 
 * Dependencies: onLogin callback from parent component (AuthProvider)
 * Pages affected: Login page, RBAC login page
 */
export default function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  // Form state management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /**
   * handleSubmit - Form submission handler
   * 
   * Handles form submission by:
   * - Preventing default form submission
   * - Validating that both email and password are provided
   * - Calling the onLogin callback with credentials
   * 
   * Dependencies: onLogin prop from AuthProvider
   * Routes affected: Authentication flow
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    await onLogin(username, password);
  };

  return (
    <Card className="w-full rounded-[32px] border border-white/80 bg-white/85 backdrop-blur-xl shadow-[0_40px_120px_rgba(15,23,42,0.08)]">
      <CardHeader className="space-y-3 text-right border-b border-slate-100 bg-white/60">
        <CardTitle className="text-2xl font-semibold text-slate-900">
          تسجيل الدخول إلى المنصة
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-500">
          أدخل بيانات حسابك للوصول إلى أدوات إدارة العملاء والعقارات.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 text-right">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="text-right">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username" className="block text-sm font-medium text-slate-700">
              اسم المستخدم
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              autoComplete="username"
              required
              disabled={isLoading}
              className="h-12 rounded-2xl border-slate-200 bg-white/70 text-right placeholder:text-right placeholder:text-slate-400 pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="block text-sm font-medium text-slate-700">
              كلمة المرور
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="h-12 rounded-2xl border-slate-200 bg-white/70 text-right placeholder:text-right placeholder:text-slate-400 pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-slate-500 text-right">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-sm text-emerald-600 hover:text-emerald-700"
              onClick={() => {
                alert('يرجى التواصل مع مدير النظام لاستعادة بيانات الدخول');
              }}
            >
              نسيت بيانات الدخول؟
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold shadow-[0_20px_45px_rgba(16,185,129,0.25)] hover:bg-emerald-700 hover:shadow-[0_25px_60px_rgba(16,185,129,0.28)] transition-all disabled:opacity-60"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
