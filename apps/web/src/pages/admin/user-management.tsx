/**
 * user-management.tsx - User Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → user-management.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin user management page. Provides:
 * - User listing and search
 * - User CRUD operations
 * - Role assignment
 * - User status management
 * 
 * Route: /admin/users/all-users
 * 
 * Related Files:
 * - apps/api/routes/rbac-admin.ts - User management API routes
 * - apps/web/src/components/admin/UserManagement.tsx - User management component
 */

import { useMemo, useState } from "react";
import { Building2, Edit, Eye, Shield, Trash2, UserPlus, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ROLE_DISPLAY_TRANSLATIONS, USER_ROLES, type UserRole } from "@shared/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDialog } from "@/components/admin/AdminDialog";
import {
  MetricCard,
  AdminTable,
  AdminExport,
  AdminBulkActions,
  AdminLoading,
  type AdminTableColumn,
} from "@/components/admin";
import {
  useAdminUsers,
  useAdminRoles,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  type AdminUser,
} from "@/lib/rbacAdmin";
import { formatAdminDate, formatAdminDateTime } from "@/lib/formatters";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

interface UserFormState {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  role: UserRole;
  password: string;
  isActive: boolean;
}

type UserDialogMode = "create" | "edit";
type StatusFilter = "all" | "active" | "inactive" | "pending" | "needs_info" | "rejected";

