/**
 * express-session.ts - Express Session Type Definitions
 * 
 * Location: apps/api/ → Types/ → express-session.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * TypeScript type definitions for Express session. Extends:
 * - Express session types
 * - Authenticated user in session
 * - Auth token storage
 * 
 * Related Files:
 * - apps/api/authMiddleware.ts - Auth middleware uses these types
 * - apps/api/auth.ts - Authentication utilities
 */

import 'express-session';
import type { AuthenticatedUser } from '../authMiddleware';

declare module 'express-session' {
  interface SessionData {
    user?: AuthenticatedUser;
    authToken?: string;
  }

  interface Session {
    user?: AuthenticatedUser;
    authToken?: string;
  }
}
