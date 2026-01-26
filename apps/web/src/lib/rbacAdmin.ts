/**
 * rbacAdmin.ts - RBAC Admin Utilities
 * 
 * Location: apps/web/src/ → Lib/ → rbacAdmin.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * RBAC admin utility functions and hooks. Provides:
 * - User management utilities
 * - Role management functions
 * - Admin API helpers
 * 
 * Related Files:
 * - apps/web/src/pages/admin/user-management.tsx - User management page
 * - apps/web/src/pages/admin/role-management.tsx - Role management page
 * - apps/api/routes/rbac-admin.ts - RBAC admin API routes
 */

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiRequest } from "./queryClient";
import type { UserRole } from "@shared/rbac";

export type AdminUserApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_INFO"
  | string;

export interface AdminOrganizationSummary {
  id: string;
  legalName: string | null;
  tradeName: string | null;
}

export interface AdminUserMembership {
  id: string;
  organizationId: string;
  roleKey: string | null;
  roleName: string | null;
  status: string;
  isPrimary: boolean;
  joinedAt: string | null;
  organization: AdminOrganizationSummary | null;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  phone: string | null;
  roles: UserRole[];
  organization: AdminOrganizationSummary | null;
  approvalStatus: AdminUserApprovalStatus | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  licenseNumber: string | null;
  memberships: AdminUserMembership[];
  primaryMembership: AdminUserMembership | null;
}

export interface AdminUserFilters {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

interface AdminUsersResponse {
  success: boolean;
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

interface AdminUsersResult {
  users: AdminUser[];
  pagination: AdminUsersResponse["pagination"];
}

export interface CreateAdminUserInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: UserRole[];
  organizationId?: string | null;
}

export interface UpdateAdminUserInput extends Partial<CreateAdminUserInput> {
  id: string;
  isActive?: boolean;
}

export interface AdminRolePermissionDetail {
  key: string;
  label: string;
  description: string | null;
  domain: string | null;
}

export interface AdminRole {
  name: string;
  displayName: string;
  description: string | null;
  scope: string;
  isSystem: boolean;
  isDefault: boolean;
  permissions: string[];
  permissionDetails: AdminRolePermissionDetail[];
}

interface AdminRolesResponse {
  success: boolean;
  roles: AdminRole[];
  message?: string;
}

export interface CreateAdminRoleInput {
  name: string;
  description?: string;
  permissions: string[];
  displayName?: string;
}

export interface UpdateAdminRoleInput extends Partial<CreateAdminRoleInput> {
  id: string;
}

interface AdminUserMutationPayload {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: UserRole[];
  organizationId?: string | null;
  isActive?: boolean;
  approvalStatus?: AdminUserApprovalStatus | null;
}

interface AdminUserMutationResponse {
  success: boolean;
  user?: AdminUserMutationPayload;
  message?: string;
}

interface OptimisticContext<T> {
  previousEntries: Array<[QueryKey, T | undefined]>;
}

const RBAC_USERS_KEY = ["rbac-admin", "users"] as const;
const RBAC_ROLES_KEY = ["rbac-admin", "roles"] as const;

const toQueryString = (params: Record<string, string | number | undefined>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && `${value}`.trim().length > 0) {
      searchParams.append(key, `${value}`);
    }
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
};

async function getJson<T>(url: string): Promise<T> {
  const res = await apiRequest("GET", url);
  return res.json() as Promise<T>;
}

const ensureSuccess = <T extends { success: boolean; message?: string }>(payload: T): T => {
  if (!payload.success) {
    throw new Error(payload.message ?? "حدث خطأ غير متوقع");
  }

  return payload;
};

