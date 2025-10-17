import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Settings,
  Eye,
  Copy,
  Lock,
  Unlock
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Mock data
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'مدير النظام',
        description: 'صلاحيات كاملة لإدارة النظام',
        permissions: ['user_management', 'role_management', 'system_settings', 'analytics'],
        userCount: 2,
        isSystem: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'مدير الشركة',
        description: 'إدارة الشركة والموظفين',
        permissions: ['user_management', 'analytics', 'reports'],
        userCount: 5,
        isSystem: false,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '3',
        name: 'وكيل عقاري',
        description: 'إدارة العقارات والعملاء',
        permissions: ['property_management', 'client_management'],
        userCount: 15,
        isSystem: false,
        createdAt: '2024-02-01T14:30:00Z'
      }
    ];

    const mockPermissions: Permission[] = [
      { id: 'user_management', name: 'إدارة المستخدمين', description: 'إضافة وتعديل وحذف المستخدمين', category: 'المستخدمين' },
      { id: 'role_management', name: 'إدارة الأدوار', description: 'إدارة الأدوار والصلاحيات', category: 'الأدوار' },
      { id: 'property_management', name: 'إدارة العقارات', description: 'إضافة وتعديل العقارات', category: 'العقارات' },
      { id: 'client_management', name: 'إدارة العملاء', description: 'إدارة العملاء المحتملين', category: 'العملاء' },
      { id: 'analytics', name: 'التحليلات', description: 'عرض التقارير والتحليلات', category: 'التقارير' },
      { id: 'system_settings', name: 'إعدادات النظام', description: 'تعديل إعدادات النظام', category: 'النظام' },
      { id: 'reports', name: 'التقارير', description: 'إنشاء وتصدير التقارير', category: 'التقارير' }
    ];

    setRoles(mockRoles);
    setPermissions(mockPermissions);
  }, []);

  const getPermissionCategory = (category: string) => {
    const categories = {
      'المستخدمين': 'bg-blue-100 text-blue-800',
      'الأدوار': 'bg-purple-100 text-purple-800',
      'العقارات': 'bg-green-100 text-green-800',
      'العملاء': 'bg-yellow-100 text-yellow-800',
      'التقارير': 'bg-red-100 text-red-800',
      'النظام': 'bg-gray-100 text-gray-800'
    };
    return categories[category as keyof typeof categories] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateRole = () => {
    const role: Role = {
      id: Date.now().toString(),
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      userCount: 0,
      isSystem: false,
      createdAt: new Date().toISOString()
    };
    setRoles([...roles, role]);
    setNewRole({ name: '', description: '', permissions: [] });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteRole = () => {
    if (selectedRole) {
      setRoles(roles.filter(role => role.id !== selectedRole.id));
      setIsDeleteDialogOpen(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الأدوار</h1>
          <p className="text-gray-600">إدارة الأدوار والصلاحيات في النظام</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          إنشاء دور جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الأدوار</p>
                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الأدوار المخصصة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.filter(r => !r.isSystem).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الصلاحيات</p>
                <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
              </div>
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المستخدمون المخصصون</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.reduce((sum, role) => sum + role.userCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة الأدوار</CardTitle>
              <CardDescription>
                عرض وإدارة جميع الأدوار في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الدور</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>عدد المستخدمين</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">{role.name}</div>
                            <div className="text-sm text-gray-500">
                              {role.permissions.length} صلاحية
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs">
                          {role.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          {role.userCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={role.isSystem ? "default" : "outline"}
                          className={role.isSystem ? "bg-blue-100 text-blue-800" : ""}
                        >
                          {role.isSystem ? 'نظام' : 'مخصص'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDate(role.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setIsEditDialogOpen(true);
                            }}
                            disabled={role.isSystem}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={role.isSystem}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          {/* Permissions by Category */}
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge className={`mr-2 ${getPermissionCategory(category)}`}>
                      {category}
                    </Badge>
                    {categoryPermissions.length} صلاحية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{permission.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                          </div>
                          <Checkbox />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء دور جديد</DialogTitle>
            <DialogDescription>
              إضافة دور جديد مع الصلاحيات المطلوبة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-name">اسم الدور</Label>
                <Input
                  id="role-name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="أدخل اسم الدور"
                />
              </div>
              <div>
                <Label htmlFor="role-description">الوصف</Label>
                <Input
                  id="role-description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="وصف الدور"
                />
              </div>
            </div>
            
            <div>
              <Label>الصلاحيات</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                    <div className="space-y-1">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={newRole.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewRole({
                                  ...newRole,
                                  permissions: [...newRole.permissions, permission.id]
                                });
                              } else {
                                setNewRole({
                                  ...newRole,
                                  permissions: newRole.permissions.filter(p => p !== permission.id)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={permission.id} className="text-sm">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateRole}>
              إنشاء الدور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRole}
            >
              حذف الدور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
