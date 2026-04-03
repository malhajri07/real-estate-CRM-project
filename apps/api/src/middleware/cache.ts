/**
 * cache.ts — In-Memory HTTP Cache Middleware
 *
 * Location: apps/api/src/middleware/cache.ts
 *
 * Features:
 * - In-memory cache for GET requests
 * - Cache key = URL + authenticated user ID (org-isolated)
 * - Configurable TTL per route (default 60 s)
 * - Automatic invalidation on POST / PUT / PATCH / DELETE
 * - ETag / If-None-Match support for conditional requests
 * - Cache-Control response headers
 * - Manual invalidation helpers
 * - LRU eviction when max entries exceeded
 *
 * Usage:
 *   import { cacheMiddleware, invalidateCache } from './middleware/cache';
 *
 *   // Cache GET /api/listings for 120 s
 *   app.get('/api/listings', cacheMiddleware({ ttl: 120 }), listingsHandler);
 *
 *   // Auto-invalidate on mutation
 *   app.use(cacheMiddleware.autoInvalidate());
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CacheEntry {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
  etag: string;
  createdAt: number;
  ttl: number;
  hitCount: number;
}

export interface CacheOptions {
  /** Time-to-live in seconds (default 60) */
  ttl?: number;
  /** Maximum number of cache entries before LRU eviction (default 5000) */
  maxEntries?: number;
  /** Whether to include user ID in cache key for per-user caching (default true) */
  perUser?: boolean;
  /** Whether to set Cache-Control response headers (default true) */
  setCacheHeaders?: boolean;
  /** Custom key generator. Receives (req) and should return a string. */
  keyGenerator?: (req: Request) => string;
  /** Paths that should never be cached (prefix match) */
  excludePaths?: string[];
  /** Only cache responses with these status codes (default [200]) */
  cacheableStatuses?: number[];
}

export interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  evictions: number;
  invalidations: number;
  hitRate: string;
}

// ─── Cache Store ──────────────────────────────────────────────────────────────

class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private maxEntries: number;

  // Stats
  public hits = 0;
  public misses = 0;
  public evictions = 0;
  public invalidations = 0;

  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;
  }

  get(key: string): CacheEntry | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    const age = (Date.now() - entry.createdAt) / 1000;
    if (age > entry.ttl) {
      this.store.delete(key);
      this.removeFromOrder(key);
      this.misses++;
      return null;
    }

    // Move to end of access order (MRU)
    this.removeFromOrder(key);
    this.accessOrder.push(key);
    entry.hitCount++;
    this.hits++;

    return entry;
  }

  set(key: string, entry: CacheEntry): void {
    // Evict LRU entries if at capacity
    while (this.store.size >= this.maxEntries && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.store.delete(lruKey);
      this.evictions++;
    }

    this.store.set(key, entry);
    this.removeFromOrder(key);
    this.accessOrder.push(key);
  }

  delete(key: string): boolean {
    const existed = this.store.delete(key);
    if (existed) {
      this.removeFromOrder(key);
      this.invalidations++;
    }
    return existed;
  }

  /**
   * Invalidate all cache entries whose key starts with the given prefix.
   * Used by auto-invalidation to clear related GET caches on mutation.
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        this.removeFromOrder(key);
        count++;
      }
    }
    this.invalidations += count;
    return count;
  }

  /** Invalidate all entries matching a URL path pattern (ignoring query + user suffix) */
  invalidateByPath(pathPattern: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.includes(pathPattern)) {
        this.store.delete(key);
        this.removeFromOrder(key);
        count++;
      }
    }
    this.invalidations += count;
    return count;
  }

  clear(): void {
    const size = this.store.size;
    this.store.clear();
    this.accessOrder = [];
    this.invalidations += size;
  }

  get size(): number {
    return this.store.size;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      entries: this.store.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      invalidations: this.invalidations,
      hitRate: total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0%',
    };
  }

  private removeFromOrder(key: string): void {
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) this.accessOrder.splice(idx, 1);
  }
}

// ─── Singleton Cache Instance ─────────────────────────────────────────────────

