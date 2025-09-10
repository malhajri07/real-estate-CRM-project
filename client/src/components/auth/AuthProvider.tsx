import React, { createContext, useContext, useEffect, useState } from 'react';

// Define UserRole enum locally since @prisma/client is not available on client side
export enum UserRole {
  WEBSITE_ADMIN = 'WEBSITE_ADMIN',
  CORP_OWNER = 'CORP_OWNER',
  CORP_AGENT = 'CORP_AGENT',
  INDIV_AGENT = 'INDIV_AGENT',
  SELLER = 'SELLER',
  BUYER = 'BUYER',
}

interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  organizationId?: string;
  organization?: {
    id: string;
    legalName: string;
    tradeName: string;
  };
  agentProfile?: {
    id: string;
    licenseNo: string;
    territories: string[];
    specialties: string[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role permissions mapping
const ROLE_PERMISSIONS = {
  WEBSITE_ADMIN: [
    'manage_users',
    'manage_organizations',
    'manage_roles',
    'view_all_data',
    'impersonate_users',
    'manage_site_settings',
    'view_audit_logs'
  ],
  CORP_OWNER: [
    'manage_org_profile',
    'manage_org_agents',
    'view_org_data',
    'search_buyer_pool',
    'reassign_leads',
    'view_org_reports'
  ],
  CORP_AGENT: [
    'manage_own_properties',
    'view_org_properties',
    'search_buyer_pool',
    'claim_buyer_requests',
    'manage_own_leads',
    'view_org_leads'
  ],
  INDIV_AGENT: [
    'manage_own_properties',
    'search_buyer_pool',
    'claim_buyer_requests',
    'manage_own_leads'
  ],
  SELLER: [
    'manage_own_submissions',
    'view_own_leads'
  ],
  BUYER: [
    'manage_own_requests',
    'view_own_claims'
  ]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has specific role
  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.some(role => user.roles.includes(role));
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.roles.some(role => 
      ROLE_PERMISSIONS[role]?.includes(permission)
    );
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email, password: password ? '***' : 'undefined' });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        console.log('Login successful, user set:', data.user);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');

        if (storedToken && storedUser) {
          // Verify token with server
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.user);
              setToken(storedToken);
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_data');
            }
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear storage on error
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
