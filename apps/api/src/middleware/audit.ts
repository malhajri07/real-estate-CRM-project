/**
 * audit.ts — Audit Trail Middleware
 *
 * Location: apps/api/src/middleware/audit.ts
 *
 * Features:
 * - Logs entity changes (before/after snapshots)
 * - Captures user ID, IP, user agent
 * - Timestamps for every audit entry
 * - Async logging (non-blocking)
 * - Configurable entity types and actions
 * - Diff computation (which fields changed)
 * - Sensitive field redaction
 * - Batch flush support
 * - In-memory buffer with periodic write
 *
 * Usage:
 *   import { auditMiddleware, auditLog, AuditLogger } from './middleware/audit';
 *
 *   // Global middleware (attaches audit helpers to req)
 *   app.use(auditMiddleware());
 *
 *   // Manual logging in route handlers
 *   await auditLog({
 *     action: 'UPDATE',
 *     entity: 'lead',
 *     entityId: lead.id,
 *     before: oldLead,
 *     after: newLead,
 *     userId: req.user.id,
 *     ip: req.ip,
 *   });
 */

import { Request, Response, NextFunction } from 'express';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'ASSIGN'
  | 'TRANSFER'
  | 'APPROVE'
  | 'REJECT'
  | 'ARCHIVE'
  | 'RESTORE';

export type AuditEntity =
  | 'user'
  | 'lead'
  | 'listing'
  | 'deal'
  | 'appointment'
  | 'organization'
  | 'role'
  | 'campaign'
  | 'document'
  | 'setting'
  | 'template'
  | string;

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  userId: string | null;
  userName?: string | null;
  userEmail?: string | null;
  ip: string | null;
  userAgent: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  diff: FieldDiff[] | null;
  metadata?: Record<string, unknown>;
  organizationId?: string | null;
  severity: AuditSeverity;
  requestMethod?: string;
  requestPath?: string;
}

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogInput {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  organizationId?: string | null;
  requestMethod?: string;
  requestPath?: string;
}

// ─── Configuration ──────────────────────────────────────────────────────────

export interface AuditConfig {
  /** Enable/disable audit logging */
  enabled: boolean;
  /** Fields to always redact from before/after snapshots */
  sensitiveFields: Set<string>;
  /** Actions considered critical (login failures, deletions, role changes) */
  criticalActions: Set<AuditAction>;
  /** Warning actions (exports, assignments) */
  warningActions: Set<AuditAction>;
  /** Maximum entries to buffer before flushing */
  bufferSize: number;
  /** Flush interval in milliseconds */
  flushIntervalMs: number;
  /** Custom persistence function */
  persistFn?: (entries: AuditEntry[]) => Promise<void>;
  /** Whether to log READ actions (can be noisy) */
  logReads: boolean;
}

const DEFAULT_CONFIG: AuditConfig = {
  enabled: true,
  sensitiveFields: new Set([
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'accessToken',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'nationalId',
  ]),
  criticalActions: new Set([
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'APPROVE',
    'REJECT',
  ]),
  warningActions: new Set([
    'EXPORT',
    'IMPORT',
    'ASSIGN',
    'TRANSFER',
    'ARCHIVE',
  ]),
  bufferSize: 50,
  flushIntervalMs: 5000,
  logReads: false,
};

// ─── ID Generation ──────────────────────────────────────────────────────────

let idCounter = 0;

function generateAuditId(): string {
  const now = Date.now();
  idCounter = (idCounter + 1) % 999999;
  const random = Math.random().toString(36).substring(2, 8);
  return `aud_${now}_${String(idCounter).padStart(6, '0')}_${random}`;
}

// ─── Field Redaction ────────────────────────────────────────────────────────

function redactSensitiveFields(
  obj: Record<string, unknown> | null,
  sensitiveFields: Set<string>
): Record<string, unknown> | null {
  if (!obj) return null;

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.has(key) || sensitiveFields.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveFields(
        value as Record<string, unknown>,
        sensitiveFields
      );
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

// ─── Diff Computation ───────────────────────────────────────────────────────

function computeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  sensitiveFields: Set<string>
): FieldDiff[] | null {
  if (!before || !after) return null;

  const diffs: FieldDiff[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    // Skip internal/meta fields
    if (key.startsWith('_') || key === 'updatedAt' || key === 'createdAt') continue;

    const oldVal = before[key];
    const newVal = after[key];

    // Check if values actually differ
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({
        field: key,
        oldValue: sensitiveFields.has(key) ? '[REDACTED]' : oldVal,
        newValue: sensitiveFields.has(key) ? '[REDACTED]' : newVal,
      });
    }
  }

  return diffs.length > 0 ? diffs : null;
}

// ─── Severity Classification ────────────────────────────────────────────────

function classifySeverity(
  action: AuditAction,
  config: AuditConfig
): AuditSeverity {
  if (config.criticalActions.has(action)) return 'critical';
  if (config.warningActions.has(action)) return 'warning';
  return 'info';
}

// ─── Client IP Extraction ───────────────────────────────────────────────────

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0];
  return req.socket?.remoteAddress || req.ip || null;
}

