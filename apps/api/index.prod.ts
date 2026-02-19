/**
 * index.prod.ts - Production Server Entry Point
 * 
 * Location: apps/api/ → Core Application Files → index.prod.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * This is the production entry point for the Express.js backend server.
 * It excludes development-specific imports like vite to avoid dependency issues.
 * 
 * Related Files:
 * - apps/api/index.ts - Development server entry point
 * - apps/api/routes.ts - Main route registration
 */

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { BACKEND_PORT } from "./config/env";
import "./types/express-session";
import { registerRoutes } from "./routes";
import { log } from "./logger";
import {
  SESSION_SECRET as getSessionSecret,
  JWT_SECRET as getJwtSecret,
  DATABASE_URL as getDatabaseUrl,
} from "./config/env";

// Create Express application instance
const app = express();

// Configure Express middleware - 12MB limit for unverified listings with base64 images
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: false, limit: "12mb" }));

// Wire up cookie-based sessions
const PgSessionStore = connectPgSimple(session);

const sessionSchema = process.env.SESSION_SCHEMA?.trim();
const sessionTable = process.env.SESSION_TABLE?.trim();

const sessionStore = new PgSessionStore({
  conString: getDatabaseUrl(),
  createTableIfMissing: true,
  ...(sessionSchema ? { schemaName: sessionSchema } : {}),
  ...(sessionTable ? { tableName: sessionTable } : {}),
});

app.use(
  session({
    store: sessionStore,
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    
    log(`[${method}] ${url} ${statusCode} ${duration}ms`);
  });
  
  next();
});

// CORS - use CORS_ORIGINS (same as index.ts)
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

(async () => {
  // Register API routes and get HTTP server
  const httpServer = await registerRoutes(app);

  // Production static file serving (SPA + assets)
  const { serveStatic } = await import("./serve-static");
  serveStatic(app);

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    log(`[ERROR] ${err.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  const preferredPort = BACKEND_PORT();
  httpServer.listen(preferredPort, "0.0.0.0", () => {
    log(`serving on port ${preferredPort}`);
  });
})();
