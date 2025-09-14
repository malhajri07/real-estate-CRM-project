import { Button } from "@/components/ui/button";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PublicHeader() {
  const { t } = useLanguage();
  const isAuth = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img src={agarkomLogo} alt="عقاركم" className="h-10 ml-2" />
          </a>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
          <a href="/search-properties" className="hover:text-primary">{t('nav.search')}</a>
          <a href="/listings" className="hover:text-primary">{t('nav.listings')}</a>
          <a href="/agencies" className="hover:text-primary">{t('nav.agencies')}</a>
          <a href="/post-listing" className="hover:text-primary">{t('nav.post_listing')}</a>
          <a href="/favorites" className="hover:text-primary">{t('nav.favorites')}</a>
          <a href="/compare" className="hover:text-primary">{t('nav.compare')}</a>
          <a href="/saved-searches" className="hover:text-primary">عمليات البحث</a>
          <a href="/contact" className="hover:text-primary">اتصل بنا</a>
        </nav>
        <div className="flex items-center gap-2">
          {isAuth ? (
            <Button variant="outline" className="border-primary text-primary" onClick={() => (window.location.href = '/')}>{t('nav.dashboard')}</Button>
          ) : (
            <>
              <Button variant="outline" className="border-primary text-primary" onClick={() => (window.location.href = '/login')}>{t('nav.login')}</Button>
              <Button className="bg-primary text-white" onClick={() => (window.location.href = '/signup')}>{t('nav.signup')}</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
