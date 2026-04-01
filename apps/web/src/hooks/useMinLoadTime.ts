import { useState, useEffect } from "react";

/**
 * useMinLoadTime — Ensures skeleton/loading state shows for at least `ms` milliseconds.
 * Combine with your data loading flag: `if (isLoading || showSkeleton) return <Skeleton />`
 *
 * @param ms Minimum display time in milliseconds (default 2000)
 * @returns `true` while the minimum time hasn't elapsed
 */
export function useMinLoadTime(ms = 2000): boolean {
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPending(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);

  return pending;
}
