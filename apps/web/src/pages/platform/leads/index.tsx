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
 * - apps/web/src/components/modals/add-lead-modal.tsx - Add lead modal
 * - apps/web/src/components/modals/send-whatsapp-modal.tsx - WhatsApp modal
 * - apps/web/src/components/CSVUploader.tsx - CSV upload component
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Eye, Plus, MessageCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddLeadModal from "@/components/modals/add-lead-modal";
import SendWhatsAppModal from "@/components/modals/send-whatsapp-modal";
import { CSVUploader } from "@/components/admin/data-display/CSVUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { Lead } from "@shared/types";
import type { UploadResult } from "@uppy/core";
import { BUTTON_PRIMARY_CLASSES, TYPOGRAPHY, PAGE_WRAPPER, CARD_STYLES, TABLE_STYLES, BADGE_STYLES, LOADING_STYLES, EMPTY_STYLES, getLeadStatusBadge, getIconSpacing } from "@/config/platform-theme";

export default function Leads() {
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { t, dir, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery<Lead[]>({
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });

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
  const iconSpacing = getIconSpacing(dir);

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

  if (isLoading) {
    return (
      <div className={LOADING_STYLES.container} dir={dir}>
        <div className={LOADING_STYLES.text}>{t("leads.loading")}</div>
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <Card className={CARD_STYLES.container}>
        <CardHeader className={CARD_STYLES.header}>
          <div className="flex items-center justify-between">
            <CardTitle className={TYPOGRAPHY.cardTitle}>
              {t("leads.all_leads")} ({displayLeads?.length || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <CSVUploader
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleCSVUploadComplete}
                buttonClassName="bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className={iconSpacing} size={16} />
                {t("leads.upload_csv")}
              </CSVUploader>
              <Button variant="outline" onClick={exportLeads}>
                {t("leads.export_csv")}
              </Button>
              <Button onClick={() => setAddLeadModalOpen(true)} className={BUTTON_PRIMARY_CLASSES}>
                <Plus className={iconSpacing} size={16} />
                {t("leads.add_lead")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={CARD_STYLES.content}>
          {csvProcessMutation.isPending && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-700 mb-4">
              <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700", getIconSpacing(dir))}></div>
              {t("leads.csv_processing")}
            </div>
          )}

          {!displayLeads || displayLeads.length === 0 ? (
            <div className={cn(EMPTY_STYLES.container, "text-end")}>
              <div className={cn(EMPTY_STYLES.description, "mb-4 text-slate-600")}>
                {searchQuery ? t("leads.no_results") : t("leads.no_leads")}
              </div>
              {!searchQuery && (
                <Button onClick={() => setAddLeadModalOpen(true)} className={BUTTON_PRIMARY_CLASSES}>
                  <Plus className={iconSpacing} size={16} />
                  {t("leads.add_first_lead")}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <Table className={TABLE_STYLES.container}>
                <TableHeader className={cn(TABLE_STYLES.header, "bg-slate-50")}>
                  <TableRow>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.name")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.email")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.phone")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.status")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.source")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.interest")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.budget")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end")}>{t("leads.table.created_at")}</TableHead>
                    <TableHead className={cn(TABLE_STYLES.headerCell, "text-end w-[160px]")}>{t("leads.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={TABLE_STYLES.body}>
                  {displayLeads.map((lead) => (
                    <TableRow key={lead.id} className="divide-y divide-slate-200">
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end font-medium")}>
                        {lead.firstName} {lead.lastName}
                      </TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>{lead.email}</TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>{lead.phone || '-'}</TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>
                        <Badge className={cn(BADGE_STYLES.base, getLeadStatusBadge(lead.status))}>
                          {t(`status.${lead.status}`) || lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>{lead.leadSource || '-'}</TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>{lead.interestType ? (t(`interest.${lead.interestType}`) || lead.interestType) : '-'}</TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>{lead.budgetRange || '-'}</TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>{new Date(lead.createdAt).toLocaleDateString(locale)}</TableCell>
                      <TableCell className={cn(TABLE_STYLES.cell, "text-end")}>
                        <div className="flex items-center gap-2">
                          {lead.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendWhatsApp(lead)}
                              className="text-emerald-600 hover:text-emerald-700"
                              title={t("whatsapp.send_message")}
                            >
                              <MessageCircle size={16} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
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
            </div>
          )}
        </CardContent>
      </Card>

      <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
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
