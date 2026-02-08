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
import { AdminCard, MetricCard } from "@/components/admin";
import { AdminTable, type AdminTableColumn } from "@/components/admin";
import { AdminDialog } from "@/components/admin/AdminDialog";
import {
  AdminSheet,
  AdminSheetContent,
  AdminSheetHeader,
  AdminSheetTitle,
  AdminSheetDescription,
  AdminSheetFooter,
} from "@/components/admin/ui/AdminSheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminRoles,
  useCreateAdminRole,
  useUpdateAdminRole,
  useDeleteAdminRole,
  type AdminRole,
} from "@/lib/rbacAdmin";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

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

  const roleColumns: AdminTableColumn<AdminRole>[] = useMemo(() => [
    {
      key: "name",
      label: "اسم الدور",
      sortable: true,
      render: (role) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {role.displayName || role.name}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{role.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      label: "الوصف",
      render: (role) => <div className="text-sm font-medium text-slate-500 max-w-xs truncate">{role.description || "—"}</div>
    },
    {
      key: "scope",
      label: "النطاق",
      render: (role) => (
        <div className="flex flex-col gap-1">
          <Badge className={cn("w-fit text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-0", role.isSystem ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700")}>
            {role.isSystem ? "نظام" : "مخصص"}
          </Badge>
          <span className="text-[10px] font-bold text-slate-400">
            {role.scope === "ORGANIZATION" ? "منظمة" : "شامل"}
          </span>
        </div>
      )
    },
    {
      key: "permissions",
      label: "الصلاحيات",
      render: (role) => (
        <div className="flex flex-wrap gap-1">
          {role.permissions.slice(0, 3).map((permission) => (
            <Badge key={permission} variant="secondary" className="bg-slate-50 text-slate-500 border-0 text-[9px] font-bold px-2 py-0.5 rounded-md">
              {permission}
            </Badge>
          ))}
          {role.permissions.length > 3 ? (
            <Badge className="bg-slate-100 text-slate-400 border-0 text-[9px] font-bold px-2 py-0.5 rounded-md">+{role.permissions.length - 3}</Badge>
          ) : null}
        </div>
      )
    },
    {
      key: "actions",
      label: "تحكم",
      className: "w-24 text-center",
      render: (role) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-50 transition-all" onClick={() => handleOpenEditDialog(role)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all" onClick={() => handleOpenEditDialog(role)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDeleteDialog(role)}
            className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], []);

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
    <div className="space-y-8 animate-in-start" dir="rtl">
      <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-end">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الأدوار</h1>
            <p className="text-slate-500 font-medium text-lg">تحكم في الصلاحيات والوصول لمختلف مجموعات المستخدمين</p>
          </div>
          <Button className="premium-gradient text-white border-0 shadow-lg shadow-blue-500/25 h-12 px-8 rounded-2xl font-bold w-full md:w-auto" onClick={handleOpenCreateDialog}>
            <Plus className="h-5 w-5 me-2" />
            إنشاء دور جديد
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="إجمالي الأدوار"
          subtitle="قاعدية ومخصصة"
          icon={<Shield className="w-5 h-5 text-blue-600" />}
          metric={{ today: roles.length, last7Days: roles.length, last30Days: roles.length }}
          loading={isLoadingRoles}
        />
        <MetricCard
          title="الأدوار المخصصة"
          subtitle="تم إنشاؤها يدويًا"
          icon={<Settings className="w-5 h-5 text-emerald-600" />}
          metric={{ today: customRolesCount, last7Days: customRolesCount, last30Days: customRolesCount }}
          loading={isLoadingRoles}
        />
        <MetricCard
          title="إجمالي الصلاحيات"
          subtitle="متاحة في النظام"
          icon={<Unlock className="w-5 h-5 text-purple-600" />}
          metric={{ today: permissionCatalog.length, last7Days: permissionCatalog.length, last30Days: permissionCatalog.length }}
          loading={isLoadingRoles}
        />
        <MetricCard
          title="أدوار المنظمات"
          subtitle="مستوى المنظمة"
          icon={<Users className="w-5 h-5 text-amber-600" />}
          metric={{ today: organizationRolesCount, last7Days: organizationRolesCount, last30Days: organizationRolesCount }}
          loading={isLoadingRoles}
        />
      </div>

      {isRolesError ? (
        <Alert variant="destructive">
          <AlertTitle>تعذر تحميل الأدوار</AlertTitle>
          <AlertDescription>{rolesError?.message ?? "يرجى المحاولة مرة أخرى لاحقًا."}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="glass border-0 rounded-[2rem] p-8 shadow-none mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">قائمة الأدوار</h2>
          <p className="text-slate-500 font-medium">عرض وإدارة الصلاحيات لكل دور وظيفي</p>
        </div>
        <AdminTable
          columns={roleColumns}
          data={roles}
          keyExtractor={(role) => role.name}
          loading={isLoadingRoles}
          pageSize={10}
        />
      </Card>

      <AdminSheet
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <AdminSheetContent side="start" className="w-[480px] sm:w-[540px] overflow-y-auto">
          <AdminSheetHeader>
            <AdminSheetTitle>{dialogMode === "create" ? "إنشاء دور جديد" : "تعديل الدور"}</AdminSheetTitle>
            <AdminSheetDescription>
              حدد اسم الدور والصلاحيات المرتبطة به
            </AdminSheetDescription>
          </AdminSheetHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="role-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">اسم الدور</Label>
                  <Input
                    id="role-name"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    className="bg-white/50 border-slate-200 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all h-11 rounded-xl shadow-sm"
                    placeholder="اسم الدور (مثلاً: مدير النظام)"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-description" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">الوصف</Label>
                <Input
                  id="role-description"
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="صف الاستخدام الأساسي لهذا الدور"
                  className="bg-white/50 border-slate-200 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                <h3 className="text-base font-bold text-slate-800">صلاحيات الدور</h3>
              </div>

              <div className="space-y-3">
                {isLoadingRoles ? (
                  <div className="text-sm text-gray-500 mt-2">جاري تحميل الصلاحيات...</div>
                ) : (
                  <div className="mt-2 space-y-6 overflow-y-auto pr-1">
                    {Object.entries(permissionCategories).map(([category, categoryPermissions]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-bold text-slate-600 bg-slate-50">{category}</Badge>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {categoryPermissions.map((permission) => {
                            const checked = formState.permissions.includes(permission.key);
                            return (
                              <label
                                key={permission.key}
                                className={cn(
                                  "flex items-start space-x-3 rtl:space-x-reverse rounded-xl border p-3 cursor-pointer transition-all duration-200 group",
                                  checked
                                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                    : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) =>
                                    handleTogglePermission(permission.key, Boolean(value))
                                  }
                                  className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <span className="flex-1 ms-2">
                                  <div className={cn("text-sm font-bold transition-colors", checked ? "text-blue-900" : "text-slate-700")}>
                                    {permission.label}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5 leading-snug">{permission.description || "—"}</div>
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {dialogMode === "create" ? "إنشاء الدور" : "حفظ التغييرات"}
            </Button>
          </AdminSheetFooter>
        </AdminSheetContent>
      </AdminSheet>

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
