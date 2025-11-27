/**
 * Form helper utilities for Unverified Listing Page
 */

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: (RequestInit & { timeout?: number }) = {}
) {
  const { timeout = 30000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed.length) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

