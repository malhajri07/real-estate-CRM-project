/**
 * serve-static.ts - Static File Serving
 * 
 * Location: apps/api/ → Core Application Files → serve-static.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Static file serving for production builds. Provides:
 * - Static asset serving
 * - Build output verification
 * 
 * Related Files:
 * - apps/api/index.prod.ts - Production entry point uses this
 */

import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Missing build output at ${distPath}. Run npm run build before starting in production.`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
