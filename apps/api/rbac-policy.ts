// apps/api/rbac-policy.ts
// Central RBAC policy aligned with the new role matrix

export type AppRole =
  | 'WEBSITE_ADMIN'
  | 'SUB_ADMIN'
  | 'CORP_OWNER'
  | 'CORP_AGENT'
  | 'INDIV_AGENT'
  | 'SELLER'
  | 'BUYER';

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

export function hasPermission(userRoles: string[] | undefined | null, perm: Permission): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  for (const r of userRoles as AppRole[]) {
    const perms = ROLE_PERMISSIONS[r as AppRole];
    if (perms && perms.includes(perm)) return true;
  }
  return false;
}

export type VisibilityScope = 'global' | 'corporate' | 'self';

export function getVisibilityScope(userRoles: string[] | undefined | null): VisibilityScope {
  if (!userRoles) return 'self';
  const roles = userRoles as AppRole[];
  if (roles.includes('WEBSITE_ADMIN')) return 'global';
  if (roles.includes('CORP_OWNER') || roles.includes('CORP_AGENT')) return 'corporate';
  return 'self';
}
