/**
 * Example: Enhanced User Management with New Admin Components
 * 
 * This file demonstrates how to use the new admin component library
 * to create a cleaner, more maintainable admin page.
 */

import { useState } from 'react';
import { Users, Shield, Calendar, Building2, UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AdminBreadcrumbs,
    AdminMetricCard,
    AdminTable,
    AdminExport,
    AdminLoading,
    AdminEmptyState,
    type AdminTableColumn,
} from '@/components/admin';
import { useAdminUsers, type AdminUser } from '@/lib/rbacAdmin';
import { ROLE_DISPLAY_TRANSLATIONS } from '@shared/rbac';
import { formatAdminDate, formatAdminDateTime } from '@/lib/formatters';

export default function UserManagementExample() {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const { data: usersResult, isLoading } = useAdminUsers();
    const users = usersResult?.users ?? [];

    // Define table columns
    const columns: AdminTableColumn<AdminUser>[] = [
        {
            key: 'name',
            label: 'المستخدم',
            sortable: true,
            render: (user) => (
                <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.username}</div>
                    {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                </div>
            ),
        },
        {
            key: 'organization',
            label: 'المنظمة',
            render: (user) => (
                <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    {user.organization?.tradeName ?? user.organization?.legalName ?? 'غير محدد'}
                </div>
            ),
        },
        {
            key: 'roles',
            label: 'الأدوار',
            render: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                        <Badge key={role} variant="outline">
                            {ROLE_DISPLAY_TRANSLATIONS[role] ?? role}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            key: 'isActive',
            label: 'الحالة',
            sortable: true,
            render: (user) => (
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
            ),
        },
        {
            key: 'lastLoginAt',
            label: 'آخر نشاط',
            sortable: true,
            render: (user) => (
                <div className="text-sm text-gray-600">
                    {formatAdminDateTime(user.lastLoginAt)}
                </div>
            ),
        },
        {
            key: 'createdAt',
            label: 'تاريخ الإنشاء',
            sortable: true,
            render: (user) => (
                <div className="text-sm text-gray-600">
                    {formatAdminDate(user.createdAt)}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'الإجراءات',
            className: 'text-center',
            render: (user) => (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const activeUsers = users.filter((u) => u.isActive).length;
    const pendingUsers = users.filter((u) => u.approvalStatus?.toUpperCase() === 'PENDING').length;
    const totalOrgs = new Set(
        users
            .map((u) => u.organization?.tradeName ?? u.organization?.legalName)
            .filter((v): v is string => Boolean(v))
    ).size;

    if (isLoading) {
        return <AdminLoading fullScreen text="جار تحميل بيانات المستخدمين..." />;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Breadcrumbs */}
            <AdminBreadcrumbs
                items={[
                    { label: 'إدارة المستخدمين', href: '/admin/users/all-users' },
                    { label: 'جميع المستخدمين' },
                ]}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
                    <p className="text-gray-600">إدارة المستخدمين والصلاحيات في النظام</p>
                </div>
                <div className="flex items-center gap-2">
                    <AdminExport data={users} filename="users" formats={['csv', 'json']} />
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                    trend={{ value: 12, isPositive: true, label: 'من الشهر الماضي' }}
                />
                <AdminMetricCard
                    title="المستخدمون المعلقون"
                    value={pendingUsers}
                    icon={<Calendar className="h-6 w-6" />}
                    color="yellow"
                />
                <AdminMetricCard
                    title="المنظمات"
                    value={totalOrgs}
                    icon={<Building2 className="h-6 w-6" />}
                    color="purple"
                />
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="text-sm text-blue-900">
                        تم تحديد <span className="font-bold">{selectedUsers.length}</span> مستخدم
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            تفعيل
                        </Button>
                        <Button variant="outline" size="sm">
                            إلغاء التفعيل
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                            حذف
                        </Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <AdminTable
                columns={columns}
                data={users}
                keyExtractor={(user) => user.id}
                selectable
                onSelectionChange={setSelectedUsers}
                searchable
                searchPlaceholder="البحث بالاسم أو البريد الإلكتروني..."
                pageSize={10}
                emptyState={
                    <AdminEmptyState
                        icon={<Users className="h-12 w-12" />}
                        title="لا يوجد مستخدمون"
                        description="لم يتم العثور على أي مستخدمين في النظام"
                        action={
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <UserPlus className="h-4 w-4 mr-2" />
                                إضافة أول مستخدم
                            </Button>
                        }
                    />
                }
            />
        </div>
    );
}