const mapMutationPayloadToAdminUser = (
  payload: AdminUserMutationPayload,
  fallback?: AdminUser,
): AdminUser => {
  const firstName = payload.firstName ?? fallback?.firstName ?? null;
  const lastName = payload.lastName ?? fallback?.lastName ?? null;
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim() || payload.username;

  const organization = payload.organizationId
    ? fallback?.organization?.id === payload.organizationId
      ? fallback.organization
      : {
        id: payload.organizationId,
        legalName: fallback?.organization?.legalName ?? null,
        tradeName: fallback?.organization?.tradeName ?? null,
      }
    : null;

  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    firstName,
    lastName,
    name,
    phone: fallback?.phone ?? null,
    roles: payload.roles ?? fallback?.roles ?? [],
    organization,
    approvalStatus: payload.approvalStatus ?? fallback?.approvalStatus ?? null,
    isActive: payload.isActive ?? fallback?.isActive ?? false,
    lastLoginAt: fallback?.lastLoginAt ?? null,
    createdAt: fallback?.createdAt ?? new Date().toISOString(),
    licenseNumber: fallback?.licenseNumber ?? null,
    memberships: fallback?.memberships ?? [],
    primaryMembership: fallback?.primaryMembership ?? null,
  };
};

const makeOptimisticUser = (
  payload: CreateAdminUserInput,
  id: string,
): AdminUser => ({
  id,
  username: payload.username,
  email: payload.email,
  firstName: payload.firstName,
  lastName: payload.lastName,
  name: `${payload.firstName} ${payload.lastName}`.trim(),
  phone: payload.phone ?? null,
  roles: payload.roles,
  organization: payload.organizationId
    ? { id: payload.organizationId, legalName: null, tradeName: null }
    : null,
  approvalStatus: "PENDING",
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  licenseNumber: null,
  memberships: [],
  primaryMembership: null,
});

const applyOptimisticUpdate = <T>(
  queryClient: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  updater: (current: T | undefined) => T,
) => {
  queryClient.getQueriesData<T>({ queryKey: key }).forEach(([queryKey, value]) => {
    queryClient.setQueryData(queryKey, updater(value));
  });
};

export const useAdminUsers = (filters?: AdminUserFilters) => {
  const queryKey = useMemo(
    () =>
      [
        ...RBAC_USERS_KEY,
        {
          search: filters?.search ?? "",
          role: filters?.role ?? "",
          page: filters?.page ?? "",
          limit: filters?.limit ?? "",
        },
      ] as const,
    [filters?.search, filters?.role, filters?.page, filters?.limit],
  );

  return useQuery<AdminUsersResult, Error>({
    queryKey,
    queryFn: async () => {
      const payload = await getJson<AdminUsersResponse>(
        `/api/rbac-admin/users${toQueryString({
          search: filters?.search,
          role: filters?.role,
          page: filters?.page,
          limit: filters?.limit,
        })}`,
      );

      const { users, pagination } = ensureSuccess(payload);
      return { users, pagination };
    },
  });
};

