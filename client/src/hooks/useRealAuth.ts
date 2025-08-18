import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userLevel: number;
  companyName: string;
  tenantId: string;
}

export function useRealAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const currentUserStr = localStorage.getItem("currentUser");
      const authToken = localStorage.getItem("authToken");
      
      if (currentUserStr && authToken) {
        const currentUser = JSON.parse(currentUserStr) as User;
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userLevel");
    localStorage.removeItem("tenantId");
    setUser(null);
    setIsAuthenticated(false);
  };

  const getUserLevelLabel = () => {
    if (!user) return "";
    switch (user.userLevel) {
      case 1: return "مدير المنصة";
      case 2: return "مالك الحساب";
      case 3: return "حساب فرعي";
      default: return "مستخدم";
    }
  };

  const canAccessAdminFeatures = () => {
    return user?.userLevel === 1; // Platform admin only
  };

  const canManageUsers = () => {
    return user?.userLevel === 1 || user?.userLevel === 2; // Platform admin or account owner
  };

  const getTenantId = () => {
    return user?.tenantId || null;
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    getUserLevelLabel,
    canAccessAdminFeatures,
    canManageUsers,
    getTenantId,
    refreshAuth: checkAuthStatus
  };
}