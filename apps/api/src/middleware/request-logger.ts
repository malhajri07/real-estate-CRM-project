/**
 * request-logger.ts — Structured JSON Request Logger Middleware
 *
 * Location: apps/api/src/middleware/request-logger.ts
 *
 * Logs every HTTP request with:
 * - Method, path, status code, duration
 * - Authenticated user ID (when available)
 * - Slow-request warnings (>1 s)
 * - Error stack traces
 *
 * Output is structured JSON, suitable for consumption by ELK / Datadog / CloudWatch.
 *
 * Usage:
 *   import { requestLogger } from './middleware/request-logger';
 *   app.use(requestLogger());
 */

import { Request, Response, NextFunction } from 'express';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RequestLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  type: 'request';
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId: string | null;
  userAgent: string | null;
  ip: string | null;
  contentLength: number | null;
  responseSize: number | null;
  query: Record<string, unknown> | null;
  error: RequestLogError | null;
}

export interface RequestLogError {
  message: string;
  stack: string | null;
  name: string;
}

export interface RequestLoggerOptions {
  /** Duration threshold in ms above which a request is logged as "warn" (default 1000) */
  slowThresholdMs?: number;
  /** Paths to exclude from logging (e.g. health checks). Exact match. */
  excludePaths?: string[];
  /** Whether to include query params in the log (default true) */
  logQuery?: boolean;
  /** Whether to log request headers (default false) */
  logHeaders?: boolean;
  /** Custom log function — defaults to console.log (JSON stringified) */
  logFn?: (entry: RequestLogEntry) => void;
  /** Whether to enable colored console output for development (default false) */
  colorize?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  '2': '\x1b[32m', // green
  '3': '\x1b[36m', // cyan
  '4': '\x1b[33m', // yellow
  '5': '\x1b[31m', // red
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function colorForStatus(code: number): string {
  return STATUS_COLORS[String(code).charAt(0)] || '';
}

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0];
  return req.socket?.remoteAddress || null;
}

function getUserId(req: Request): string | null {
  // Support common auth patterns
  const user = (req as any).user;
  if (user?.id) return user.id;
  const auth = (req as any).auth;
  if (auth?.id) return auth.id;
  return null;
}

function getResponseSize(res: Response): number | null {
  const header = res.getHeader('content-length');
  if (header) return Number(header);
  return null;
}

function sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> | null {
  const keys = Object.keys(query);
  if (keys.length === 0) return null;

  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = new Set(['password', 'token', 'secret', 'authorization', 'apikey', 'api_key']);

  for (const key of keys) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = query[key];
    }
  }
  return sanitized;
}

// ─── Default Logger ───────────────────────────────────────────────────────────

function defaultLogFn(entry: RequestLogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function colorizedLogFn(entry: RequestLogEntry): void {
  const statusColor = colorForStatus(entry.statusCode);
  const durationStr = formatDuration(entry.durationMs);
  const durationColor = entry.durationMs > 1000 ? '\x1b[31m' : entry.durationMs > 300 ? '\x1b[33m' : '\x1b[32m';

  const parts = [
    `${DIM}${entry.timestamp}${RESET}`,
    `${BOLD}${entry.method.padEnd(7)}${RESET}`,
    entry.path,
    `${statusColor}${entry.statusCode}${RESET}`,
    `${durationColor}${durationStr}${RESET}`,
  ];

  if (entry.userId) {
    parts.push(`${DIM}user=${entry.userId.substring(0, 8)}...${RESET}`);
  }

  if (entry.level === 'warn') {
    parts.push('\x1b[33m[SLOW]\x1b[0m');
  }

  if (entry.error) {
    parts.push(`\x1b[31m[ERROR: ${entry.error.message}]\x1b[0m`);
  }

  console.log(parts.join(' '));

  if (entry.error?.stack) {
    console.error(`${DIM}${entry.error.stack}${RESET}`);
  }
}

// ─── Middleware Factory ───────────────────────────────────────────────────────

export function requestLogger(options: RequestLoggerOptions = {}) {
  const {
    slowThresholdMs = 1000,
    excludePaths = ['/health', '/healthz', '/ready', '/favicon.ico'],
    logQuery = true,
    logHeaders = false,
    colorize = process.env.NODE_ENV === 'development',
    logFn = colorize ? colorizedLogFn : defaultLogFn,
  } = options;

  const excludeSet = new Set(excludePaths);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip excluded paths
    if (excludeSet.has(req.path)) {
      next();
      return;
    }

    const startTime = process.hrtime.bigint();
    const startDate = new Date();

    // Capture error if thrown in downstream middleware
    let caughtError: Error | null = null;

    // Override res.end to capture timing at the actual response end
    const originalEnd = res.end.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).end = function patchedEnd(...args: any[]) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      const statusCode = res.statusCode;

      // Determine log level
      let level: RequestLogEntry['level'] = 'info';
      if (statusCode >= 500 || caughtError) {
        level = 'error';
      } else if (durationMs > slowThresholdMs || statusCode >= 400) {
        level = 'warn';
      }

      // Build log entry
      const entry: RequestLogEntry = {
        timestamp: startDate.toISOString(),
        level,
        type: 'request',
        method: req.method,
        path: req.originalUrl || req.path,
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        userId: getUserId(req),
        userAgent: (req.headers['user-agent'] as string) || null,
        ip: getClientIp(req),
        contentLength: req.headers['content-length'] ? Number(req.headers['content-length']) : null,
        responseSize: getResponseSize(res),
        query: logQuery ? sanitizeQuery(req.query as Record<string, unknown>) : null,
        error: null,
      };

      // Attach error info
      if (caughtError) {
        entry.error = {
          message: caughtError.message,
          stack: caughtError.stack || null,
          name: caughtError.name,
        };
      } else if (statusCode >= 500) {
        // Try to extract error info from response locals (set by error handler)
        const resError = (res as any).locals?.error;
        if (resError instanceof Error) {
          entry.error = {
            message: resError.message,
            stack: resError.stack || null,
            name: resError.name,
          };
        }
      }

      // Emit log
      try {
        logFn(entry);
      } catch {
        // Logging should never break the response
      }

      return originalEnd(...args);
    };

    // Capture errors from next()
    const wrappedNext = (err?: unknown) => {
      if (err instanceof Error) {
        caughtError = err;
      }
      next(err);
    };

    wrappedNext();
  };
}

// ─── Error Logger Middleware ──────────────────────────────────────────────────

/**
 * Place AFTER routes. Logs unhandled errors with full stack traces
 * and sends a generic 500 response.
 */
export function errorLogger(options: { logFn?: (entry: RequestLogEntry) => void } = {}) {
  const logFn = options.logFn || defaultLogFn;

  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    const entry: RequestLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      type: 'request',
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode >= 400 ? res.statusCode : 500,
      durationMs: 0,
      userId: getUserId(req),
      userAgent: (req.headers['user-agent'] as string) || null,
      ip: getClientIp(req),
      contentLength: null,
      responseSize: null,
      query: null,
      error: {
        message: err.message,
        stack: err.stack || null,
        name: err.name,
      },
    };

    try {
      logFn(entry);
    } catch {
      console.error('Failed to log error:', err);
    }

    // Store error for request logger to pick up
    (res as any).locals = (res as any).locals || {};
    (res as any).locals.error = err;

    if (!res.headersSent) {
      res.status(entry.statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
          ? 'حدث خطأ في الخادم'
          : err.message,
      });
    }
  };
}

export default requestLogger;
