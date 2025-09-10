import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await onLogin(email, password);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
        <CardDescription>
          أدخل بياناتك للوصول إلى نظام إدارة العقارات
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">حسابات تجريبية:</p>
          <div className="space-y-1 text-xs">
            <p><strong>مدير النظام:</strong> admin@aqaraty.com / admin123</p>
            <p><strong>مالك شركة:</strong> owner1@riyadh-realestate.com / owner123</p>
            <p><strong>وكيل شركة:</strong> agent1@riyadh-realestate.com / agent123</p>
            <p><strong>وكيل مستقل:</strong> indiv1@example.com / agent123</p>
            <p><strong>بائع:</strong> seller1@example.com / seller123</p>
            <p><strong>مشتري:</strong> buyer1@example.com / buyer123</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
