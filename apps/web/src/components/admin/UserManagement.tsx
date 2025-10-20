import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@shared/rbac';

interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: UserRole[];
  organizationId?: string;
  organizationName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  propertiesCount?: number;
  listingsCount?: number;
  leadsCount?: number;
}

interface OrganizationData {
  id: string;
  name: string;
  legalName: string;
  licenseNo: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  agentsCount: number;
  propertiesCount: number;
  createdAt: string;
}

const mockUsers: UserData[] = [
  {
    id: '1',
    email: 'admin@aqaraty.com',
    name: 'مدير المنصة',
    phone: '+966501234567',
    roles: [UserRole.WEBSITE_ADMIN],
    isActive: true,
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'owner1@riyadh-realestate.com',
    name: 'أحمد الشركة العقارية',
    phone: '+966501234568',
    roles: [UserRole.CORP_OWNER],
    organizationId: 'org-1',
    organizationName: 'شركة الرياض العقارية',
    isActive: true,
    lastLogin: '2024-01-15T09:15:00Z',
    createdAt: '2023-02-01T00:00:00Z',
    propertiesCount: 45,
    listingsCount: 78,
    leadsCount: 23,
  },
  {
    id: '3',
    email: 'agent1@riyadh-realestate.com',
    name: 'سارة الوكيل العقاري',
    phone: '+966501234569',
    roles: [UserRole.CORP_AGENT],
    organizationId: 'org-1',
    organizationName: 'شركة الرياض العقارية',
    isActive: true,
    lastLogin: '2024-01-15T08:45:00Z',
    createdAt: '2023-03-01T00:00:00Z',
    propertiesCount: 12,
    listingsCount: 18,
    leadsCount: 8,
  },
  {
    id: '4',
    email: 'indiv1@example.com',
    name: 'محمد الوكيل المستقل',
    phone: '+966501234570',
    roles: [UserRole.INDIV_AGENT],
    isActive: true,
    lastLogin: '2024-01-14T16:20:00Z',
    createdAt: '2023-04-01T00:00:00Z',
    propertiesCount: 8,
    listingsCount: 12,
    leadsCount: 5,
  },
  {
    id: '5',
    email: 'seller1@example.com',
    name: 'فاطمة البائعة',
    phone: '+966501234571',
    roles: [UserRole.SELLER],
    isActive: true,
    lastLogin: '2024-01-13T14:10:00Z',
    createdAt: '2023-05-01T00:00:00Z',
  },
  {
    id: '6',
    email: 'buyer1@example.com',
    name: 'خالد المشتري',
    phone: '+966501234572',
    roles: [UserRole.BUYER],
    isActive: false,
    lastLogin: '2024-01-10T11:30:00Z',
    createdAt: '2023-06-01T00:00:00Z',
  },
];

