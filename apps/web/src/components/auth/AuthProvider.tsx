import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * UserRole Enum - Defines all possible user roles in the RBAC system
 * 
 * This enum is defined locally on the client side since @prisma/client 
 * is not available in the browser environment. Each role represents
 * a different level of access and permissions within the real estate platform.
 */
export enum UserRole {
  WEBSITE_ADMIN = 'WEBSITE_ADMIN',    // Platform owner/admin with full system access
  CORP_OWNER = 'CORP_OWNER',          // Corporate account owner/manager
  CORP_AGENT = 'CORP_AGENT',          // Licensed agent under a corporate organization
  INDIV_AGENT = 'INDIV_AGENT',        // Licensed independent agent (no corporate affiliation)
  SELLER = 'SELLER',                  // Individual customer selling property
  BUYER = 'BUYER',                    // Individual customer looking to buy property
}

/**
 * User Interface - Defines the structure of a user object
 * 
 * This interface represents a user in the system with their basic information,
 * roles, and optional organization/agent profile data. The organization and
 * agent profile are optional since not all users belong to organizations
 * or have agent profiles (e.g., individual buyers/sellers).
 */
interface User {
  id: string;                    // Unique user identifier
  username?: string;             // Username for login and display
  email?: string;                // User's email address (optional)
  name: string;                  // User's display name
  firstName?: string | null;     // Optional given name for display in admin UI
  lastName?: string | null;      // Optional family name for display in admin UI
  roles: UserRole[];             // Array of roles assigned to this user (multi-role support)
  organizationId?: string;       // Optional: ID of the organization this user belongs to
  organization?: {               // Optional: Full organization details
    id: string;
    legalName: string;           // Official legal name of the organization
    tradeName: string;           // Trading/business name of the organization
  };
  agentProfile?: {               // Optional: Agent-specific profile information
    id: string;
    licenseNo: string;           // Real estate license number
    territories: string[];       // Geographic areas the agent covers
    specialties: string[];       // Types of properties the agent specializes in
  };
}

/**
 * AuthContextType Interface - Defines the shape of the authentication context
 * 
 * This interface describes all the properties and methods available through
 * the authentication context. Components can use these to access user state,
 * perform authentication operations, and check permissions.
 */
interface AuthContextType {
  user: User | null;                                    // Current authenticated user (null if not logged in)
  token: string | null;                                 // JWT token for API authentication (null if not logged in)
  login: (username: string, password: string) => Promise<void>;  // Function to authenticate user with credentials
  logout: () => void;                                   // Function to log out the current user
  isLoading: boolean;                                   // Loading state for authentication operations
  hasRole: (roles: UserRole[]) => boolean;             // Function to check if user has any of the specified roles
  hasPermission: (permission: string) => boolean;      // Function to check if user has a specific permission
}

// Create the React context for authentication state management
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * ROLE_PERMISSIONS - Permission mapping for each user role
 * 
 * This object defines what permissions each role has in the system.
 * It implements the RBAC (Role-Based Access Control) system by mapping
 * each role to an array of specific permissions they can perform.
 * 
 * Permissions are granular actions that can be performed in the system,
 * such as managing users, viewing data, or performing specific operations.
 */
