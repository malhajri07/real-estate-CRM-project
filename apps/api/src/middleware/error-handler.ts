/**
 * error-handler.ts — Enhanced Express Error Handler Middleware
 *
 * Location: apps/api/src/middleware/error-handler.ts
 *
 * Features:
 * - Zod validation error formatting (field-level errors with Arabic messages)
 * - Prisma error mapping (unique constraint, not found, relation, timeout)
 * - i18n error messages (Arabic primary, English fallback)
 * - Stack trace in development mode only
 * - Consistent JSON error response format
 * - Custom application error classes
 * - Request ID tracking
 * - Error severity classification
 *
 * Usage:
 *   import { errorHandler, AppError, NotFoundError } from './middleware/error-handler';
 *   app.use(errorHandler());
 *
 *   // Throw in routes:
 *   throw new NotFoundError('العقار غير موجود');
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';

// ─── Custom Error Classes ───────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'بيانات غير صالحة', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'المورد المطلوب غير موجود') {
    super(message, 404, 'NOT_FOUND', true);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'غير مصرح — يرجى تسجيل الدخول') {
    super(message, 401, 'UNAUTHORIZED', true);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'ليس لديك صلاحية للوصول إلى هذا المورد') {
    super(message, 403, 'FORBIDDEN', true);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'تعارض في البيانات — السجل موجود مسبقاً') {
    super(message, 409, 'CONFLICT', true);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'تم تجاوز الحد المسموح من الطلبات — حاول مجدداً لاحقاً') {
    super(message, 429, 'RATE_LIMIT', true);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'الخدمة غير متاحة حالياً — يرجى المحاولة لاحقاً') {
    super(message, 503, 'SERVICE_UNAVAILABLE', true);
    this.name = 'ServiceUnavailableError';
  }
}

// ─── Error Response Types ───────────────────────────────────────────────────

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: FieldError[] | unknown;
    requestId?: string;
    timestamp: string;
    stack?: string;
  };
}

interface FieldError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

// ─── Zod Error Formatting ───────────────────────────────────────────────────

function formatZodErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue: ZodIssue) => {
    const field = issue.path.join('.');
    return {
      field: field || '_root',
      message: issue.message,
      code: issue.code,
      received: 'received' in issue ? (issue as any).received : undefined,
    };
  });
}

function zodErrorSummary(error: ZodError): string {
  const count = error.issues.length;
  if (count === 1) {
    const issue = error.issues[0];
    const field = issue.path.join('.');
    return field ? `خطأ في الحقل "${field}": ${issue.message}` : issue.message;
  }
  return `${count} أخطاء في البيانات المدخلة`;
}

// ─── Prisma Error Mapping ───────────────────────────────────────────────────

interface PrismaClientError {
  code: string;
  meta?: {
    target?: string[];
    field_name?: string;
    model_name?: string;
    cause?: string;
  };
  message: string;
}

function isPrismaError(error: unknown): error is PrismaClientError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    (error as any).code.startsWith('P')
  );
}

const PRISMA_ERROR_MAP: Record<string, { status: number; code: string; messageAr: string }> = {
  P2000: {
    status: 400,
    code: 'VALUE_TOO_LONG',
    messageAr: 'القيمة المدخلة تتجاوز الحد المسموح',
  },
  P2001: {
    status: 404,
    code: 'RECORD_NOT_FOUND',
    messageAr: 'السجل المطلوب غير موجود في قاعدة البيانات',
  },
  P2002: {
    status: 409,
    code: 'UNIQUE_CONSTRAINT',
    messageAr: 'قيمة مكررة — هذا السجل موجود مسبقاً',
  },
  P2003: {
    status: 400,
    code: 'FOREIGN_KEY_VIOLATION',
    messageAr: 'مرجع غير صالح — السجل المرتبط غير موجود',
  },
  P2014: {
    status: 400,
    code: 'RELATION_VIOLATION',
    messageAr: 'لا يمكن حذف هذا السجل لوجود سجلات مرتبطة به',
  },
  P2015: {
    status: 404,
    code: 'RELATED_RECORD_NOT_FOUND',
    messageAr: 'السجل المرتبط غير موجود',
  },
  P2021: {
    status: 500,
    code: 'TABLE_NOT_FOUND',
    messageAr: 'خطأ في بنية قاعدة البيانات',
  },
  P2022: {
    status: 500,
    code: 'COLUMN_NOT_FOUND',
    messageAr: 'خطأ في بنية قاعدة البيانات',
  },
  P2024: {
    status: 503,
    code: 'CONNECTION_POOL_TIMEOUT',
    messageAr: 'الخادم مشغول حالياً — يرجى المحاولة بعد لحظات',
  },
  P2025: {
    status: 404,
    code: 'RECORD_NOT_FOUND',
    messageAr: 'السجل المطلوب غير موجود أو لا يمكن الوصول إليه',
  },
};

function formatPrismaError(error: PrismaClientError): {
  status: number;
  code: string;
  message: string;
  details?: unknown;
} {
  const mapping = PRISMA_ERROR_MAP[error.code];

  if (mapping) {
    let message = mapping.messageAr;

    // Enhance unique constraint message with field name
    if (error.code === 'P2002' && error.meta?.target) {
      const fields = error.meta.target.join('، ');
      message = `قيمة مكررة في الحقل: ${fields}`;
    }

    // Enhance foreign key message
    if (error.code === 'P2003' && error.meta?.field_name) {
      message = `مرجع غير صالح في الحقل: ${error.meta.field_name}`;
    }

    return {
      status: mapping.status,
      code: mapping.code,
      message,
      details: error.meta,
    };
  }

  return {
    status: 500,
    code: `PRISMA_${error.code}`,
    message: 'حدث خطأ في قاعدة البيانات',
  };
}

// ─── Error Severity ─────────────────────────────────────────────────────────

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

function classifySeverity(statusCode: number, isOperational: boolean): ErrorSeverity {
  if (!isOperational) return 'critical';
  if (statusCode >= 500) return 'high';
  if (statusCode === 429) return 'medium';
  if (statusCode >= 400) return 'low';
  return 'low';
}

// ─── Request ID ─────────────────────────────────────────────────────────────

function getRequestId(req: Request): string | undefined {
  return (
    (req.headers['x-request-id'] as string) ??
    (req.headers['x-correlation-id'] as string) ??
    undefined
  );
}

// ─── Error Handler Options ──────────────────────────────────────────────────

export interface ErrorHandlerOptions {
  /** Include stack trace in response (defaults to NODE_ENV === 'development') */
  includeStack?: boolean;
  /** Custom logger function */
  logger?: (severity: ErrorSeverity, error: Error, req: Request) => void;
  /** Default locale for error messages */
  defaultLocale?: 'ar' | 'en';
}

