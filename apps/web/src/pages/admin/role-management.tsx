/**
 * role-management.tsx - Role Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → role-management.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * RBAC role management page. Provides:
 * - Role listing and management
 * - Permission assignment
 * - Role creation and editing
 * 
 * Route: /admin/roles/roles-list
 * 
 * Related Files:
 * - apps/api/routes/rbac-admin.ts - RBAC admin API routes
 * - apps/api/rbac.ts - RBAC system
 */

import { useMemo, useState } from "react";
import { Edit, Eye, Plus, Settings, Shield, Trash2, Unlock, Users } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AdminDialog } from "@/components/admin/AdminDialog";
import {
  useAdminRoles,
  useCreateAdminRole,
  useUpdateAdminRole,
  useDeleteAdminRole,
  type AdminRole,
} from "@/lib/rbacAdmin";

interface RoleFormState {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
}

type RoleDialogMode = "create" | "edit";

const createEmptyRoleForm = (): RoleFormState => ({
  name: "",
  description: "",
  permissions: [],
});

export default function RoleManagement() {
  const [dialogMode, setDialogMode] = useState<RoleDialogMode>("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formState, setFormState] = useState<RoleFormState>(createEmptyRoleForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const { toast } = useToast();

  const {
    data: roles = [],
    isLoading: isLoadingRoles,
    isError: isRolesError,
    error: rolesError,
  } = useAdminRoles();

  const createRoleMutation = useCreateAdminRole();
  const updateRoleMutation = useUpdateAdminRole();
  const deleteRoleMutation = useDeleteAdminRole();

  const permissionCatalog = useMemo(() => {
    const map = new Map<string, { key: string; label: string; description: string | null; domain: string | null }>();

    roles.forEach((role) => {
      role.permissionDetails.forEach((permission) => {
        if (!map.has(permission.key)) {
          map.set(permission.key, {
            key: permission.key,
            label: permission.label,
            description: permission.description,
            domain: permission.domain ?? "أخرى",
          });
        }
      });
    });

    return Array.from(map.values());
  }, [roles]);

  const permissionCategories = useMemo(() => {
    return permissionCatalog.reduce<Record<string, typeof permissionCatalog>>((acc, permission) => {
      const domain = permission.domain ?? "أخرى";
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(permission);
      return acc;
    }, {});
  }, [permissionCatalog]);

  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    setFormState(createEmptyRoleForm());
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (role: AdminRole) => {
    setDialogMode("edit");
    setFormState({
      id: role.name,
      name: role.displayName ?? role.name,
      description: role.description ?? "",
      permissions: role.permissions,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const normalizedKey =
      dialogMode === "edit" && formState.id
        ? formState.id
        : formState.name.trim().replace(/\s+/g, "_").toUpperCase();

    const payload = {
      name: normalizedKey,
      displayName: formState.name,
      description: formState.description || undefined,
      permissions: formState.permissions,
    };

    if (dialogMode === "create") {
      createRoleMutation.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast({ title: "تم إنشاء الدور" });
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: "فشل إنشاء الدور",
            description: error.message,
          }),
      });
    } else if (formState.id) {
      updateRoleMutation.mutate(
        {
          id: formState.id,
          ...payload,
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            toast({ title: "تم حفظ التغييرات" });
          },
          onError: (error) =>
            toast({
              variant: "destructive",
              title: "فشل تحديث الدور",
              description: error.message,
            }),
        },
      );
    }
  };

  const handleTogglePermission = (permissionId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, permissionId]))
        : prev.permissions.filter((permission) => permission !== permissionId),
    }));
  };

  const handleOpenDeleteDialog = (role: AdminRole) => {
    setDeleteTarget(role);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteRole = () => {
    if (!deleteTarget) return;
    deleteRoleMutation.mutate(
      { id: deleteTarget.name },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          toast({ title: "تم حذف الدور" });
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: "فشل حذف الدور",
            description: error.message,
          }),
      },
    );
  };

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;
  const disableSubmit = !formState.name || !formState.permissions.length;

  const customRolesCount = roles.filter((role) => !role.isSystem).length;
  const organizationRolesCount = roles.filter((role) => role.scope === "ORGANIZATION").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الأدوار</h1>
          <p className="text-gray-600">إدارة الأدوار والصلاحيات في النظام</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          إنشاء دور جديد
        </Button>
      </div>

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
                <p className="text-2xl font-bold text-gray-900">{customRolesCount}</p>
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
                <p className="text-2xl font-bold text-gray-900">{permissionCatalog.length}</p>
              </div>
              <Unlock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">أدوار مستوى المنظمة</p>
                <p className="text-2xl font-bold text-gray-900">{organizationRolesCount}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isRolesError ? (
        <Alert variant="destructive">
          <AlertTitle>تعذر تحميل الأدوار</AlertTitle>
          <AlertDescription>{rolesError?.message ?? "يرجى المحاولة مرة أخرى لاحقًا."}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>قائمة الأدوار</CardTitle>
          <CardDescription>عرض وإدارة الأدوار والصلاحيات في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRoles ? (
            <div className="py-8 text-center text-sm text-gray-500">جاري تحميل الأدوار...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الدور</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>تصنيف الدور</TableHead>
                  <TableHead>الصلاحيات</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.name}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{role.displayName || role.name}</div>
                      <div className="text-sm text-gray-500">{role.name}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {role.description || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit">
                          {role.isSystem ? "دور نظام" : "دور مخصص"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {role.scope === "ORGANIZATION" ? "مستوى المنظمة" : "مستوى النظام"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 4).map((permission) => (
                          <Badge key={permission} variant="outline">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 4 ? (
                          <Badge variant="secondary">+{role.permissions.length - 4}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(role)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(role)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!roles.length && !isLoadingRoles ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                      لا توجد أدوار متاحة حاليًا.
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
        title={dialogMode === "create" ? "إنشاء دور جديد" : "تعديل الدور"}
        description="حدد اسم الدور والصلاحيات المرتبطة به"
        confirmLabel={dialogMode === "create" ? "إنشاء الدور" : "حفظ التغييرات"}
        confirmLoading={isSubmitting}
        confirmDisabled={disableSubmit}
        onConfirm={handleSubmit}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role-name">اسم الدور</Label>
              <Input
                id="role-name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="role-description">الوصف</Label>
            <Input
              id="role-description"
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="صف الاستخدام الأساسي لهذا الدور"
            />
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">الصلاحيات</span>
              {isLoadingRoles ? (
                <div className="text-sm text-gray-500 mt-2">جاري تحميل الصلاحيات...</div>
              ) : (
                <div className="mt-3 space-y-4 max-h-64 overflow-y-auto pr-2">
                  {Object.entries(permissionCategories).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-2">
                      <div className="text-sm font-semibold text-gray-800">{category}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryPermissions.map((permission) => {
                          const checked = formState.permissions.includes(permission.key);
                          return (
                            <label
                              key={permission.key}
                              className="flex items-start space-x-2 rtl:space-x-reverse rounded-lg border p-3 hover:bg-gray-50"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  handleTogglePermission(permission.key, Boolean(value))
                                }
                              />
                              <span>
                                <div className="text-sm font-medium text-gray-900">
                                  {permission.label}
                                </div>
                                <div className="text-xs text-gray-500">{permission.description || "—"}</div>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminDialog>

      <AdminDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="تأكيد الحذف"
        description="هل أنت متأكد من حذف هذا الدور؟ قد يؤثر ذلك على المستخدمين المرتبطين."
        confirmLabel="حذف الدور"
        confirmVariant="destructive"
        confirmLoading={deleteRoleMutation.isPending}
        onConfirm={handleDeleteRole}
      />
    </div>
  );
}
