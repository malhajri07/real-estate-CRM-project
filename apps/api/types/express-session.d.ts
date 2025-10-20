import "express-session"; // Extend express-session types so we can store authenticated user snapshots
import type { UserRole } from "@shared/rbac";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email?: string | null;
      username?: string | null;
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      roles?: UserRole[];
      organizationId?: string | null;
    };
    authToken?: string;
  }
}
