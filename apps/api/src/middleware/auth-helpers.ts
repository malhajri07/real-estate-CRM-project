/**
 * auth-helpers.ts - Shared auth extraction helpers
 *
 * Centralizes getAuth and decodeAuth used across API routes.
 * Used by: cms-*, landing, deals, activities, messages, notifications.
 *
 * - getAuth: from session or req.user (set by session promotion or authenticateToken)
 * - decodeAuth: from JWT in Authorization header (no DB lookup)
 */

import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { parseStoredRoles, normalizeRoleKeys } from '@shared/rbac';

export interface AuthPayload {
  id?: string;
  roles: string[];
  organizationId?: string;
}

/**
 * Extract auth from session or req.user (session cookie or authenticateToken).
 * Used by CMS routes that rely on session or Bearer + DB lookup.
 */
export function getAuth(req: Request): AuthPayload {
  const user = (req as { session?: { user?: { id?: string; roles?: string[] | string }; }; user?: { id?: string; roles?: string[] | string; organizationId?: string } }).session?.user
    || (req as { user?: { id?: string; roles?: string[] | string; organizationId?: string } }).user;
  const roles: string[] = Array.isArray(user?.roles)
    ? normalizeRoleKeys(user.roles)
    : typeof user?.roles === 'string'
      ? normalizeRoleKeys(parseStoredRoles(user.roles))
      : [];
  return {
    id: user?.id ?? 'anonymous',
    roles,
    organizationId: (user as { organizationId?: string })?.organizationId,
  };
}

/**
 * Extract auth from JWT in Authorization header (no DB lookup).
 * Used by landing preview, deals, activities, messages, notifications.
 */
export function decodeAuth(req: Request): AuthPayload {
  try {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return { roles: [] };
    const payload = AuthService.verifyToken(token);
    if (!payload) return { roles: [] };
    const roles = typeof payload.roles === 'string'
      ? normalizeRoleKeys(parseStoredRoles(payload.roles))
      : Array.isArray(payload.roles)
        ? payload.roles
        : [];
    return {
      id: payload.userId,
      roles,
      organizationId: payload.organizationId,
    };
  } catch {
    return { roles: [] };
  }
}
