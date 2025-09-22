/**
 * Header Component - Main Application Header
 * 
 * This component provides a floating header that appears above the main content area.
 * It includes:
 * - Page title display
 * - Search functionality
 * - Action buttons (optional)
 * - Proper RTL support
 * - Responsive design
 * 
 * The header is positioned as a floating element above the main content,
 * following modern UI/UX best practices.
 */

import { Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showActions?: boolean;
}

export default function Header({ 
  onSearch, 
  searchPlaceholder,
  showSearch = true,
  showActions = true
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const defaultPlaceholder = searchPlaceholder || t('form.search') || "البحث...";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  // Extract username from email (everything before @)
  const getUsername = () => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return "المستخدم";
  };

  // Mock notification count - in real app this would come from API
  const notificationCount = 3;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm h-16">
      <div className="flex items-center gap-4 px-6 h-full w-full" dir="ltr">
        {/* Notifications (far left) */}
        {showActions && (
          <div className="flex items-center shrink-0 order-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-sm">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Search Bar (center, grows) */}
        {showSearch && (
          <div className="relative flex-1 min-w-0 order-2">
            <Input
              type="text"
              placeholder={defaultPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-10 bg-gray-50/80 border-gray-200 rounded-md pr-12 pl-4 text-sm text-right placeholder:text-right focus:bg-white focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 focus:shadow-sm transition-all duration-200"
            />
            <Search className="absolute right-4 top-3 text-gray-400" size={16} />
          </div>
        )}

        {/* User cluster (far right) */}
        {showActions && (
          <div className="flex items-center gap-3 shrink-0 order-3 ml-2">
            <span className="text-sm font-medium text-gray-700">{getUsername()}</span>
            <div className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm bg-emerald-600">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
