import { useQuery } from "@tanstack/react-query";
import { Users, Building, Filter, DollarSign, Plus, Home, Calendar, Download } from "lucide-react";
import Header from "@/components/layout/header";
import MetricsCard from "@/components/ui/metrics-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import AddLeadModal from "@/components/modals/add-lead-modal";
import AddPropertyModal from "@/components/modals/add-property-modal";
import type { Lead, Activity } from "@shared/schema";

export default function Dashboard() {
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<{
    totalLeads: number;
    activeProperties: number;
    dealsInPipeline: number;
    monthlyRevenue: number;
    pipelineByStage: {
      lead: number;
      qualified: number;
      showing: number;
      negotiation: number;
      closed: number;
    };
  }>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: todaysActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities/today"],
  });

  const recentLeads = leads?.slice(0, 3) || [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-blue-100 text-blue-800";
      case "showing": return "bg-orange-100 text-orange-800";
      case "negotiation": return "bg-purple-100 text-purple-800";
      case "closed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (metricsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="Dashboard" 
        onAddClick={() => setAddLeadModalOpen(true)}
        searchPlaceholder="Search leads, properties..."
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        {/* Dashboard Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Leads"
            value={metrics?.totalLeads || 0}
            change="12% from last month"
            changeType="positive"
            icon={Users}
            iconColor="bg-blue-100 text-blue-600"
          />
          <MetricsCard
            title="Active Properties"
            value={metrics?.activeProperties || 0}
            change="8% from last month"
            changeType="positive"
            icon={Building}
            iconColor="bg-green-100 text-green-600"
          />
          <MetricsCard
            title="Deals in Pipeline"
            value={metrics?.dealsInPipeline || 0}
            change="2% from last month"
            changeType="negative"
            icon={Filter}
            iconColor="bg-purple-100 text-purple-600"
          />
          <MetricsCard
            title="Monthly Revenue"
            value={formatCurrency(metrics?.monthlyRevenue || 0)}
            change="24% from last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-yellow-100 text-yellow-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leads & Activities */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Leads */}
            <Card>
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Leads</CardTitle>
                  <Button variant="link" className="text-primary">View All</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No leads found. Create your first lead to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {lead.firstName[0]}{lead.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{lead.firstName} {lead.lastName}</p>
                            <p className="text-sm text-slate-500">{lead.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusBadgeColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal Pipeline Overview */}
            <Card>
              <CardHeader className="border-b border-slate-200">
                <CardTitle>Deal Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="bg-slate-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-slate-900">
                        {metrics?.pipelineByStage?.lead || 0}
                      </div>
                      <div className="text-xs text-slate-500">Leads</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">Lead</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-blue-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-blue-900">
                        {metrics?.pipelineByStage?.qualified || 0}
                      </div>
                      <div className="text-xs text-blue-600">Qualified</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">Qualified</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-yellow-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-yellow-900">
                        {metrics?.pipelineByStage?.showing || 0}
                      </div>
                      <div className="text-xs text-yellow-600">Showing</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">Showing</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-orange-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-orange-900">
                        {metrics?.pipelineByStage?.negotiation || 0}
                      </div>
                      <div className="text-xs text-orange-600">Negotiation</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">Negotiation</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-green-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-green-900">
                        {metrics?.pipelineByStage?.closed || 0}
                      </div>
                      <div className="text-xs text-green-600">Closed</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">Closed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setAddLeadModalOpen(true)}
                  >
                    <Plus className="mr-3 text-primary" size={20} />
                    Add New Lead
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setAddPropertyModalOpen(true)}
                  >
                    <Home className="mr-3 text-green-500" size={20} />
                    List Property
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Calendar className="mr-3 text-blue-500" size={20} />
                    Schedule Showing
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Download className="mr-3 text-purple-500" size={20} />
                    Export Leads
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {!todaysActivities || todaysActivities.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    No tasks scheduled for today
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <input 
                          type="checkbox" 
                          checked={activity.completed}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${activity.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {activity.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {activity.scheduledDate ? new Date(activity.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time set'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
      <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
    </>
  );
}
