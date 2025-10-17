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
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Settings,
  TrendingUp
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  userCount: number;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    website?: string;
  };
  subscription: {
    plan: string;
    status: 'active' | 'expired' | 'cancelled';
    expiryDate: string;
  };
  createdAt: string;
  lastActive: string;
}

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    description: '',
    type: '',
    email: '',
    phone: '',
    address: ''
  });

  // Mock data
  useEffect(() => {
    const mockOrganizations: Organization[] = [
      {
        id: '1',
        name: 'شركة العقارات المتقدمة',
        description: 'شركة رائدة في مجال العقارات والاستثمار',
        type: 'شركة عقارية',
        status: 'active',
        userCount: 25,
        contactInfo: {
          email: 'info@advanced-realestate.com',
          phone: '+966112345678',
          address: 'الرياض، المملكة العربية السعودية',
          website: 'www.advanced-realestate.com'
        },
        subscription: {
          plan: 'الخطة المؤسسية',
          status: 'active',
          expiryDate: '2025-12-31T23:59:59Z'
        },
        createdAt: '2024-01-15T10:00:00Z',
        lastActive: '2025-01-20T14:30:00Z'
      },
      {
        id: '2',
        name: 'مؤسسة العقارات الحديثة',
        description: 'مؤسسة متخصصة في التطوير العقاري',
        type: 'مؤسسة',
        status: 'active',
        userCount: 12,
        contactInfo: {
          email: 'contact@modern-realestate.com',
          phone: '+966198765432',
          address: 'جدة، المملكة العربية السعودية'
        },
        subscription: {
          plan: 'الخطة المتقدمة',
          status: 'active',
          expiryDate: '2025-06-30T23:59:59Z'
        },
        createdAt: '2024-03-10T09:30:00Z',
        lastActive: '2025-01-19T16:45:00Z'
      },
      {
        id: '3',
        name: 'مجموعة الاستثمار العقاري',
        description: 'مجموعة استثمارية في القطاع العقاري',
        type: 'مجموعة استثمارية',
        status: 'pending',
        userCount: 5,
        contactInfo: {
          email: 'admin@investment-group.com',
          phone: '+966155555555',
          address: 'الدمام، المملكة العربية السعودية'
        },
        subscription: {
          plan: 'الخطة الأساسية',
          status: 'expired',
          expiryDate: '2024-12-31T23:59:59Z'
        },
        createdAt: '2024-11-20T14:00:00Z',
        lastActive: '2025-01-18T11:20:00Z'
      }
    ];
    setOrganizations(mockOrganizations);
    setFilteredOrganizations(mockOrganizations);
  }, []);

  // Filter organizations
  useEffect(() => {
    let filtered = organizations;

    if (searchTerm) {
      filtered = filtered.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contactInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(org => org.type === typeFilter);
    }

    setFilteredOrganizations(filtered);
  }, [organizations, searchTerm, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', className: 'bg-green-100 text-green-800 border-green-200' },
      inactive: { label: 'غير نشط', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      suspended: { label: 'معلق', className: 'bg-red-100 text-red-800 border-red-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  const getSubscriptionBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', className: 'bg-green-100 text-green-800 border-green-200' },
      expired: { label: 'منتهي', className: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { label: 'ملغي', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateOrganization = () => {
    const organization: Organization = {
      id: Date.now().toString(),
      name: newOrganization.name,
      description: newOrganization.description,
      type: newOrganization.type,
      status: 'pending',
      userCount: 0,
      contactInfo: {
        email: newOrganization.email,
        phone: newOrganization.phone,
        address: newOrganization.address
      },
      subscription: {
        plan: 'الخطة الأساسية',
        status: 'active',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    setOrganizations([...organizations, organization]);
    setNewOrganization({ name: '', description: '', type: '', email: '', phone: '', address: '' });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteOrganization = () => {
    if (selectedOrganization) {
      setOrganizations(organizations.filter(org => org.id !== selectedOrganization.id));
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المنظمات</h1>
          <p className="text-gray-600">إدارة المنظمات والشركات في النظام</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة منظمة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المنظمات</p>
                <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المنظمات النشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.reduce((sum, org) => sum + org.userCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الاشتراكات النشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.subscription.status === 'active').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="status-filter">الحالة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="type-filter">النوع</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="شركة عقارية">شركة عقارية</SelectItem>
                  <SelectItem value="مؤسسة">مؤسسة</SelectItem>
                  <SelectItem value="مجموعة استثمارية">مجموعة استثمارية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">المنظمات</TabsTrigger>
          <TabsTrigger value="types">أنواع المنظمات</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة المنظمات</CardTitle>
              <CardDescription>
                عرض وإدارة جميع المنظمات في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنظمة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المستخدمين</TableHead>
                    <TableHead>الاشتراك</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر نشاط</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((organization) => (
                    <TableRow key={organization.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{organization.name}</div>
                          <div className="text-sm text-gray-500">{organization.contactInfo.email}</div>
                          <div className="text-sm text-gray-500">{organization.contactInfo.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{organization.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          {organization.userCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{organization.subscription.plan}</div>
                          <div className="text-xs text-gray-500">
                            ينتهي: {formatDate(organization.subscription.expiryDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(organization.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDate(organization.lastActive)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrganization(organization);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrganization(organization);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrganization(organization);
                              setIsDeleteDialogOpen(true);
                            }}
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

        <TabsContent value="types">
          {/* Organization Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  شركة عقارية
                </CardTitle>
                <CardDescription>
                  شركات متخصصة في العقارات والوساطة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">عدد المنظمات:</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">المستخدمين:</span>
                    <span className="font-medium">37</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  مؤسسة
                </CardTitle>
                <CardDescription>
                  مؤسسات غير ربحية في القطاع العقاري
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">عدد المنظمات:</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">المستخدمين:</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  مجموعة استثمارية
                </CardTitle>
                <CardDescription>
                  مجموعات استثمارية في القطاع العقاري
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">عدد المنظمات:</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">المستخدمين:</span>
                    <span className="font-medium">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة منظمة جديدة</DialogTitle>
            <DialogDescription>
              إضافة منظمة جديدة إلى النظام
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="org-name">اسم المنظمة</Label>
                <Input
                  id="org-name"
                  value={newOrganization.name}
                  onChange={(e) => setNewOrganization({ ...newOrganization, name: e.target.value })}
                  placeholder="أدخل اسم المنظمة"
                />
              </div>
              <div>
                <Label htmlFor="org-type">نوع المنظمة</Label>
                <Select value={newOrganization.type} onValueChange={(value) => setNewOrganization({ ...newOrganization, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المنظمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="شركة عقارية">شركة عقارية</SelectItem>
                    <SelectItem value="مؤسسة">مؤسسة</SelectItem>
                    <SelectItem value="مجموعة استثمارية">مجموعة استثمارية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="org-description">الوصف</Label>
              <Textarea
                id="org-description"
                value={newOrganization.description}
                onChange={(e) => setNewOrganization({ ...newOrganization, description: e.target.value })}
                placeholder="وصف المنظمة"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="org-email">البريد الإلكتروني</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={newOrganization.email}
                  onChange={(e) => setNewOrganization({ ...newOrganization, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="org-phone">الهاتف</Label>
                <Input
                  id="org-phone"
                  value={newOrganization.phone}
                  onChange={(e) => setNewOrganization({ ...newOrganization, phone: e.target.value })}
                  placeholder="+966501234567"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="org-address">العنوان</Label>
              <Input
                id="org-address"
                value={newOrganization.address}
                onChange={(e) => setNewOrganization({ ...newOrganization, address: e.target.value })}
                placeholder="العنوان الكامل"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateOrganization}>
              إضافة المنظمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه المنظمة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteOrganization}
            >
              حذف المنظمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