// ─── Default Logger ─────────────────────────────────────────────────────────

function defaultLogger(severity: ErrorSeverity, error: Error, req: Request): void {
  const entry = {
    severity,
    error: error.name,
    message: error.message,
    method: req.method,
    path: req.originalUrl || req.path,
    userId: (req as any).user?.id ?? (req as any).auth?.id ?? null,
    timestamp: new Date().toISOString(),
  };

  if (severity === 'critical' || severity === 'high') {
    console.error(JSON.stringify({ ...entry, stack: error.stack }));
  } else {
    console.warn(JSON.stringify(entry));
  }
}

// ─── Main Error Handler Factory ─────────────────────────────────────────────

export function errorHandler(options: ErrorHandlerOptions = {}) {
  const {
    includeStack = process.env.NODE_ENV === 'development',
    logger = defaultLogger,
    defaultLocale = 'ar',
  } = options;

  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = defaultLocale === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred';
    let details: FieldError[] | unknown | undefined;
    let isOperational = false;

    // ── Zod Validation Errors ──────────────────────────────────────────
    if (err instanceof ZodError) {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = zodErrorSummary(err);
      details = formatZodErrors(err);
      isOperational = true;
    }
    // ── App Errors (our custom classes) ────────────────────────────────
    else if (err instanceof AppError) {
      statusCode = err.statusCode;
      code = err.code;
      message = err.message;
      details = err.details;
      isOperational = err.isOperational;
    }
    // ── Prisma Errors ──────────────────────────────────────────────────
    else if (isPrismaError(err)) {
      const prismaResult = formatPrismaError(err);
      statusCode = prismaResult.status;
      code = prismaResult.code;
      message = prismaResult.message;
      details = prismaResult.details;
      isOperational = statusCode < 500;
    }
    // ── JSON Parse Errors ──────────────────────────────────────────────
    else if (err instanceof SyntaxError && 'body' in err) {
      statusCode = 400;
      code = 'INVALID_JSON';
      message = defaultLocale === 'ar'
        ? 'صيغة JSON غير صالحة في جسم الطلب'
        : 'Invalid JSON in request body';
      isOperational = true;
    }
    // ── TypeError (usually programming errors) ─────────────────────────
    else if (err instanceof TypeError) {
      statusCode = 500;
      code = 'TYPE_ERROR';
      message = defaultLocale === 'ar'
        ? 'حدث خطأ داخلي — تم إبلاغ فريق التطوير'
        : 'Internal error — the development team has been notified';
      isOperational = false;
    }
    // ── Generic errors ─────────────────────────────────────────────────
    else {
      message = err.message || message;
    }

    // Classify and log
    const severity = classifySeverity(statusCode, isOperational);
    logger(severity, err, req);

    // Build response
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    };

    if (details) {
      response.error.details = details;
    }

    const requestId = getRequestId(req);
    if (requestId) {
      response.error.requestId = requestId;
    }

    if (includeStack && err.stack) {
      response.error.stack = err.stack;
    }

    // Store error on locals for request logger
    (res as any).locals = (res as any).locals || {};
    (res as any).locals.error = err;

    // Send response
    if (!res.headersSent) {
      res.status(statusCode).json(response);
    }
  };
}

// ─── 404 Handler (for unmatched routes) ─────────────────────────────────────

export function notFoundHandler() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const error = new NotFoundError(
      `المسار ${req.method} ${req.originalUrl} غير موجود`
    );
    next(error);
  };
}

// ─── Async Route Wrapper ────────────────────────────────────────────────────

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
