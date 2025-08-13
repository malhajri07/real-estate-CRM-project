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
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      data-testid="language-toggle"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm">
        {language === 'ar' ? t('language.english') : t('language.arabic')}
      </span>
    </Button>
  );
}