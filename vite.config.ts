/**
 * vite.config.ts - Vite Build Configuration
 * 
 * This file configures the Vite build tool for the frontend React application.
 * It provides:
 * - React plugin integration for JSX/TSX support
 * - Path aliases for clean imports (@/, @shared/, @assets/)
 * - Development server configuration with API proxy
 * - Build output configuration for production
 * - Development plugins for enhanced debugging
 * 
 * Key Features:
 * - API Proxy: Forwards /api requests to backend server (port 3000)
 * - Path Aliases: Clean import paths for better code organization
 * - Hot Module Replacement (HMR): Fast development with instant updates
 * - TypeScript Support: Full TypeScript compilation and type checking
 * - Asset Handling: Proper handling of images, fonts, and other assets
 * 
 * Dependencies:
 * - Vite core build tool
 * - React plugin for JSX/TSX support
 * - Path utilities for file system operations
 * - Replit plugins for development environment
 * 
 * Routes affected: All frontend routes (development server)
 * Pages affected: All frontend pages
 */

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"; // Removed - Replit-specific

// Get current directory for path resolution
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const normalizePath = (filepath: string) => filepath.split(path.sep).join("/");

const adminManualChunkGroups: Array<{ name: string; patterns: string[] }> = [
  {
    name: "admin-dashboard-core",
    patterns: [
      "/apps/web/src/pages/dashboard",
    ],
  },
  {
    name: "admin-reports",
    patterns: [
      "/apps/web/src/pages/reports",
    ],
  },
  {
    name: "admin-sales",
    patterns: [
      "/apps/web/src/pages/leads",
      "/apps/web/src/pages/customers",
      "/apps/web/src/pages/clients",
      "/apps/web/src/pages/pipeline",
    ],
  },
  {
    name: "admin-properties",
    patterns: [
      "/apps/web/src/pages/properties",
      "/apps/web/src/pages/property-detail",
      "/apps/web/src/pages/listing",
      "/apps/web/src/pages/agencies",
      "/apps/web/src/pages/agency",
      "/apps/web/src/pages/agent",
      "/apps/web/src/pages/compare",
    ],
  },
  {
    name: "admin-operations",
    patterns: [
      "/apps/web/src/pages/cms-admin",
      "/apps/web/src/pages/moderation",
      "/apps/web/src/pages/marketing-requests",
      "/apps/web/src/pages/admin-requests",
      "/apps/web/src/pages/customer-requests",
      "/apps/web/src/pages/real-estate-requests",
      "/apps/web/src/pages/post-listing",
    ],
  },
  {
    name: "admin-rbac-dashboard",
    patterns: [
      "/apps/web/src/pages/rbac-dashboard",
    ],
  },
  {
    name: "admin-rbac-login",
    patterns: [
      "/apps/web/src/pages/rbac-login",
    ],
  },
  {
    name: "platform-shell",
    patterns: [
      "/apps/web/src/pages/app",
      "/apps/web/src/pages/unverfied_Listing",
    ],
  },
  {
    name: "admin-engagement",
    patterns: [
      "/apps/web/src/pages/favorites",
      "/apps/web/src/pages/saved-searches",
      "/apps/web/src/pages/notifications",
      "/apps/web/src/pages/settings",
    ],
  },
];

const publicLandingChunkIdentifiers = [
  "/apps/web/src/pages/landing",
  "/apps/web/src/pages/signup-selection",
  "/apps/web/src/pages/signup-individual",
  "/apps/web/src/pages/signup-corporate",
  "/apps/web/src/pages/signup-success",
  "/apps/web/src/pages/kyc-submitted",
  "/apps/web/src/pages/marketing-request",
  "/apps/web/src/pages/search-properties",
];

const resolveManualChunk = (id: string): string | undefined => {
  const normalizedId = normalizePath(id);
  for (const { name, patterns } of adminManualChunkGroups) {
    if (patterns.some((pattern) => normalizedId.includes(pattern))) {
      return name;
    }
  }
  if (publicLandingChunkIdentifiers.some((identifier) => normalizedId.includes(identifier))) {
    return "public-landing";
  }
  return undefined;
};

const loadBundleVisualizerPlugins = async (): Promise<Plugin[]> => {
  if (process.env.ANALYZE_BUNDLE !== "true") {
    return [];
  }

  return import("vite-bundle-visualizer")
    .then(({ visualizer }) => [
      visualizer({
        filename: "dist/bundle-visualizer.html",
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    ])
    .catch((error) => {
      console.warn("[vite] Failed to load vite-bundle-visualizer. Run `npm install vite-bundle-visualizer` to enable bundle analysis.", error);
      return [];
    });
};

export default defineConfig(async () => {
  const visualizerPlugins = await loadBundleVisualizerPlugins();

  return {
  // Plugin configuration
  plugins: [
    react(), // React plugin for JSX/TSX support
    ...visualizerPlugins,
    // runtimeErrorOverlay(), // Temporarily disabled for debugging
    // Conditional plugins for development environment
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          // await import("@replit/vite-plugin-cartographer").then((m) =>
          //   m.cartographer(), // Removed - Replit-specific
          // ),
        ]
      : []),
    // Custom plugin to inject SERVER_PORT for port detection
    // Only inject when running as standalone Vite dev server (not through Express middleware)
    {
      name: 'inject-server-port',
      transformIndexHtml(html) {
        // Only inject if not already present (to avoid conflicts with Express server)
        if (!html.includes('window.SERVER_PORT')) {
          return html.replace(
            '</head>',
            `<script>window.SERVER_PORT = '5173';</script></head>`
          );
        }
        return html;
      }
    }
  ],
  
  // Path resolution aliases for clean imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps", "web", "src"),        // Frontend source files
      "@shared": path.resolve(__dirname, "packages", "shared"),   // Shared utilities and types
      "@assets": path.resolve(__dirname, "data", "raw-assets"),  // Static assets (images, fonts)
    },
  },
  
  // Root directory for the frontend application
  root: path.resolve(__dirname, "apps", "web"),
  
  // Build configuration for production
  build: {
    outDir: path.resolve(__dirname, "dist/public"), // Output directory for built files
    emptyOutDir: true, // Clear output directory before building
    rollupOptions: {
      output: {
        manualChunks(id) {
          return resolveManualChunk(id);
        },
      },
    },
  },
  
  // Development server configuration
  server: {
    port: 5173,
    strictPort: true,
    // File system security settings
    fs: {
      strict: true,        // Strict file system access
      deny: ["**/.*"],     // Deny access to hidden files
    },
    
    /**
     * API Proxy Configuration
     * 
     * Forwards all /api requests from the frontend dev server (port 3000) to the backend server (port 3000).
     * This allows the frontend to make API calls using relative paths (/api/*) which are
     * automatically proxied to the backend server.
     * 
     * Target: http://127.0.0.1:3000 (backend server)
     * Routes affected: All /api/* requests
     * Pages affected: All pages making API calls
     */
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',  // Backend server URL
        changeOrigin: true,                // Change origin header
        secure: false,                     // Allow HTTP (for development)
      },
    },
  },
  };
});
