import React, { useState, useMemo } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  useAdminOrganizations,
  useCreateAdminOrganization,
  useDeleteAdminOrganization,
  useUpdateAdminOrganization,
  type AdminOrganization,
  type CreateAdminOrganizationInput
} from "@/lib/rbacAdmin";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { MetricCard } from "@/components/admin";
import { formatAdminDate } from "@/lib/formatters";

export default function OrganizationManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [selectedOrganization, setSelectedOrganization] = useState<AdminOrganization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [newOrganization, setNewOrganization] = useState<CreateAdminOrganizationInput>({
    name: '',
    description: '',
    type: '',
    email: '',
    phone: '',
    address: ''
  });

  const [editForm, setEditForm] = useState<CreateAdminOrganizationInput | null>(null);

  const { toast } = useToast();

  // API Hooks
  const queryFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
  }), [searchTerm, statusFilter, typeFilter]);

  const {
    data: organizations = [],
    isLoading,
    isError,
    error
  } = useAdminOrganizations(queryFilters);

  const createMutation = useCreateAdminOrganization();
  const updateMutation = useUpdateAdminOrganization();
  const deleteMutation = useDeleteAdminOrganization();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: 'نشط', className: 'bg-primary/10 text-primary border-primary/20' },
      inactive: { label: 'غير نشط', className: 'bg-muted/50 text-foreground border-border' },
      pending_verification: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      suspended: { label: 'معلق', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig['inactive'];
    return (
      <Badge className={`${config.className} border text-xs font-bold px-2 py-0.5 rounded-md`}>
        {config.label}
      </Badge>
    );
  };

  const handleCreateOrganization = () => {
    createMutation.mutate(newOrganization, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewOrganization({ name: '', description: '', type: '', email: '', phone: '', address: '' });
        toast({ title: "تم إنشاء المنظمة بنجاح" });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "فشل إنشاء المنظمة",
          description: err.message
        });
      }
    });
  };

  const handleUpdateOrganization = () => {
    if (!selectedOrganization || !editForm) return;
    updateMutation.mutate(
      { id: selectedOrganization.id, ...editForm },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedOrganization(null);
          setEditForm(null);
          toast({ title: "تم تحديث المنظمة بنجاح" });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "فشل تحديث المنظمة",
            description: err.message
          });
        }
      }
    );
  };

  const handleDeleteOrganization = () => {
    if (selectedOrganization) {
      deleteMutation.mutate({ id: selectedOrganization.id }, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          toast({ title: "تم حذف المنظمة بنجاح" });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "فشل حذف المنظمة",
            description: err.message
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" className="text-primary" />
        <span className="me-2 text-lg text-muted-foreground">جاري تحميل المنظمات...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        <p>فشل في تحميل البيانات: {error?.message}</p>
      </div>
    );
  }

  const activeOrgsCount = organizations.filter(o => o.status?.toLowerCase() === 'active').length;
  const totalUsersCount = organizations.reduce((sum, org) => sum + (org.userCount || 0), 0);
  const activeSubsCount = organizations.filter(o => o.subscription?.status === 'active').length;

  return (
    <div className="space-y-8 animate-in-start" dir="rtl">
      <Card className="glass border-0 rounded-2xl p-8 shadow-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-end">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">إدارة المنظمات</h1>
            <p className="text-muted-foreground font-medium text-lg">تحكم في الكيانات والشركات المشتركة في النظام</p>
          </div>
          <Button className="premium-gradient text-white border-0 shadow-lg shadow-primary/10 h-12 px-8 rounded-2xl font-bold w-full md:w-auto" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-5 w-5 me-2" />
            إضافة منظمة جديدة
          </Button>
        </div>
      </Card>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="إجمالي المنظمات"
          subtitle="شركات ومؤسسات"
          icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: organizations.length, last7Days: organizations.length, last30Days: organizations.length }}
          loading={isLoading}
        />
        <MetricCard
          title="المنظمات النشطة"
          subtitle="اشتراكات مفعلة"
          icon={<ShieldCheck className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: activeOrgsCount, last7Days: activeOrgsCount, last30Days: activeOrgsCount }}
          loading={isLoading}
        />
        <MetricCard
          title="إجمالي المستخدمين"
          subtitle="في جميع المنظمات"
          icon={<Users className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: totalUsersCount, last7Days: totalUsersCount, last30Days: totalUsersCount }}
          loading={isLoading}
        />
        <MetricCard
          title="الاشتراكات المميزة"
          subtitle="تراخيص نشطة"
          icon={<CreditCard className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: activeSubsCount, last7Days: activeSubsCount, last30Days: activeSubsCount }}
          loading={isLoading}
        />
      </div>

      {/* Filters Container */}
      <Card className="glass border-0 rounded-2xl p-6 shadow-none">
        <div className="flex flex-col lg:flex-row items-end gap-6">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ps-1">البحث</Label>
              <Input
                id="search"
                placeholder="اسم المنظمة، البريد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 bg-card/50 border-border/60 rounded-xl focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ps-1">الحالة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-card/50 border-border/60 rounded-xl focus:ring-blue-500/20">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl">
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ps-1">نوع الكيان</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 bg-card/50 border-border/60 rounded-xl focus:ring-blue-500/20">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl">
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="شركة عقارية">شركة عقارية</SelectItem>
                  <SelectItem value="مؤسسة">مؤسسة</SelectItem>
                  <SelectItem value="مجموعة استثمارية">مجموعة استثمارية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl border-0 h-14">
          <TabsTrigger value="organizations" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">المنظمات</TabsTrigger>
          <TabsTrigger value="types" className="rounded-xl px-8 h-12 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">أنواع المنظمات</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <Card className="glass border-0 rounded-2xl p-8 shadow-none">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">قائمة المنظمات</h2>
                <p className="text-muted-foreground font-medium text-sm">عرض وتصفية الشركات المشتركة في النظام</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border">
                    <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">المنظمة</TableHead>
                    <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">النوع</TableHead>
                    <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">المستخدمين</TableHead>
                    <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الاشتراك</TableHead>
                    <TableHead className="text-end text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">الحالة</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase text-muted-foreground/70 tracking-widest py-4">تحكم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                        لا توجد منظمات مطابقة للبحث
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations.map((organization) => (
                      <TableRow key={organization.id} className="border-slate-50 hover:bg-primary/5 transition-colors group">
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground group-hover:text-foreground/80 transition-colors">{organization.name}</span>
                            <span className="text-xs font-bold text-muted-foreground/70 mt-1 uppercase tracking-tight">{organization.contactInfo?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-muted/30 text-muted-foreground border-0 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
                            {organization.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {organization.userCount}
                            </div>
                            <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">مستخدم</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{organization.subscription?.plan ?? 'Basic'}</span>
                            <span className="text-xs font-bold text-muted-foreground/70 mt-0.5">
                              {organization.subscription?.expiryDate
                                ? `ينتهي: ${formatAdminDate(organization.subscription.expiryDate)}`
                                : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(organization.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 hover:text-primary transition-all"
                              onClick={() => {
                                setSelectedOrganization(organization);
                                setEditForm({
                                  name: organization.name,
                                  description: organization.description ?? '',
                                  type: organization.type ?? '',
                                  email: organization.contactInfo?.email ?? '',
                                  phone: organization.contactInfo?.phone ?? '',
                                  address: organization.contactInfo?.address ?? ''
                                });
                                setIsEditDialogOpen(true);
                              }}
                              aria-label="تعديل المنظمة"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              onClick={() => {
                                setSelectedOrganization(organization);
                                setIsDeleteDialogOpen(true);
                              }}
                              aria-label="حذف المنظمة"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
            ميزة أنواع المنظمات قادمة قريباً
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader className="text-end">
            <DialogTitle>إضافة منظمة جديدة</DialogTitle>
            <DialogDescription>
              إضافة منظمة جديدة إلى النظام
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-end">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="org-name">اسم المنظمة <span className="text-red-500">*</span></Label>
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleCreateOrganization}
              disabled={createMutation.isPending || !newOrganization.name}
            >
              {createMutation.isPending && <Spinner size="sm" className="ms-2" />}
              إضافة المنظمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditForm(null);
        }}
      >
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader className="text-end">
            <DialogTitle>تعديل المنظمة</DialogTitle>
            <DialogDescription>تعديل بيانات المنظمة</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 text-end">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-org-name">اسم المنظمة <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-org-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="أدخل اسم المنظمة"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-org-type">نوع المنظمة</Label>
                  <Select value={editForm.type} onValueChange={(value) => setEditForm({ ...editForm, type: value })}>
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
                <Label htmlFor="edit-org-description">الوصف</Label>
                <Textarea
                  id="edit-org-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="وصف المنظمة"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-org-email">البريد الإلكتروني</Label>
                  <Input
                    id="edit-org-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-org-phone">الهاتف</Label>
                  <Input
                    id="edit-org-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+966501234567"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-org-address">العنوان</Label>
                <Input
                  id="edit-org-address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="العنوان الكامل"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleUpdateOrganization}
              disabled={updateMutation.isPending || !editForm?.name}
            >
              {updateMutation.isPending && <Spinner size="sm" className="ms-2" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader className="text-end">
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المنظمة "{selectedOrganization?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrganization}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Spinner size="sm" className="ms-2" />}
              حذف المنظمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
