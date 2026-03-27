/**
 * AppErrorBoundary.tsx - Top-level Error Boundary
 *
 * Catches unhandled errors and displays a recovery UI.
 * Prevents full app crash for better UX.
 */

import { Component, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("App Error Boundary caught an error", {
      context: "AppErrorBoundary",
      data: { error: error.message, componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-8" dir="ltr">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <span className="text-3xl">⚠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                We encountered an unexpected error. Try refreshing or going back.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="outline" className="rounded-xl">
                Try again
              </Button>
              <Button onClick={this.handleReload} className="rounded-xl bg-primary hover:bg-primary/90">
                Reload page
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-start bg-card p-4 rounded-lg border border-border">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Error details</summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">{this.state.error.message}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
