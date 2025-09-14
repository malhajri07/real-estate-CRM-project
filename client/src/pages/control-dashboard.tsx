import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth, UserRole } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Building2, 
  Users, 
  BarChart3, 
  Home,
  FileText,
  MessageSquare,
  Search,
  Heart,
  Plus,
  ArrowRight,
  LogOut,
  Menu,
  X
} from 'lucide-react';

/**
 * ControlDashboard - General system control dashboard with sidebar navigation
 * 
 * This dashboard provides general system management including:
 * - Property and listing management
 * - Customer management
 * - Sales reports and analytics
 * - General system settings
 * 
 * Features:
 * - Sidebar navigation for easy access to different sections
 * - Responsive design with mobile-friendly sidebar
 * - Role-based access control
 * - Arabic RTL support
 */
export default function ControlDashboard() {
  const [, setLocation] = useLocation();
  const { user, hasRole, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Redirect if user is not admin
  if (!hasRole([UserRole.WEBSITE_ADMIN])) {
    setLocation('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleBackToSelection = () => {
    setLocation('/admin-dashboard-selection');
  };

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Home },
    { id: 'properties', label: 'العقارات', icon: Building2 },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'listings', label: 'القوائم', icon: FileText },
    { id: 'inquiries', label: 'الاستفسارات', icon: MessageSquare },
    { id: 'search', label: 'البحث', icon: Search },
    { id: 'favorites', label: 'المفضلة', icon: Heart },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  // Mock data
  const stats = {
    totalProperties: 1247,
    activeListings: 1156,
    totalCustomers: 89,
    newInquiries: 76,
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">لوحة التحكم العامة</h2>
              <p className="text-gray-600">نظرة عامة على النظام والإحصائيات</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي العقارات</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.totalProperties.toLocaleString()}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">القوائم النشطة</p>
                      <p className="text-3xl font-bold text-green-600">{stats.activeListings.toLocaleString()}</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.totalCustomers}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">استفسارات جديدة</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.newInquiries}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
                <CardDescription>الوصول السريع للمهام الشائعة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button className="h-20 flex-col space-y-2" variant="outline">
                    <Plus className="w-6 h-6" />
                    <span>إضافة عقار جديد</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2" variant="outline">
                    <Users className="w-6 h-6" />
                    <span>إضافة عميل جديد</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2" variant="outline">
                    <BarChart3 className="w-6 h-6" />
                    <span>عرض التقارير</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">إدارة العقارات</h2>
                <p className="text-gray-600">إدارة جميع العقارات في النظام</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة عقار جديد
              </Button>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة العقارات</h3>
                <p className="text-gray-600">هنا يمكنك إدارة جميع العقارات في النظام</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">إدارة العملاء</h2>
                <p className="text-gray-600">إدارة جميع العملاء في النظام</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة عميل جديد
              </Button>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة العملاء</h3>
                <p className="text-gray-600">هنا يمكنك إدارة جميع العملاء في النظام</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'listings':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">إدارة القوائم</h2>
                <p className="text-gray-600">إدارة جميع قوائم العقارات</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة قائمة جديدة
              </Button>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة القوائم</h3>
                <p className="text-gray-600">هنا يمكنك إدارة جميع قوائم العقارات</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'inquiries':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">الاستفسارات</h2>
              <p className="text-gray-600">إدارة جميع الاستفسارات والرسائل</p>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">الاستفسارات</h3>
                <p className="text-gray-600">هنا يمكنك إدارة جميع الاستفسارات والرسائل</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">البحث</h2>
              <p className="text-gray-600">البحث في العقارات والعملاء</p>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">البحث</h3>
                <p className="text-gray-600">هنا يمكنك البحث في العقارات والعملاء</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">المفضلة</h2>
              <p className="text-gray-600">العقارات والعملاء المفضلين</p>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">المفضلة</h3>
                <p className="text-gray-600">هنا يمكنك عرض العقارات والعملاء المفضلين</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">التقارير</h2>
              <p className="text-gray-600">تقارير المبيعات والأداء</p>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">التقارير</h3>
                <p className="text-gray-600">هنا يمكنك عرض تقارير المبيعات والأداء</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">الإعدادات</h2>
              <p className="text-gray-600">إعدادات النظام العامة</p>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">الإعدادات</h3>
                <p className="text-gray-600">هنا يمكنك إدارة إعدادات النظام العامة</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Settings className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-gray-900">لوحة التحكم</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="mt-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-right hover:bg-gray-100 transition-colors ${
                  activeSection === item.id ? 'bg-green-50 text-green-700 border-l-4 border-green-600' : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleBackToSelection}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للاختيار
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pr-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">لوحة التحكم العامة</h1>
                  <p className="text-sm text-gray-600">مرحباً بك، {user?.name}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full ml-2" />
                متصل
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