const mockOrganizations: OrganizationData[] = [
  {
    id: 'org-1',
    name: 'شركة الرياض العقارية',
    legalName: 'شركة الرياض العقارية المحدودة',
    licenseNo: 'CR-123456789',
    status: 'ACTIVE',
    agentsCount: 15,
    propertiesCount: 120,
    createdAt: '2023-01-15T00:00:00Z',
  },
  {
    id: 'org-2',
    name: 'شركة جدة العقارية',
    legalName: 'شركة جدة العقارية المحدودة',
    licenseNo: 'CR-987654321',
    status: 'ACTIVE',
    agentsCount: 8,
    propertiesCount: 65,
    createdAt: '2023-02-20T00:00:00Z',
  },
  {
    id: 'org-3',
    name: 'شركة الدمام العقارية',
    legalName: 'شركة الدمام العقارية المحدودة',
    licenseNo: 'CR-456789123',
    status: 'PENDING',
    agentsCount: 3,
    propertiesCount: 12,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const roleLabels: Record<UserRole, string> = {
  WEBSITE_ADMIN: 'مدير المنصة',
  CORP_OWNER: 'مالك شركة',
  CORP_AGENT: 'وكيل شركة',
  INDIV_AGENT: 'وكيل مستقل',
  SELLER: 'بائع',
  BUYER: 'مشتري',
};

const roleColors: Record<UserRole, string> = {
  WEBSITE_ADMIN: 'bg-red-100 text-red-800',
  CORP_OWNER: 'bg-purple-100 text-purple-800',
  CORP_AGENT: 'bg-blue-100 text-blue-800',
  INDIV_AGENT: 'bg-green-100 text-green-800',
  SELLER: 'bg-orange-100 text-orange-800',
  BUYER: 'bg-gray-100 text-gray-800',
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>(mockUsers);
  const [organizations, setOrganizations] = useState<OrganizationData[]>(mockOrganizations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (!user || !user.roles.includes(UserRole.WEBSITE_ADMIN)) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">غير مصرح لك بالوصول إلى إدارة المستخدمين</p>
        </CardContent>
      </Card>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || user.roles.includes(selectedRole);
    const matchesStatus = selectedStatus === 'ALL' || 
                         (selectedStatus === 'ACTIVE' && user.isActive) ||
                         (selectedStatus === 'INACTIVE' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  };


  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h2>
          <p className="text-gray-600">إدارة المستخدمين والشركات والأدوار</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 mr-2" />
          إضافة مستخدم جديد
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            الشركات
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الأدوار
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث بالاسم أو البريد الإلكتروني..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="ALL">جميع الأدوار</option>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <option key={role} value={role}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="ACTIVE">نشط</option>
                    <option value="INACTIVE">غير نشط</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                قائمة المستخدمين ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{user.name}</h3>
                          {getStatusIcon(user.isActive)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {user.roles.map((role) => (
                            <Badge key={role} className={roleColors[role]}>
                              {roleLabels[role]}
                            </Badge>
                          ))}
                          {user.organizationName && (
                            <Badge variant="outline" className="text-xs">
                              {user.organizationName}
                            </Badge>
                          )}
                        </div>
                        {(user.propertiesCount || user.listingsCount || user.leadsCount) && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {user.propertiesCount && (
                              <span>العقارات: {user.propertiesCount}</span>
                            )}
                            {user.listingsCount && (
                              <span>الإعلانات: {user.listingsCount}</span>
                            )}
                            {user.leadsCount && (
                              <span>العملاء المحتملين: {user.leadsCount}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                الشركات المسجلة ({organizations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{org.name}</h3>
                          <Badge 
                            className={
                              org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              org.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {org.status === 'ACTIVE' ? 'نشط' :
                             org.status === 'PENDING' ? 'في الانتظار' : 'معلق'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{org.legalName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>الترخيص: {org.licenseNo}</span>
                          <span>الوكلاء: {org.agentsCount}</span>
                          <span>العقارات: {org.propertiesCount}</span>
                          <span>تاريخ التسجيل: {formatDate(org.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إدارة الأدوار والصلاحيات
              </CardTitle>
              <CardDescription>
                تخصيص الأدوار والصلاحيات للمستخدمين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(roleLabels).map(([role, label]) => (
                  <div key={role} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={roleColors[role as UserRole]}>
                        {label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {role === UserRole.WEBSITE_ADMIN && 'صلاحيات كاملة على المنصة'}
                      {role === UserRole.CORP_OWNER && 'إدارة الشركة والوكلاء'}
                      {role === UserRole.CORP_AGENT && 'وكيل تحت إشراف شركة'}
                      {role === UserRole.INDIV_AGENT && 'وكيل مستقل'}
                      {role === UserRole.SELLER && 'بيع العقارات'}
                      {role === UserRole.BUYER && 'شراء العقارات'}
                    </p>
                    <div className="text-xs text-gray-500">
                      المستخدمين: {users.filter(u => u.roles.includes(role as UserRole)).length}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
