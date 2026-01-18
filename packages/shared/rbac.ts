/**
 * rbac.ts - Shared RBAC Utilities
 * 
 * Location: packages/shared/ → rbac.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Shared RBAC utilities. Provides:
 * - Single source of truth for role constants
 * - Display metadata
 * - Permission mappings
 * - Helpers used by both API and web client
 * 
 * Related Files:
 * - apps/api/rbac.ts - Backend RBAC system
 * - apps/api/rbac-policy.ts - RBAC policy definitions
 * - apps/web/src/lib/rbacAdmin.ts - Frontend RBAC utilities
 */

/**
 * packages/shared/rbac.ts - Shared RBAC utilities
 *
 * Provides a single source of truth for role constants, display metadata,
 * permission mappings, and helpers used by both the API and web client.
 */

export enum UserRole {
  WEBSITE_ADMIN = 'WEBSITE_ADMIN',
  CORP_OWNER = 'CORP_OWNER',
  CORP_AGENT = 'CORP_AGENT',
  INDIV_AGENT = 'INDIV_AGENT',
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  AGENT = 'AGENT', // Legacy role for seeded data
}

export const USER_ROLES: readonly UserRole[] = Object.values(UserRole);

export const DEFAULT_USER_ROLE: UserRole = UserRole.BUYER;

export const ROLE_DISPLAY_TRANSLATIONS: Record<UserRole, string> = {
  [UserRole.WEBSITE_ADMIN]: 'مدير النظام',
  [UserRole.CORP_OWNER]: 'مالك الشركة',
  [UserRole.CORP_AGENT]: 'وكيل شركة',
  [UserRole.INDIV_AGENT]: 'وكيل مستقل',
  [UserRole.SELLER]: 'بائع',
  [UserRole.BUYER]: 'مشتري',
  [UserRole.AGENT]: 'وكيل عقاري',
};

export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  [UserRole.WEBSITE_ADMIN]: [
    'manage_users',
    'manage_organizations',
    'manage_roles',
    'view_all_data',
    'impersonate_users',
    'manage_site_settings',
    'view_audit_logs',
  ],
  [UserRole.CORP_OWNER]: [
    'manage_org_profile',
    'manage_org_agents',
    'view_org_data',
    'manage_org_listings',
    'view_org_reports',
  ],
  [UserRole.CORP_AGENT]: [
    'manage_listings',
    'view_org_listings',
    'manage_assigned_leads',
    'view_org_leads',
  ],
  [UserRole.INDIV_AGENT]: [
    'manage_personal_listings',
    'view_personal_leads',
    'update_personal_profile',
    'submit_marketing_requests',
    'respond_to_requests',
  ],
  [UserRole.AGENT]: [
    'manage_listings',
    'view_org_listings',
    'manage_assigned_leads',
    'view_org_leads',
  ],
  [UserRole.SELLER]: [
    'create_property_requests',
    'view_own_requests',
    'manage_property_details',
    'communicate_with_agents',
  ],
  [UserRole.BUYER]: [
    'view_public_listings',
    'save_favorites',
    'submit_buy_requests',
    'contact_agents',
  ],
};

export const ALL_PERMISSIONS: readonly string[] = Array.from(
  new Set(Object.values(ROLE_PERMISSIONS).flat()),
);

export const normalizeRoleKeys = (
  input?: unknown,
  fallback: UserRole = DEFAULT_USER_ROLE,
): UserRole[] => {
  if (!input) return [fallback];

  const normalize = (value: string) => value.trim().toUpperCase();

  if (Array.isArray(input)) {
    const cleaned = input
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => normalize(value))
      .filter((value): value is UserRole => USER_ROLES.includes(value as UserRole));

    return cleaned.length ? Array.from(new Set(cleaned)) : [fallback];
  }

  if (typeof input === 'string' && input.trim().length > 0) {
    const normalized = normalize(input);
    return USER_ROLES.includes(normalized as UserRole) ? [normalized as UserRole] : [fallback];
  }

  return [fallback];
};

export const serializeRoles = (roles: readonly UserRole[]): string => {
  const unique = Array.from(new Set(roles.length ? roles : [DEFAULT_USER_ROLE]));
  return JSON.stringify(unique);
};

export const parseStoredRoles = (raw: string | null | undefined): UserRole[] => {
  if (!raw) return [DEFAULT_USER_ROLE];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [DEFAULT_USER_ROLE];

    const cleaned = parsed
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is UserRole => USER_ROLES.includes(value as UserRole));

    return cleaned.length ? Array.from(new Set(cleaned)) : [DEFAULT_USER_ROLE];
  } catch {
    const normalized = raw.trim().toUpperCase();
    return USER_ROLES.includes(normalized as UserRole) ? [normalized as UserRole] : [DEFAULT_USER_ROLE];
  }
};

export const hasPermission = (roles: readonly UserRole[], permission: string): boolean => {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
};
