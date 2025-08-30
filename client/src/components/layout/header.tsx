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
    <header className="bg-card border-b border-border/50 px-8 py-6 apple-shadow relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 space-x-reverse">
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
          
        </div>
      </div>
    </header>
  );
}
