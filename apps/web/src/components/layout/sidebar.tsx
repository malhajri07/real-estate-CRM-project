import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { platformSidebarConfig, type PlatformSidebarChildConfig } from "@/config/platform-sidebar";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

interface SidebarProps {
  onLogout?: () => void;
}

const routeMatches = (item: PlatformSidebarChildConfig, currentLocation: string) => {
  if (!currentLocation) return false;
  if (currentLocation === item.path) return true;
  if (item.matchPaths?.includes(currentLocation)) return true;
  if (item.matchPrefixes?.some((prefix) => currentLocation.startsWith(prefix))) return true;
  return false;
};

const findActiveGroupId = (currentLocation: string) => {
  for (const group of platformSidebarConfig) {
    if (group.children.some((child) => routeMatches(child, currentLocation))) {
      return group.id;
    }
  }
  return null;
};

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { t, dir } = useLanguage();

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const activeGroupId = findActiveGroupId(location);
    if (activeGroupId) return [activeGroupId];
    return platformSidebarConfig.length ? [platformSidebarConfig[0].id] : [];
  });

  useEffect(() => {
    const activeGroupId = findActiveGroupId(location);
    if (activeGroupId) {
      setExpandedGroups((prev) => (prev.includes(activeGroupId) ? prev : [...prev, activeGroupId]));
    }
  }, [location]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div className="w-64 md:w-72 bg-white text-slate-700 shadow-md border-l border-slate-200 fixed right-0 top-0 h-full overflow-y-auto z-50">
      <div className="p-4">
        <div className="flex justify-center">
          <img
            src={agarkomLogo}
            alt="عقاركم"
            width={180}
            height={101}
            loading="lazy"
            decoding="async"
            className="h-24 w-auto object-contain"
          />
        </div>
      </div>

      <nav className="px-4 md:px-6 pb-6">
        <ul className="space-y-3">
          {platformSidebarConfig.map((group) => {
            const GroupIcon = group.icon;
            const groupLabel = group.label ?? (group.labelKey ? t(group.labelKey) : group.id);
            const isExpanded = expandedGroups.includes(group.id);
            const isActiveGroup = group.children.some((child) => routeMatches(child, location));

            return (
              <li key={group.id} className="space-y-2">
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center px-4 py-3 rounded-lg transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    isActiveGroup ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                >
                  <div
                    className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-md",
                      dir === "rtl" ? "ml-3" : "mr-3",
                      isActiveGroup ? "text-emerald-600" : "text-slate-500"
                    )}
                  >
                    <GroupIcon size={18} />
                  </div>
                  <span className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>{groupLabel}</span>
                  <span className={cn(dir === "rtl" ? "mr-2" : "ml-2")}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </button>

                {isExpanded && (
                  <ul className="space-y-1">
                    {group.children.map((item) => {
                      const ItemIcon = item.icon;
                      const itemLabel = item.label ?? (item.labelKey ? t(item.labelKey) : item.id);
                      const isActive = routeMatches(item, location);

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.path}
                            className={cn(
                              "flex items-center px-4 py-2 rounded-md transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                              dir === "rtl" ? "text-right" : "text-left",
                              isActive ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 flex items-center justify-center rounded-md",
                                dir === "rtl" ? "ml-3" : "mr-3",
                                isActive ? "text-white" : "text-slate-500"
                              )}
                            >
                              <ItemIcon size={16} />
                            </div>
                            <span className="flex-1">{itemLabel}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {onLogout && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2 rounded-md transition-colors text-slate-600 hover:bg-slate-100 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              data-testid="button-logout"
            >
              <div
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-md",
                  dir === "rtl" ? "ml-3" : "mr-3"
                )}
              >
                <LogOut size={18} />
              </div>
              <span className="text-sm tracking-tight">تسجيل الخروج</span>
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
