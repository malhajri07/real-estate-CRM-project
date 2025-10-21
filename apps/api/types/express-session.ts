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