const ROLE_PERMISSIONS = {
  WEBSITE_ADMIN: [              // Platform administrator with full system access
    'manage_users',             // Create, edit, delete user accounts
    'manage_organizations',     // Manage corporate organizations
    'manage_roles',             // Assign and modify user roles
    'view_all_data',            // Access to all system data across all organizations
    'impersonate_users',        // Login as other users for support purposes
    'manage_site_settings',     // Configure global platform settings
    'view_audit_logs'           // Access to system audit and activity logs
  ],
  CORP_OWNER: [                 // Corporate account owner/manager
    'manage_org_profile',       // Update organization information
    'manage_org_agents',        // Invite, enable/disable agents in their organization
    'view_org_data',            // View all data within their organization
    'search_buyer_pool',        // Search the global buyer pool
    'reassign_leads',           // Reassign leads between agents in their organization
    'view_org_reports'          // Access to organization-specific reports and analytics
  ],
  CORP_AGENT: [                 // Licensed agent under a corporate organization
    'manage_own_properties',    // Create, edit, delete their own property listings
    'view_org_properties',      // View properties listed by other agents in their organization
    'search_buyer_pool',        // Search the global buyer pool for potential clients
    'claim_buyer_requests',     // Claim buyer requests to work with potential clients
    'manage_own_leads',         // Manage leads they have claimed or been assigned
    'view_org_leads'            // View leads from other agents in their organization
  ],
  INDIV_AGENT: [                // Independent licensed agent (no corporate affiliation)
    'manage_own_properties',    // Create, edit, delete their own property listings
    'search_buyer_pool',        // Search the global buyer pool for potential clients
    'claim_buyer_requests',     // Claim buyer requests to work with potential clients
    'manage_own_leads'          // Manage only their own leads (no organization access)
  ],
  SELLER: [                     // Individual customer selling property
    'manage_own_submissions',   // Create and manage their property sale submissions
    'view_own_leads'            // View leads from agents interested in their property
  ],
  BUYER: [                      // Individual customer looking to buy property
    'manage_own_requests',      // Create and manage their property purchase requests
    'view_own_claims'           // View which agents have claimed their requests
  ]
};

