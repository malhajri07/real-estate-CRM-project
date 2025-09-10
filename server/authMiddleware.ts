import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Extended user interface for authentication context
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
}

// Extended request interface
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  tenantId?: string;
}

// User levels enum for better readability
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
