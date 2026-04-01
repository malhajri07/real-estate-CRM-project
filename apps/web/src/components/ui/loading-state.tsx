/**
 * LoadingState — Unified loading state with centered spinner
 */
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  message?: string;
}

export function LoadingState({ className, message }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <Spinner size="lg" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
