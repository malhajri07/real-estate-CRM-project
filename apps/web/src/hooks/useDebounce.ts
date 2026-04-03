/**
 * useDebounce.ts - Debounce Hook
 *
 * Location: apps/web/src/ -> Hooks/ -> useDebounce.ts
 *
 * Generic debounce hook that delays updating a value until
 * a specified period of inactivity has passed. Useful for
 * search inputs, filter changes, and other high-frequency events.
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 300);
 * // debouncedQuery updates 300ms after the last setQuery call
 */

import { useState, useEffect } from "react";

/**
 * Debounces a rapidly-changing value.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
