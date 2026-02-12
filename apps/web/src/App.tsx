/**
 * App.tsx - Main Application Component
 * 
 * Location: apps/web/src/ → Entry Points → App.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
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
 * 
 * Related Files:
 * - apps/web/src/main.tsx - Application entry point
 * - apps/web/src/pages/ - Page components (50+ files)
 * - apps/web/src/components/auth/AuthProvider.tsx - Authentication context
 * - apps/web/src/components/layout/ - Layout components
 */

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { UserRole } from "@shared/rbac";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { RouteGuard } from "@/components/auth/RouteGuard";

// Core page imports - loaded immediately for critical public routes
import Landing from "@/pages/landing";
import SignupSelection from "@/pages/signup/selection";
import SignupIndividual from "@/pages/signup/individual";
import SignupCorporate from "@/pages/signup/corporate";
import SignupSuccess from "@/pages/signup/success";
import KYCSubmitted from "@/pages/signup/kyc-submitted";
import Sidebar from "@/components/layout/sidebar";
import PlatformShell from "@/components/layout/PlatformShell";
import Header from "@/components/layout/header";

import { adminSidebarConfig } from "@/config/admin-sidebar";

// Lazy-loaded page imports - loaded on demand for better performance
const CMSAdmin = lazy(() => import("@/pages/admin/cms"));
const Dashboard = lazy(() => import("@/pages/platform/dashboard"));
const MapPage = lazy(() => import("@/pages/map"));
const Leads = lazy(() => import("@/pages/platform/leads"));
const Customers = lazy(() => import("@/pages/platform/customers"));
const Properties = lazy(() => import("@/pages/platform/properties"));
const Pipeline = lazy(() => import("@/pages/platform/pipeline"));
const Clients = lazy(() => import("@/pages/platform/clients"));
const Reports = lazy(() => import("@/pages/platform/reports"));
const Notifications = lazy(() => import("@/pages/platform/notifications"));
const Settings = lazy(() => import("@/pages/platform/settings"));
const PropertyDetail = lazy(() => import("@/pages/platform/properties/detail"));
const LazyRBACDashboard = lazy(() => import("@/pages/admin/dashboard"));
const LazyRBACLoginPage = lazy(() => import("@/pages/auth/login"));
const LazyPlatformPage = lazy(() => import("@/pages/platform/home"));
const LazyUnverifiedListingPage = lazy(() => import("@/pages/unverified-listing"));
const LazyUnverifiedListingsManagementPage = lazy(() => import("@/pages/admin/unverified-listings-management"));
const LazyMarketingRequestSubmissionPage = lazy(() => import("@/pages/marketing/submission"));
const LazyMarketingRequestsBoardPage = lazy(() => import("@/pages/marketing/board"));
const FavoritesPage = lazy(() => import("@/pages/platform/favorites"));
const ComparePage = lazy(() => import("@/pages/platform/compare"));
const PostListingPage = lazy(() => import("@/pages/platform/properties/post"));
const ModerationQueuePage = lazy(() => import("@/pages/admin/moderation"));
const AgenciesPage = lazy(() => import("@/pages/platform/agencies"));
const AgencyPage = lazy(() => import("@/pages/platform/agencies/detail"));
const AgentPage = lazy(() => import("@/pages/platform/agents/detail"));
const PublicListingPage = lazy(() => import("@/pages/listing"));
const SavedSearchesPage = lazy(() => import("@/pages/platform/saved-searches"));
const BlogPage = lazy(() => import("@/pages/blog"));
const RealEstateRequestsPage = lazy(() => import("@/pages/requests/real-estate"));
const CustomerRequestsPage = lazy(() => import("@/pages/platform/requests/customer"));
const AdminRequestsPage = lazy(() => import("@/pages/admin/requests"));
const ActivitiesPage = lazy(() => import("@/pages/platform/activities"));
const CalendarPage = lazy(() => import("@/pages/platform/calendar"));
const PoolPage = lazy(() => import("@/pages/platform/pool"));
const ForumPage = lazy(() => import("@/pages/platform/forum"));

