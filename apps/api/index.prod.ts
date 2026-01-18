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
import path from "path";
import { createServer as createNetServer } from "node:net";
import { registerRoutes } from "./routes";
import { log } from "./logger";
import {
  SESSION_SECRET as getSessionSecret,
  JWT_SECRET as getJwtSecret,
  DATABASE_URL as getDatabaseUrl,
} from "./config/env";

// Create Express application instance
const app = express();

// Configure Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register API routes
registerRoutes(app);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log(`[ERROR] ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Server startup
(async () => {
  const server = createNetServer();
  
  // Production static file serving
  const { serveStatic } = await import("./serve-static");
  serveStatic(app);
  
  // Find available port
  const findAvailablePort = async (preferredPort: number): Promise<number> => {
    const testPort = (port: number) => new Promise<number | null>((resolve, reject) => {
      const tester = createNetServer()
        .once("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EADDRINUSE" || err.code === "EACCES") {
            resolve(null);
          } else {
            reject(err);
          }
        })
        .once("listening", () => {
          tester.close(() => resolve(port));
        });

      tester.listen({
        port,
        host: "0.0.0.0",
      });
    });

    for (let port = preferredPort; port < preferredPort + 20; port += 1) {
      const availablePort = await testPort(port);
      if (availablePort) {
        return availablePort;
      }
    }

    return new Promise((resolve, reject) => {
      const tester = createNetServer();
      tester
        .once("error", reject)
        .once("listening", () => {
          const address = tester.address();
          tester.close(() => {
            if (!address || typeof address === "string") {
              reject(new Error("Unable to determine available port"));
              return;
            }
            resolve(address.port);
          });
        })
        .listen({ port: 0, host: "0.0.0.0" });
    });
  };

  const preferredPort = BACKEND_PORT();
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    log(`[startup] Port ${preferredPort} in use, switching to ${port}`);
  }
  process.env.PORT = String(port);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
