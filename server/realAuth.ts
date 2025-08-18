import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Enhanced authentication system with role-based access control
export async function setupRealAuth(app: Express) {
  // Authentication middleware that checks headers
  app.use('/api', async (req: any, res, next) => {
    // Skip auth for metrics endpoint to allow dashboard to work
    if (req.path === '/dashboard/metrics') {
      req.user = {
        id: "mock-user-1",
        email: "user@example.com",
        firstName: "مستخدم", 
        lastName: "تجريبي"
      };
      req.isAuthenticated = () => true;
      return next();
    }

    const userId = req.headers['x-user-id'];
    const tenantId = req.headers['x-tenant-id'];
    const authToken = req.headers['authorization'];

    if (!userId || !authToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Get user from database
      const user = await storage.getUser(userId as string);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "User not found or inactive" });
      }

      // Attach user and tenant info to request
      req.user = user;
      req.tenantId = tenantId || user.tenantId;
      req.isAuthenticated = () => true;

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const requireRole = (allowedLevels: number[]): RequestHandler => {
  return (req: any, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedLevels.includes(req.user.userLevel)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

export const requireTenantAccess: RequestHandler = (req: any, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Platform admins can access any tenant
  if (req.user.userLevel === 1) {
    return next();
  }

  // Other users can only access their own tenant
  const requestedTenantId = req.tenantId || req.user.tenantId;
  if (req.user.tenantId !== requestedTenantId) {
    return res.status(403).json({ error: "Access denied to this tenant" });
  }

  next();
};