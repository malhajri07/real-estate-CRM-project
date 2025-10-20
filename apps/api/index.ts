/**
 * apps/api/index.ts - Main Server Entry Point
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
 * The server runs on port 3000 in development and serves both the API
 * and the frontend application through a single port.
 */

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session"; // Enable per-user session storage so multiple logins can coexist
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { SESSION_SECRET as getSessionSecret, JWT_SECRET as getJwtSecret } from "./config/env";

// Create Express application instance
const app = express();

// Configure Express middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies

// Wire up cookie-based sessions so several users can stay logged in at the same time
app.use(
  session({
    secret: getSessionSecret(), // Fail fast if the session secret is missing
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // We run in HTTP during development; swap to true behind HTTPS
      maxAge: 24 * 60 * 60 * 1000, // Keep sessions for 24 hours
    },
  }),
);

// Promote session user info onto req.user when no bearer token is provided
app.use((req, _res, next) => {
  if (!req.headers.authorization && req.session?.user) {
    (req as any).user = req.session.user;
  }
  next();
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
 * - serveStatic() from ./vite.ts - Production static file serving
 * - log() from ./vite.ts - Logging functionality
 */
(async () => {
  // Force development environment for now
  process.env.NODE_ENV = 'development';
  app.set('env', 'development');
  // Mandatory production checks (disabled unless explicitly allowed)
  if (process.env.NODE_ENV === 'production') {
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
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

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
    await setupVite(app, server);
  } else {
    // In production, serve the built frontend from dist/public
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
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
