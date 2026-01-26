/**
 * authMiddleware.ts - Authentication Middleware Types
 * 
 * Location: apps/api/ → Authentication & Authorization → authMiddleware.ts
 * 
 * This file defines types related to authentication middleware.
 */

import { UserRole } from "@shared/rbac";

/**
 * AuthenticatedUser - Represents the user object attached to the request after successful authentication.
 */
export interface AuthenticatedUser {
    id: string;
    email: string | null;
    username: string | null;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    userLevel: number;
    tenantId: string;
    accountOwnerId: string | null;
    companyName: string | null;
    roles: UserRole[];
    organizationId: string | null;
}
