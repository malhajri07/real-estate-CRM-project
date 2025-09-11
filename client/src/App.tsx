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
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";

// Core page imports - loaded immediately for critical routes
import Login from "@/pages/login";
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
import RBACLoginPage from "@/pages/rbac-login";
import RBACDashboard from "@/pages/rbac-dashboard";
import LoginTest from "@/pages/login-test";

// Lazy-loaded page imports - loaded on demand for better performance
import { lazy, Suspense } from "react";
const Listings = lazy(() => import("@/pages/listings"));
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
const AdminRequestsPage = lazy(() => import("@/pages/admin-requests"));

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
  const { user, isLoading } = useAuth();
  
  // Navigation loading state for smooth transitions
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);
  const [location] = useLocation();
  const [previousLocation, setPreviousLocation] = useState("");

  // Determine if user is authenticated
  const isAuthenticated = !!user;

  /**
   * Handle navigation loading effect for authenticated pages
   * 
   * This creates a smooth loading transition when navigating between
   * authenticated pages. The loading state lasts for 2.5 seconds to
   * provide visual feedback during route changes.
   */
  useEffect(() => {
    if (isAuthenticated && location !== previousLocation && previousLocation !== "") {
      setIsNavigationLoading(true);
      const timer = setTimeout(() => {
        setIsNavigationLoading(false);
      }, 2500); // 2.5 seconds loading
      
      return () => clearTimeout(timer);
    }
    setPreviousLocation(location);
  }, [location, isAuthenticated, previousLocation]);

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

  /**
   * Public Routes - Available to unauthenticated users
   * 
   * These routes include:
   * - Landing page (marketing site)
   * - Authentication pages (login, signup)
   * - Public property listings
   * - Public agency/agent profiles
   * - Property search functionality
   * 
   * All public routes use the PublicLayout component for consistent styling.
   */
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/rbac-login" component={RBACLoginPage} />
        <Route path="/signup" component={SignupSelection} />
        <Route path="/signup/individual" component={SignupIndividual} />
        <Route path="/signup/corporate" component={SignupCorporate} />
        <Route path="/signup/success" component={SignupSuccess} />
        <Route path="/signup/kyc-submitted" component={KYCSubmitted} />
        <Route path="/search-properties" component={SearchProperties} />
        <Route path="/listings" component={Listings} />
        <Route path="/real-estate-requests" component={RealEstateRequestsPage} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route path="/compare" component={ComparePage} />
        <Route path="/post-listing" component={PostListingPage} />
        <Route path="/moderation" component={ModerationQueuePage} />
        <Route path="/agencies" component={AgenciesPage} />
        <Route path="/agency/:id" component={AgencyPage} />
        <Route path="/agent/:id" component={AgentPage} />
        <Route path="/listing/:id" component={PublicListingPage} />
        <Route path="/saved-searches" component={SavedSearchesPage} />
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
  if (isNavigationLoading) {
    return (
      <div className="layout-lock bg-background relative">
        <Sidebar onLogout={handleLogout} />
        <div className="mr-72 flex flex-col min-h-screen relative">
          {/* Loading Overlay - Only covers content below header */}
          <div className="absolute top-20 left-0 right-0 bottom-0 bg-white/90 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="text-center" dir="rtl">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">جار التحميل...</p>
            </div>
          </div>
        </div>
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
   */
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
    <Switch>
      <Route path="/" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Dashboard />
          </div>
        </div>
      )} />

      {/* Public/marketing pages should be reachable even when authenticated */}
      <Route path="/listings" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Listings />
          </div>
        </div>
      )} />
      <Route path="/real-estate-requests" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <RealEstateRequestsPage />
          </div>
        </div>
      )} />
      <Route path="/admin/requests" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <AdminRequestsPage />
          </div>
        </div>
      )} />
      <Route path="/favorites" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <FavoritesPage />
          </div>
        </div>
      )} />
      <Route path="/compare" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <ComparePage />
          </div>
        </div>
      )} />
      <Route path="/post-listing" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <PostListingPage />
          </div>
        </div>
      )} />
      <Route path="/agencies" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <AgenciesPage />
          </div>
        </div>
      )} />
      <Route path="/agency/:id" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <AgencyPage />
          </div>
        </div>
      )} />
      <Route path="/agent/:id" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <AgentPage />
          </div>
        </div>
      )} />
      <Route path="/search-properties" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <SearchProperties />
          </div>
        </div>
      )} />
      <Route path="/moderation" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <ModerationQueuePage />
          </div>
        </div>
      )} />

      <Route path="/customers" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Customers />
          </div>
        </div>
      )} />
      <Route path="/properties" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Properties />
          </div>
        </div>
      )} />
      <Route path="/properties/:id" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <PropertyDetail />
          </div>
        </div>
      )} />
      {/* Public listing detail also available when authenticated */}
      <Route path="/listing/:id" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <PublicListingPage />
          </div>
        </div>
      )} />
      <Route path="/pipeline" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Pipeline />
          </div>
        </div>
      )} />
      <Route path="/clients" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Clients />
          </div>
        </div>
      )} />
      <Route path="/reports" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Reports />
          </div>
        </div>
      )} />
      <Route path="/notifications" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Notifications />
          </div>
        </div>
      )} />
      <Route path="/settings" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Settings />
          </div>
        </div>
      )} />

      {/* CMS Admin - Standalone page */}
      <Route path="/cms" component={CMSAdmin} />

    </Switch>
    </Suspense>
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