/**
 * AuthProvider Component - Main authentication context provider
 * 
 * This component provides authentication state and methods to all child components
 * through React Context. It manages user login/logout, token storage, and permission
 * checking. The provider wraps the entire application to make authentication
 * available everywhere.
 * 
 * @param children - React components that will have access to authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State management for authentication
  const [user, setUser] = useState<User | null>(null);        // Current authenticated user
  const [token, setToken] = useState<string | null>(null);    // JWT token for API calls
  const [isLoading, setIsLoading] = useState(true);          // Loading state during auth operations
  const [, setLocation] = useLocation(); // Imperative navigation helper for post-login redirects
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // يحفظ مؤقت الخمول الحالي لإعادة ضبطه عند التفاعل
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // مؤقت تنبيه قبل انتهاء الجلسة
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null); // يحدّث العد التنازلي كل ثانية
  const [showSessionWarning, setShowSessionWarning] = useState(false); // تحديد ما إذا كان يجب عرض نافذة التحذير
  const [sessionExpired, setSessionExpired] = useState(false); // يحدد ما إذا كانت الجلسة منتهية بسبب الخمول
  const [countdownSeconds, setCountdownSeconds] = useState(0); // عدد الثواني المتبقية قبل تسجيل الخروج التلقائي
  const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 120 ثانية بدون تفاعل تؤدي إلى تسجيل الخروج تلقائياً
  const WARNING_LEAD_TIME_MS = 30 * 1000; // نعرض نافذة تحذير قبل 30 ثانية من انتهاء الجلسة

  /**
   * hasRole - Check if the current user has any of the specified roles
   * 
   * This function implements role-based access control by checking if the
   * current user has any of the roles passed in the array. It returns true
   * if the user has at least one of the specified roles.
   * 
   * @param roles - Array of UserRole enums to check against
   * @returns boolean - true if user has any of the specified roles, false otherwise
   */
  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;  // No user logged in, no roles
    return roles.some(role => user.roles.includes(role));  // Check if user has any of the specified roles
  };

  /**
   * hasPermission - Check if the current user has a specific permission
   * 
   * This function checks if the current user has a specific permission by
   * looking up their roles in the ROLE_PERMISSIONS mapping. It returns true
   * if any of the user's roles grant the specified permission.
   * 
   * @param permission - String permission to check (e.g., 'manage_users', 'view_all_data')
   * @returns boolean - true if user has the permission, false otherwise
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;  // No user logged in, no permissions
    return user.roles.some(role => 
      ROLE_PERMISSIONS[role]?.includes(permission)  // Check if any role grants this permission
    );
  };

  /**
   * login - Authenticate user with email and password
   * 
   * This function handles user authentication by sending credentials to the backend
   * API. On successful authentication, it stores the user data and JWT token in
   * both React state and localStorage for persistence across browser sessions.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if authentication fails
   */
  const login = async (username: string, password: string) => {
    try {
      // Log login attempt (password is masked for security)
      console.log('Attempting login with:', { username, password: password ? '***' : 'undefined' });
      
      // Normalize username client-side (lowercase/trim)
      const normalized = (username || '').trim().toLowerCase();

      // Send authentication request to backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: normalized, password }),
      });

      // Parse response data robustly (handle non-JSON)
      const raw = await response.text();
      let data: any;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (e) {
        data = { message: raw };
      }
      console.log('Login response:', { status: response.status, data });

      // Check if request was successful
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // Process successful authentication
      if (data.success) {
        setUser(data.user);                    // Set user in React state
        setToken(data.token);                  // Set token in React state
        localStorage.setItem('auth_token', data.token);              // Persist token in localStorage
        localStorage.setItem('user_data', JSON.stringify(data.user)); // Persist user data in localStorage
        setSessionExpired(false);
        console.log('Login successful, user set:', data.user);

        // Redirect users based on role after the auth state is stored. Admins land on the RBAC dashboard,
        // while everyone else goes to the main platform shell. (Requested to document every change.)
        const roles: string[] = Array.isArray(data.user?.roles) ? data.user.roles : [];
        if (roles.includes(UserRole.WEBSITE_ADMIN)) {
          setLocation('/admin/overview/main-dashboard');
        } else {
          setLocation('/home/platform');
        }
      } else {
        throw new Error(data.message || data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;  // Re-throw error for component handling
    }
  };

  /**
   * logout - Log out the current user and clear all authentication data
   * 
   * This function clears all authentication state by removing user data and tokens
   * from both React state and localStorage. This ensures the user is completely
   * logged out and no authentication data persists.
   */
  const performLogout = (keepExpiredNotice = false) => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current);
      warningTimer.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (!keepExpiredNotice) {
      setShowSessionWarning(false);
      setSessionExpired(false);
    }
    setCountdownSeconds(0);
    setUser(null);                                    // Clear user from React state
    setToken(null);                                   // Clear token from React state
    localStorage.removeItem('auth_token');            // Remove token from localStorage
    localStorage.removeItem('user_data');             // Remove user data from localStorage
  };

  const logout = () => {
    performLogout();
  };

  /**
   * useEffect - Check authentication status on component mount
   * 
   * This effect runs once when the AuthProvider component mounts. It checks if there
   * is stored authentication data in localStorage and verifies it with the server.
   * If the token is valid, it restores the user session. If not, it clears the
   * stored data and sets loading to false.
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Retrieve stored authentication data from localStorage
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');

        // If we have both token and user data, verify with server
        if (storedToken && storedUser) {
          // Verify token validity with backend API
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Token is valid, restore user session
              setUser(data.user);
              setToken(storedToken);
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_data');
            }
          } else {
            // Server rejected token, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear storage on any error
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } finally {
        setIsLoading(false);  // Always set loading to false when done
      }
    };

    checkAuth();
  }, []);  // Empty dependency array means this runs only once on mount

  // يضمن هذا المؤثر مراقبة نشاط المستخدم وتسجيل خروجه تلقائياً بعد دقيقتين من الخمول
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (!user) return;
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      setShowSessionWarning(false);
      setSessionExpired(false);
      setCountdownSeconds(0);
      inactivityTimer.current = setTimeout(() => {
        logout();
        setLocation('/login');
      }, INACTIVITY_TIMEOUT_MS);
      warningTimer.current = setTimeout(() => {
        setCountdownSeconds(Math.floor(WARNING_LEAD_TIME_MS / 1000));
        setShowSessionWarning(true);
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
        countdownInterval.current = setInterval(() => {
          setCountdownSeconds((prev) => {
            if (prev <= 1) {
              if (countdownInterval.current) {
                clearInterval(countdownInterval.current);
                countdownInterval.current = null;
              }
              setShowSessionWarning(false);
              setSessionExpired(true);
              performLogout(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, INACTIVITY_TIMEOUT_MS - WARNING_LEAD_TIME_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    if (user) {
      resetInactivityTimer();
      activityEvents.forEach((eventName) => {
        window.addEventListener(eventName, resetInactivityTimer, { passive: true });
      });
    }

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
        warningTimer.current = null;
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [user]);

  // Create the context value object with all authentication state and methods
  const value: AuthContextType = {
    user,           // Current user state
    token,          // Current JWT token
    login,          // Login function
    logout,         // Logout function
    isLoading,      // Loading state
    hasRole,        // Role checking function
    hasPermission,  // Permission checking function
  };

  // Provide the authentication context to all child components
  return (
    <AuthContext.Provider value={value}>
      {children}
      <Dialog
        open={showSessionWarning || sessionExpired}
        onOpenChange={(open) => {
          if (!open) {
            setShowSessionWarning(false);
            setSessionExpired(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md text-right">
          <DialogHeader>
            <DialogTitle>{sessionExpired ? 'تم إنهاء الجلسة بسبب عدم النشاط' : 'انتهاء الجلسة قريباً'}</DialogTitle>
            <DialogDescription>
              {sessionExpired
                ? 'لقد تم إنهاء جلستك تلقائياً بسبب عدم النشاط. الرجاء تسجيل الدخول مرة أخرى لمتابعة العمل.'
                : 'بسبب عدم النشاط سيتم إغلاق الجلسة قريباً. يرجى الضغط على "متابعة" للحفاظ على تسجيل الدخول.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row-reverse items-center gap-2 justify-end">
            {sessionExpired ? (
              <Button
                onClick={() => {
                  setSessionExpired(false);
                  setShowSessionWarning(false);
                  setLocation('/login');
                }}
              >
                تسجيل الدخول
              </Button>
            ) : (
              <>
                <span className="text-sm text-slate-600 font-medium">
                  سيتم الإنهاء خلال&nbsp;{countdownSeconds}&nbsp;ثانية
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSessionWarning(false);
                    if (countdownInterval.current) {
                      clearInterval(countdownInterval.current);
                      countdownInterval.current = null;
                    }
                    performLogout();
                    setLocation('/login');
                  }}
                >
                  تسجيل الخروج الآن
                </Button>
                <Button
                  onClick={() => {
                    setShowSessionWarning(false);
                    setSessionExpired(false);
                    if (countdownInterval.current) {
                      clearInterval(countdownInterval.current);
                      countdownInterval.current = null;
                    }
                    if (inactivityTimer.current) {
                      clearTimeout(inactivityTimer.current);
                      inactivityTimer.current = null;
                    }
                    if (warningTimer.current) {
                      clearTimeout(warningTimer.current);
                      warningTimer.current = null;
                    }
                    setCountdownSeconds(0);
                    const synthetic = new Event('mousemove');
                    window.dispatchEvent(synthetic);
                  }}
                >
                  متابعة الجلسة
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook - Custom hook to access authentication context
 * 
 * This hook provides a convenient way for components to access the authentication
 * context. It ensures that the component is wrapped in an AuthProvider and throws
 * an error if used outside of the provider context.
 * 
 * @returns AuthContextType - The authentication context with user state and methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout, hasRole } = useAuth();
 *   
 *   if (hasRole([UserRole.WEBSITE_ADMIN])) {
 *     return <AdminPanel />;
 *   }
 *   
 *   return <UserPanel />;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Ensure the hook is used within an AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
