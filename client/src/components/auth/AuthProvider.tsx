import React, { createContext, useContext, useEffect, useState } from 'react';

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
  email: string;                 // User's email address (used for login)
  name: string;                  // User's display name
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
  login: (email: string, password: string) => Promise<void>;  // Function to authenticate user with credentials
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
  const login = async (email: string, password: string) => {
    try {
      // Log login attempt (password is masked for security)
      console.log('Attempting login with:', { email, password: password ? '***' : 'undefined' });
      
      // Send authentication request to backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Parse response data
      const data = await response.json();
      console.log('Login response:', { status: response.status, data });

      // Check if request was successful
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Process successful authentication
      if (data.success) {
        setUser(data.user);                    // Set user in React state
        setToken(data.token);                  // Set token in React state
        localStorage.setItem('auth_token', data.token);              // Persist token in localStorage
        localStorage.setItem('user_data', JSON.stringify(data.user)); // Persist user data in localStorage
        console.log('Login successful, user set:', data.user);
      } else {
        throw new Error(data.message || 'Login failed');
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
  const logout = () => {
    setUser(null);                                    // Clear user from React state
    setToken(null);                                   // Clear token from React state
    localStorage.removeItem('auth_token');            // Remove token from localStorage
    localStorage.removeItem('user_data');             // Remove user data from localStorage
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
