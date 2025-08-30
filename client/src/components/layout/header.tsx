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
    <header className="bg-card border-b border-border/50 px-8 py-4 apple-shadow relative z-10">
      <div className="flex items-center justify-center w-full">
        {/* Full Width Search Bar */}
        <div className="relative w-full">
          <Input
            type="text"
            placeholder={searchPlaceholder || "البحث بالاسم أو رقم الهاتف أو المدينة..."}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-12 bg-white border-slate-200 rounded-2xl pl-12 pr-6 text-sm font-medium shadow-sm focus:shadow-md focus:border-primary/50 transition-all duration-200"
          />
          <Search className="absolute left-4 top-4 text-slate-400" size={16} />
        </div>
      </div>
    </header>
  );
}
