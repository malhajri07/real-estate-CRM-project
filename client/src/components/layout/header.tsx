import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HeaderProps {
  title: string;
  onAddClick?: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export default function Header({ title, onAddClick, onSearch, searchPlaceholder = "Search..." }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span>Last updated: <span>2 minutes ago</span></span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-80 pl-10"
            />
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          </div>
          
          {/* Quick Actions */}
          {onAddClick && (
            <Button onClick={onAddClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2" size={16} />
              Add Lead
            </Button>
          )}
          
          {/* Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <span className="text-slate-600 text-sm font-medium">SJ</span>
            </div>
            <span className="text-sm font-medium text-slate-700">Sarah Johnson</span>
          </div>
        </div>
      </div>
    </header>
  );
}
