/**
 * vite.config.ts - Vite Build Configuration
 * 
 * Location: Root/ → vite.config.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Vite build configuration for the frontend React application. Provides:
 * - React plugin integration for JSX/TSX support
 * - Path aliases for clean imports (@/, @shared/, @assets/)
 * - Development server configuration with API proxy
 * - Build output configuration for production
 * - Development plugins for enhanced debugging
 * 
 * Related Files:
 * - apps/api/vite.ts - Vite integration for backend
 * - apps/web/src/main.tsx - Application entry point
 */

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import { FRONTEND_PORT, API_PROXY_TARGET } from "./apps/api/config/env";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"; // Removed - Replit-specific

// Get current directory for path resolution
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const normalizePath = (filepath: string) => filepath.split(path.sep).join("/");

const adminManualChunkGroups: Array<{ name: string; patterns: string[] }> = [
  {
    name: "admin-dashboard-core",
    patterns: [
      "/apps/web/src/pages/admin/dashboard",
    ],
  },
  {
    name: "admin-reports",
    patterns: [
      "/apps/web/src/pages/platform/reports",
    ],
  },
  {
    name: "platform-sales",
    patterns: [
      "/apps/web/src/pages/platform/leads",
      "/apps/web/src/pages/platform/customers",
      "/apps/web/src/pages/platform/clients",
      "/apps/web/src/pages/platform/pipeline",
    ],
  },
  {
    name: "platform-properties",
    patterns: [
      "/apps/web/src/pages/platform/properties",
      "/apps/web/src/pages/listing",
      "/apps/web/src/pages/platform/agencies",
      "/apps/web/src/pages/platform/compare",
    ],
  },
  {
    name: "admin-operations",
    patterns: [
      "/apps/web/src/pages/admin/cms-landing",
      "/apps/web/src/pages/admin/cms",
      "/apps/web/src/pages/admin/moderation",
      "/apps/web/src/pages/marketing",
      "/apps/web/src/pages/admin/requests",
      "/apps/web/src/pages/platform/requests",
      "/apps/web/src/pages/requests",
      "/apps/web/src/pages/platform/properties/post",
    ],
  },
  {
    name: "admin-rbac-login",
    patterns: [
      "/apps/web/src/pages/auth/login",
    ],
  },
  {
    name: "platform-shell",
    patterns: [
      "/apps/web/src/pages/platform/home",
      "/apps/web/src/pages/unverified-listing",
      "/apps/web/src/pages/admin/unverified-listings-management",
    ],
  },
  {
    name: "admin-engagement",
    patterns: [
      "/apps/web/src/pages/platform/favorites",
      "/apps/web/src/pages/platform/saved-searches",
      "/apps/web/src/pages/platform/notifications",
      "/apps/web/src/pages/platform/settings",
    ],
  },
];

const publicLandingChunkIdentifiers = [
  "/apps/web/src/pages/landing",
  "/apps/web/src/pages/signup/selection",
  "/apps/web/src/pages/signup/individual",
  "/apps/web/src/pages/signup/corporate",
  "/apps/web/src/pages/signup/success",
  "/apps/web/src/pages/signup/kyc-submitted",
  "/apps/web/src/pages/marketing/submission",
  "/apps/web/src/pages/map",
];

const vendorChunkMatchers: Array<{ name: string; test: (id: string) => boolean }> = [
  { name: "vendor-react-query", test: (id) => id.includes("/node_modules/@tanstack/react-query") },
  { name: "vendor-recharts", test: (id) => id.includes("/node_modules/recharts") },
  { name: "vendor-tremor", test: (id) => id.includes("/node_modules/@tremor") },
  { name: "vendor-dnd", test: (id) => id.includes("/node_modules/@hello-pangea/dnd") },
  { name: "vendor-framer-motion", test: (id) => id.includes("/node_modules/framer-motion") },
];

const resolveManualChunk = (id: string): string | undefined => {
  const normalizedId = normalizePath(id);

  if (normalizedId.includes("/node_modules/")) {
    const vendorMatch = vendorChunkMatchers.find(({ test }) => test(normalizedId));
    if (vendorMatch) {
      return vendorMatch.name;
    }
  }

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
  // Cache directory - use writable location in sandbox environments
  cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
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
      transformIndexHtml(html: string) {
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
        manualChunks(id: string) {
          return resolveManualChunk(id);
        },
      },
    },
  },
  
  // Development server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    strictPort: true,
    // File system security settings
    fs: {
      strict: true,        // Strict file system access
      deny: ["**/.*"],     // Deny access to hidden files
    },
    
    /**
     * API Proxy Configuration
     * 
     * Forwards all /api requests from the frontend dev server to the backend server.
     * This allows the frontend to make API calls using relative paths (/api/*) which are
     * automatically proxied to the backend server.
     * 
     * Target: Dynamic backend server URL from API_PROXY_TARGET()
     * Routes affected: All /api/* requests
     * Pages affected: All pages making API calls
     */
    proxy: {
      '/api': {
        target: API_PROXY_TARGET(),  // Backend server URL (dynamic from env config)
        changeOrigin: true,                // Change origin header
        secure: false,                     // Allow HTTP (for development)
      },
    },
  },
  };
});
