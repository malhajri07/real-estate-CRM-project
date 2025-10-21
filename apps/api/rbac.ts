import { Request, Response, NextFunction } from 'express';
import {
  UserRole,
  normalizeRoleKeys,
  hasPermission as rolesHavePermission,
} from '@shared/rbac';

export { UserRole } from '@shared/rbac';

// Check if user has specific permission
export function hasPermission(userRoles: unknown, permission: string): boolean {
  const roles = normalizeRoleKeys(userRoles);
  return rolesHavePermission(roles, permission);
}

// Check if user has any of the specified roles
export function hasRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

// Check if user is website admin
export function isWebsiteAdmin(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.WEBSITE_ADMIN);
}

// Check if user is corporate owner
export function isCorpOwner(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.CORP_OWNER);
}

// Check if user is any type of agent
export function isAgent(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, [UserRole.CORP_AGENT, UserRole.INDIV_AGENT]);
}

// Check if user is corporate agent
export function isCorpAgent(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.CORP_AGENT);
}

// Check if user is individual agent
export function isIndivAgent(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.INDIV_AGENT);
}

// Check if user is seller
export function isSeller(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.SELLER);
}

// Check if user is buyer
export function isBuyer(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.BUYER);
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Middleware to require specific role
export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);
    
    if (!hasRole(userRoles, roles)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: roles,
        current: userRoles
      });
    }
    
    next();
  };
}

// Middleware to require specific permission
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);

    if (!hasPermission(userRoles, permission)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permission,
        current: userRoles
      });
    }
    
    next();
  };
}

// Middleware to require organization membership
export function requireOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.organizationId) {
    return res.status(403).json({ message: 'Organization membership required' });
  }
  
  next();
}

// Middleware to check if user can access organization data
export function canAccessOrganization(organizationId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);

    // Website admin can access any organization
    if (isWebsiteAdmin(userRoles)) {
      return next();
    }
    
    // User must be in the same organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({ message: 'Cannot access organization data' });
    }
    
    next();
  };
}

// Middleware to check if user can access resource
export function canAccessResource(resourceType: 'property' | 'listing' | 'lead' | 'claim') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);
    
    // Website admin can access any resource
    if (isWebsiteAdmin(userRoles)) {
      return next();
    }
    
    // For now, let the specific route handlers implement detailed access control
    // This is a placeholder for more complex ABAC logic
    next();
  };
}

// Utility to mask contact information
export function maskContact(contact: any, userRoles: UserRole[], hasActiveClaim: boolean = false): any {
  // Website admin sees full contact
  if (isWebsiteAdmin(userRoles)) {
    return contact;
  }
  
  // Agents with active claim see full contact
  if (isAgent(userRoles) && hasActiveClaim) {
    return contact;
  }
  
  // Otherwise, return masked contact
  return {
    phone: contact.phone ? contact.phone.replace(/(\d{2})\d{3}(\d{4})/, '$1***$2') : null,
    email: contact.email ? contact.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null
  };
}

// Utility to check if user can claim buyer request
export function canClaimBuyerRequest(userRoles: UserRole[], organizationId?: string): boolean {
  return isAgent(userRoles);
}

// Utility to check if user can release claim
export function canReleaseClaim(userRoles: UserRole[], claimAgentId: string, userId: string): boolean {
  // Website admin can release any claim
  if (isWebsiteAdmin(userRoles)) {
    return true;
  }
  
  // Agent can release their own claim
  if (isAgent(userRoles) && claimAgentId === userId) {
    return true;
  }
  
  // Corp owner can release claims by their agents
  if (isCorpOwner(userRoles)) {
    // This would need additional logic to check if claimAgentId belongs to the same organization
    return true; // Simplified for now
  }
  
  return false;
}

// Utility to check if user can view full contact details
export function canViewFullContact(userRoles: UserRole[], hasActiveClaim: boolean = false): boolean {
  return isWebsiteAdmin(userRoles) || (isAgent(userRoles) && hasActiveClaim);
}

// Rate limiting for claims (to prevent spam)
export const CLAIM_RATE_LIMITS = {
  MAX_ACTIVE_CLAIMS_PER_AGENT: 5,
  MAX_CLAIMS_PER_BUYER_PER_DAY: 3,
  CLAIM_EXPIRY_HOURS: 72,
  COOLDOWN_HOURS: 24
};

// Utility to check claim rate limits
export function checkClaimRateLimit(agentId: string, buyerRequestId: string): {
  canClaim: boolean;
  reason?: string;
  waitTime?: number;
} {
  // This would need to query the database to check current claims
  // For now, return a simplified check
  return {
    canClaim: true
  };
}
