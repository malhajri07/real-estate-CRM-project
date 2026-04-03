/**
 * usePagination.ts - Pagination Hook
 *
 * Location: apps/web/src/ -> Hooks/ -> usePagination.ts
 *
 * Manages pagination state for tables and lists. Provides page navigation,
 * page size changes, and computed metadata (total pages, visible range, etc.).
 *
 * @example
 * const pagination = usePagination({ totalItems: 150, initialPageSize: 20 });
 * // pagination.page, pagination.pageSize, pagination.totalPages, ...
 */

import { useState, useMemo, useCallback } from "react";

export interface UsePaginationOptions {
  /** Total number of items in the dataset */
  totalItems: number;
  /** Starting page (1-based, default 1) */
  initialPage?: number;
  /** Items per page (default 10) */
  initialPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
}

export interface UsePaginationReturn {
  /** Current page (1-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Total items passed in */
  totalItems: number;
  /** Whether a previous page exists */
  hasPrevious: boolean;
  /** Whether a next page exists */
  hasNext: boolean;
  /** 0-based start index of the current page slice */
  startIndex: number;
  /** 0-based end index (exclusive) of the current page slice */
  endIndex: number;
  /** Available page size options */
  pageSizeOptions: number[];
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  previousPage: () => void;
  /** Go to the first page */
  firstPage: () => void;
  /** Go to the last page */
  lastPage: () => void;
  /** Change the page size (resets to page 1) */
  setPageSize: (size: number) => void;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Hook for managing pagination state.
 */
export function usePagination({
  totalItems,
  initialPage = 1,
  initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize],
  );

  // Clamp page if totalPages shrinks below current page
  const clampedPage = useMemo(
    () => Math.min(page, totalPages),
    [page, totalPages],
  );

  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const goToPage = useCallback(
    (target: number) => {
      setPage(Math.max(1, Math.min(target, totalPages)));
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => setPage(1), []);

  const lastPage = useCallback(() => setPage(totalPages), [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  return {
    page: clampedPage,
    pageSize,
    totalPages,
    totalItems,
    hasPrevious: clampedPage > 1,
    hasNext: clampedPage < totalPages,
    startIndex,
    endIndex,
    pageSizeOptions,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
  };
}
