import React from 'react';
import { useLocation } from 'wouter';
import { useAuth, UserRole } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Shield, Users, Settings, BarChart3, Database } from 'lucide-react';

/**
 * AdminDashboardSelection - Dashboard selection page for admin users
 * 
 * This page appears after successful admin login and provides two main options:
 * 1. RBAC Dashboard - Role-based access control management
 * 2. Control Dashboard - General system control and management
 * 
 * Features:
 * - Clean, modern UI with card-based selection
 * - Role-based access control
 * - Responsive design
 * - Arabic RTL support
 */
export default function AdminDashboardSelection() {
  const [, setLocation] = useLocation();
  const { user, hasRole } = useAuth();

  // Redirect if user is not admin
  if (!hasRole([UserRole.WEBSITE_ADMIN])) {
    setLocation('/login');
    return null;
  }

  const handleRBACDashboard = () => {
    setLocation('/rbac-dashboard');
  };

  const handleControlDashboard = () => {
    setLocation('/control');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            مرحباً بك، {user?.name}
          </h1>
          <p className="text-xl text-gray-600">
            اختر لوحة التحكم المناسبة لإدارة النظام
          </p>
        </div>

        {/* Dashboard Selection Cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          
          {/* RBAC Dashboard Card */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={handleRBACDashboard}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">لوحة التحكم المتقدمة</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                إدارة الأدوار والصلاحيات المتقدمة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">إدارة المستخدمين والأدوار</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">إدارة المنظمات والوكالات</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">تقارير وتحليلات متقدمة</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">إدارة قاعدة البيانات</span>
                </div>
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleRBACDashboard}
              >
                الوصول للوحة المتقدمة
              </Button>
            </CardContent>
          </Card>

          {/* Control Dashboard Card */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={handleControlDashboard}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Settings className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">لوحة التحكم العامة</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                إدارة العقارات والعملاء اليومية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">إدارة العقارات والقوائم</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">إدارة العملاء والزبائن</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">تقارير المبيعات والأداء</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Settings className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">إعدادات النظام العامة</span>
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleControlDashboard}
              >
                الوصول للوحة العامة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              معلومات إضافية
            </h3>
            <p className="text-gray-600">
              يمكنك التبديل بين لوحات التحكم في أي وقت. كل لوحة تقدم أدوات وإمكانيات مختلفة 
              مصممة خصيصاً لاحتياجاتك الإدارية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
