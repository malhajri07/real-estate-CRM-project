import { Request, Response, NextFunction } from "express";

// ── In-memory store ─────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  /** Timestamp (ms) when this window started */
  windowStart: number;
}

/**
 * Simple in-memory map keyed by IP address.
 * Each rate-limiter instance gets its own store so counters don't collide.
 */
class InMemoryStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(private windowMs: number) {
    // Purge expired entries every 5 minutes to prevent memory leaks
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // Allow the process to exit even if the timer is still active
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Increment the counter for `key` and return the current hit count
   * plus the number of milliseconds remaining in this window.
   */
  increment(key: string, now: number): { count: number; remainingMs: number } {
    const existing = this.store.get(key);

    if (!existing || now - existing.windowStart >= this.windowMs) {
      // First request in a new window
      this.store.set(key, { count: 1, windowStart: now });
      return { count: 1, remainingMs: this.windowMs };
    }

    existing.count += 1;
    const remainingMs = this.windowMs - (now - existing.windowStart);
    return { count: existing.count, remainingMs };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now - entry.windowStart >= this.windowMs) {
        this.store.delete(key);
      }
    }
  }

  /** Exposed for testing — stop the background cleanup timer. */
  destroy(): void {
    clearInterval(this.cleanupTimer);
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────

interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed in the window */
  max: number;
}

const RATE_LIMIT_MESSAGE =
  "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً";

function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max } = options;
  const store = new InMemoryStore(windowMs);

  const middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const { count, remainingMs } = store.increment(key, now);

    // Always set informational headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));

    if (count > max) {
      const retryAfterSeconds = Math.ceil(remainingMs / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        error: "TOO_MANY_REQUESTS",
        message: RATE_LIMIT_MESSAGE,
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };

  // Attach destroy so callers can clean up in tests or on shutdown
  middleware._store = store;

  return middleware;
}

// ── Exported limiters ───────────────────────────────────────────────────────

/** General API rate limit — 100 requests per minute per IP */
export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,   // 1 minute
  max: 100,
});

/** Auth endpoints rate limit — 10 requests per minute per IP */
export const authRateLimit = createRateLimiter({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,
});
