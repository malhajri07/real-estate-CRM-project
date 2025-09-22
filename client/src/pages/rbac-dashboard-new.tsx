import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { Shield, Users, Building2, UserCheck, Activity, RefreshCw, Settings, Lock, Bell, BarChart3, Database } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  organizationId: string;
  lastActiveAt: string;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  activeOrganizations: number;
}

export default function RBACDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrganizations: 0,
    activeOrganizations: 0
  });

  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showOrgDialog, setShowOrgDialog] = useState(false);

  const adminMenuItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      description: 'إحصائيات المنصة',
      icon: BarChart3
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      description: 'المستخدمين والأدوار',
      icon: Users
    },
    {
      id: 'roles',
      label: 'إدارة الأدوار',
      description: 'الصلاحيات والأذونات',
      icon: Shield
    },
    {
      id: 'organizations',
      label: 'إدارة المنظمات',
      description: 'الشركات والوكالات',
      icon: Building2
    },
    {
      id: 'cms',
      label: 'إدارة المحتوى',
      description: 'محتوى الموقع',
      icon: Settings
    },
    {
      id: 'security',
      label: 'الأمان',
      description: 'إعدادات الحماية',
      icon: Lock
    },
    {
      id: 'notifications',
      label: 'الإشعارات',
      description: 'إدارة التنبيهات',
      icon: Bell
    },
    {
      id: 'analytics',
      label: 'التحليلات',
      description: 'تقارير مفصلة',
      icon: BarChart3
    },
    {
      id: 'system',
      label: 'إعدادات النظام',
      description: 'إعدادات عامة',
      icon: Database
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes] = await Promise.all([
        fetch('/api/rbac/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/rbac/organizations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (usersRes.ok && orgsRes.ok) {
        const usersData = await usersRes.json();
        const orgsData = await orgsRes.json();
        
        setUsers(usersData);
        setOrganizations(orgsData);
        
        setStats({
          totalUsers: usersData.length,
          activeUsers: usersData.filter((u: User) => u.isActive).length,
          totalOrganizations: orgsData.length,
          activeOrganizations: orgsData.filter((o: Organization) => o.isActive).length
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = () => {
    fetchData();
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/home/login';
  };

  const handleBackToSelection = () => {
    window.location.href = '/home/platform';
  };

  const renderContent = () => {
    switch (activeSidebarItem) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المستخدمون النشطون</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المنظمات</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizations.toLocaleString()}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المنظمات النشطة</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeOrganizations.toLocaleString()}</p>
                    </div>
                    <Activity className="w-8 h-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">إدارة المستخدمين</h3>
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.username}</p>
                      </div>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'organizations':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">إدارة المنظمات</h3>
            <div className="grid gap-4">
              {organizations.map((org) => (
                <Card key={org.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-gray-500">{org.description}</p>
                      </div>
                      <Badge variant={org.isActive ? "default" : "secondary"}>
                        {org.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">المحتوى قيد التطوير</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم المتقدمة</h1>
                    <p className="text-gray-600">إدارة الأدوار والصلاحيات المتقدمة</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button
                    variant="outline"
                    onClick={refreshData}
                    disabled={loading}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <RefreshCw size={16} className={cn(loading ? "animate-spin" : "")} />
                    <span>تحديث</span>
                  </Button>
                  <Button variant="outline" onClick={handleBackToSelection}>
                    العودة للمنصة
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    تسجيل الخروج
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Admin Sidebar - Right Side */}
        <div className="w-80 bg-white shadow-lg border-l border-gray-200 flex-shrink-0">
          <div className="p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-8">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة الإدارة</h1>
                <p className="text-sm text-gray-500">مركز التحكم الشامل</p>
              </div>
            </div>

            <nav className="space-y-2">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSidebarItem === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSidebarItem(item.id)}
                    className={`w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg text-right transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}



