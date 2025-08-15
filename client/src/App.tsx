import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import Properties from "@/pages/properties";
import Pipeline from "@/pages/pipeline";
import Clients from "@/pages/clients";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import PropertyDetail from "@/pages/property-detail";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">جار التحميل...</div>
      </div>
    );
  }

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={() => (
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Home />
              </div>
            </div>
          )} />
          <Route path="/leads" component={() => (
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Leads />
              </div>
            </div>
          )} />
          <Route path="/properties" component={() => (
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Properties />
              </div>
            </div>
          )} />
          <Route path="/properties/:id" component={PropertyDetail} />
          <Route path="/pipeline" component={() => (
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Pipeline />
              </div>
            </div>
          )} />
          <Route path="/clients" component={() => (
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Clients />
              </div>
            </div>
          )} />
          <Route path="/reports" component={() => (
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Reports />
              </div>
            </div>
          )} />
          <Route path="/notifications" component={() => (
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Notifications />
              </div>
            </div>
          )} />
        </>
      )}
      <Route component={NotFound} />
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