const globalCache = new MemoryCache(5000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateETag(body: string): string {
  const hash = crypto.createHash('md5').update(body).digest('hex');
  return `"${hash.substring(0, 16)}"`;
}

function getUserId(req: Request): string {
  const user = (req as any).user;
  if (user?.id) return user.id;
  const auth = (req as any).auth;
  if (auth?.id) return auth.id;
  return 'anonymous';
}

function defaultKeyGenerator(req: Request, perUser: boolean): string {
  const userId = perUser ? getUserId(req) : '_shared';
  // Include full URL (path + query) and user ID
  return `cache:${req.originalUrl || req.url}:${userId}`;
}

/**
 * Extract the "resource path" from a URL for invalidation purposes.
 * e.g. /api/leads/abc-123 -> /api/leads
 *      /api/listings?page=1 -> /api/listings
 */
function getResourceBasePath(url: string): string {
  const path = url.split('?')[0]; // Remove query string
  const segments = path.split('/').filter(Boolean);

  // If last segment looks like a UUID or ID, drop it to get the collection path
  if (segments.length >= 2) {
    const last = segments[segments.length - 1];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const numericPattern = /^\d+$/;
    if (uuidPattern.test(last) || numericPattern.test(last)) {
      segments.pop();
    }
  }

  return '/' + segments.join('/');
}

// ─── Cache Middleware ─────────────────────────────────────────────────────────

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 60,
    perUser = true,
    setCacheHeaders = true,
    keyGenerator,
    excludePaths = [],
    cacheableStatuses = [200],
  } = options;

  const excludeSet = new Set(excludePaths);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Skip excluded paths
    const path = req.path;
    for (const excluded of excludeSet) {
      if (path.startsWith(excluded)) {
        next();
        return;
      }
    }

    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : defaultKeyGenerator(req, perUser);

    // Check cache
    const cached = globalCache.get(cacheKey);
    if (cached) {
      // Handle conditional request (If-None-Match)
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        res.status(304).end();
        return;
      }

      // Serve from cache
      if (setCacheHeaders) {
        const age = Math.round((Date.now() - cached.createdAt) / 1000);
        const maxAge = Math.max(0, cached.ttl - age);
        res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
        res.setHeader('ETag', cached.etag);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', String(age));
      }

      // Restore original headers
      for (const [key, value] of Object.entries(cached.headers)) {
        if (!['cache-control', 'etag', 'x-cache', 'x-cache-age'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      }

      res.status(cached.statusCode);
      res.send(cached.body);
      return;
    }

    // Cache MISS — intercept the response to store it
    if (setCacheHeaders) {
      res.setHeader('X-Cache', 'MISS');
    }

    const originalJson = res.json.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).json = function patchedJson(body: any) {
      // Only cache successful responses
      if (cacheableStatuses.includes(res.statusCode)) {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        const etag = generateETag(bodyStr);

        // Collect response headers
        const headers: Record<string, string> = {};
        const headerNames = res.getHeaderNames();
        for (const name of headerNames) {
          const val = res.getHeader(name);
          if (val != null) headers[name] = String(val);
        }

        const entry: CacheEntry = {
          body: bodyStr,
          statusCode: res.statusCode,
          headers,
          etag,
          createdAt: Date.now(),
          ttl,
          hitCount: 0,
        };

        globalCache.set(cacheKey, entry);

        // Set cache headers on the original response
        if (setCacheHeaders) {
          res.setHeader('Cache-Control', `private, max-age=${ttl}`);
          res.setHeader('ETag', etag);
        }
      }

      return originalJson(body);
    };

    next();
  };
}

// ─── Auto-Invalidation Middleware ─────────────────────────────────────────────

/**
 * Middleware that automatically invalidates related cache entries
 * when a mutation request (POST/PUT/PATCH/DELETE) completes successfully.
 *
 * Place this BEFORE your routes:
 *   app.use(autoInvalidateCache());
 */
export function autoInvalidateCache() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const method = req.method.toUpperCase();

    // Only intercept mutation methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).json = function patchedJson(body: any) {
      // Invalidate cache for this resource path on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const basePath = getResourceBasePath(req.originalUrl || req.url);
        globalCache.invalidateByPath(basePath);
      }
      return originalJson(body);
    };

    next();
  };
}

// ─── Manual Invalidation Helpers ──────────────────────────────────────────────

/** Invalidate all cache entries for a specific path */
export function invalidateCache(path: string): number {
  return globalCache.invalidateByPath(path);
}

/** Invalidate all cache entries matching a key prefix */
export function invalidateCacheByPrefix(prefix: string): number {
  return globalCache.invalidateByPrefix(prefix);
}

/** Clear the entire cache */
export function clearCache(): void {
  globalCache.clear();
}

/** Get cache statistics */
export function getCacheStats(): CacheStats {
  return globalCache.getStats();
}

/** Get the underlying cache instance (for advanced usage / testing) */
export function getCacheInstance(): MemoryCache {
  return globalCache;
}

export default cacheMiddleware;
