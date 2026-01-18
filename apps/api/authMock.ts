/**
 * authMock.ts - Mock Authentication Setup
 * 
 * Location: apps/api/ → Testing & Utilities → authMock.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Mock authentication setup for development. Provides:
 * - Mock user session middleware
 * - Development authentication bypass
 * - Test authentication utilities
 * 
 * Related Files:
 * - apps/api/auth.ts - Real authentication utilities
 * - apps/api/authMiddleware.ts - Auth middleware
 */

import type { Express, RequestHandler } from "express";
import { storage } from "./storage-prisma";
import { seedDummyData } from "./seedData";

// Simple mock authentication for development
export async function setupMockAuth(app: Express) {
  // Mock user session middleware - always authenticate for development
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

    // Add dummy data on first setup
    // Create dummy data with Arabic content and English numbers
    await seedDummyData();
  } catch (error) {
    console.log("Mock user already exists or creation failed", error);
  }
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  // Always allow access in development mode
  return next();
};