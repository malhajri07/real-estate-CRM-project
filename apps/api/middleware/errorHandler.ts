/**
 * errorHandler.ts - Centralized Error Handling Middleware
 * 
 * Location: apps/api/ → Middleware/ → errorHandler.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Centralized error handling middleware that provides consistent error responses
 * across all routes. Handles:
 * - Application errors (AppError)
 * - Validation errors (ZodError)
 * - Unexpected errors
 * - Error logging
 * 
 * Related Files:
 * - apps/api/errors/AppError.ts - Custom error class
 * - apps/api/routes.ts - Routes that use this middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../logger';
import { ZodError } from 'zod';
import { getErrorResponse } from '../i18n';

const SENSITIVE_PATTERNS = [
  /postgres(ql)?:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
  /mongodb(\+srv)?:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,
  /password\s*[=:]\s*\S+/gi,
  /\/Users\/[^\s]+/g,
  /\/home\/[^\s]+/g,
  /[A-Z]:\\[^\s]+/g,
];

/**
 * Strip database connection strings, password fields, and absolute filesystem
 * paths out of an error message before it can leak into a response or log.
 *
 * @param msg - Raw error message that may contain secrets.
 *   Source: `err.message` / `err.stack` from any thrown error.
 * @returns Sanitized message with each match replaced by `[REDACTED]`.
 *   Consumer: returned to the client in dev mode and written to `logger.error`.
 */
function sanitizeMessage(msg: string): string {
  let sanitized = msg;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

/**
 * Centralized Express error-handling middleware. Catches every error thrown by
 * upstream handlers and returns a consistent localized response.
 *
 * Behavior:
 * - {@link AppError} → respects `err.statusCode` and looks up a localized message
 *   via `getErrorResponse(err.code, locale, err.details)`.
 * - {@link ZodError} → 400 with `VALIDATION_ERROR` + the zod error array.
 * - Body-parser 413 → friendly Arabic message about payload size (typically
 *   triggered by base64 listing photos).
 * - Anything else → 500 `SERVER_ERROR`. In production, no internal details
 *   leak to the client; in dev, the sanitized stack trace is included.
 *
 * Mounted last in `apps/api/index.ts`, after all routes.
 *
 * @param err - The thrown error.
 *   Source: bubbled up from any route handler via `next(err)` or `asyncHandler`.
 * @param req - Express request. Used for `req.path`, `req.method`, `req.user.id`
 *   (logging) and `req.locale` (i18n).
 * @param res - Express response. The middleware writes the JSON response on it
 *   and returns; no further middleware runs after this.
 *
 * @sideEffect Writes a structured error log via `logger.error`.
 *
 * @see [[Architecture/Authentication & RBAC]]
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  }, 'Error occurred');

  // Get locale from request (set by localeMiddleware) or default to Arabic
  const locale = (req as any).locale || (req.headers['accept-language'] || '').split(',')[0]?.split('-')[0] || 'ar';

  // Handle known errors (AppError instances)
  if (err instanceof AppError) {
    // If AppError has a code, try to localize it, otherwise use the message as-is
    const errorCode = err.code || 'SERVER_ERROR';
    const errorResponse = getErrorResponse(errorCode as any, locale, err.details);
    return res.status(err.statusCode).json({
      ...errorResponse,
      ...(process.env.NODE_ENV === 'development' && {
        stack: sanitizeMessage(err.stack || ''),
        originalMessage: sanitizeMessage(err.message),
      }),
    });
  }

  // Handle validation errors (Zod)
  if (err instanceof ZodError) {
    const errorResponse = getErrorResponse('VALIDATION_ERROR', locale, err.errors);
    return res.status(400).json(errorResponse);
  }

  // Handle payload too large (body-parser limit exceeded, e.g. base64 images)
  const statusCode = (err as any).statusCode ?? (err as any).status;
  if (statusCode === 413) {
    return res.status(413).json({
      error: 'PAYLOAD_TOO_LARGE',
      message: 'حجم الطلب كبير جداً. قلّل عدد الصور أو حجمها.',
      messageEn: 'Request payload too large. Reduce the number or size of images.',
    });
  }

  // Handle unknown errors
  if (process.env.NODE_ENV === 'production') {
    // In production, don't expose internal error details
    return res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }

  const errorResponse = getErrorResponse(
    'SERVER_ERROR',
    locale,
    { originalMessage: sanitizeMessage(err.message), stack: sanitizeMessage(err.stack || '') }
  );
  res.status(500).json(errorResponse);
};

/**
 * Wrap an async Express route handler so promise rejections automatically
 * route into the {@link errorHandler} via `next(err)`. Without this wrapper,
 * `throw` inside an async handler would silently hang the request.
 *
 * @param fn - Any async (or sync) Express route handler.
 *   Source: route file authors who don't want try/catch boilerplate.
 * @returns A new handler with the same signature that catches rejections.
 *   Consumer: any `router.post('/x', asyncHandler(myHandler))` call site.
 *
 * @example
 * router.get('/leads', asyncHandler(async (req, res) => {
 *   const leads = await prisma.leads.findMany({ where: { agentId: req.user.id } });
 *   res.json(leads);
 * }));
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
