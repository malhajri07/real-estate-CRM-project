import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      className="flex items-center gap-2 h-9 px-3 bg-sidebar-accent hover:bg-sidebar-accent/80 border-sidebar-border apple-transition rounded-xl"
      data-testid="language-toggle"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium tracking-tight">
        {language === 'ar' ? t('language.english') : t('language.arabic')}
      </span>
    </Button>
  );
}