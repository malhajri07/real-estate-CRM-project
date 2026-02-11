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

/**
 * Error handling middleware
 * Catches all errors and returns consistent error responses
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
        stack: err.stack,
        originalMessage: err.message,
      }),
    });
  }

  // Handle validation errors (Zod)
  if (err instanceof ZodError) {
    const errorResponse = getErrorResponse('VALIDATION_ERROR', locale, err.errors);
    return res.status(400).json(errorResponse);
  }

  // Handle unknown errors
  const errorResponse = getErrorResponse(
    'SERVER_ERROR',
    locale,
    process.env.NODE_ENV === 'development' ? { originalMessage: err.message, stack: err.stack } : undefined
  );
  res.status(500).json(errorResponse);
};

/**
 * Async handler wrapper
 * Automatically catches promise rejections in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
