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
import { Spinner } from "@/components/ui/spinner";
import { ROLE_DISPLAY_TRANSLATIONS, USER_ROLES, UserRole } from "@shared/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDialog } from "@/components/admin/AdminDialog";
import {
  AdminSheet,
  AdminSheetContent,
  AdminSheetHeader,
  AdminSheetTitle,
  AdminSheetDescription,
  AdminSheetFooter,
} from "@/components/admin/ui/AdminSheet";
import {
  MetricCard,
  AdminTable,
  AdminExport,
  AdminBulkActions,
  type AdminTableColumn,
} from "@/components/admin";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
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
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { ADMIN_BUTTON_PRIMARY, DELETE_BUTTON_STYLES, ACTION_BUTTON_ICON } from "@/config/design-tokens";
import { GRID_METRICS } from "@/config/platform-theme";

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
  role: (UserRole?.BUYER || 'BUYER') as UserRole, // Safer default than USER_ROLES[0]
  password: "",
  isActive: true,
});

export default function UserManagement() {
  const showSkeleton = useMinLoadTime();
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

  // Defensive check for USER_ROLES
  const SAFE_USER_ROLES = USER_ROLES || (UserRole ? Object.values(UserRole) : []) || [];
  const SAFE_TRANSLATIONS = ROLE_DISPLAY_TRANSLATIONS || {};

  const roleOptions = useMemo(() => {
    if (!SAFE_USER_ROLES.length) return [];

    if (roles.length) {
      const normalized = roles
        .map((role) => role.name)
        .filter((value): value is UserRole => SAFE_USER_ROLES.includes(value as UserRole));

      if (normalized.length) {
        return normalized.map((role) => ({
          value: role,
          label:
            roles.find((definition) => definition.name === role)?.displayName ??
            SAFE_TRANSLATIONS[role] ?? role,
        }));
      }
    }
    return SAFE_USER_ROLES.map((role) => ({ value: role, label: SAFE_TRANSLATIONS[role] ?? role }));
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
          <span className="font-bold text-foreground group-hover:text-foreground/80 transition-colors">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name || user.username}
          </span>
          <span className="text-xs font-medium text-muted-foreground/70 mt-0.5">{user.email}</span>
        </div>
      ),
    },
    {
      key: "roles",
      label: "الدور",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role} variant="secondary" className="bg-muted/30 text-foreground/80 border-0 text-xs font-bold px-2.5 py-0.5 rounded-md">
              {(ROLE_DISPLAY_TRANSLATIONS && ROLE_DISPLAY_TRANSLATIONS[role]) ?? role}
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
            <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
              نشط
            </Badge>
          ) : (
            <Badge className="bg-muted/50 text-muted-foreground border-0 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
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
        <span className="text-xs font-bold text-muted-foreground/70">
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50 hover:text-foreground/80 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onClick={() => handleOpenEditDialog(user)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`${ACTION_BUTTON_ICON} ${DELETE_BUTTON_STYLES} transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
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

  if (isLoadingUsers || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <AdminPageSkeleton />
      </div>
    );
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
    <div className={PAGE_WRAPPER}>
      {/* Metrics */}
      <div className={GRID_METRICS}>
        <MetricCard
          title="إجمالي المستخدمين"
          subtitle="مستخدم مسجل"
          icon={<Users className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: users.length, last7Days: users.length, last30Days: users.length }} // Placeholder for actual trend data if available
          loading={isLoadingUsers}
        />
        <MetricCard
          title="المستخدمون النشطون"
          subtitle="حسابات مفعلة"
          icon={<CheckCircle className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: activeUsers, last7Days: activeUsers, last30Days: activeUsers }}
          loading={isLoadingUsers}
        />
        <MetricCard
          title="المستخدمون المعلقون"
          subtitle="بانتظار المراجعة"
          icon={<AlertCircle className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: pendingUsers, last7Days: pendingUsers, last30Days: pendingUsers }}
          loading={isLoadingUsers}
        />
        <MetricCard
          title="إجمالي المنظمات"
          subtitle="منظمة نشطة"
          icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
          metric={{ today: totalOrgs, last7Days: totalOrgs, last30Days: totalOrgs }}
          loading={isLoadingUsers}
        />
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">إدارة المستخدمين</h1>
            <p className="text-muted-foreground font-medium">تحكم كامل في صلاحيات وحسابات المستخدمين والمنظمات</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <AdminExport data={users} filename="users" formats={["csv", "json"]} />
            <Button className={`${ADMIN_BUTTON_PRIMARY} px-6 flex-1 md:flex-none`} onClick={handleOpenCreateDialog}>
              <UserPlus className="h-5 w-5 me-2" />
              إضافة مستخدم جديد
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters & Actions Container */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex flex-col lg:flex-row items-end gap-6">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ps-1">الحالة</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger id="status-filter" className="h-11 bg-card/50 border-border/60 rounded-xl focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl">
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
              <Label htmlFor="role-filter" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ps-1">الدور الوظيفي</Label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}>
                <SelectTrigger id="role-filter" className="h-11 bg-card/50 border-border/60 rounded-xl focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl">
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
      {/* Create/Edit Sheet (Drawer) */}
      <AdminSheet
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <AdminSheetContent side="start" className="w-[400px] sm:w-[540px] overflow-y-auto">
          <AdminSheetHeader>
            <AdminSheetTitle>{dialogMode === "create" ? "إضافة مستخدم جديد" : "تعديل المستخدم"}</AdminSheetTitle>
            <AdminSheetDescription>
              {dialogMode === "create" ? "أدخل بيانات المستخدم الجديد" : "تعديل بيانات المستخدم"}
            </AdminSheetDescription>
          </AdminSheetHeader>

          <div className="space-y-6 py-6">

            {/* Section: Personal Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                <h3 className="text-lg font-bold text-foreground">بيانات الهوية</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الاسم الأول *</Label>
                  <div className="relative group">
                    <Users className="absolute end-3 top-3 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input
                      id="firstName"
                      value={formState.firstName}
                      onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                      className="pe-10 bg-card/50 border-border focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all h-11 rounded-xl shadow-sm"
                      placeholder="الاسم الأول"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الاسم الأخير *</Label>
                  <div className="relative group">
                    <Users className="absolute end-3 top-3 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input
                      id="lastName"
                      value={formState.lastName}
                      onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                      className="pe-10 bg-card/50 border-border focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all h-11 rounded-xl shadow-sm"
                      placeholder="الاسم الأخير"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Section: Contact & Access */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/70 rounded-full" />
                <h3 className="text-lg font-bold text-foreground">معلومات الاتصال والدخول</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">البريد الإلكتروني *</Label>
                  <div className="relative group">
                    <Building2 className="absolute end-3 top-3 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="pe-10 bg-card/50 border-border focus:bg-card focus:border-primary/20 focus:ring-4 focus:ring-primary/30 transition-all h-11 rounded-xl shadow-sm text-end"
                      placeholder="example@domain.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">رقم الهاتف</Label>
                  <div className="relative group">
                    <Input
                      id="phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      className="bg-card/50 border-border focus:bg-card focus:border-primary/20 focus:ring-4 focus:ring-primary/30 transition-all h-11 rounded-xl shadow-sm text-right"
                      placeholder="+966 50 000 0000"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">اسم المستخدم *</Label>
                  <div className="relative group">
                    <Shield className="absolute end-3 top-3 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input
                      id="username"
                      value={formState.username}
                      onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                      className="pe-10 bg-card/50 border-border focus:bg-card focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all h-11 rounded-xl shadow-sm"
                      placeholder="username"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الدور *</Label>
                  <Select value={formState.role} onValueChange={(value) => setFormState({ ...formState, role: value as UserRole })}>
                    <SelectTrigger id="role" className="h-11 bg-card/50 border-border focus:bg-card focus:ring-4 focus:ring-primary/10 rounded-xl shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {dialogMode === "create" && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">كلمة المرور *</Label>
                  <div className="relative group">
                    <Shield className="absolute end-3 top-3 h-4 w-4 text-muted-foreground/70 group-focus-within:text-muted-foreground transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={formState.password}
                      onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                      className="pe-10 bg-card/50 border-border focus:bg-card focus:border-destructive/50 focus:ring-4 focus:ring-destructive/10 transition-all h-11 rounded-xl shadow-sm"
                    />
                  </div>
                </div>
              )}

              {dialogMode === "edit" && (
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-base font-bold text-foreground/80">حالة الحساب</Label>
                    <p className="text-xs text-muted-foreground">تفعيل أو تعطيل دخول المستخدم للنظام</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formState.isActive}
                    onCheckedChange={(checked) => setFormState({ ...formState, isActive: checked })}
                  />
                </div>
              )}
            </div>
          </div>

          <AdminSheetFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={disableSubmit || isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting && <Spinner size="sm" className="me-2" />}
              {dialogMode === "create" ? "إنشاء" : "حفظ"}
            </Button>
          </AdminSheetFooter>
        </AdminSheetContent>
      </AdminSheet>

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
