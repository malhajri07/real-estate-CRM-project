/**
 * rbac-policy.ts - RBAC Policy Definitions
 * 
 * Location: apps/api/ → Authentication & Authorization → rbac-policy.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Central RBAC policy definitions aligned with the role matrix. Provides:
 * - Role and permission definitions
 * - Permission checking functions
 * - Visibility scope management
 * 
 * Related Files:
 * - apps/api/rbac.ts - RBAC system
 * - apps/api/routes/rbac-admin.ts - RBAC admin routes
 * - packages/shared/rbac.ts - Shared RBAC types
 */

// Central RBAC policy aligned with the new role matrix

/**
 * Closed set of application role keys, mirroring the `UserRole` enum in
 * `data/schema/prisma/schema.prisma` and the `users.roles` column.
 *
 * **Source:** parsed from `users.roles` (CSV string) at JWT verification time.
 * **Consumer:** {@link ROLE_PERMISSIONS} map and the {@link hasPermission} /
 * {@link getVisibilityScope} helpers.
 *
 * See [[Architecture/Authentication & RBAC]].
 */
export type AppRole =
  | 'WEBSITE_ADMIN'
  | 'SUB_ADMIN'
  | 'CORP_OWNER'
  | 'CORP_AGENT'
  | 'INDIV_AGENT'
  | 'SELLER'
  | 'BUYER';

/**
 * Closed set of permission keys used across the API.
 *
 * Naming convention: `<resource>:<action>:<scope>` where scope is `all`,
 * `corporate`, or `self`. Scope-only keys (`scope:global` etc.) are convenience
 * markers for the {@link getVisibilityScope} helper.
 *
 * **Consumer:** every `requirePermission(...)` middleware call in `routes/*`.
 */
export type Permission =
  | 'system:manage'
  | 'system:limited'
  | 'content:manage:all'
  | 'content:manage:corporate'
  | 'content:manage:self'
  | 'users:manage:all'
  | 'users:manage:limited'
  | 'users:manage:corporate'
  | 'users:manage:self'
  | 'listings:manage:all'
  | 'listings:manage:corporate'
  | 'listings:manage:self'
  | 'requests:manage:all'
  | 'requests:manage:corporate'
  | 'requests:pool:pickup'
  | 'reports:view:all'
  | 'reports:view:corporate'
  | 'reports:view:self'
  | 'scope:global'
  | 'scope:corporate'
  | 'scope:self';

/**
 * Static role → permissions matrix. The single source of truth for what each
 * role can do; never compute permissions any other way.
 *
 * To add a permission to a role: add the key to {@link Permission}, list it
 * here, and ensure no `requirePermission(...)` middleware silently swallows
 * the new key.
 *
 * **Consumer:** {@link hasPermission}, which is called by every gated route.
 */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  WEBSITE_ADMIN: [
    'system:manage',
    'content:manage:all',
    'users:manage:all',
    'listings:manage:all',
    'requests:manage:all',
    'reports:view:all',
    'scope:global',
  ],
  SUB_ADMIN: [
    'system:limited',
    'content:manage:all',
    'users:manage:limited',
    'listings:manage:all',
    'requests:manage:all',
    'reports:view:all',
    'scope:global',
  ],
  CORP_OWNER: [
    'content:manage:corporate',
    'users:manage:corporate',
    'listings:manage:corporate',
    'reports:view:corporate',
    'scope:corporate',
  ],
  CORP_AGENT: [
    'content:manage:corporate',
    'listings:manage:corporate',
    'requests:pool:pickup',
    'reports:view:corporate',
    'scope:corporate',
  ],
  INDIV_AGENT: [
    'content:manage:self',
    'listings:manage:self',
    'requests:pool:pickup',
    'reports:view:self',
    'scope:self',
  ],
  SELLER: [
    'users:manage:self',
    'reports:view:self',
    'scope:self',
  ],
  BUYER: [
    'users:manage:self',
    'reports:view:self',
    'scope:self',
  ],
};

/**
 * Returns `true` if any of the user's roles grants the requested permission.
 *
 * @param userRoles - Normalized role keys for the user.
 *   Source: `req.user.roles` populated by `authenticateToken` (from `users.roles`).
 * @param perm - The permission key to check.
 *   Source: hard-coded at the call site (`requirePermission('listings:manage:corporate')`).
 * @returns `true` if granted, `false` if denied (including for null/empty role lists).
 *   Consumer: `requirePermission` middleware in `apps/api/rbac.ts`, which
 *   returns 403 to the client on `false`.
 */
export function hasPermission(userRoles: string[] | undefined | null, perm: Permission): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  for (const r of userRoles as AppRole[]) {
    const perms = ROLE_PERMISSIONS[r as AppRole];
    if (perms && perms.includes(perm)) return true;
  }
  return false;
}

/**
 * Coarse-grained "how much can this user see?" key used by route handlers to
 * pick between three canonical `where` clauses:
 *
 * - `'global'` → no filter (admin sees everything)
 * - `'corporate'` → `{ organizationId: req.user.organizationId }`
 * - `'self'` → `{ agentId: req.user.id }`
 *
 * This is the shorthand that corresponds to [[Architecture/Org Isolation]].
 */
export type VisibilityScope = 'global' | 'corporate' | 'self';

/**
 * Derive the visibility scope from a user's roles. Used by routes that want a
 * single scope key instead of checking multiple permissions.
 *
 * @param userRoles - Normalized role keys.
 *   Source: `req.user.roles`.
 * @returns One of `'global' | 'corporate' | 'self'` — defaults to `'self'` for
 *   unauthenticated or unknown role sets.
 *   Consumer: route handlers that switch on the returned key to build the
 *   appropriate Prisma `where` clause.
 */
export function getVisibilityScope(userRoles: string[] | undefined | null): VisibilityScope {
  if (!userRoles) return 'self';
  const roles = userRoles as AppRole[];
  if (roles.includes('WEBSITE_ADMIN')) return 'global';
  if (roles.includes('CORP_OWNER') || roles.includes('CORP_AGENT')) return 'corporate';
  return 'self';
}
