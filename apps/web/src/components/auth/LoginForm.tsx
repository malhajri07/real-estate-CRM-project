/**
 * LoginForm.tsx - Authentication Login Form Component
 * 
 * Location: apps/web/src/ → Components/ → Auth Components → LoginForm.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Authentication login form component. Provides:
 * - Email and password input fields
 * - Password visibility toggle
 * - Form validation and error handling
 * - Loading states during authentication
 * - RTL (Right-to-Left) layout support for Arabic
 * 
 * Routes affected: Login page, RBAC login page
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { BUTTON_PRIMARY_CLASSES, INPUT_STYLES } from '@/config/platform-theme';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginFormProps {
  onLogin: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { dir } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    await onLogin(identifier, password, rememberMe);
  };

  return (
    <Card className="w-full border-0 rounded-3xl shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
      <CardHeader className="space-y-2 text-center pb-8 pt-8 border-b border-slate-50 bg-slate-50/30">
        <CardTitle className="text-xl font-bold text-slate-900">
          مرحباً بك مجدداً
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          أدخل بيانات حسابك للمتابعة
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-100 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-start">
            <Label htmlFor="identifier" className="text-sm font-semibold text-slate-700">
              البريد الإلكتروني
            </Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="example@domain.com"
              autoComplete="username"
              required
              disabled={isLoading}
              className={cn(INPUT_STYLES.base, "h-11")}
            />
          </div>

          <div className="space-y-2 text-start">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                كلمة المرور
              </Label>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-xs font-medium text-emerald-600 hover:text-emerald-700"
                onClick={() => {
                  alert('يرجى التواصل مع مدير النظام لاستعادة بيانات الدخول');
                }}
              >
                نسيت كلمة المرور؟
              </Button>
            </div>
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
                className={cn(INPUT_STYLES.base, "h-11", dir === 'rtl' ? "pl-10" : "pr-10")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-transparent h-8 w-8",
                  dir === 'rtl' ? "left-2" : "right-2"
                )}
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

          <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isLoading}
              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 cursor-pointer select-none"
            >
              تذكر تسجيل دخولي
            </Label>
          </div>

          <Button
            type="submit"
            className={cn(BUTTON_PRIMARY_CLASSES, "w-full h-12 text-base shadow-lg shadow-emerald-600/20 mt-4")}
            disabled={isLoading || !identifier || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري الدخول...
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
