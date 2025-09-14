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
import { DarkModeProvider } from "@/contexts/DarkModeContext";
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
import Header from "@/components/layout/header";
import RBACDashboard from "@/pages/rbac-dashboard";
import AuthTestPage from "@/pages/auth-test";
import LoginTest from "@/pages/login-test";
import SimpleAdminPage from "@/pages/simple-admin";
import DirectAdminPage from "@/pages/direct-admin";
import RBACLoginPage from "@/pages/rbac-login";
import PlatformPage from "@/pages/app";

// Lazy-loaded page imports - loaded on demand for better performance
import { lazy, Suspense } from "react";
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
  const { user, isLoading, logout } = useAuth();
  
  // Navigation loading state for smooth transitions
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const [previousLocation, setPreviousLocation] = useState("");

  // Determine if user is authenticated
  const isAuthenticated = !!user;
  
  // Detect which server port is being used
  const isDashboardPort = (window as any).SERVER_PORT === '5001' || window.location.port === '5001';
  
  // Debug logging
  console.log('Routing Debug:', {
    SERVER_PORT: (window as any).SERVER_PORT,
    locationPort: window.location.port,
    isDashboardPort,
    isAuthenticated,
    user: user ? 'authenticated' : 'not authenticated'
  });

  // Logout handler for platform routes
  const handlePlatformLogout = () => {
    logout();
    setLocation('/home');
  };

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

  // Port-based routing logic:
  // - Port 3000 (Vite dev server): ALWAYS show landing page (never redirect)
  // - Port 5001 (Express server): Show dashboard for authenticated users, show landing page for unauthenticated users
  console.log('Port routing check:', { isDashboardPort, isAuthenticated });
  
  // Port 3000 should ALWAYS show landing page, never redirect
  if (!isDashboardPort) {
    console.log('Port 3000: Showing landing page (no redirect)');
    // Always show public routes on port 3000, regardless of authentication status
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
      <Switch>
        {/* Dashboard and authenticated routes should redirect to port 5001 */}
        <Route path="/dashboard" component={() => {
          window.location.href = 'http://localhost:5001/dashboard';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/leads" component={() => {
          window.location.href = 'http://localhost:5001/leads';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/customers" component={() => {
          window.location.href = 'http://localhost:5001/customers';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/properties" component={() => {
          window.location.href = 'http://localhost:5001/properties';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/pipeline" component={() => {
          window.location.href = 'http://localhost:5001/pipeline';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/clients" component={() => {
          window.location.href = 'http://localhost:5001/clients';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/reports" component={() => {
          window.location.href = 'http://localhost:5001/reports';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/notifications" component={() => {
          window.location.href = 'http://localhost:5001/notifications';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/rbac-dashboard" component={() => {
          window.location.href = 'http://localhost:5001/rbac-dashboard';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/buyer-pool" component={() => {
          window.location.href = 'http://localhost:5001/buyer-pool';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/inquiries" component={() => {
          window.location.href = 'http://localhost:5001/inquiries';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/requests" component={() => {
          window.location.href = 'http://localhost:5001/requests';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/locations" component={() => {
          window.location.href = 'http://localhost:5001/locations';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        <Route path="/cms-admin" component={() => {
          window.location.href = 'http://localhost:5001/cms-admin';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى لوحة التحكم...</div>;
        }} />
        {/* Use RBAC-aware login that integrates with AuthProvider */}
        <Route path="/home/login" component={RBACLoginPage} />
        <Route path="/home/platform" component={PlatformPage} />
        
        {/* Platform Dashboard Routes - All dashboard functionality under /home/platform/ */}
        <Route path="/home/platform/customers" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Customers />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/properties" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Properties />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/leads" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Leads />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/pipeline" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Pipeline />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/clients" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Clients />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/reports" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Reports />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/notifications" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Notifications />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/settings" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <Settings />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/rbac-dashboard" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <RBACDashboard />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        
        <Route path="/home/platform/agencies" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <AgenciesPage />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/moderation" component={() => (
          <div className="flex h-screen bg-background layout-container">
            <div className="flex-1 flex flex-col pr-72 main-content">
              <Header />
              <div className="flex-1 overflow-hidden">
                <ModerationQueuePage />
              </div>
            </div>
            <div className="sidebar-container">
              <Sidebar onLogout={handlePlatformLogout} />
            </div>
          </div>
        )} />
        
        <Route path="/home/platform/cms" component={CMSAdmin} />
        
        {/* Admin Route with RBAC Dashboard - No sidebar/header */}
        <Route path="/home/admin" component={RBACDashboard} />
        
        {/* Landing page route */}
        <Route path="/home" component={Landing} />
        <Route path="/rbac-login" component={RBACLoginPage} />
        <Route path="/auth-test" component={AuthTestPage} />
        <Route path="/simple-admin" component={SimpleAdminPage} />
        <Route path="/direct-admin" component={DirectAdminPage} />
        <Route path="/signup" component={SignupSelection} />
        <Route path="/signup/individual" component={SignupIndividual} />
        <Route path="/signup/corporate" component={SignupCorporate} />
        <Route path="/signup/success" component={SignupSuccess} />
        <Route path="/signup/kyc-submitted" component={KYCSubmitted} />
        <Route path="/search-properties" component={SearchProperties} />
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
        {/* Default route for port 3000 - redirect to home */}
        <Route component={() => {
          window.location.href = '/home';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى الصفحة الرئيسية...</div>;
        }} />
      </Switch>
      </Suspense>
    );
  }

  // Port 5001 logic: Show dashboard for authenticated users, landing page for unauthenticated users
  if (isDashboardPort && !isAuthenticated) {
    console.log('Port 5001: Showing landing page (unauthenticated user)');
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
      <Switch>
        {/* Use RBAC-aware login that integrates with AuthProvider */}
        <Route path="/login" component={RBACLoginPage} />
        <Route path="/rbac-login" component={RBACLoginPage} />
        <Route path="/auth-test" component={AuthTestPage} />
        <Route path="/simple-admin" component={SimpleAdminPage} />
        <Route path="/direct-admin" component={DirectAdminPage} />
        <Route path="/signup" component={SignupSelection} />
        <Route path="/signup/individual" component={SignupIndividual} />
        <Route path="/signup/corporate" component={SignupCorporate} />
        <Route path="/signup/success" component={SignupSuccess} />
        <Route path="/signup/kyc-submitted" component={KYCSubmitted} />
        <Route path="/search-properties" component={SearchProperties} />
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
        {/* Root path for unauthenticated users on port 5001 - redirect to login */}
        <Route path="/" component={() => {
          window.location.href = '/login';
          return <div className="min-h-screen flex items-center justify-center">جاري التوجيه إلى صفحة تسجيل الدخول...</div>;
        }} />
        {/* Landing page is the default route for unauthenticated users on port 5001 */}
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
      <div className="flex h-screen bg-background layout-container">
        <div className="flex-1 flex flex-col pr-72 relative main-content">
          {/* Loading Overlay */}
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="text-center" dir="rtl">
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
   * Note: These routes are only shown on port 5001 (dashboard port) for authenticated users
   */
  if (isDashboardPort && isAuthenticated) {
    console.log('Port 5001: Showing authenticated routes (dashboard)');
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جار التحميل...</div>}>
    <Switch>
      <Route path="/" component={() => (
        <div className="flex h-screen bg-background layout-container">
          {/* Main Content Area - Proper spacing for fixed sidebar */}
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header 
              searchPlaceholder="البحث في العملاء أو العقارات..."
            />
            <div className="flex-1 overflow-hidden">
              <Dashboard />
            </div>
          </div>
          {/* Sidebar - Fixed on the right */}
            <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />

      <Route path="/rbac-dashboard" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <RBACDashboard />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />


      {/* Public/marketing pages should be reachable even when authenticated */}
      <Route path="/real-estate-requests" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <RealEstateRequestsPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/admin/requests" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <AdminRequestsPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/favorites" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <FavoritesPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/compare" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <ComparePage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/post-listing" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <PostListingPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/agencies" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <AgenciesPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/agency/:id" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <AgencyPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/agent/:id" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <AgentPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/search-properties" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <SearchProperties />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/moderation" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <ModerationQueuePage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />

      <Route path="/customers" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <Customers />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/properties" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <Properties />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/properties/:id" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <PropertyDetail />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      {/* Public listing detail also available when authenticated */}
      <Route path="/listing/:id" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <PublicListingPage />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/pipeline" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <Pipeline />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/clients" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <Clients />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/reports" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <Reports />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/notifications" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <Notifications />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />
      <Route path="/settings" component={() => (
        <div className="flex h-screen bg-background layout-container">
          <div className="flex-1 flex flex-col pr-72 main-content">
            <Header />
            <div className="flex-1 overflow-hidden">
              <Settings />
            </div>
          </div>
          <div className="sidebar-container">
            <Sidebar onLogout={handleLogout} />
          </div>
        </div>
      )} />

      {/* CMS Admin - Standalone page */}
      <Route path="/cms" component={CMSAdmin} />

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
      <DarkModeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  );
}

export default App;
