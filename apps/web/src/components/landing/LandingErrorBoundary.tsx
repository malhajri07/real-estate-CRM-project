/**
 * LandingErrorBoundary.tsx - Error Boundary for Landing Page
 * 
 * Catches errors in landing page components and displays a fallback UI
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

export class LandingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Landing Page Error Boundary caught an error', {
      context: 'LandingPage',
      data: { error: error.message, errorInfo, stack: error.stack }
    });
    console.error('Landing page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8" dir="rtl">
          <div className="text-center max-w-2xl">
            <h1 className="text-3xl font-black text-slate-900 mb-4">حدث خطأ في تحميل الصفحة</h1>
            <p className="text-lg text-slate-600 mb-6">
              نعتذر، حدث خطأ أثناء تحميل صفحة الهبوط. يرجى إعادة تحميل الصفحة أو التواصل مع الدعم الفني.
            </p>
            {this.state.error && (
              <details className="mt-4 text-start bg-slate-50 p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-bold text-slate-700 mb-2">تفاصيل الخطأ</summary>
                <pre className="text-xs text-slate-600 overflow-auto">{this.state.error.message}</pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="mt-6 rounded-2xl bg-emerald-600 px-8 py-3 text-white font-bold hover:bg-emerald-700 transition-colors"
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