// Admin Pages
const UserManagementPage = lazy(() => import("@/pages/admin/user-management"));
const RoleManagementPage = lazy(() => import("@/pages/admin/role-management"));
const OrganizationManagementPage = lazy(() => import("@/pages/admin/organization-management"));
const ArticlesManagementPage = lazy(() => import("@/pages/admin/articles-management"));
const MediaLibraryPage = lazy(() => import("@/pages/admin/media-library"));
const NavigationManagementPage = lazy(() => import("@/pages/admin/navigation-management"));
const SEOManagementPage = lazy(() => import("@/pages/admin/seo-management"));
const TemplatesManagementPage = lazy(() => import("@/pages/admin/templates-management"));
const ComplaintsManagementPage = lazy(() => import("@/pages/admin/complaints-management"));
const RevenueManagementPage = lazy(() => import("@/pages/admin/revenue-management"));
const ADMIN_DASHBOARD_ROUTES = Array.from(
  new Set<string>([
    "/rbac-dashboard",
    "/admin",
    "/admin/dashboard",
    "/admin/analytics",
    "/overview/dashboard",
    "/overview/main-dashboard",
    "/admin/overview/main-dashboard",
    "/admin/users/all-users",
    "/admin/content/landing-pages",
    "/admin/content/articles",
    "/admin/content/media-library",
    "/admin/content/seo",
    "/admin/content/templates",
    "/admin/content/navigation",
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
  const { user, isLoading, logout, hasRole, hasPermission } = useAuth();
  const [location, setLocation] = useLocation();
  const isAdmin = !!user?.roles?.includes?.(UserRole.WEBSITE_ADMIN); // Helper flag to distinguish admin flow from standard platform users.

  const fullScreenSuspenseFallback = (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-sm text-gray-600">جار التحميل...</div>
    </div>
  );

  const shellSuspenseFallback = (
    <div className="h-full">
      <DashboardSkeleton />
    </div>
  );

  type LoadableComponent = ComponentType<any> | LazyExoticComponent<ComponentType<any>>;

  const withSuspense = (
    Component: LoadableComponent,
    fallback: ReactNode = fullScreenSuspenseFallback
  ): ComponentType<any> => {
    const SuspendedComponent: ComponentType<any> = (props: any) => (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
    return SuspendedComponent;
  };

  const SuspendedRBACLoginPage = withSuspense(LazyRBACLoginPage);
  const SuspendedRBACDashboard = withSuspense(LazyRBACDashboard);
  const SuspendedPlatformPage = withSuspense(LazyPlatformPage);
  const SuspendedUnverifiedListingPage = withSuspense(LazyUnverifiedListingPage);
  const SuspendedUnverifiedListingsManagementPage = withSuspense(LazyUnverifiedListingsManagementPage);
  const SuspendedMarketingRequestSubmissionPage = withSuspense(LazyMarketingRequestSubmissionPage);
  const SuspendedSearchPropertiesPage = withSuspense(MapPage);
  const SuspendedRealEstateRequestsPage = withSuspense(RealEstateRequestsPage);
  const SuspendedBlogPage = withSuspense(BlogPage);

  const PLATFORM_CORE_ROLES: readonly UserRole[] = [
    UserRole.WEBSITE_ADMIN,
    UserRole.CORP_OWNER,
    UserRole.CORP_AGENT,
    UserRole.INDIV_AGENT,
  ];
  const CORPORATE_MANAGEMENT_ROLES: readonly UserRole[] = [
    UserRole.WEBSITE_ADMIN,
    UserRole.CORP_OWNER,
  ];
  const ADMIN_ONLY_ROLES: readonly UserRole[] = [UserRole.WEBSITE_ADMIN];
  const EXTENDED_PLATFORM_ROLES: readonly UserRole[] = [
    UserRole.WEBSITE_ADMIN,
    UserRole.CORP_OWNER,
    UserRole.CORP_AGENT,
    UserRole.INDIV_AGENT,
    UserRole.SELLER,
    UserRole.BUYER,
  ];



  // Guard against admins momentarily visiting the platform shell; if they land there (e.g. via browser history) we immediately send them back to RBAC.
  // Navigation loading overlay should only run for normal platform users, never for admins (so RBAC loads without flashing the platform shell).
  useEffect(() => {
    if (isAdmin && (location.startsWith('/home/platform') || location === '/')) {
      setLocation('/admin/overview/main-dashboard', { replace: true });
    }
  }, [isAdmin, location, setLocation]);

  // Navigation loading state for smooth transitions
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);
  const [previousLocation, setPreviousLocation] = useState("");
  const [isNormalizingUrl, setIsNormalizingUrl] = useState(false);
  const [hash, setHash] = useState(() => window.location.hash);

  // Determine if user is authenticated
  const isAuthenticated = !!user;

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
      // Remove artificial delay for better performance
      setIsNavigationLoading(false);
    }

    setPreviousLocation(location);
  }, [location, isAuthenticated, previousLocation, isAdmin]);

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
    return <SuspendedUnverifiedListingPage />;
  }

  // Detect which server port is being used
  const isDashboardPort = (window as any).SERVER_PORT === '3000' || window.location.port === '3000';

  // Debug logging (development only)
  logger.debug('Routing state', {
    context: 'Router',
    data: {
      SERVER_PORT: (window as any).SERVER_PORT,
      locationPort: window.location.port,
      isDashboardPort,
      isAuthenticated,
      location,
      isLoading,
      user: user ? 'authenticated' : 'not authenticated'
    }
  });

  // Logout handler for platform routes
  const handlePlatformLogout = () => {
    logout();
    setLocation('/home');
  };

  // Provide standalone rendering for the public property search page
  if (location.startsWith('/map')) {
    return <SuspendedSearchPropertiesPage />;
  }

  // Provide standalone rendering for the public blog page (accessible to all users)
  if (location.startsWith('/blog')) {
    return <SuspendedBlogPage />;
  }

  type PlatformRouteOptions = {
    title?: string;
    searchPlaceholder?: string;
  };

  type PlatformRenderableComponent = ComponentType<any> | LazyExoticComponent<ComponentType<any>>;

  // Define route configuration objects
  const platformShellRoutes: Array<{
    path: string;
    component: PlatformRenderableComponent;
    options?: PlatformRouteOptions;
    aliases?: string[];
    allowedRoles?: readonly UserRole[];
    requiredPermission?: string;
  }> = [
      { path: '/home/platform/customers', component: Customers, aliases: ['/customers'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/properties', component: Properties, aliases: ['/properties'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/leads', component: Leads, aliases: ['/leads'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/pipeline', component: Pipeline, aliases: ['/pipeline'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/clients', component: Clients, aliases: ['/clients'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/reports', component: Reports, aliases: ['/reports'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/notifications', component: Notifications, aliases: ['/notifications'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/settings', component: Settings, aliases: ['/settings'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/agencies', component: AgenciesPage, aliases: ['/agencies'], allowedRoles: CORPORATE_MANAGEMENT_ROLES },
      { path: '/home/platform/moderation', component: ModerationQueuePage, aliases: ['/moderation'], allowedRoles: ADMIN_ONLY_ROLES },
      { path: '/home/platform/cms', component: CMSAdmin, aliases: ['/cms', '/cms-admin'], allowedRoles: ADMIN_ONLY_ROLES },
      { path: '/home/platform/marketing-requests', component: LazyMarketingRequestsBoardPage, aliases: ['/marketing-requests'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/unverified-listings', component: SuspendedUnverifiedListingsManagementPage, allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/pool', component: withSuspense(PoolPage), aliases: ['/pool'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/forum', component: withSuspense(ForumPage), aliases: ['/forum'], allowedRoles: PLATFORM_CORE_ROLES },
    ];

  const platformDynamicRoutes: Array<{
    path: string;
    component: PlatformRenderableComponent;
    options?: PlatformRouteOptions;
    aliases?: string[];
    allowedRoles?: readonly UserRole[];
  }> = [
      { path: '/home/platform/agency/:id', component: AgencyPage, aliases: ['/agency/:id'], allowedRoles: CORPORATE_MANAGEMENT_ROLES },
      { path: '/home/platform/agent/:id', component: AgentPage, aliases: ['/agent/:id'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/properties/:id', component: PropertyDetail, aliases: ['/properties/:id'], allowedRoles: PLATFORM_CORE_ROLES },
      { path: '/home/platform/listing/:id', component: PublicListingPage, aliases: ['/listing/:id'] },
    ];

  const platformAdditionalRoutes: Array<{
    path: string;
    component: PlatformRenderableComponent;
    options?: PlatformRouteOptions;
    aliases?: string[];
    allowedRoles?: readonly UserRole[];
    requiredPermission?: string;
  }> = [
      { path: '/home/platform/customer-requests', component: CustomerRequestsPage, aliases: ['/customer-requests'], allowedRoles: CORPORATE_MANAGEMENT_ROLES },
      { path: '/home/platform/admin-requests', component: AdminRequestsPage, aliases: ['/admin/requests'], allowedRoles: ADMIN_ONLY_ROLES },
      { path: '/home/platform/favorites', component: FavoritesPage, aliases: ['/favorites'], allowedRoles: EXTENDED_PLATFORM_ROLES },
      { path: '/home/platform/compare', component: ComparePage, aliases: ['/compare'], allowedRoles: EXTENDED_PLATFORM_ROLES },
      { path: '/home/platform/post-listing', component: PostListingPage, aliases: ['/post-listing'], allowedRoles: EXTENDED_PLATFORM_ROLES },
      { path: '/home/platform/saved-searches', component: SavedSearchesPage, aliases: ['/saved-searches'], allowedRoles: EXTENDED_PLATFORM_ROLES },

      { path: '/home/platform/activities', component: ActivitiesPage, aliases: ['/activities'], allowedRoles: EXTENDED_PLATFORM_ROLES },
      { path: '/home/platform/calendar', component: CalendarPage, aliases: ['/calendar'], allowedRoles: EXTENDED_PLATFORM_ROLES },
    ];




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
  logger.debug('Port routing check', {
    context: 'Router',
    data: { isDashboardPort, isAuthenticated }
  });

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

  // Helper function to render public routes (used in multiple places)
  // Routes ordered from most specific to least specific for optimal matching
  const renderPublicRoutes = () => (
    <>
      {/* Specific routes first */}
      <Route path="/blog/:slug" component={SuspendedBlogPage} />
      <Route path="/signup/kyc-submitted" component={KYCSubmitted} />
      <Route path="/signup/success" component={SignupSuccess} />
      <Route path="/signup/corporate" component={SignupCorporate} />
      <Route path="/signup/individual" component={SignupIndividual} />
      {/* Less specific routes */}
      <Route path="/blog" component={SuspendedBlogPage} />
      <Route path="/unverified-listings" component={SuspendedUnverifiedListingPage} />
      <Route path="/marketing-request" component={SuspendedMarketingRequestSubmissionPage} />
      <Route path="/real-estate-requests" component={SuspendedRealEstateRequestsPage} />
      <Route path="/map" component={SuspendedSearchPropertiesPage} />
      <Route path="/signup" component={SignupSelection} />
      <Route path="/home" component={Landing} />
    </>
  );

  // Helper function to render platform routes using RouteGuard
  const renderPlatformRoutes = (includeAliases: boolean = true) => (
    <>
      {[...platformShellRoutes, ...platformAdditionalRoutes].flatMap(({ path, component, options, aliases, allowedRoles, requiredPermission }) => {
        const renderComponent = () => (
          <RouteGuard
            component={component}
            allowedRoles={allowedRoles}
            requiredPermission={requiredPermission}
            withShell={true}
            shellProps={{
              ...options,
              onLogout: handlePlatformLogout
            }}
          />
        );

        const routes = [
          <Route key={path} path={path} component={renderComponent} />
        ];

        if (includeAliases && aliases) {
          routes.push(
            ...aliases.map((alias) => (
              <Route key={`${path}-alias-${alias}`} path={alias} component={renderComponent} />
            ))
          );
        }
        return routes;
      })}

      {platformDynamicRoutes.flatMap(({ path, component, options, aliases, allowedRoles }) => {
        const renderComponent = () => (
          <RouteGuard
            component={component}
            allowedRoles={allowedRoles}
            withShell={true}
            shellProps={{
              ...options,
              onLogout: handlePlatformLogout
            }}
          />
        );

        const routes = [
          <Route key={path} path={path} component={renderComponent} />
        ];
        if (includeAliases && aliases) {
          routes.push(
            ...aliases.map((alias) => (
              <Route key={`${path}-alias-${alias}`} path={alias} component={renderComponent} />
            ))
          );
        }
        return routes;
      })}
    </>
  );


  // Standalone Vite dev server (non-dashboard ports) should redirect back to Express
  if (!isDashboardPort) {
    logger.debug('Non-dashboard port detected: redirecting secured routes to 3000', {
      context: 'Router'
    });
    // When running the standalone Vite server, keep public routes here and redirect
    // any authenticated routes back to the Express instance on port 3000
    return (
      <Suspense fallback={fullScreenSuspenseFallback}>
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
          {/* RBAC-aware login accessible from landing */}
          <Route path="/home/login" component={SuspendedRBACLoginPage} />
          <Route path="/home/platform" component={SuspendedPlatformPage} />

          {/* Public Routes */}
          {renderPublicRoutes()}

          {/* Platform Dashboard Routes - All dashboard functionality under /home/platform/ */}
          {renderPlatformRoutes(true)}

          {/* Admin Route with RBAC Dashboard - No sidebar/header */}
          <Route path="/home/admin">
            <RouteGuard component={SuspendedRBACDashboard} allowedRoles={ADMIN_ONLY_ROLES} />
          </Route>
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
      <Suspense fallback={fullScreenSuspenseFallback}>
        <Switch>
          {/* Use RBAC-aware login that integrates with AuthProvider */}
          <Route path="/rbac-login" component={SuspendedRBACLoginPage} />
          <Route path="/login" component={() => {
            window.location.href = '/rbac-login';
            return null;
          }} />
          {/* Public Routes */}
          {renderPublicRoutes()}
          {ADMIN_DASHBOARD_ROUTES.map((path) => (
            <Route
              key={`guest-admin-${path}`}
              path={path}
              component={createRedirectComponent('/rbac-login', 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم')}
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
      <PlatformShell onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">جار التحميل...</p>
          </div>
        </div>
      </PlatformShell>
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
    logger.debug('Port 3000: Showing authenticated routes (dashboard)', {
      context: 'Router'
    });

    // Separate admin users from platform users
    const isAdmin = !!user?.roles?.includes?.(UserRole.WEBSITE_ADMIN);
    const isPlatformUser = !!user?.roles?.some(role =>
      [UserRole.CORP_OWNER, UserRole.CORP_AGENT, UserRole.INDIV_AGENT].includes(role)
    );
    const isSellerBuyer = !!user?.roles?.some(role =>
      [UserRole.SELLER, UserRole.BUYER].includes(role)
    );

    // Admin users get access to everything - both platform features and admin features

    const legacyRedirects = [
      // Legacy links (e.g. /dashboard) for non-admin users still land on the platform shell.
      { path: '/dashboard', target: '/home/platform' },
    ];

    return (
      <Suspense fallback={fullScreenSuspenseFallback}>
        <Switch>
          {/* Admin Dashboard Routes - Only for WEBSITE_ADMIN users */}
          {isAdmin && (
            <>
              <Route path="/rbac-login" component={createRedirectComponent('/admin/overview/main-dashboard', 'جاري التوجيه إلى لوحة التحكم الإدارية...')} />



              {ADMIN_DASHBOARD_ROUTES.map((path) => (
                <Route key={`admin-${path}`} path={path}>
                  <RouteGuard component={SuspendedRBACDashboard} allowedRoles={ADMIN_ONLY_ROLES} />
                </Route>
              ))}
              {/* Redirect admin users from platform routes to admin dashboard */}
              <Route path="/home/platform" component={createRedirectComponent('/admin/overview/main-dashboard', 'جاري التوجيه إلى لوحة التحكم الإدارية...')} />
            </>
          )}

          {/* Platform Routes - For CORP_OWNER, CORP_AGENT, INDIV_AGENT users */}
          {isPlatformUser && (
            <>
              <Route path="/login" component={createRedirectComponent('/home/platform', 'جاري التوجيه إلى لوحة التحكم...')} />
              <Route path="/rbac-login" component={createRedirectComponent('/home/platform', 'جاري التوجيه إلى لوحة التحكم...')} />
              <Route path="/home/platform" component={SuspendedPlatformPage} />
              <Route path="/unverified-listings" component={SuspendedUnverifiedListingPage} />

              {/* Platform Routes */}
              {renderPlatformRoutes(true)}

              {/* Redirect platform users from admin routes to platform dashboard */}
              {ADMIN_DASHBOARD_ROUTES.map((path) => (
                <Route key={`redirect-admin-${path}`} path={path} component={createRedirectComponent('/home/platform', 'جاري التوجيه إلى لوحة التحكم...')} />
              ))}
            </>
          )}

          {/* Seller/Buyer Routes - Limited access for now */}
          {isSellerBuyer && (
            <>
              <Route path="/login" component={createRedirectComponent('/home/platform', 'جاري التوجيه إلى لوحة التحكم...')} />
              <Route path="/rbac-login" component={createRedirectComponent('/home/platform', 'جاري التوجيه إلى لوحة التحكم...')} />
              <Route path="/home/platform" component={SuspendedPlatformPage} />
              <Route path="/unverified-listings" component={SuspendedUnverifiedListingPage} />

              {/* Redirect seller/buyer users from admin routes to platform dashboard */}
              {ADMIN_DASHBOARD_ROUTES.map((path) => (
                <Route key={`redirect-admin-sb-${path}`} path={path} component={createRedirectComponent('/home/platform', 'جاري التوجيه إلى لوحة التحكم...')} />
              ))}
            </>
          )}

          {/* Legacy redirects */}
          {legacyRedirects.map(({ path, target }) => (
            <Route
              key={path}
              path={path}
              component={createRedirectComponent(target, 'جاري التوجيه إلى لوحة التحكم...')}
            />
          ))}

          {/* Default routes */}
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </Switch>
      </Suspense>
    );
  }

  // Fallback case: This should not happen with the new logic
  logger.warn('Fallback case: Unexpected routing state', {
    context: 'Router',
    data: { isDashboardPort, isAuthenticated, location }
  });
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
