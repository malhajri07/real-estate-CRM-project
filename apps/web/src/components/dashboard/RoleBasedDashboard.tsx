/**
 * RoleBasedDashboard.tsx - Role-Based Dashboard Component
 * 
 * Location: apps/web/src/ → Components/ → Feature Components → dashboard/ → RoleBasedDashboard.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Role-based dashboard component. Provides:
 * - Dashboard content based on user role
 * - Role-specific metrics and widgets
 * - Customizable dashboard layout
 * 
 * Related Files:
 * - apps/web/src/pages/dashboard.tsx - Dashboard page
 * - apps/web/src/hooks/useDashboardData.ts - Dashboard data hook
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building,
  Home,
  Search,
  FileText,
  BarChart3,
  Settings,
  Shield,
  UserCheck,
  Handshake,
  ShoppingCart,
  User
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole, ROLE_DISPLAY_TRANSLATIONS } from '@shared/rbac';

export default function RoleBasedDashboard() {
  const { user, hasRole, hasPermission } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">يرجى تسجيل الدخول لعرض لوحة التحكم</p>
        </CardContent>
      </Card>
    );
  }

  const getRoleDisplayName = (role: UserRole) => ROLE_DISPLAY_TRANSLATIONS[role] ?? role;

  const getRoleColor = (role: UserRole) => {
    const roleColors = {
      WEBSITE_ADMIN: 'bg-red-100 text-red-800',
      CORP_OWNER: 'bg-blue-100 text-blue-800',
      CORP_AGENT: 'bg-green-100 text-green-800',
      INDIV_AGENT: 'bg-yellow-100 text-yellow-800',
      SELLER: 'bg-purple-100 text-purple-800',
      BUYER: 'bg-indigo-100 text-indigo-800',
      AGENT: 'bg-teal-100 text-teal-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                مرحباً، {user.name ?? user.username ?? user.email ?? 'المستخدم'}
              </CardTitle>
              <CardDescription className="mt-2">
                {user.email}
                {user.organization && (
                  <span className="block text-sm text-gray-600">
                    {user.organization.tradeName}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role} className={getRoleColor(role)}>
                  {getRoleDisplayName(role)}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Role-based Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Website Admin Dashboard */}
        {hasRole([UserRole.WEBSITE_ADMIN]) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  إدارة النظام
                </CardTitle>
                <CardDescription>
                  إدارة المستخدمين والصلاحيات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  إدارة المستخدمين
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  إدارة الشركات
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  إعدادات النظام
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  سجلات التدقيق
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Corporate Owner Dashboard */}
        {hasRole([UserRole.CORP_OWNER]) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  إدارة الشركة
                </CardTitle>
                <CardDescription>
                  إدارة فريق العمل والعقارات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="h-4 w-4 mr-2" />
                  إدارة الوكلاء
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  عقارات الشركة
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  تقارير الأداء
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Handshake className="h-4 w-4 mr-2" />
                  توزيع العملاء
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Agent Dashboard (Corporate & Individual) */}
        {(hasRole([UserRole.CORP_AGENT]) || hasRole([UserRole.INDIV_AGENT])) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  مساحة العمل
                </CardTitle>
                <CardDescription>
                  إدارة العقارات والعملاء
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  عقاراتي
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  قاعدة بيانات المشترين
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  العملاء المحتملين
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Handshake className="h-4 w-4 mr-2" />
                  مطالباتي النشطة
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Seller Dashboard */}
        {hasRole([UserRole.SELLER]) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  إدارة العقارات
                </CardTitle>
                <CardDescription>
                  إدارة عروض البيع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  عروض البيع
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Handshake className="h-4 w-4 mr-2" />
                  عروض الوكلاء
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  تتبع المبيعات
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Buyer Dashboard */}
        {hasRole([UserRole.BUYER]) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  البحث عن عقار
                </CardTitle>
                <CardDescription>
                  إدارة طلبات الشراء
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  طلبات الشراء
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Handshake className="h-4 w-4 mr-2" />
                  الوكلاء المطالبين
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  البحث عن عقارات
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Common Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              الإعدادات
            </CardTitle>
            <CardDescription>
              إدارة الحساب والإعدادات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              الملف الشخصي
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              إعدادات الحساب
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              الأمان
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Agent Profile Info */}
      {user.agentProfile && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات الوكيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">رقم الترخيص</label>
                <p className="text-lg font-semibold">{user.agentProfile.licenseNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">المناطق المغطاة</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.agentProfile.territories.map((territory) => (
                    <Badge key={territory} variant="secondary">
                      {territory}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">التخصصات</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.agentProfile.specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Info */}
      {user.organization && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات الشركة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">الاسم التجاري</label>
                <p className="text-lg font-semibold">{user.organization.tradeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">الاسم القانوني</label>
                <p className="text-lg font-semibold">{user.organization.legalName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
