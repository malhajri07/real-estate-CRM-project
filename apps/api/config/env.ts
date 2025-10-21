/**
 * apps/api/config/env.ts
 *
 * Centralised helpers for accessing environment variables that must be set.
 * Throws a descriptive error when required secrets are missing so we fail fast.
 */

import crypto from 'crypto';

const cache = new Map<string, string>();
const warned = new Set<string>();
const isProduction = process.env.NODE_ENV === 'production';

type RequireEnvOptions = {
  /**
   * Allow a generated fallback value when running in development.
   * In production we will still throw if the variable is missing.
   */
  allowInDev?: boolean;
  /**
   * Custom fallback value or generator. If omitted we generate a random 32-byte hex string.
   */
  fallback?: string | (() => string);
};

export function requireEnv(name: string, options: RequireEnvOptions = {}): string {
  if (cache.has(name)) {
    return cache.get(name)!;
  }

  const value = process.env[name];
  if (!value || !value.trim()) {
    if (options.allowInDev && !isProduction) {
      const fallbackValue =
        typeof options.fallback === 'function'
          ? options.fallback()
          : options.fallback ?? crypto.randomBytes(32).toString('hex');

      if (!warned.has(name)) {
        console.warn(
          `[config] ${name} missing; using development fallback. Set ${name} in your environment to silence this warning.`,
        );
        warned.add(name);
      }

      cache.set(name, fallbackValue);
      process.env[name] = fallbackValue;
      return fallbackValue;
    }

    throw new Error(`[config] Missing required environment variable: ${name}`);
  }

  const normalized = value.trim();
  cache.set(name, normalized);
  return normalized;
}

export const JWT_SECRET = () =>
  requireEnv('JWT_SECRET', {
    allowInDev: true,
    fallback: () => `dev-jwt-${crypto.randomBytes(32).toString('hex')}`,
  });

export const SESSION_SECRET = () =>
  requireEnv('SESSION_SECRET', {
    allowInDev: true,
    fallback: () => `dev-session-${crypto.randomBytes(32).toString('hex')}`,
  });

export const DATABASE_URL = () => requireEnv('DATABASE_URL');
