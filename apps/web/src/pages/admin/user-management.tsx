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
import { Building2, Edit, Eye, Shield, Trash2, UserPlus, Users, CheckCircle, XCircle } from "lucide-react";
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
  AdminMetricCard,
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
      label: "المستخدم",
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name || user.username}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="text-sm text-gray-500">{user.username}</div>
          {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
        </div>
      ),
    },
    {
      key: "organization",
      label: "المنظمة",
      render: (user) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm">
            {user.organization?.tradeName ?? user.organization?.legalName ?? "غير محدد"}
          </span>
        </div>
      ),
    },
    {
      key: "roles",
      label: "الأدوار",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role} variant="outline" className="text-xs">
              {ROLE_DISPLAY_TRANSLATIONS[role] ?? role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "isActive",
      label: "الحالة",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          {user.isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              نشط
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              <XCircle className="h-3 w-3 mr-1" />
              غير نشط
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
      label: "آخر نشاط",
      sortable: true,
      render: (user) => (
        <div className="text-sm text-gray-600">
          {user.lastLoginAt ? formatAdminDateTime(user.lastLoginAt) : "لم يسجل دخول"}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "تاريخ الإنشاء",
      sortable: true,
      render: (user) => (
        <div className="text-sm text-gray-600">
          {formatAdminDate(user.createdAt)}
        </div>
      ),
    },
    {
      key: "actions",
      label: "الإجراءات",
      className: "text-center",
      render: (user) => (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(user)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-600">إدارة المستخدمين والصلاحيات في النظام</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminExport data={users} filename="users" formats={["csv", "json"]} />
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenCreateDialog}>
            <UserPlus className="h-4 w-4 mr-2" />
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminMetricCard
          title="إجمالي المستخدمين"
          value={users.length}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <AdminMetricCard
          title="المستخدمون النشطون"
          value={activeUsers}
          icon={<Shield className="h-6 w-6" />}
          color="green"
          trend={{ value: 12, isPositive: true, label: "من الشهر الماضي" }}
        />
        <AdminMetricCard
          title="المستخدمون المعلقون"
          value={pendingUsers}
          icon={<Users className="h-6 w-6" />}
          color="yellow"
        />
        <AdminMetricCard
          title="المنظمات"
          value={totalOrgs}
          icon={<Building2 className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="status-filter">تصفية حسب الحالة</Label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="pending">معلق</SelectItem>
              <SelectItem value="needs_info">يحتاج معلومات</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label htmlFor="role-filter">تصفية حسب الدور</Label>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}>
            <SelectTrigger id="role-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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

      {/* Bulk Actions */}
      <AdminBulkActions
        selectedCount={selectedUserIds.length}
        actions={[
          {
            label: "تفعيل",
            icon: <CheckCircle className="h-4 w-4" />,
            onClick: handleBulkActivate,
          },
          {
            label: "إلغاء التفعيل",
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

      {/* Delete Dialog */}
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
