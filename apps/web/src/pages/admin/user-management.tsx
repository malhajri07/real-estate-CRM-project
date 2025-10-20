import { useMemo, useState } from "react";
import { Building2, Calendar, Edit, Eye, Search, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { ROLE_DISPLAY_TRANSLATIONS, USER_ROLES, type UserRole } from "@shared/rbac";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDialog } from "@/components/admin/AdminDialog";
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
  const [formState, setFormState] = useState<UserFormState>(createEmptyFormState);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
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

    return USER_ROLES.map((role) => ({
      value: role,
      label: ROLE_DISPLAY_TRANSLATIONS[role],
    }));
  }, [roles]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = searchTerm
        ? [user.name, user.email, user.username]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const matchesStatus = (() => {
        switch (statusFilter) {
          case "active":
            return user.isActive;
          case "inactive":
            return !user.isActive;
          case "pending":
            return user.approvalStatus?.toUpperCase() === "PENDING";
          case "needs_info":
            return user.approvalStatus?.toUpperCase() === "NEEDS_INFO";
          case "rejected":
            return user.approvalStatus?.toUpperCase() === "REJECTED";
          default:
            return true;
        }
      })();
      const matchesRole =
        roleFilter === "all" ? true : user.roles.some((role) => role === roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

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
      username: formState.username || formState.email.split("@")[0],
      email: formState.email,
      firstName: formState.firstName,
      lastName: formState.lastName,
      phone: formState.phone ? formState.phone : undefined,
      roles: [formState.role],
    };

    if (dialogMode === "create") {
      if (!formState.password) {
        toast({
          variant: "destructive",
          title: "كلمة المرور مطلوبة",
          description: "يرجى إدخال كلمة مرور للمستخدم الجديد.",
        });
        return;
      }

      createUserMutation.mutate(
        {
          ...basePayload,
          password: formState.password,
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

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;
  const disableSubmit =
    !formState.firstName ||
    !formState.lastName ||
    !formState.email ||
    !formState.username ||
    !formState.role ||
    (dialogMode === "create" && !formState.password);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-600">إدارة المستخدمين والصلاحيات في النظام</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenCreateDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          إضافة مستخدم جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المستخدمون النشطون</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((user) => user.isActive).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المستخدمون المعلقون</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    users.filter(
                      (user) => user.approvalStatus?.toUpperCase() === "PENDING",
                    ).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المنظمات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(
                    users
                      .map((user) => user.organization?.tradeName ?? user.organization?.legalName)
                      .filter((value): value is string => Boolean(value)),
                  ).size}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="md:w-48">
              <Label htmlFor="status-filter">الحالة</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="needs_info">مطلوب معلومات</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:w-48">
              <Label htmlFor="role-filter">الدور</Label>
              <Select
                value={roleFilter}
                onValueChange={(value) =>
                  setRoleFilter(value as UserRole | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isUsersError ? (
        <Alert variant="destructive">
          <AlertTitle>حدث خطأ أثناء جلب المستخدمين</AlertTitle>
          <AlertDescription>{usersError?.message ?? "يرجى المحاولة مرة أخرى لاحقًا."}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>عرض وإدارة جميع المستخدمين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="py-8 text-center text-sm text-gray-500">جاري تحميل المستخدمين...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>المنظمة</TableHead>
                  <TableHead>الأدوار</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>آخر نشاط</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                        {user.phone ? <div className="text-sm text-gray-500">{user.phone}</div> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        {user.organization?.tradeName ?? user.organization?.legalName ?? "غير محدد"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {ROLE_DISPLAY_TRANSLATIONS[role] ?? role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge approvalStatus={user.approvalStatus} isActive={user.isActive} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{formatAdminDateTime(user.lastLoginAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{formatAdminDate(user.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredUsers.length && !isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-gray-500">
                      لا توجد سجلات مطابقة للمعايير الحالية.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={dialogMode === "create" ? "إضافة مستخدم جديد" : "تعديل المستخدم"}
        description="تحديث معلومات المستخدم والصلاحيات"
        confirmLabel={dialogMode === "create" ? "إنشاء المستخدم" : "حفظ التغييرات"}
        confirmLoading={isSubmitting}
        confirmDisabled={disableSubmit}
        onConfirm={handleSubmit}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input
                id="firstName"
                value={formState.firstName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, firstName: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="lastName">اسم العائلة</Label>
              <Input
                id="lastName"
                value={formState.lastName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, lastName: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={formState.username}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="مثال: ahmed.mohammed"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">الهاتف</Label>
              <Input
                id="phone"
                value={formState.phone}
                onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="role">الدور</Label>
              <Select
                value={formState.role}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, role: value as UserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              id="isActive"
              checked={formState.isActive}
              onCheckedChange={(checked) =>
                setFormState((prev) => ({ ...prev, isActive: Boolean(checked) }))
              }
            />
            <Label htmlFor="isActive">حساب نشط</Label>
          </div>
          {dialogMode === "create" ? (
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="أدخل كلمة مرور مؤقتة"
              />
            </div>
          ) : null}
        </div>
      </AdminDialog>

      <AdminDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف المستخدم"
        confirmVariant="destructive"
        confirmLoading={deleteUserMutation.isPending}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