export const useAdminRoles = () =>
  useQuery<AdminRole[], Error>({
    queryKey: RBAC_ROLES_KEY,
    queryFn: async () => {
      const payload = await getJson<AdminRolesResponse>("/api/rbac-admin/roles");
      return ensureSuccess(payload).roles;
    },
  });

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminUserMutationPayload, Error, CreateAdminUserInput, OptimisticContext<AdminUsersResult>>({
    mutationFn: async (payload) => {
      const res = await apiRequest("POST", "/api/rbac-admin/users", payload);
      const json = (await res.json()) as AdminUserMutationResponse;
      if (!json.success || !json.user) {
        throw new Error(json.message ?? "فشل إنشاء المستخدم");
      }

      return json.user;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: RBAC_USERS_KEY });
      const previousEntries = queryClient.getQueriesData<AdminUsersResult>({
        queryKey: RBAC_USERS_KEY,
      });

      const optimisticUser = makeOptimisticUser(payload, `temp-${Date.now()}`);

      previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData<AdminUsersResult>(queryKey, () => {
          const current = value ?? {
            users: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 1 },
          };

          return {
            ...current,
            users: [...current.users, optimisticUser],
          };
        });
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSuccess: (createdUser) => {
      applyOptimisticUpdate<AdminUsersResult>(queryClient, RBAC_USERS_KEY, (value) => {
        if (!value) return value ?? { users: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } };

        return {
          ...value,
          users: value.users.map((user) =>
            user.id.startsWith("temp-")
              ? mapMutationPayloadToAdminUser(createdUser, user)
              : user,
          ),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_USERS_KEY });
    },
  });
};

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminUserMutationPayload, Error, UpdateAdminUserInput, OptimisticContext<AdminUsersResult>>({
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiRequest("PUT", `/api/rbac-admin/users/${id}`, payload);
      const json = (await res.json()) as AdminUserMutationResponse;
      if (!json.success || !json.user) {
        throw new Error(json.message ?? "فشل تحديث المستخدم");
      }

      return json.user;
    },
    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey: RBAC_USERS_KEY });
      const previousEntries = queryClient.getQueriesData<AdminUsersResult>({
        queryKey: RBAC_USERS_KEY,
      });

      previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData<AdminUsersResult>(queryKey, () => {
          const current = value ?? {
            users: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 1 },
          };

          return {
            ...current,
            users: current.users.map((user) =>
              user.id === id
                ? {
                  ...user,
                  ...payload,
                  firstName: payload.firstName ?? user.firstName,
                  lastName: payload.lastName ?? user.lastName,
                  name:
                    `${payload.firstName ?? user.firstName ?? ""} ${payload.lastName ?? user.lastName ?? ""}`.trim() ||
                    user.username,
                  phone: payload.phone ?? user.phone,
                  roles: payload.roles ?? user.roles,
                  organization: payload.organizationId
                    ? user.organization?.id === payload.organizationId
                      ? user.organization
                      : { id: payload.organizationId, legalName: null, tradeName: null }
                    : null,
                  isActive: payload.isActive ?? user.isActive,
                }
                : user,
            ),
          };
        });
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSuccess: (updatedUser) => {
      applyOptimisticUpdate<AdminUsersResult>(queryClient, RBAC_USERS_KEY, (value) => {
        if (!value) return value ?? { users: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } };

        return {
          ...value,
          users: value.users.map((user) =>
            user.id === updatedUser.id ? mapMutationPayloadToAdminUser(updatedUser, user) : user,
          ),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_USERS_KEY });
    },
  });
};

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }, OptimisticContext<AdminUsersResult>>({
    mutationFn: async ({ id }) => {
      await apiRequest("DELETE", `/api/rbac-admin/users/${id}`);
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: RBAC_USERS_KEY });
      const previousEntries = queryClient.getQueriesData<AdminUsersResult>({
        queryKey: RBAC_USERS_KEY,
      });

      previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData<AdminUsersResult>(queryKey, () => {
          const current = value ?? {
            users: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 1 },
          };

          return {
            ...current,
            users: current.users.filter((user) => user.id !== id),
          };
        });
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_USERS_KEY });
    },
  });
};

export const useCreateAdminRole = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminRole, Error, CreateAdminRoleInput, OptimisticContext<AdminRole[]>>({
    mutationFn: async (payload) => {
      const res = await apiRequest("POST", "/api/rbac-admin/roles", payload);
      const json = await res.json();
      if (!json?.success || !json?.role) {
        throw new Error(json?.message ?? "فشل إنشاء الدور");
      }

      return json.role as AdminRole;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: RBAC_ROLES_KEY });
      const previousEntries = queryClient.getQueriesData<AdminRole[]>({
        queryKey: RBAC_ROLES_KEY,
      });

      const optimisticRole: AdminRole = {
        name: payload.name,
        displayName: payload.displayName ?? payload.name,
        description: payload.description ?? null,
        scope: "SYSTEM",
        isSystem: false,
        isDefault: false,
        permissions: payload.permissions,
        permissionDetails: [],
      };

      previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData<AdminRole[]>(queryKey, [
          ...(value ?? []),
          optimisticRole,
        ]);
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_ROLES_KEY });
    },
  });
};

