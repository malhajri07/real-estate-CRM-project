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
import { Eye, EyeOff } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "sonner";

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
  const { dir, language } = useLanguage();
  const isAr = language === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    await onLogin(identifier, password, rememberMe);
  };

  return (
    <Card className="w-full border-0 rounded-3xl shadow-xl shadow-slate-200/50 bg-card overflow-hidden">
      <CardHeader className="space-y-2 text-center pb-8 pt-8 border-b border-slate-50 bg-muted/30">
        <CardTitle className="text-xl font-bold text-foreground">
          {isAr ? "مرحباً بك مجدداً" : "Welcome Back"}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {isAr ? "أدخل بيانات حسابك للمتابعة" : "Enter your credentials to continue"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-start">
            <Label htmlFor="identifier" className="text-sm font-semibold text-foreground/80">
              {isAr ? "البريد الإلكتروني" : "Email"}
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
              className="h-11 border-border rounded-xl bg-card/80 focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-start"
            />
          </div>

          <div className="space-y-2 text-start">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">
                {isAr ? "كلمة المرور" : "Password"}
              </Label>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-xs font-medium text-muted-foreground hover:text-foreground/80"
                onClick={() => {
                  toast.info(isAr ? 'يرجى التواصل مع مدير النظام لاستعادة بيانات الدخول' : 'Please contact the system administrator to recover your credentials');
                }}
              >
                {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
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
                className={cn("h-11 border-border rounded-xl bg-card/80 focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-start", dir === 'rtl' ? "pl-10" : "pr-10")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground hover:bg-transparent h-8 w-8",
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
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer select-none"
            >
              {isAr ? "تذكر تسجيل دخولي" : "Remember me"}
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base shadow-lg shadow-primary/20 mt-4"
            disabled={isLoading || !identifier || !password}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="ms-2" />
                {isAr ? "جاري الدخول..." : "Signing in..."}
              </>
            ) : (
              isAr ? "تسجيل الدخول" : "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
