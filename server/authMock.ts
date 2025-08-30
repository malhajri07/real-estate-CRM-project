import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { seedDummyData } from "./seedData";

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

    // Add dummy data on first setup - temporarily disabled to preserve real Saudi customer data
    // Create dummy data with Arabic content and English numbers
    // await seedDummyData();
  } catch (error) {
    console.log("Mock user already exists or creation failed", error);
  }
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  // For development, always allow authenticated access since we have mock user setup
  if (req.user && req.user.id) {
    return next();
  }
  
  // Fallback: Create mock user session if not exists for development
  req.user = {
    id: "mock-user-1",
    email: "user@example.com", 
    firstName: "مستخدم",
    lastName: "تجريبي"
  };
  req.isAuthenticated = () => true;
  return next();
};