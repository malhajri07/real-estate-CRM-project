/**
 * App.tsx - Main Application Component
 * 
 * This is the root component of the real estate CRM application. It handles:
 * - Application routing and navigation
 * - Authentication state management
 * - Context providers setup (Query, Language, Auth, Tooltip)
 * - Layout management for authenticated vs unauthenticated users
 * - Lazy loading of page components for performance optimization
 * - Navigation loading states and transitions
 * 
 * The application uses a role-based access control (RBAC) system with different
 * layouts for authenticated users (with sidebar) and public users (landing page).
 * 
 * Key Features:
 * - Wouter-based client-side routing
 * - React Query for server state management
 * - RTL (Right-to-Left) language support for Arabic
 * - JWT-based authentication with persistent sessions
 * - Lazy loading for better performance
 * - Responsive design with Tailwind CSS
 */

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth, UserRole } from "@/components/auth/AuthProvider";

// Core page imports - loaded immediately for critical routes
import Landing from "@/pages/landing";
import SignupSelection from "@/pages/signup-selection";
import SignupIndividual from "@/pages/signup-individual";
import SignupCorporate from "@/pages/signup-corporate";
import SignupSuccess from "@/pages/signup-success";
import KYCSubmitted from "@/pages/kyc-submitted";
import CMSAdmin from "@/pages/cms-admin";
import Dashboard from "@/pages/dashboard";
import SearchProperties from "@/pages/search-properties";
import Leads from "@/pages/leads";
import Customers from "@/pages/customers";
import Properties from "@/pages/properties";
import Pipeline from "@/pages/pipeline";
import Clients from "@/pages/clients";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import PropertyDetail from "@/pages/property-detail";
import Sidebar from "@/components/layout/sidebar";
import PlatformShell from "@/components/layout/PlatformShell";
import Header from "@/components/layout/header";
import RBACDashboard from "@/pages/rbac-dashboard";
import RBACLoginPage from "@/pages/rbac-login";
import PlatformPage from "@/pages/app";
import UnverfiedListingPage from "@/pages/unverfied_Listing";
import MarketingRequestSubmissionPage from "@/pages/marketing-request";
import MarketingRequestsBoardPage from "@/pages/marketing-requests";
import { adminSidebarConfig } from "@/config/admin-sidebar";

// Lazy-loaded page imports - loaded on demand for better performance
const FavoritesPage = lazy(() => import("@/pages/favorites"));
const ComparePage = lazy(() => import("@/pages/compare"));
const PostListingPage = lazy(() => import("@/pages/post-listing"));
const ModerationQueuePage = lazy(() => import("@/pages/moderation"));
const AgenciesPage = lazy(() => import("@/pages/agencies"));
const AgencyPage = lazy(() => import("@/pages/agency"));
const AgentPage = lazy(() => import("@/pages/agent"));
const PublicListingPage = lazy(() => import("@/pages/listing"));
const SavedSearchesPage = lazy(() => import("@/pages/saved-searches"));
const RealEstateRequestsPage = lazy(() => import("@/pages/real-estate-requests"));
const CustomerRequestsPage = lazy(() => import("@/pages/customer-requests"));
const AdminRequestsPage = lazy(() => import("@/pages/admin-requests"));

const ADMIN_DASHBOARD_ROUTES = Array.from(
  new Set<string>([
    "/rbac-dashboard",
    "/admin",
    "/overview/dashboard",
    "/overview/main-dashboard",
    "/admin/overview/main-dashboard",
    ...adminSidebarConfig.flatMap((section) => section.children.map((child) => child.route))
  ])
);


/**
 * Router Component - Main routing logic for the application
 * 
 * This component handles:
 * - Authentication state checking
 * - Route rendering based on authentication status
 * - Navigation loading states for better UX
 * - Layout management (sidebar for authenticated users)
 * - Public vs private route separation
 * 
 * The router uses a two-tier approach:
 * 1. Unauthenticated users see public pages (landing, login, signup)
 * 2. Authenticated users see the full CRM with sidebar navigation
 */
