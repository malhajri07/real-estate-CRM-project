import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useRealAuth } from "@/hooks/useRealAuth";
import { useState, useEffect } from "react";
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
  const { isAuthenticated, isLoading, logout } = useRealAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-4">منصة عقاراتي</h1>
          <p className="text-green-600 mb-8">نظام إدارة العقارات المتكامل</p>
          <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main CRM application if authenticated
  return (
    <Switch>
      <Route path="/" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={logout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Dashboard />
          </div>
        </div>
      )} />

      <Route path="/customers" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={logout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Customers />
          </div>
        </div>
      )} />
      <Route path="/properties" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={logout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Properties />
          </div>
        </div>
      )} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/pipeline" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={logout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Pipeline />
          </div>
        </div>
      )} />
      <Route path="/clients" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={logout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Clients />
          </div>
        </div>
      )} />
      <Route path="/reports" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={logout} />
          <div className="mr-72 flex flex-col min-h-screen">
            <Reports />
          </div>
        </div>
      )} />
      <Route path="/notifications" component={() => (
        <div className="layout-lock bg-background">
          <Sidebar onLogout={logout} />
          <div className="mr-72 flex flex-col min-h-screen">
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
