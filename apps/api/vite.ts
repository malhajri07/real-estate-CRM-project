// @ts-nocheck
import type { Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import rawViteConfig from "../../vite.config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const viteConfig =
    typeof rawViteConfig === "function"
      ? await rawViteConfig({
          command: "serve",
          mode: process.env.NODE_ENV ?? "development",
        })
      : rawViteConfig;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes - let them be handled by the API middleware
    if (url.startsWith("/api/")) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "web",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // Add a script to set the server port for client-side detection
      // This will override any existing SERVER_PORT from Vite plugins
      const portScript = `
        <script>
          window.SERVER_PORT = '${process.env.PORT || "3000"}';
        </script>
      `;
      template = template.replace("</head>", `${portScript}</head>`);

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
