/**
 * query-error-fallback.tsx - Consistent error UI for failed queries
 *
 * Use with useQuery: when isError, render this with onRetry={refetch}.
 */

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface QueryErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryErrorFallback({
  message = "Failed to load data. Please try again.",
  onRetry,
  className,
}: QueryErrorFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center min-h-[200px] ${className ?? ""}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-2">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl">
          Try again
        </Button>
      )}
    </div>
  );
}
