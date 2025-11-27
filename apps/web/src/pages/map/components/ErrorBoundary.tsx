/**
 * ErrorBoundary.tsx - Map Error Boundary Component
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → components/ → ErrorBoundary.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Error boundary component for map page. Provides:
 * - Error catching for Google Maps integration
 * - Friendly error fallback UI
 * - Error logging
 * 
 * Related Files:
 * - apps/web/src/pages/map/index.tsx - Map page uses this boundary
 */

/**
 * Error Boundary Component for Map Page
 * 
 * Wraps the interactive map in a React error boundary so a failure inside the
 * Google Maps integration shows a friendly fallback instead of crashing the page.
 */

import { Component, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class PropertiesMapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('PropertiesMap Error Boundary caught an error', {
      context: 'MapPage',
      data: { error: error.message, errorInfo }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-red-200 bg-red-50">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800">خطأ في تحميل الخريطة</h3>
            <p className="text-sm text-red-600 mt-2">
              حدث خطأ أثناء تحميل خريطة العقارات. يرجى إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

