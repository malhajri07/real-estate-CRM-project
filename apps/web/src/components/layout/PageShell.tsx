/**
 * PageShell.tsx - Standard Page Layout Template
 *
 * Use this wrapper for all platform pages. Ensures consistent:
 * - Wrapper div with PAGE_WRAPPER classes
 * - RTL support via dir
 * - PageHeader placement
 * - Loading/error/empty patterns
 */

import { type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { PAGE_WRAPPER } from "@/config/platform-theme";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** When true, show error state instead of children */
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  /** When true, show loading skeleton instead of children */
  isLoading?: boolean;
  loadingSlot?: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  actions,
  children,
  isError,
  errorMessage,
  onRetry,
  isLoading,
  loadingSlot,
}: PageShellProps) {
  const { dir } = useLanguage();

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title={title} subtitle={subtitle}>
        {actions}
      </PageHeader>

      {isError && (
        <QueryErrorFallback
          message={errorMessage}
          onRetry={onRetry}
        />
      )}

      {!isError && isLoading && loadingSlot}

      {!isError && !isLoading && children}
    </div>
  );
}
