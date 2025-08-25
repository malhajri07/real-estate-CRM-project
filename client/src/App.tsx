import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import SignupSelection from "@/pages/signup-selection";
import SignupIndividual from "@/pages/signup-individual";
import SignupCorporate from "@/pages/signup-corporate";
import SignupSuccess from "@/pages/signup-success";
import KYCSubmitted from "@/pages/kyc-submitted";
import Dashboard from "@/pages/dashboard";
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

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Handle login
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={() => <Login onLogin={handleLogin} />} />
        <Route path="/signup" component={SignupSelection} />
        <Route path="/signup/individual" component={SignupIndividual} />
        <Route path="/signup/corporate" component={SignupCorporate} />
        <Route path="/signup/success" component={SignupSuccess} />
        <Route path="/signup/kyc-submitted" component={KYCSubmitted} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show main CRM application if authenticated
  return (
    <Switch>
      <Route path="/" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Dashboard />
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
      <Route path="/properties/:id" component={PropertyDetail} />
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
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
