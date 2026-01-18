/**
 * send-whatsapp-modal.tsx - Send WhatsApp Modal Component
 * 
 * Location: apps/web/src/ → Components/ → Feature Components → modals/ → send-whatsapp-modal.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Modal component for sending WhatsApp messages. Provides:
 * - WhatsApp message form
 * - Message sending functionality
 * - Contact integration
 * 
 * Related Files:
 * - apps/web/src/pages/leads.tsx - Leads page uses this
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema, type InsertMessage } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface SendWhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  phoneNumber: string;
  leadName: string;
}

export default function SendWhatsAppModal({
  open,
  onOpenChange,
  leadId,
  phoneNumber,
  leadName
}: SendWhatsAppModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageStatus, setMessageStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const { t, dir } = useLanguage();

  const form = useForm<InsertMessage>({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: {
      leadId,
      content: "",
      channel: "whatsapp",
      direction: "outgoing",
    },
  });

  useEffect(() => {
    form.reset({
      leadId,
      content: "",
      channel: "whatsapp",
      direction: "outgoing",
    });
    setMessageStatus('idle');
  }, [leadId, open]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: InsertMessage) => {
      setMessageStatus('sending');
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageStatus('sent');
      toast({
        title: t("message.success"),
        description: t("whatsapp.status.sent")
      });
      setTimeout(() => {
        onOpenChange(false);
        form.reset();
        setMessageStatus('idle');
      }, 2000);
    },
    onError: () => {
      setMessageStatus('failed');
      toast({
        title: t("message.error"),
        description: t("whatsapp.status.failed"),
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: InsertMessage) => {
    sendMessageMutation.mutate({
      ...data,
      leadId,
      channel: data.channel ?? 'whatsapp',
      direction: data.direction ?? 'outgoing',
    });
  };

  const getStatusIcon = () => {
    switch (messageStatus) {
      case 'sending':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch (messageStatus) {
      case 'sending':
        return t('whatsapp.status.sending');
      case 'sent':
        return t('whatsapp.status.sent');
      case 'failed':
        return t('whatsapp.status.failed');
      default:
        return t('whatsapp.status.idle');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon()}
            {t('whatsapp.send_message')}
          </DialogTitle>
          <div className="text-sm text-slate-600 mt-2">
            {t('whatsapp.to')}: {leadName} ({phoneNumber})
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('whatsapp.message_label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder={t('whatsapp.message_placeholder')}
                      {...field}
                      disabled={messageStatus === 'sending'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className={cn(
                'flex justify-end pt-4',
                dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={messageStatus === 'sending'}
              >
                {t('form.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={messageStatus === 'sending' || messageStatus === 'sent'}
                className="bg-green-600 hover:bg-green-700"
              >
                {getStatusText()}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
