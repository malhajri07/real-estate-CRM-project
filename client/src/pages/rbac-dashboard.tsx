import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  LogOut, 
  BarChart3, 
  Users, 
  Settings, 
  Home,
  Building2,
  UserCheck,
  Shield,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import RoleBasedDashboard from '@/components/dashboard/RoleBasedDashboard';
import BuyerPoolSearch from '@/components/buyer-pool/BuyerPoolSearch';
import AdminSettings from '@/components/admin/AdminSettings';
import UserManagement from '@/components/admin/UserManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export default function RBACDashboardPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/rbac-login');
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const isAdmin = user.roles.includes('WEBSITE_ADMIN' as UserRole);
  const isCorpOwner = user.roles.includes('CORP_OWNER' as UserRole);
  const isAgent = user.roles.includes('CORP_AGENT' as UserRole) || user.roles.includes('INDIV_AGENT' as UserRole);

  const roleLabels: Record<string, string> = {
    'WEBSITE_ADMIN': 'مدير الموقع',
    'CORP_OWNER': 'مالك الشركة',
    'CORP_AGENT': 'وكيل الشركة',
    'INDIV_AGENT': 'وكيل مستقل',
    'SELLER': 'بائع',
    'BUYER': 'مشتري'
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'WEBSITE_ADMIN': return 'bg-red-100 text-red-800';
      case 'CORP_OWNER': return 'bg-blue-100 text-blue-800';
      case 'CORP_AGENT': return 'bg-green-100 text-green-800';
      case 'INDIV_AGENT': return 'bg-purple-100 text-purple-800';
      case 'SELLER': return 'bg-yellow-100 text-yellow-800';
      case 'BUYER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200 bg-white">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">منصة عقاراتي</h1>
                <p className="text-slate-600 text-sm">نظام إدارة العقارات</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-slate-600 hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{user.name}</h3>
                <p className="text-sm text-slate-600">{user.email}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.roles.map((role) => (
                    <Badge key={role} className={`text-xs ${getRoleBadgeColor(role)}`}>
                      {roleLabels[role] || role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Calendar className="h-3 w-3" />
                <span>آخر دخول: {formatDate(new Date())} {formatTime(new Date())}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                className="w-full justify-start h-12 text-right"
                onClick={() => setActiveTab('dashboard')}
              >
                <Home className="h-5 w-5 ml-3" />
                لوحة التحكم
              </Button>
              
              {isAgent && (
                <Button
                  variant={activeTab === 'buyer-pool' ? 'default' : 'ghost'}
                  className="w-full justify-start h-12 text-right"
                  onClick={() => setActiveTab('buyer-pool')}
                >
                  <TrendingUp className="h-5 w-5 ml-3" />
                  مجموعة المشترين
                </Button>
              )}

              {isAdmin && (
                <>
                  <Button
                    variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                    className="w-full justify-start h-12 text-right"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-5 w-5 ml-3" />
                    التحليلات والإحصائيات
                  </Button>
                  
                  <Button
                    variant={activeTab === 'users' ? 'default' : 'ghost'}
                    className="w-full justify-start h-12 text-right"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="h-5 w-5 ml-3" />
                    إدارة المستخدمين
                  </Button>
                  
                  <Button
                    variant={activeTab === 'settings' ? 'default' : 'ghost'}
                    className="w-full justify-start h-12 text-right"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="h-5 w-5 ml-3" />
                    إعدادات الإدارة
                  </Button>
                </>
              )}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-right text-red-600 hover:bg-red-50"
              onClick={() => {
                logout();
                setLocation('/rbac-login');
              }}
            >
              <LogOut className="h-5 w-5 ml-3" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile menu button */}
          <div className="lg:hidden p-4 bg-white border-b border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Main content area */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                      <p className="text-slate-600 mt-1">Welcome back, {user.name}</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(new Date())} {formatTime(new Date())}</span>
                    </div>
                  </div>
                  <RoleBasedDashboard />
                </div>
              )}

              {activeTab === 'buyer-pool' && isAgent && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">Buyer Pool</h1>
                      <p className="text-slate-600 mt-1">Search and claim buyer requests</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(new Date())} {formatTime(new Date())}</span>
                    </div>
                  </div>
                  <BuyerPoolSearch />
                </div>
              )}

              {activeTab === 'analytics' && isAdmin && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1>
                      <p className="text-slate-600 mt-1">Platform insights and performance metrics</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(new Date())} {formatTime(new Date())}</span>
                    </div>
                  </div>
                  <AnalyticsDashboard />
                </div>
              )}

              {activeTab === 'users' && isAdmin && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                      <p className="text-slate-600 mt-1">Manage users, roles, and organizations</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(new Date())} {formatTime(new Date())}</span>
                    </div>
                  </div>
                  <UserManagement />
                </div>
              )}

              {activeTab === 'settings' && isAdmin && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">Admin Settings</h1>
                      <p className="text-slate-600 mt-1">Platform configuration and controls</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(new Date())} {formatTime(new Date())}</span>
                    </div>
                  </div>
                  <AdminSettings />
                </div>
              )}

              {activeTab === 'corporate' && isCorpOwner && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">Corporate Management</h1>
                      <p className="text-slate-600 mt-1">Manage your organization and agents</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(new Date())} {formatTime(new Date())}</span>
                    </div>
                  </div>
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Building2 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Corporate Management</h3>
                      <p className="text-slate-500">Corporate management features are under development</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}