function Router() {
  // Get authentication state from AuthProvider context
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isAdmin = !!user?.roles?.includes?.(UserRole.WEBSITE_ADMIN); // Helper flag to distinguish admin flow from standard platform users.

  // Guard against admins momentarily visiting the platform shell; if they land there (e.g. via browser history) we immediately send them back to RBAC.
  // Navigation loading overlay should only run for normal platform users, never for admins (so RBAC loads without flashing the platform shell).
  useEffect(() => {
    if (isAdmin && location.startsWith('/home/platform')) {
      setLocation('/admin/overview/main-dashboard', { replace: true });
    }
  }, [isAdmin, location, setLocation]);
  
  // Navigation loading state for smooth transitions
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);
  const [previousLocation, setPreviousLocation] = useState("");
  const [isNormalizingUrl, setIsNormalizingUrl] = useState(false);
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Normalize trailing slashes to avoid duplicate route definitions
  const hasTrailingSlash = location.length > 1 && location.endsWith('/');
  useEffect(() => {
    if (hasTrailingSlash) {
      const normalized = location.replace(/\/+$/, '');
      setIsNormalizingUrl(true);
      if (normalized !== location) {
        setLocation(normalized, { replace: true });
      }
    } else if (isNormalizingUrl) {
      setIsNormalizingUrl(false);
    }
  }, [location, setLocation, hasTrailingSlash, isNormalizingUrl]);

  const shouldShowNormalizationScreen = hasTrailingSlash || isNormalizingUrl;

  if (shouldShowNormalizationScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-sm">جار تهيئة الرابط...</p>
        </div>
      </div>
    );
  }

  if (hash === '#list') {
    return <UnverfiedListingPage />;
  }

  // Determine if user is authenticated
  const isAuthenticated = !!user;
  
  // Debug authentication state
  console.log('Auth Debug:', {
    isAuthenticated,
    isLoading,
    user: user ? 'authenticated' : 'not authenticated'
  });
  
  // Detect which server port is being used
  const isDashboardPort = (window as any).SERVER_PORT === '3000' || window.location.port === '3000';
  
  // Debug logging
  console.log('Routing Debug:', {
    SERVER_PORT: (window as any).SERVER_PORT,
    locationPort: window.location.port,
    isDashboardPort,
    isAuthenticated,
    location
  });

  // Logout handler for platform routes
  const handlePlatformLogout = () => {
    logout();
    setLocation('/home');
  };

  // Provide standalone rendering for the public property search page
  if (location.startsWith('/search-properties')) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
        <SearchProperties />
      </Suspense>
    );
  }

  type PlatformRouteOptions = {
    title?: string;
    searchPlaceholder?: string;
  };

  type PlatformRenderableComponent = ComponentType<any> | LazyExoticComponent<ComponentType<any>>;

  const renderPlatformShellRoute = (
    Component: PlatformRenderableComponent,
    options: PlatformRouteOptions = {}
  ) => () => (
    <PlatformShell
      onLogout={handlePlatformLogout}
      title={options.title}
      searchPlaceholder={options.searchPlaceholder}
    >
      <Component />
    </PlatformShell>
  );

  const platformShellRoutes: Array<{
    path: string;
    component: PlatformRenderableComponent;
    options?: PlatformRouteOptions;
    aliases?: string[];
  }> = [
    { path: '/home/platform/customers', component: Customers, aliases: ['/customers'] },
    { path: '/home/platform/properties', component: Properties, aliases: ['/properties'] },
    { path: '/home/platform/leads', component: Leads, aliases: ['/leads'] },
    { path: '/home/platform/pipeline', component: Pipeline, aliases: ['/pipeline'] },
    { path: '/home/platform/clients', component: Clients, aliases: ['/clients'] },
    { path: '/home/platform/reports', component: Reports, aliases: ['/reports'] },
    { path: '/home/platform/notifications', component: Notifications, aliases: ['/notifications'] },
    { path: '/home/platform/settings', component: Settings, aliases: ['/settings'] },
    { path: '/home/platform/agencies', component: AgenciesPage, aliases: ['/agencies'] },
    { path: '/home/platform/moderation', component: ModerationQueuePage, aliases: ['/moderation'] },
    { path: '/home/platform/cms', component: CMSAdmin, aliases: ['/cms', '/cms-admin'] },
    { path: '/home/platform/marketing-requests', component: MarketingRequestsBoardPage, aliases: ['/marketing-requests'] },
  ];

  const platformDynamicRoutes: Array<{
    path: string;
    component: PlatformRenderableComponent;
    options?: PlatformRouteOptions;
    aliases?: string[];
  }> = [
    { path: '/home/platform/agency/:id', component: AgencyPage, aliases: ['/agency/:id'] },
    { path: '/home/platform/agent/:id', component: AgentPage, aliases: ['/agent/:id'] },
    { path: '/home/platform/properties/:id', component: PropertyDetail, aliases: ['/properties/:id'] },
    { path: '/home/platform/listing/:id', component: PublicListingPage, aliases: ['/listing/:id'] },
  ];

  const platformAdditionalRoutes: Array<{
    path: string;
    component: PlatformRenderableComponent;
    options?: PlatformRouteOptions;
    aliases?: string[];
  }> = [
    {
      path: '/home/platform/customer-requests',
      component: CustomerRequestsPage,
      options: { title: 'طلبات العملاء', searchPlaceholder: 'ابحث في بيانات العملاء' },
      aliases: ['/customer-requests']
    },
    { path: '/home/platform/admin-requests', component: AdminRequestsPage, aliases: ['/admin/requests'] },
    { path: '/home/platform/favorites', component: FavoritesPage, aliases: ['/favorites'] },
    { path: '/home/platform/compare', component: ComparePage, aliases: ['/compare'] },
    { path: '/home/platform/post-listing', component: PostListingPage, aliases: ['/post-listing'] },
    { path: '/home/platform/saved-searches', component: SavedSearchesPage, aliases: ['/saved-searches'] },
  ];

  /**
   * Handle navigation loading effect for authenticated pages
   * 
   * This creates a smooth loading transition when navigating between
   * authenticated pages. The loading state lasts for 2.5 seconds to
   * provide visual feedback during route changes.
   */
  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setIsNavigationLoading(false);
      setPreviousLocation(location);
      return;
    }
    if (location !== previousLocation && previousLocation !== "") {
      setIsNavigationLoading(true);
      const timer = setTimeout(() => {
        setIsNavigationLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
    setPreviousLocation(location);
  }, [location, isAuthenticated, previousLocation, isAdmin]);

  /**
   * Handle logout functionality
   * 
   * Note: The actual logout logic is handled by the AuthProvider context.
   * This function is passed to the Sidebar component for the logout button.
   */
  const handleLogout = () => {
    // Logout is handled by AuthProvider
  };

  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

// Port-based routing logic:
  // - Port 3000 (Express server): primary host serving both API and frontend
  // - Any other port (e.g. standalone Vite dev server): keep public experience and redirect
  console.log('Port routing check:', { isDashboardPort, isAuthenticated });

  const dashboardRedirectPaths = Array.from(
    new Set<string>([
      "/dashboard",
      "/leads",
      "/customers",
      "/properties",
      "/pipeline",
      "/clients",
      "/reports",
      "/notifications",
      "/admin",
      "/rbac-dashboard",
      "/buyer-pool",
      "/inquiries",
      "/requests",
      "/locations",
      "/cms-admin",
      ...ADMIN_DASHBOARD_ROUTES.filter((path) => path.startsWith("/admin"))
    ])
  );

  const createRedirectComponent = (target: string, message: string) => () => {
    setLocation(target, { replace: true });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">{message}</div>
      </div>
    );
  };
  
  // Standalone Vite dev server (non-dashboard ports) should redirect back to Express
  if (!isDashboardPort) {
    console.log('Non-dashboard port detected: redirecting secured routes to 3000');
    // When running the standalone Vite server, keep public routes here and redirect
    // any authenticated routes back to the Express instance on port 3000
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
      <Switch>
        {/* Dashboard and authenticated routes should redirect to the unified server */}
        {dashboardRedirectPaths.map((path) => (
          <Route
            key={path}
            path={path}
            component={() => {
              window.location.href = `http://localhost:3000${path}`;
              return (
                <div className="min-h-screen flex items-center justify-center">
                  جاري التوجيه إلى لوحة التحكم...
                </div>
              );
            }}
          />
        ))}
        {/* Login route removed - handled by dashboard port section */}
        {/* Landing page */}
        <Route path="/home" component={Landing} />
        <Route path="/unverfied-listing" component={UnverfiedListingPage} />
        <Route path="/unverified-listings" component={UnverfiedListingPage} />
        <Route path="/marketing-request" component={MarketingRequestSubmissionPage} />

        {/* RBAC-aware login accessible from landing */}
        <Route path="/home/login" component={RBACLoginPage} />
        <Route path="/home/platform" component={PlatformPage} />

        {/* Platform Dashboard Routes - All dashboard functionality under /home/platform/ */}
        {platformShellRoutes.flatMap(({ path, component, options, aliases }) => {
          const routes = [
            <Route
              key={path}
              path={path}
              component={renderPlatformShellRoute(component, options)}
            />
          ];
          if (aliases) {
            routes.push(
              ...aliases.map((alias) => (
                <Route
                  key={`${path}-alias-${alias}`}
                  path={alias}
                  component={renderPlatformShellRoute(component, options)}
                />
              ))
            );
          }
          return routes;
        })}

        {platformAdditionalRoutes.flatMap(({ path, component, options, aliases }) => {
          const routes = [
            <Route
              key={path}
              path={path}
              component={renderPlatformShellRoute(component, options)}
            />
          ];
          if (aliases) {
            routes.push(
              ...aliases.map((alias) => (
                <Route
                  key={`${path}-alias-${alias}`}
                  path={alias}
                  component={renderPlatformShellRoute(component, options)}
                />
              ))
            );
          }
          return routes;
        })}

        {platformDynamicRoutes.flatMap(({ path, component, options, aliases }) => {
          const routes = [
            <Route
              key={path}
              path={path}
              component={renderPlatformShellRoute(component, options)}
            />
          ];
          if (aliases) {
            routes.push(
              ...aliases.map((alias) => (
                <Route
                  key={`${path}-alias-${alias}`}
                  path={alias}
                  component={renderPlatformShellRoute(component, options)}
                />
              ))
            );
          }
          return routes;
        })}
        
        {/* Admin Route with RBAC Dashboard - No sidebar/header */}
        <Route path="/home/admin" component={RBACDashboard} />
        
        <Route path="/rbac-login" component={RBACLoginPage} />
        <Route path="/signup" component={SignupSelection} />
        <Route path="/signup/individual" component={SignupIndividual} />
        <Route path="/signup/corporate" component={SignupCorporate} />
        <Route path="/signup/success" component={SignupSuccess} />
        <Route path="/signup/kyc-submitted" component={KYCSubmitted} />
        <Route path="/real-estate-requests" component={RealEstateRequestsPage} />
        {/* Default route for non-dashboard port - redirect to home */}
        <Route component={() => {
          window.location.href = '/home';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى الصفحة الرئيسية...</div>;
        }} />
      </Switch>
      </Suspense>
    );
  }

  // Port 3000 logic: Show dashboard for authenticated users, landing page for unauthenticated users
  if (isDashboardPort && !isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
      <Switch>
        {/* Use RBAC-aware login that integrates with AuthProvider */}
        <Route path="/login" component={RBACLoginPage} />
        <Route path="/rbac-login" component={RBACLoginPage} />
        {/* Test route to verify routing works */}
        <Route path="/test-login">
          {() => {
            console.log('✅ TEST ROUTE MATCHED - /test-login');
            return (
              <div className="min-h-screen flex items-center justify-center bg-red-100">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-800">TEST ROUTE WORKING!</h1>
                  <p className="text-red-600">If you see this, routing is working correctly.</p>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Go to Real Login
                  </button>
                </div>
              </div>
            );
          }}
        </Route>
        <Route path="/unverfied-listing" component={UnverfiedListingPage} />
        <Route path="/unverified-listings" component={UnverfiedListingPage} />
        <Route path="/marketing-request" component={MarketingRequestSubmissionPage} />
        <Route path="/signup" component={SignupSelection} />
        <Route path="/signup/individual" component={SignupIndividual} />
        <Route path="/signup/corporate" component={SignupCorporate} />
        <Route path="/signup/success" component={SignupSuccess} />
        <Route path="/signup/kyc-submitted" component={KYCSubmitted} />
        <Route path="/search-properties" component={SearchProperties} />
        <Route path="/real-estate-requests" component={RealEstateRequestsPage} />
        {ADMIN_DASHBOARD_ROUTES.map((path) => (
          <Route
            key={`guest-admin-${path}`}
            path={path}
            component={createRedirectComponent('/login', 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم')}
          />
        ))}
        {/* Root path for unauthenticated users on port 3000 - show landing */}
        <Route path="/" component={Landing} />
        {/* Fallback */}
        <Route component={Landing} />
      </Switch>
      </Suspense>
    );
  }

  /**
   * Navigation Loading Overlay - Shows during route transitions
   * 
   * This overlay provides visual feedback when navigating between
   * authenticated pages. It maintains the sidebar and header while
   * showing a loading spinner over the main content area.
   */
  // Only render the animated loading overlay for non-admin users; admins should see the RBAC dashboard immediately.
  if (isNavigationLoading && !isAdmin) {
    return (
      <div className="flex h-screen bg-background layout-container">
        <div className="flex-1 flex flex-col pr-72 relative main-content">
          {/* Loading Overlay */}
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">جار التحميل...</p>
            </div>
          </div>
        </div>
        <Sidebar onLogout={handleLogout} />
      </div>
    );
  }

  /**
   * Authenticated Routes - Full CRM application with sidebar navigation
   * 
   * These routes are only accessible to authenticated users and include:
   * - Dashboard and analytics
   * - Property management
   * - Lead and client management
   * - Reports and settings
   * - RBAC dashboard for role-based access control
   * 
   * All authenticated routes use the layout-lock class for consistent
   * sidebar positioning and the mr-72 class for right margin to
   * accommodate the fixed sidebar.
   * 
   * Note: These routes are only shown on port 3000 (dashboard port) for authenticated users
   */
  if (isDashboardPort && isAuthenticated) {
    console.log('Port 3000: Showing authenticated routes (dashboard)');

    // Admin users get access to everything - both platform features and admin features

    const legacyRedirects = [
      // Legacy links (e.g. /dashboard) for non-admin users still land on the platform shell.
      { path: '/dashboard', target: '/home/platform' },
    ];

    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
        <Switch>
          <Route path="/home/platform" component={PlatformPage} />
          <Route path="/unverfied-listing" component={UnverfiedListingPage} />
          <Route path="/unverified-listings" component={UnverfiedListingPage} />

          {platformShellRoutes.flatMap(({ path, component, options, aliases }) => {
            const routes = [
              <Route
                key={path}
                path={path}
                component={renderPlatformShellRoute(component, options)}
              />,
            ];

            if (aliases) {
              routes.push(
                ...aliases.map((alias) => (
                  <Route
                    key={alias}
                    path={alias}
                    component={renderPlatformShellRoute(component, options)}
                  />
                )),
              );
            }

            return routes;
          })}

        {platformAdditionalRoutes.flatMap(({ path, component, options, aliases }) => {
          const routes = [
            <Route
              key={path}
              path={path}
              component={renderPlatformShellRoute(component, options)}
            />
          ];
          if (aliases) {
            routes.push(
              ...aliases.map((alias) => (
                <Route
                  key={`${path}-alias-${alias}`}
                  path={alias}
                  component={renderPlatformShellRoute(component, options)}
                />
              ))
            );
          }
          return routes;
        })}

        {platformDynamicRoutes.flatMap(({ path, component, options, aliases }) => {
          const routes = [
            <Route
              key={path}
              path={path}
              component={renderPlatformShellRoute(component, options)}
            />
          ];
          if (aliases) {
            routes.push(
              ...aliases.map((alias) => (
                <Route
                  key={`${path}-alias-${alias}`}
                  path={alias}
                  component={renderPlatformShellRoute(component, options)}
                />
              ))
            );
          }
          return routes;
        })}

          {/* Ensure direct admin access and redirect legacy login requests for authenticated users */}
          <Route path="/login" component={createRedirectComponent('/admin/overview/main-dashboard', 'جاري التوجيه إلى لوحة التحكم الإدارية...')} />
          {/* RBAC admin dashboard lives outside PlatformShell so it renders without the sidebar header. */}
          {ADMIN_DASHBOARD_ROUTES.map((path) => (
            <Route key={`admin-${path}`} path={path} component={RBACDashboard} />
          ))}

          {legacyRedirects.map(({ path, target }) => (
            <Route
              key={path}
              path={path}
              component={createRedirectComponent(target, 'جاري التوجيه إلى لوحة التحكم...')}
            />
          ))}

          // Default to landing even for authenticated platform users so root url remains public-facing.
          <Route path="/" component={Landing} />

          <Route component={Landing} />
        </Switch>
      </Suspense>
    );
  }

  // Fallback case: This should not happen with the new logic
  console.log('Fallback case: Unexpected routing state');
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-700">جار التحميل...</p>
      </div>
    </div>
  );
}

/**
 * App Component - Root application component
 * 
 * This is the main entry point that sets up all the necessary context providers
 * and wraps the entire application. The provider hierarchy is:
 * 
 * 1. QueryClientProvider - Manages server state and caching with React Query
 * 2. LanguageProvider - Handles internationalization and RTL support
 * 3. AuthProvider - Manages authentication state and user sessions
 * 4. TooltipProvider - Provides tooltip functionality throughout the app
 * 5. Toaster - Global toast notification system
 * 6. Router - Main routing component
 * 
 * This hierarchy ensures that all child components have access to:
 * - Server state management
 * - Language and localization
 * - Authentication context
 * - UI tooltips and notifications
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
