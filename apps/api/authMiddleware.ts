/**
 * authMiddleware.ts - Authentication and Authorization Middleware
 * 
 * This file provides comprehensive authentication and authorization middleware for the Express.js server.
 * It includes:
 * - User authentication verification
 * - Role-based access control (RBAC)
 * - Permission checking
 * - Tenant isolation for multi-tenant architecture
 * - User level management (Platform Admin, Account Owner, Sub-Account)
 * 
 * The middleware integrates with the storage layer to fetch user data and permissions,
 * and provides type-safe interfaces for authenticated requests throughout the application.
 * 
 * Dependencies:
 * - Express.js Request, Response, NextFunction types
 * - storage from ./storage.ts for user data access
 * 
 * Routes affected: All protected API routes
 * Pages affected: All pages requiring authentication
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-prisma';
import { normalizeRoleKeys, UserRole } from '@shared/rbac';

/**
 * AuthenticatedUser Interface - User data structure for authenticated requests
 * 
 * Defines the structure of user data available in authenticated requests:
 * - id: Unique user identifier
 * - email: User's email address
 * - firstName/lastName: User's name
 * - userLevel: Access level (1: Platform Admin, 2: Account Owner, 3: Sub-Account)
 * - accountOwnerId: ID of the account owner (for sub-accounts)
 * - companyName: Company/organization name
 * - tenantId: Multi-tenant isolation identifier
 * - permissions: User's specific permissions
 * 
 * Used in: All authenticated API routes
 * Pages affected: All authenticated pages
 */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  userLevel: number; // 1: Platform Admin, 2: Account Owner, 3: Sub-Account
  accountOwnerId?: string | null;
  companyName?: string | null;
  tenantId: string;
  permissions?: any;
  roles: UserRole[];
  organizationId?: string;
}

/**
 * AuthenticatedRequest Interface - Extended Express Request with user data
 * 
 * Extends the standard Express Request interface to include:
 * - user: AuthenticatedUser object with user data
 * - tenantId: Tenant identifier for multi-tenant isolation
 * 
 * Used in: All authenticated route handlers
 * Pages affected: All authenticated pages
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  tenantId?: string;
}

const parseUserRoles = (raw: unknown): UserRole[] => normalizeRoleKeys(raw);

/**
 * UserLevel Enum - User access levels
 * 
 * Defines the three levels of user access in the system:
 * - PLATFORM_ADMIN (1): Full system access, can manage all accounts
 * - ACCOUNT_OWNER (2): Account-level access, can manage their organization
 * - SUB_ACCOUNT (3): Limited access within an account
 * 
 * Used in: Authorization checks, access control
 * Pages affected: All pages with role-based access
 */
export enum UserLevel {
  PLATFORM_ADMIN = 1,
  ACCOUNT_OWNER = 2,
  SUB_ACCOUNT = 3
}

/**
 * Basic authentication middleware - checks if user exists
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, we'll use a simple mock authentication
    // In a real app, this would validate JWT tokens or session data
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userLevel: (user as any).userLevel ?? 1,
      accountOwnerId: (user as any).accountOwnerId ?? (user as any).parentCompanyId ?? null,
      companyName: user.companyName,
      tenantId: user.tenantId || user.id, // Use user ID as tenant ID if not set
      organizationId: user.organizationId ?? undefined,
      roles: parseUserRoles((user as any).roles),
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (requiredLevels: UserLevel[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!requiredLevels.includes(user.userLevel as UserLevel)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Tenant isolation middleware - ensures users can only access their own data
 */
export const requireTenantAccess = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Platform admins can access all tenant data
  if (user.userLevel === UserLevel.PLATFORM_ADMIN) {
    // Don't add tenant filter for platform admins
    return next();
  }

  // Account owners and sub-accounts can only access their own tenant data
  // For account owners, tenantId is their own ID
  // For sub-accounts, tenantId should be their account owner's ID
  let tenantId = user.tenantId;
  
  if (user.userLevel === UserLevel.SUB_ACCOUNT && user.accountOwnerId) {
    // Sub-accounts should use their account owner's tenantId
    const accountOwner = await storage.getUser(user.accountOwnerId);
    if (accountOwner?.tenantId) {
      tenantId = accountOwner.tenantId;
    }
  }

  // Add tenant filter to request context
  (req as AuthenticatedRequest).tenantId = tenantId;
  
  next();
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Platform admins have all permissions
    if (user.userLevel === UserLevel.PLATFORM_ADMIN) {
      return next();
    }

    // Check user-specific permissions
    const userPermissions = await storage.getUserPermissions(user.id);
    if (!userPermissions) {
      return res.status(403).json({ error: 'No permissions found' });
    }

    // Map permission strings to database fields
    const permissionMap: Record<string, keyof typeof userPermissions> = {
      'manage_company_settings': 'canManageCompanySettings',
      'manage_billing': 'canManageBilling',
      'manage_users': 'canManageUsers',
      'manage_roles': 'canManageRoles',
      'view_leads': 'canViewLeads',
      'create_edit_delete_leads': 'canCreateEditDeleteLeads',
      'export_data': 'canExportData',
      'manage_campaigns': 'canManageCampaigns',
      'manage_integrations': 'canManageIntegrations',
      'manage_api_keys': 'canManageApiKeys',
      'view_reports': 'canViewReports',
      'view_audit_logs': 'canViewAuditLogs',
      'create_support_tickets': 'canCreateSupportTickets',
      'impersonate_users': 'canImpersonateUsers',
      'wipe_company_data': 'canWipeCompanyData'
    };

    const permissionField = permissionMap[permission];
    if (!permissionField || !userPermissions[permissionField]) {
      return res.status(403).json({ error: `Permission denied: ${permission}` });
    }

    next();
  };
};

/**
 * Create default permissions for new users based on their level
 */
export const createDefaultUserPermissions = async (userId: string, userLevel: UserLevel) => {
  const defaultPermissions = {
    userId,
    // Company Settings & Branding
    canManageCompanySettings: userLevel === UserLevel.ACCOUNT_OWNER,
    canManageBilling: userLevel === UserLevel.ACCOUNT_OWNER,
    canManageUsers: userLevel === UserLevel.ACCOUNT_OWNER,
    // Role & Permission Management
    canManageRoles: userLevel === UserLevel.ACCOUNT_OWNER,
    // Data Access
    canViewLeads: true,
    canCreateEditDeleteLeads: true,
    canExportData: userLevel <= UserLevel.ACCOUNT_OWNER,
    // Campaigns
    canManageCampaigns: true,
    // Integrations
    canManageIntegrations: userLevel === UserLevel.ACCOUNT_OWNER,
    // API Keys
    canManageApiKeys: userLevel === UserLevel.ACCOUNT_OWNER,
    // Reports & Dashboards
    canViewReports: true,
    canViewAuditLogs: userLevel <= UserLevel.ACCOUNT_OWNER,
    // Support
    canCreateSupportTickets: true,
    // Platform Admin only permissions
    canImpersonateUsers: userLevel === UserLevel.PLATFORM_ADMIN,
    canWipeCompanyData: userLevel === UserLevel.PLATFORM_ADMIN,
  };

  return await storage.createUserPermissions(defaultPermissions);
};

// Export storage references for role routes
export { storage };
