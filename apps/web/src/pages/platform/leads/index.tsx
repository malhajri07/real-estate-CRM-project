/**
 * leads.tsx - Lead Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → leads.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Lead management page for authenticated users. Provides:
 * - Lead listing and search
 * - Lead CRUD operations
 * - CSV import functionality
 * - WhatsApp integration
 * 
 * Route: /home/platform/leads or /leads
 * 
 * Related Files:
 * - apps/web/src/components/modals/send-whatsapp-modal.tsx - WhatsApp modal
 * - apps/web/src/components/CSVUploader.tsx - CSV upload component
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Eye, MessageCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import SendWhatsAppModal from "@/components/modals/send-whatsapp-modal";
import { CSVUploader } from "@/components/admin/data-display/CSVUploader";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Lead } from "@shared/types";
import type { UploadResult } from "@uppy/core";
import { getLeadStatusVariant } from "@/lib/status-variants";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function Leads() {
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { t, dir, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const queryClient = useQueryClient();

  const { data: leads, isLoading, isError, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: searchResults } = useQuery<Lead[]>({
    queryKey: ["/api/leads/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/leads/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery.trim(),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      toast({ title: t("message.success"), description: t("leads.delete_success") });
    },
    onError: () => {
      toast({
        title: t("message.error"),
        description: t("leads.delete_error"),
        variant: "destructive"
      });
    },
  });

  const csvProcessMutation = useMutation({
    mutationFn: async (csvUrl: string) => {
      const response = await fetch('/api/csv/process-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('leads.csv_error'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });

      if (data.results.errors.length > 0) {
        toast({
          title: t("leads.csv_partial_title"),
          description: `${data.message}. ${t("leads.csv_partial_description")}`,
          variant: "default"
        });
        console.log("CSV Processing Errors:", data.results.errors);
      } else {
        toast({
          title: t("message.success"),
          description: data.message
        });
      }
    },
    onError: (error) => {
      toast({
        title: t("message.error"),
        description: error instanceof Error ? error.message : t("leads.csv_error"),
        variant: "destructive"
      });
    },
  });

  const handleCSVUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const csvUrl = uploadedFile.uploadURL;

      if (csvUrl) {
        csvProcessMutation.mutate(csvUrl);
      }
    }
  };

  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/csv/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(t('leads.upload_error'));
    }

    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const displayLeads = searchQuery.trim() ? searchResults : leads;

  const handleDelete = (id: string) => {
    if (confirm(t("leads.confirm_delete"))) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleSendWhatsApp = (lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: t("message.error"),
        description: t("leads.no_phone_error"),
        variant: "destructive"
      });
      return;
    }
    setSelectedLead(lead);
    setWhatsappModalOpen(true);
  };

  const exportLeads = () => {
    if (!displayLeads || displayLeads.length === 0) {
      toast({
        title: t("leads.export_no_data_title"),
        description: t("leads.export_no_data_description"),
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Lead Source', 'Interest Type', 'Budget Range', 'Created At'].join(','),
      ...displayLeads.map(lead => [
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.phone || '',
        lead.status,
        lead.leadSource || '',
        lead.interestType || '',
        lead.budgetRange || '',
        new Date(lead.createdAt).toLocaleDateString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: t("message.success"), description: t("leads.export_success") });
  };

  if (isError) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <QueryErrorFallback message={t("leads.load_error") || "Failed to load leads."} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <p className="text-sm text-muted-foreground mb-4">{t("leads.loading")}</p>
        <TableSkeleton rows={6} cols={9} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" dir={dir}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t("leads.all_leads")} ({displayLeads?.length || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <CSVUploader
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleCSVUploadComplete}
                buttonClassName="bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="me-2" size={16} />
                {t("leads.upload_csv")}
              </CSVUploader>
              <Button variant="outline" onClick={exportLeads}>
                {t("leads.export_csv")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {csvProcessMutation.isPending && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center gap-3">
                <Spinner size="sm" className="me-2" />
                {t("leads.csv_processing")}
              </AlertDescription>
            </Alert>
          )}

          {!displayLeads || displayLeads.length === 0 ? (
            <EmptyState
              title={searchQuery ? t("leads.no_results") : t("leads.no_leads")}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">{t("leads.table.name")}</TableHead>
                  <TableHead className="text-end">{t("leads.table.email")}</TableHead>
                  <TableHead className="text-end">{t("leads.table.phone")}</TableHead>
                  <TableHead className="text-end">{t("leads.table.status")}</TableHead>
                  <TableHead className="text-end">{t("leads.table.source")}</TableHead>
                  <TableHead className="text-end">{t("leads.table.interest")}</TableHead>
                  <TableHead className="text-end">{t("leads.table.budget")}</TableHead>
                  <TableHead className="text-end">{t("leads.table.created_at")}</TableHead>
                  <TableHead className="text-end w-[160px]">{t("leads.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-end font-medium">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell className="text-end">{lead.email}</TableCell>
                    <TableCell className="text-end">{lead.phone || '-'}</TableCell>
                    <TableCell className="text-end">
                      <Badge variant={getLeadStatusVariant(lead.status)}>
                        {t(`status.${lead.status}`) || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">{lead.leadSource || '-'}</TableCell>
                    <TableCell className="text-end">{lead.interestType ? (t(`interest.${lead.interestType}`) || lead.interestType) : '-'}</TableCell>
                    <TableCell className="text-end">{lead.budgetRange || '-'}</TableCell>
                    <TableCell className="text-end">{new Date(lead.createdAt).toLocaleDateString(locale)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center gap-2">
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendWhatsApp(lead)}
                            title={t("whatsapp.send_message")}
                          >
                            <MessageCircle size={16} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lead.id)}
                          disabled={deleteLeadMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <SendWhatsAppModal
          open={whatsappModalOpen}
          onOpenChange={setWhatsappModalOpen}
          leadId={selectedLead.id}
          phoneNumber={selectedLead.phone || ""}
          leadName={`${selectedLead.firstName} ${selectedLead.lastName}`}
        />
      )}
    </div>
  );
}