function getUserFromRequest(req: Request): {
  id: string | null;
  name: string | null;
  email: string | null;
  organizationId: string | null;
} {
  const user = (req as any).user;
  if (user) {
    return {
      id: user.id ?? null,
      name: user.name ?? user.firstName ?? null,
      email: user.email ?? null,
      organizationId: user.organizationId ?? user.tenantId ?? null,
    };
  }
  const auth = (req as any).auth;
  if (auth) {
    return {
      id: auth.id ?? null,
      name: null,
      email: auth.email ?? null,
      organizationId: null,
    };
  }
  return { id: null, name: null, email: null, organizationId: null };
}

// ─── Audit Logger Class ─────────────────────────────────────────────────────

/** Audit logger. */
export class AuditLogger {
  private buffer: AuditEntry[] = [];
  private config: AuditConfig;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enabled && this.config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(
        () => this.flush(),
        this.config.flushIntervalMs
      );
      // Allow process to exit without waiting for timer
      if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
        this.flushTimer.unref();
      }
    }
  }

  async log(input: AuditLogInput): Promise<void> {
    if (!this.config.enabled) return;
    if (!this.config.logReads && input.action === 'READ') return;

    const entry: AuditEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      userId: input.userId ?? null,
      userName: input.userName ?? null,
      userEmail: input.userEmail ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      before: redactSensitiveFields(input.before ?? null, this.config.sensitiveFields),
      after: redactSensitiveFields(input.after ?? null, this.config.sensitiveFields),
      diff: computeDiff(input.before ?? null, input.after ?? null, this.config.sensitiveFields),
      metadata: input.metadata,
      organizationId: input.organizationId ?? null,
      severity: classifySeverity(input.action, this.config),
      requestMethod: input.requestMethod,
      requestPath: input.requestPath,
    };

    this.buffer.push(entry);

    if (this.buffer.length >= this.config.bufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      if (this.config.persistFn) {
        await this.config.persistFn(entries);
      } else {
        // Default: log to console as structured JSON
        for (const entry of entries) {
          const logLine = JSON.stringify({
            type: 'audit',
            ...entry,
          });

          if (entry.severity === 'critical') {
            console.error(logLine);
          } else if (entry.severity === 'warning') {
            console.warn(logLine);
          } else {
            console.log(logLine);
          }
        }
      }
    } catch (err) {
      // Re-buffer on failure (limited retry)
      console.error('Audit flush failed:', err);
      if (this.buffer.length < this.config.bufferSize * 3) {
        this.buffer = [...entries, ...this.buffer];
      }
    }
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush().catch(() => {});
  }
}

// ─── Global Logger Instance ─────────────────────────────────────────────────

let globalAuditLogger: AuditLogger | null = null;

/** Get audit logger. */
export function getAuditLogger(config?: Partial<AuditConfig>): AuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger(config);
  }
  return globalAuditLogger;
}

// ─── Standalone Audit Log Function ──────────────────────────────────────────

/** Audit log. */
export async function auditLog(input: AuditLogInput): Promise<void> {
  const logger = getAuditLogger();
  await logger.log(input);
}

// ─── Express Middleware ─────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      audit?: {
        log: (input: Omit<AuditLogInput, 'userId' | 'ip' | 'userAgent' | 'organizationId' | 'requestMethod' | 'requestPath'>) => Promise<void>;
      };
    }
  }
}

export interface AuditMiddlewareOptions extends Partial<AuditConfig> {
  /** Automatically log write operations (POST, PUT, PATCH, DELETE) */
  autoLogWrites?: boolean;
  /** Paths to exclude from auto-logging */
  excludePaths?: string[];
}

/** Audit middleware. */
export function auditMiddleware(options: AuditMiddlewareOptions = {}) {
  const {
    autoLogWrites = false,
    excludePaths = ['/health', '/healthz', '/ready', '/favicon.ico'],
    ...configOverrides
  } = options;

  const logger = getAuditLogger(configOverrides);
  const excludeSet = new Set(excludePaths);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = getUserFromRequest(req);
    const ip = getClientIp(req);
    const userAgent = (req.headers['user-agent'] as string) || null;

    // Attach audit helper to request
    req.audit = {
      log: async (input) => {
        await logger.log({
          ...input,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          ip,
          userAgent,
          organizationId: user.organizationId,
          requestMethod: req.method,
          requestPath: req.originalUrl || req.path,
        });
      },
    };

    // Auto-log writes if enabled
    if (autoLogWrites && !excludeSet.has(req.path)) {
      const method = req.method.toUpperCase();
      const writeActions: Record<string, AuditAction> = {
        POST: 'CREATE',
        PUT: 'UPDATE',
        PATCH: 'UPDATE',
        DELETE: 'DELETE',
      };

      const action = writeActions[method];
      if (action) {
        // Derive entity from URL path (e.g., /api/leads/123 -> "lead")
        const pathParts = req.path
          .replace(/^\/api\//, '')
          .split('/')
          .filter(Boolean);

        const entityRaw = pathParts[0] ?? 'unknown';
        const entity = entityRaw.replace(/s$/, ''); // pluralize to singular
        const entityId = pathParts[1] ?? 'new';

        // Log asynchronously (non-blocking)
        setImmediate(() => {
          logger
            .log({
              action,
              entity,
              entityId,
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              ip,
              userAgent,
              organizationId: user.organizationId,
              requestMethod: method,
              requestPath: req.originalUrl || req.path,
              after: method !== 'DELETE' ? (req.body ?? null) : null,
            })
            .catch(() => {});
        });
      }
    }

    next();
  };
}

export default auditMiddleware;
