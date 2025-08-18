import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import Customers from "@/pages/customers";
import Properties from "@/pages/properties";
import Pipeline from "@/pages/pipeline";
import Clients from "@/pages/clients";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
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

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show main CRM application if authenticated
  return (
    <Switch>
      <Route path="/" component={() => (
        <div className="min-h-screen bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col">
            <Dashboard />
          </div>
        </div>
      )} />

      <Route path="/customers" component={() => (
        <div className="min-h-screen bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col">
            <Customers />
          </div>
        </div>
      )} />
      <Route path="/properties" component={() => (
        <div className="min-h-screen bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col">
            <Properties />
          </div>
        </div>
      )} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/pipeline" component={() => (
        <div className="min-h-screen bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col">
            <Pipeline />
          </div>
        </div>
      )} />
      <Route path="/clients" component={() => (
        <div className="min-h-screen bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col">
            <Clients />
          </div>
        </div>
      )} />
      <Route path="/reports" component={() => (
        <div className="min-h-screen bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col">
            <Reports />
          </div>
        </div>
      )} />
      <Route path="/notifications" component={() => (
        <div className="min-h-screen bg-background">
          <Sidebar onLogout={handleLogout} />
          <div className="mr-72 flex flex-col">
            <Notifications />
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
