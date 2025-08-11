import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema, type InsertMessage } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";

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

  const form = useForm<InsertMessage>({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: {
      leadId,
      messageType: "whatsapp",
      phoneNumber,
      message: "",
      status: "pending",
    },
  });

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
        title: "نجح", 
        description: "تم إرسال رسالة WhatsApp بنجاح" 
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
        title: "خطأ", 
        description: "فشل في إرسال رسالة WhatsApp",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: InsertMessage) => {
    sendMessageMutation.mutate(data);
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
        return 'جار الإرسال...';
      case 'sent':
        return 'تم الإرسال بنجاح!';
      case 'failed':
        return 'فشل الإرسال';
      default:
        return 'إرسال رسالة WhatsApp';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon()}
            إرسال رسالة WhatsApp
          </DialogTitle>
          <div className="text-sm text-slate-600 mt-2">
            إلى: {leadName} ({phoneNumber})
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نص الرسالة</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="اكتب رسالة WhatsApp هنا..."
                      {...field}
                      disabled={messageStatus === 'sending'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 space-x-reverse pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={messageStatus === 'sending'}
              >
                إلغاء
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