export const useUpdateAdminRole = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminRole, Error, UpdateAdminRoleInput, OptimisticContext<AdminRole[]>>({
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiRequest("PUT", `/api/rbac-admin/roles/${id}`, payload);
      const json = await res.json();
      if (!json?.success || !json?.role) {
        throw new Error(json?.message ?? "فشل تحديث الدور");
      }

      return json.role as AdminRole;
    },
    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey: RBAC_ROLES_KEY });
      const previousEntries = queryClient.getQueriesData<AdminRole[]>({
        queryKey: RBAC_ROLES_KEY,
      });

      previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData<AdminRole[]>(queryKey, () => {
          const roles = value ?? [];
          return roles.map((role) =>
            role.name === id
              ? {
                ...role,
                ...payload,
                displayName: payload.displayName ?? role.displayName,
                description: payload.description ?? role.description,
                permissions: payload.permissions ?? role.permissions,
              }
              : role,
          );
        });
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_ROLES_KEY });
    },
  });
};

export const useDeleteAdminRole = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }, OptimisticContext<AdminRole[]>>({
    mutationFn: async ({ id }) => {
      await apiRequest("DELETE", `/api/rbac-admin/roles/${id}`);
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: RBAC_ROLES_KEY });
      const previousEntries = queryClient.getQueriesData<AdminRole[]>({
        queryKey: RBAC_ROLES_KEY,
      });

      previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData<AdminRole[]>(
          queryKey,
          (value ?? []).filter((role) => role.name !== id),
        );
      });

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_ROLES_KEY });
    },
  });
};
export interface AdminOrganization {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  userCount: number;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
  subscription: {
    plan: string;
    status: string;
    expiryDate: string;
  };
  createdAt: string;
  lastActive: string;
}

export interface AdminOrganizationFilters {
  search?: string;
  status?: string;
  type?: string;
}

interface AdminOrganizationsResponse {
  success: boolean;
  organizations: AdminOrganization[];
  message?: string;
}

export interface CreateAdminOrganizationInput {
  name: string;
  type: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateAdminOrganizationInput extends Partial<CreateAdminOrganizationInput> {
  id: string;
  status?: string;
}

const RBAC_ORGS_KEY = ["rbac-admin", "organizations"] as const;

export const useAdminOrganizations = (filters?: AdminOrganizationFilters) => {
  return useQuery<AdminOrganization[], Error>({
    queryKey: [...RBAC_ORGS_KEY, filters],
    queryFn: async () => {
      const payload = await getJson<AdminOrganizationsResponse>(
        `/api/rbac-admin/organizations${toQueryString({
          search: filters?.search,
          status: filters?.status === 'all' ? undefined : filters?.status,
          type: filters?.type === 'all' ? undefined : filters?.type,
        })}`
      );
      return ensureSuccess(payload).organizations;
    },
  });
};

export const useCreateAdminOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminOrganization, Error, CreateAdminOrganizationInput>({
    mutationFn: async (payload) => {
      const res = await apiRequest("POST", "/api/rbac-admin/organizations", payload);
      const json = await res.json();
      if (!json.success || !json.organization) {
        throw new Error(json.message ?? "فشل إنشاء المنظمة");
      }
      return json.organization;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_ORGS_KEY });
    },
  });
};

export const useUpdateAdminOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminOrganization, Error, UpdateAdminOrganizationInput>({
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiRequest("PUT", `/api/rbac-admin/organizations/${id}`, payload);
      const json = await res.json();
      if (!json.success || !json.organization) {
        throw new Error(json.message ?? "فشل تحديث المنظمة");
      }
      return json.organization;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_ORGS_KEY });
    },
  });
};

export const useDeleteAdminOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      await apiRequest("DELETE", `/api/rbac-admin/organizations/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RBAC_ORGS_KEY });
    },
  });
};
