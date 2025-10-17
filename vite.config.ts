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

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"; // Removed - Replit-specific

// Get current directory for path resolution
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Plugin configuration
  plugins: [
    react(), // React plugin for JSX/TSX support
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
});