const createEmptyFormState = (): UserFormState => ({
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  phone: "",
  role: USER_ROLES[0],
  password: "",
  isActive: true,
});

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [dialogMode, setDialogMode] = useState<UserDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formState, setFormState] = useState<UserFormState>(createEmptyFormState());
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { toast } = useToast();

  const queryFilters = useMemo(
    () => ({
      search: searchTerm || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
    }),
    [searchTerm, roleFilter],
  );

  const {
    data: usersResult,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
  } = useAdminUsers(queryFilters);
  const users = usersResult?.users ?? [];
  const { data: roles = [] } = useAdminRoles();

  const createUserMutation = useCreateAdminUser();
  const updateUserMutation = useUpdateAdminUser();
  const deleteUserMutation = useDeleteAdminUser();

  const roleOptions = useMemo(() => {
    if (roles.length) {
      const normalized = roles
        .map((role) => role.name)
        .filter((value): value is UserRole => USER_ROLES.includes(value as UserRole));

      if (normalized.length) {
        return normalized.map((role) => ({
          value: role,
          label:
            roles.find((definition) => definition.name === role)?.displayName ??
            ROLE_DISPLAY_TRANSLATIONS[role],
        }));
      }
    }
    return USER_ROLES.map((role) => ({ value: role, label: ROLE_DISPLAY_TRANSLATIONS[role] }));
  }, [roles]);

  // Filter users based on status
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        const status = user.approvalStatus?.toUpperCase();
        switch (statusFilter) {
          case "active":
            return user.isActive;
          case "inactive":
            return !user.isActive;
          case "pending":
            return status === "PENDING";
          case "needs_info":
            return status === "NEEDS_INFO";
          case "rejected":
            return status === "REJECTED";
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [users, statusFilter]);

  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    setFormState(createEmptyFormState());
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (user: AdminUser) => {
    setDialogMode("edit");
    setFormState({
      id: user.id,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      username: user.username,
      phone: user.phone ?? "",
      role: user.roles[0] ?? USER_ROLES[0],
      password: "",
      isActive: user.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const basePayload = {
      firstName: formState.firstName,
      lastName: formState.lastName,
      email: formState.email,
      username: formState.username,
      phone: formState.phone,
    };

    if (dialogMode === "create") {
      createUserMutation.mutate(
        {
          ...basePayload,
          password: formState.password,
          roles: [formState.role],
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            toast({ title: "تم إنشاء المستخدم بنجاح" });
          },
          onError: (error) =>
            toast({
              variant: "destructive",
              title: "فشل إنشاء المستخدم",
              description: error.message,
            }),
        },
      );
    } else if (formState.id) {
      updateUserMutation.mutate(
        {
          id: formState.id,
          ...basePayload,
          password: undefined,
          isActive: formState.isActive,
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            toast({ title: "تم حفظ التغييرات" });
          },
          onError: (error) =>
            toast({
              variant: "destructive",
              title: "فشل تحديث المستخدم",
              description: error.message,
            }),
        },
      );
    }
  };

  const handleOpenDeleteDialog = (user: AdminUser) => {
    setDeleteTarget(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (!deleteTarget) return;
    deleteUserMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          toast({ title: "تم حذف المستخدم" });
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: "فشل حذف المستخدم",
            description: error.message,
          }),
      },
    );
  };

  const handleBulkActivate = () => {
    toast({ title: `تفعيل ${selectedUserIds.length} مستخدم...` });
    // Implement bulk activate logic
  };

  const handleBulkDeactivate = () => {
    toast({ title: `إلغاء تفعيل ${selectedUserIds.length} مستخدم...` });
    // Implement bulk deactivate logic
  };

  const handleBulkDelete = () => {
    toast({
      variant: "destructive",
      title: `حذف ${selectedUserIds.length} مستخدم...`
    });
    // Implement bulk delete logic
  };

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;
  const disableSubmit =
    !formState.firstName ||
    !formState.lastName ||
    !formState.email ||
    !formState.username ||
    !formState.role ||
    (dialogMode === "create" && !formState.password);

  // Define table columns
  const columns: AdminTableColumn<AdminUser>[] = [
    {
      key: "name",
      label: "المستخدِم",
      sortable: true,
      render: (user) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name || user.username}
          </span>
          <span className="text-xs font-medium text-slate-400 mt-0.5">{user.email}</span>
        </div>
      ),
    },
    {
      key: "roles",
      label: "الدور",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role} variant="secondary" className="bg-slate-50 text-slate-700 border-0 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
              {ROLE_DISPLAY_TRANSLATIONS[role] ?? role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "isActive",
      label: "حالة الحساب",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          {user.isActive ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
              نشط
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
              متوقف
            </Badge>
          )}
          {user.approvalStatus && (
            <AdminStatusBadge approvalStatus={user.approvalStatus} isActive={user.isActive ?? false} />
          )}
        </div>
      ),
    },
    {
      key: "lastLoginAt",
      label: "النشاط",
      sortable: true,
      render: (user) => (
        <span className="text-[11px] font-bold text-slate-400">
          {user.lastLoginAt ? formatAdminDateTime(user.lastLoginAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "تحكم",
      className: "w-20 text-center",
      render: (user) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all" onClick={() => handleOpenEditDialog(user)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
            onClick={() => handleOpenDeleteDialog(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const activeUsers = users.filter((u) => u.isActive).length;
  const pendingUsers = users.filter((u) => u.approvalStatus?.toUpperCase() === "PENDING").length;
  const totalOrgs = new Set(
    users
      .map((u) => u.organization?.tradeName ?? u.organization?.legalName)
      .filter((v): v is string => Boolean(v))
  ).size;

  if (isLoadingUsers) {
    return <AdminLoading fullScreen text="جار تحميل بيانات المستخدمين..." />;
  }

  if (isUsersError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          فشل في تحميل المستخدمين: {usersError?.message ?? "خطأ غير معروف"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-in-start" dir="rtl">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="إجمالي المستخدمين"
          subtitle="مستخدم مسجل"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          metric={{ today: users.length, last7Days: users.length, last30Days: users.length }} // Placeholder for actual trend data if available
          loading={isLoadingUsers}
        />
        <MetricCard
          title="المستخدمون النشطون"
          subtitle="حسابات مفعلة"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          metric={{ today: activeUsers, last7Days: activeUsers, last30Days: activeUsers }}
          loading={isLoadingUsers}
        />
        <MetricCard
          title="المستخدمون المعلقون"
          subtitle="بانتظار المراجعة"
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          metric={{ today: pendingUsers, last7Days: pendingUsers, last30Days: pendingUsers }}
          loading={isLoadingUsers}
        />
        <MetricCard
          title="إجمالي المنظمات"
          subtitle="منظمة نشطة"
          icon={<Building2 className="w-5 h-5 text-purple-600" />}
          metric={{ today: totalOrgs, last7Days: totalOrgs, last30Days: totalOrgs }}
          loading={isLoadingUsers}
        />
      </div>

      <Card className="glass border-0 rounded-[2rem] p-8 shadow-none mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المستخدمين</h1>
            <p className="text-slate-500 font-medium">تحكم كامل في صلاحيات وحسابات المستخدمين والمنظمات</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <AdminExport data={users} filename="users" formats={["csv", "json"]} />
            <Button className="premium-gradient text-white border-0 shadow-lg shadow-blue-500/25 h-12 px-6 rounded-2xl font-bold flex-1 md:flex-none" onClick={handleOpenCreateDialog}>
              <UserPlus className="h-5 w-5 me-2" />
              إضافة مستخدم جديد
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters & Actions Container */}
      <Card className="glass border-0 rounded-[2rem] p-6 shadow-none">
        <div className="flex flex-col lg:flex-row items-end gap-6">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-xs font-bold text-slate-500 uppercase tracking-widest ps-1">الحالة</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger id="status-filter" className="h-11 bg-white/50 border-slate-200/60 rounded-xl focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="needs_info">يحتاج معلومات</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-filter" className="text-xs font-bold text-slate-500 uppercase tracking-widest ps-1">الدور الوظيفي</Label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}>
                <SelectTrigger id="role-filter" className="h-11 bg-white/50 border-slate-200/60 rounded-xl focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <AdminBulkActions
              selectedCount={selectedUserIds.length}
              actions={[
                {
                  label: "تفعيل",
                  icon: <CheckCircle className="h-4 w-4" />,
                  onClick: handleBulkActivate,
                },
                {
                  label: "إيقاف",
                  icon: <XCircle className="h-4 w-4" />,
                  onClick: handleBulkDeactivate,
                },
                {
                  label: "حذف",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: handleBulkDelete,
                  variant: "destructive",
                },
              ]}
              onClear={() => setSelectedUserIds([])}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        selectable
        onSelectionChange={setSelectedUserIds}
        searchable
        searchPlaceholder="البحث بالاسم أو البريد الإلكتروني..."
        pageSize={10}
      />

      {/* Create/Edit Dialog */}
      <AdminDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={dialogMode === "create" ? "إضافة مستخدم جديد" : "تعديل المستخدم"}
        description={
          dialogMode === "create"
            ? "أدخل بيانات المستخدم الجديد"
            : "تعديل بيانات المستخدم"
        }
        onConfirm={handleSubmit}
        confirmLabel={dialogMode === "create" ? "إنشاء" : "حفظ"}
        confirmDisabled={disableSubmit || isSubmitting}
        confirmLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">الاسم الأول *</Label>
              <Input
                id="firstName"
                value={formState.firstName}
                onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">الاسم الأخير *</Label>
              <Input
                id="lastName"
                value={formState.lastName}
                onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="username">اسم المستخدم *</Label>
            <Input
              id="username"
              value={formState.username}
              onChange={(e) => setFormState({ ...formState, username: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="role">الدور *</Label>
            <Select value={formState.role} onValueChange={(value) => setFormState({ ...formState, role: value as UserRole })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dialogMode === "create" && (
            <div>
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                value={formState.password}
                onChange={(e) => setFormState({ ...formState, password: e.target.value })}
              />
            </div>
          )}

          {dialogMode === "edit" && (
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">المستخدم نشط</Label>
              <Switch
                id="isActive"
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState({ ...formState, isActive: checked })}
              />
            </div>
          )}
        </div>
      </AdminDialog>

      <AdminDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="تأكيد الحذف"
        description={`هل أنت متأكد من حذف المستخدم "${deleteTarget?.name ?? deleteTarget?.username}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        onConfirm={handleDeleteUser}
        confirmLabel="حذف"
        confirmVariant="destructive"
        confirmLoading={deleteUserMutation.isPending}
      />
    </div>
  );
}
