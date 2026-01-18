/**
 * apps/api/index.ts - Main Server Entry Point
 * 
 * Location: apps/api/ → Core Application Files → index.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * This is the main entry point for the Express.js backend server. It handles:
 * - Environment variable configuration
 * - Express application setup and middleware configuration
 * - Request logging and monitoring
 * - Route registration and error handling
 * - Development vs production environment handling
 * - Vite integration for development hot reloading
 * - Static file serving for production builds
 * 
 * The server runs on port 3001 in development and serves both the API
 * and the frontend application through a single port.
 * 
 * Related Files:
 * - apps/api/index.prod.ts - Production entry point
 * - apps/api/routes.ts - Main route registration
 * - apps/api/routes/ - Individual route handlers
 */

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session"; // Enable per-user session storage so multiple logins can coexist
import connectPgSimple from "connect-pg-simple";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Consider removing if possible
        "https://maps.googleapis.com", // Google Maps
        "https://*.googleapis.com", // Google Maps subdomains
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://maps.googleapis.com", // Google Maps API
        "https://*.googleapis.com", // Google Maps subdomains (for RPC calls)
        "https://*.gstatic.com", // Google static resources
        "https://maps.gstatic.com", // Google Maps static resources
        "https://*.google.com", // Additional Google domains
        "https://*.googleapis.com", // Explicit wildcard for all Google APIs
      ],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Google Maps
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration - environment-based
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};

app.use(cors(corsOptions));

// Wire up cookie-based sessions so several users can stay logged in at the same time
const PgSessionStore = connectPgSimple(session);

const sessionSchema = process.env.SESSION_SCHEMA?.trim();
const sessionTable = process.env.SESSION_TABLE?.trim();

const sessionStore = new PgSessionStore({
  conString: getDatabaseUrl(),
  createTableIfMissing: true,
  ...(sessionSchema ? { schemaName: sessionSchema } : {}),
  ...(sessionTable ? { tableName: sessionTable } : {}),
});

// Trust proxy when behind reverse proxy (Cloud Run, nginx, etc.)
app.set('trust proxy', 1);

app.use(
  session({
    secret: getSessionSecret(), // Fail fast if the session secret is missing
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true',
      httpOnly: true, // Explicitly prevent XSS access
      maxAge: 5 * 60 * 1000, // 5 minutes (was 24 hours)
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  }),
);

// Promote session user info onto req.user when no bearer token is provided
app.use((req, _res, next) => {
  if (!req.headers.authorization && req.session?.user) {
    req.user = req.session.user;
  }
  next();
});

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Serve attached assets (raw datasets/images) as static files
const rawAssetsDir = path.resolve(process.cwd(), 'data/raw-assets');
app.use('/attached_assets', express.static(rawAssetsDir));

/**
 * Request Logging Middleware
 * 
 * This middleware captures and logs all API requests with:
 * - Request method, path, and response status
 * - Response time in milliseconds
 * - JSON response body (truncated if too long)
 * 
 * Dependencies: Uses the log() function from ./vite.ts
 * Routes affected: All /api/* routes
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Override res.json to capture response body for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log request details when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines for readability
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function findAvailablePort(preferredPort: number): Promise<number> {
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
    if (availablePort !== null) {
      return availablePort;
    }
  }

  return await new Promise<number>((resolve, reject) => {
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
}

/**
 * Server Initialization and Startup
 *
 * This async function handles:
 * - Route registration (all API endpoints)
 * - Error handling middleware
 * - Development vs production environment setup
 * - Server startup and port configuration
 *
 * Dependencies:
 * - registerRoutes() from ./routes.ts - Registers all API routes
 * - setupVite() from ./vite.ts - Development hot reloading
 * - serveStatic() from ./serve-static.ts - Production static file serving
 * - log() from ./logger.ts - Logging functionality
 */
(async () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  app.set('env', nodeEnv);
  // Mandatory production checks (disabled unless explicitly allowed)
  if (nodeEnv === 'production') {
    if (process.env.ALLOW_PRODUCTION !== 'true') {
      console.error('[startup] Production mode is disabled for this environment. Set ALLOW_PRODUCTION=true to enable.');
      process.exit(1);
    }
    const jwtSecret = getJwtSecret();
    if (!jwtSecret.length) {
      console.error('[startup] Missing or insecure JWT_SECRET in production. Please set a strong JWT_SECRET env var.');
      process.exit(1);
    }
  }

  // Register all API routes and return the HTTP server instance
  const server = await registerRoutes(app);

  /**
   * Global Error Handling Middleware
   * 
   * This middleware catches any unhandled errors in the application
   * and returns a standardized error response.
   * 
   * Routes affected: All routes (catch-all error handler)
   */
  const { errorHandler } = await import('./middleware/errorHandler');
  app.use(errorHandler);

  /**
   * Environment-specific Setup
   * 
   * Development: Uses Vite for hot reloading and development server
   * Production: Serves static files from the built frontend
   * 
   * Dependencies:
   * - setupVite() - Development server with HMR
   * - serveStatic() - Production static file serving
   */
  if (app.get("env") === "development") {
    // In development, serve the app and API from a single Express port (3000)
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // In production, serve the built frontend from dist/public
    const { serveStatic } = await import("./serve-static");
    serveStatic(app);
  }

  /**
   * Server Startup
   * 
   * Starts the HTTP server on the specified port.
   * Default port: 5000 (fallback if PORT env var not set)
   * Host: 0.0.0.0 (accessible from all network interfaces)
   * 
   * This serves both the API and the frontend application.
   */
  const preferredPort = BACKEND_PORT();
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    log(`[startup] Port ${preferredPort} in use, switching to ${port}`);
  }
  process.env.PORT = String(port);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  /**
   * Graceful shutdown handler
   * Handles SIGTERM and SIGINT signals to close connections properly
   */
  const gracefulShutdown = async (signal: string) => {
    log(`[shutdown] Received ${signal}, closing server gracefully`);

    server.close(() => {
      log('[shutdown] HTTP server closed');
    });

    // Close database connection
    try {
      const { prisma } = await import('./prismaClient');
      await prisma.$disconnect();
      log('[shutdown] Database connection closed');
    } catch (error) {
      log(`[shutdown] Error closing database connection: ${error}`);
    }

    // Close Redis connection if used
    if (process.env.REDIS_URL) {
      try {
        const Redis = (await import('ioredis')).default;
        const redis = new Redis(process.env.REDIS_URL);
        await redis.quit();
        log('[shutdown] Redis connection closed');
      } catch (error) {
        log(`[shutdown] Error closing Redis connection: ${error}`);
      }
    }

    process.exit(0);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    log(`[fatal] Uncaught exception: ${error.message}`);
    log(`[fatal] Stack: ${error.stack}`);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    log(`[fatal] Unhandled rejection at: ${promise}, reason: ${reason}`);
    gracefulShutdown('unhandledRejection');
  });
})();
