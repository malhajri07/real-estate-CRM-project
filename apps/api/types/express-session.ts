import "express-session"; // Extend express-session types so we can store authenticated user snapshots

declare global {
  namespace Express {
    interface SessionData {
      user?: {
        id: string;
        email?: string | null;
        username?: string | null;
        name?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        roles?: string[];
        organizationId?: string | null;
      };
      authToken?: string;
    }
  }
}

export {};
