/**
 * PublicLayout.tsx - Public Layout Component
 * 
 * Location: apps/web/src/ → Components/ → Layout Components → PublicLayout.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Public layout wrapper for unauthenticated pages. Provides:
 * - Public header
 * - Page title and subtitle
 * - Consistent public page styling
 * 
 * Related Files:
 * - apps/web/src/components/layout/PublicHeader.tsx - Public header component
 * - apps/web/src/pages/landing.tsx - Uses this layout
 */

import { ReactNode, useEffect } from 'react';
import PublicHeader from './PublicHeader';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PublicLayout({ title, subtitle, children, metaTitle }: { title?: string; subtitle?: string; metaTitle?: string; children: ReactNode }) {
  const { dir } = useLanguage();
  useEffect(() => {
    if (metaTitle || title) {
      document.title = `${metaTitle || title} · عقاركم`;
    }
  }, [metaTitle, title]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-white">
      <PublicHeader />
      {(title || subtitle) && (
        <section className="bg-gradient-to-br from-primary/10 to-white py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </section>
      )}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-border py-2 px-6 text-xs text-muted-foreground text-center">
        © 2025 عقاركم - جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
