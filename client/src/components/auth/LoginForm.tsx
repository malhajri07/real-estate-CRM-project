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
  onLogin: (email: string, password: string) => Promise<void>;
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
  const [email, setEmail] = useState('');
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
