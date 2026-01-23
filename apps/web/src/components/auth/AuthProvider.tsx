/**
 * AuthProvider.tsx - Authentication Context Provider
 * 
 * Location: apps/web/src/ → Components/ → Auth Components → AuthProvider.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Authentication context provider for the React application. Provides:
 * - User authentication state management
 * - Login/logout functionality
 * - User session management
 * - Role-based access control integration
 * 
 * Related Files:
 * - apps/web/src/pages/rbac-login.tsx - Login page
 * - apps/api/routes/auth.ts - Authentication API routes
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserRole, ROLE_PERMISSIONS, normalizeRoleKeys } from '@shared/rbac';
import { logger } from '@/lib/logger';
export { UserRole } from '@shared/rbac';

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
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;  // Function to authenticate user with credentials
  logout: () => void;                                   // Function to log out the current user
  isLoading: boolean;                                   // Loading state for authentication operations
  hasRole: (roles: UserRole[]) => boolean;             // Function to check if user has any of the specified roles
  hasPermission: (permission: string) => boolean;      // Function to check if user has a specific permission
}

// Create the React context for authentication state management
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ROLE_PERMISSIONS comes from the shared RBAC module so the client stays in sync with the API.

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
  // Dynamic timeout: 30 minutes standard, 7 days if "Remember Me" is active
  const isRemembered = localStorage.getItem('remember_me') === 'true';
  const INACTIVITY_TIMEOUT_MS = isRemembered ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000;

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
   * @param identifier - User's email address or username
   * @param password - User's password
   * @throws Error if authentication fails
   */
  const login = async (identifier: string, password: string, rememberMe: boolean = false) => {
    try {
      // Log login attempt (password is masked for security)
      logger.debug('Attempting login', {
        context: 'AuthProvider',
        data: { identifier, password: password ? '***' : 'undefined' }
      });

      // Normalize identifier client-side (trim + lowercase for matching)
      const rawIdentifier = (identifier || '').trim();
      if (!rawIdentifier) {
        throw new Error('يرجى إدخال البريد الإلكتروني أو اسم المستخدم');
      }
      const isEmail = rawIdentifier.includes('@');
      const normalized = rawIdentifier.toLowerCase();

      const payload: Record<string, string> = {
        identifier: normalized,
        password,
      };

      if (isEmail) {
        payload.email = normalized;
      } else {
        payload.username = normalized;
      }

      // Send authentication request to backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies for session
        body: JSON.stringify(payload),
      });

      // Parse response data robustly (handle non-JSON)
      const raw = await response.text();
      let data: any;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (e) {
        data = { message: raw };
      }
      logger.debug('Login response received', {
        context: 'AuthProvider',
        data: {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data
        }
      });

      // Check if request was successful
      if (!response.ok) {
        const errorMessage = data.message || data.error || `Login failed (${response.status} ${response.statusText})`;
        logger.error('Login failed', {
          context: 'AuthProvider',
          data: {
            status: response.status,
            statusText: response.statusText,
            data,
            errorMessage
          }
        });
        throw new Error(errorMessage);
      }

      // Process successful authentication
      if (data.success) {
        const normalizedRoles = normalizeRoleKeys(data.user?.roles);
        const normalizedUser = { ...data.user, roles: normalizedRoles } as User;
        setUser(normalizedUser);                    // Set user in React state
        setToken(data.token);                  // Set token in React state
        localStorage.setItem('auth_token', data.token);              // Persist token in localStorage
        localStorage.setItem('user_data', JSON.stringify(normalizedUser)); // Persist user data in localStorage
        localStorage.setItem('remember_me', String(rememberMe)); // Persist remember me preference
        setSessionExpired(false);
        logger.info('Login successful', {
          context: 'AuthProvider',
          data: { userId: data.user?.id, roles: data.user?.roles }
        });

        // Redirect users based on role after the auth state is stored. 
        // WEBSITE_ADMIN → Admin Dashboard
        // CORP_OWNER, CORP_AGENT, INDIV_AGENT → Platform Dashboard
        // SELLER, BUYER → Platform Dashboard (limited access for now)
        const roles = normalizedRoles;
        if (roles.includes(UserRole.WEBSITE_ADMIN)) {
          // Use setLocation for a smooth client-side transition
          setLocation('/admin/overview/main-dashboard');
        } else if (roles.some(role =>
          [UserRole.CORP_OWNER, UserRole.CORP_AGENT, UserRole.INDIV_AGENT].includes(role)
        )) {
          setLocation('/home/platform');
        } else if (roles.some(role =>
          [UserRole.SELLER, UserRole.BUYER].includes(role)
        )) {
          setLocation('/home/platform');
        } else {
          // Fallback for users with no recognized roles
          setLocation('/home/platform');
        }
      } else {
        throw new Error(data.message || data.error || 'Login failed');
      }
    } catch (error) {
      logger.error('Login error', {
        context: 'AuthProvider',
        data: { error: error instanceof Error ? error.message : String(error) }
      });
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
    localStorage.removeItem('remember_me');           // Clear remember me preference
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
              const normalizedUser = { ...data.user, roles: normalizeRoleKeys(data.user?.roles) } as User;
              setUser(normalizedUser);
              setToken(storedToken);
              localStorage.setItem('user_data', JSON.stringify(normalizedUser));
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
        logger.error('Auth check error', {
          context: 'AuthProvider',
          data: { error: error instanceof Error ? error.message : String(error) }
        });
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

    const activityEvents = ['keydown', 'click', 'scroll', 'touchstart'];

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
        <DialogContent className="sm:max-w-md text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">{sessionExpired ? 'تم إنهاء الجلسة بسبب عدم النشاط' : 'انتهاء الجلسة قريباً'}</DialogTitle>
            <DialogDescription className="text-right">
              {sessionExpired
                ? 'لقد تم إنهاء جلستك تلقائياً بسبب عدم النشاط. الرجاء تسجيل الدخول مرة أخرى لمتابعة العمل.'
                : 'بسبب عدم النشاط سيتم إغلاق الجلسة قريباً. يرجى الضغط على "متابعة" للحفاظ على تسجيل الدخول.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row-reverse items-center gap-2 justify-start">
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
                    // Dispatch a click event to reset the inactivity timer
                    const synthetic = new Event('click');
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
