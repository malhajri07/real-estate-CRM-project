import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

interface HeaderProps {
  title: string;
  onAddClick?: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export default function Header({ title, onAddClick, onSearch, searchPlaceholder }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  
  const defaultPlaceholder = searchPlaceholder || t('form.search') || "Search...";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border/50 px-8 py-6 apple-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 space-x-reverse">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{title}</h2>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder={defaultPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-80 h-10 bg-muted/30 border-border/50 rounded-xl pl-10 pr-4 text-sm font-medium apple-transition focus:bg-background focus:border-primary/50"
            />
            <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
          </div>
          
          {/* Quick Actions */}
          {onAddClick && (
            <Button 
              onClick={onAddClick} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-2 h-10 font-medium tracking-tight apple-transition hover:scale-105 apple-shadow"
            >
              <Plus className="ml-2" size={16} />
              {t('leads.add_lead') || 'Add New Lead'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
