import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Simple mock authentication for development
export async function setupMockAuth(app: Express) {
  // Mock user session middleware
  app.use((req: any, res, next) => {
    req.user = {
      id: "mock-user-1",
      email: "user@example.com", 
      firstName: "مستخدم",
      lastName: "تجريبي"
    };
    req.isAuthenticated = () => true;
    next();
  });

  // Create mock user in storage
  try {
    await storage.upsertUser({
      id: "mock-user-1",
      email: "user@example.com",
      firstName: "مستخدم",
      lastName: "تجريبي",
      profileImageUrl: null,
    });
  } catch (error) {
    console.log("Mock user already exists or creation failed");
  }
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};