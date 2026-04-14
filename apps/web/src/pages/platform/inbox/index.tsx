/**
 * inbox/index.tsx - WhatsApp-style Two-Way Chat Inbox
 *
 * Route: /home/platform/inbox
 *
 * Two-panel RTL layout matching modern chat UI:
 *   - Right panel: Conversation list with avatars, search, labels, pins
 *   - Left panel:  Chat thread with rich header, date separators, quick replies
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  Search,
  Tag,
  X,
  Pin,
  PinOff,
  Plus,
  Zap,
  ExternalLink,
  Trash2,
  ChevronDown,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  User,
  Copy,
  Trash,
  Reply,
  MessageCirclePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { InboxSkeleton } from "@/components/skeletons/page-skeletons";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import type { Lead } from "@shared/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  conversationKey: string;
  leadId: string | null;
  phone: string | null;
  contactName: string;
  lastMessageContent: string;
  lastMessageAt: string;
  lastMessageDirection: string;
  unreadCount: number;
  channel: string;
  labels?: string[];
  pinned?: boolean;
}

interface Message {
  id: string;
  leadId: string | null;
  customerId: string | null;
  agentId: string;
  direction: string;
  channel: string;
  content: string;
  phone: string | null;
  status: string;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  isMine?: boolean;
  metadata: string | null;
}

interface QuickReplyTemplate {
  id: string;
  title: string;
  content: string;
  category: string | null;
  sortOrder: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const LABEL_OPTIONS = ["عميل ساخن", "متابعة", "مكتمل"] as const;
const LABEL_COLORS: Record<string, string> = {
  "عميل ساخن": "bg-destructive/10 text-destructive border-destructive/30",
  "متابعة": "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]",
  "مكتمل": "bg-primary/10 text-primary border-primary/30",
};

const DEFAULT_TEMPLATES: { title: string; content: string; category: string }[] = [
  { title: "تحية", content: "السلام عليكم ورحمة الله وبركاته، كيف يمكنني مساعدتك؟", category: "عام" },
  { title: "تأكيد موعد", content: "تم تأكيد موعد المعاينة. نراكم في الموعد المحدد إن شاء الله.", category: "عام" },
  { title: "تفاصيل العقار", content: "يسعدني مشاركة تفاصيل العقار معك. العقار يتميز بـ:", category: "عقارات" },
  { title: "شكرًا", content: "شكرًا لتواصلك معنا. لا تتردد في الاستفسار عن أي شيء آخر.", category: "عام" },
  { title: "المتابعة", content: "مرحبًا، أتمنى أنك بخير. أود المتابعة بخصوص العقار الذي تحدثنا عنه سابقًا.", category: "متابعة" },
];

// Stable avatar colors derived from name
// Avatar colors — teal/green family matching the app's hue-160 primary
const AVATAR_COLORS = [
  "bg-[hsl(160,84%,35%)]",   // primary teal
  "bg-[hsl(165,70%,40%)]",   // light teal
  "bg-[hsl(150,60%,38%)]",   // green-teal
  "bg-[hsl(175,55%,38%)]",   // cyan-teal
  "bg-[hsl(140,50%,42%)]",   // forest
  "bg-[hsl(185,50%,40%)]",   // ocean
  "bg-[hsl(155,65%,32%)]",   // deep teal
  "bg-[hsl(170,60%,36%)]",   // medium teal
  "bg-[hsl(145,55%,45%)]",   // bright green
  "bg-[hsl(180,50%,35%)]",   // dark cyan
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || "?").toUpperCase();
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ContactAvatar({ name, size = "md", online }: { name: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  return (
    <div className={cn("relative rounded-full flex items-center justify-center text-white font-bold flex-shrink-0", dim, getAvatarColor(name))}>
      <span className={textSize}>{getInitials(name)}</span>
      {online !== undefined && (
        <span className={cn(
          "absolute bottom-0 end-0 rounded-full border-2 border-card",
          online ? "bg-primary" : "bg-muted-foreground/40",
          size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"
        )} />
      )}
    </div>
  );
}

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "READ":
      return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
    case "DELIVERED":
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/60" />;
    case "SENT":
      return <Check className="h-3.5 w-3.5 text-muted-foreground/60" />;
    case "FAILED":
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />;
  }
}

function ChannelBadge({ channel }: { channel: string }) {
  const labels: Record<string, string> = { whatsapp: "واتساب", sms: "رسالة قصيرة", email: "بريد" };
  const colors: Record<string, string> = {
    whatsapp: "bg-primary/10 text-primary",
    sms: "bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]",
    email: "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", colors[channel] || "bg-muted text-muted-foreground")}>
      {labels[channel] || channel}
    </span>
  );
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return "اليوم";
  if (isYesterday(date)) return "أمس";
  return format(date, "d MMMM yyyy", { locale: ar });
}

function getShortTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `${diffMins} دقيقة`;
  if (isToday(d)) return format(d, "hh:mm a", { locale: ar });
  if (isYesterday(d)) return "أمس";
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays} أيام`;
  return format(d, "d MMM", { locale: ar });
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function InboxPage() {
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConvSearch, setNewConvSearch] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/inbox"],
    queryFn: () => apiGet<Conversation[]>("/api/inbox"),
    refetchInterval: 10_000,
  });

  const { data: templates = [] } = useQuery<QuickReplyTemplate[]>({
    queryKey: ["/api/inbox/templates/quick-replies"],
    queryFn: () => apiGet<QuickReplyTemplate[]>("/api/inbox/templates/quick-replies"),
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: showNewConversation,
  });

  const allTemplates = useMemo(() => {
    if (templates.length > 0) return templates;
    return DEFAULT_TEMPLATES.map((t, i) => ({ id: `default-${i}`, ...t, sortOrder: i }));
  }, [templates]);

  const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + c.unreadCount, 0), [conversations]);

  const filteredConversations = conversations.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.contactName.toLowerCase().includes(q) && !c.lastMessageContent.toLowerCase().includes(q) && !(c.phone || "").includes(q)) return false;
    }
    if (labelFilter && !(c.labels || []).includes(labelFilter)) return false;
    return true;
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addLabelMutation = useMutation({
    mutationFn: ({ key, label }: { key: string; label: string }) => apiPost(`/api/inbox/${key}/label`, { label }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/inbox"] }),
  });

  const removeLabelMutation = useMutation({
    mutationFn: ({ key, label }: { key: string; label: string }) => apiDelete(`/api/inbox/${key}/label/${encodeURIComponent(label)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/inbox"] }),
  });

  const pinMutation = useMutation({
    mutationFn: ({ key, pin }: { key: string; pin: boolean }) =>
      pin ? apiPost(`/api/inbox/${key}/pin`, {}) : apiDelete(`/api/inbox/${key}/pin`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/inbox"] }),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => apiPost("/api/inbox/templates/quick-replies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inbox/templates/quick-replies"] });
      setNewTemplateName("");
      setNewTemplateContent("");
      toast.success("تم حفظ القالب");
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/inbox/templates/quick-replies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/inbox/templates/quick-replies"] }),
  });

  const selectedConv = conversations.find((c) => c.conversationKey === selectedConversation);

  // ── Message thread ─────────────────────────────────────────────────────────

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/inbox", selectedConversation],
    queryFn: () => apiGet<Message[]>(`/api/inbox/${selectedConversation}`),
    enabled: !!selectedConversation,
    refetchInterval: 5_000,
  });

  const messagesWithSeparators = useMemo(() => {
    const result: Array<{ type: "separator"; date: string } | { type: "message"; message: Message }> = [];
    let lastDate: string | null = null;
    for (const msg of messages) {
      const msgDate = new Date(msg.sentAt);
      const dateKey = format(msgDate, "yyyy-MM-dd");
      if (dateKey !== lastDate) {
        result.push({ type: "separator", date: getDateLabel(msgDate) });
        lastDate = dateKey;
      }
      result.push({ type: "message", message: msg });
    }
    return result;
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send mutation ──────────────────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: (payload: { leadId?: string; channel: string; content: string; phone?: string }) =>
      apiPost("/api/inbox/send", payload),
    onSuccess: () => {
      setMessageText("");
      setShowQuickReplies(false);
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox", selectedConversation] });
    },
    onError: () => toast.error("فشل في إرسال الرسالة"),
  });

  const handleSend = () => {
    if (!messageText.trim() || !selectedConv) return;
    sendMutation.mutate({
      leadId: selectedConv.leadId ?? undefined,
      channel: selectedConv.channel || "whatsapp",
      content: messageText.trim(),
      phone: selectedConv.phone ?? undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Audio recording ────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECORDING_SECONDS = 60;

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= MAX_RECORDING_SECONDS - 1) {
            stopRecording(true);
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error("لم يتم السماح بالوصول إلى الميكروفون");
    }
  }, []);

  const stopRecording = useCallback((autoSend = false) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      recorder.stream.getTracks().forEach((t) => t.stop());

      if (autoSend || blob.size > 0) {
        // Convert to base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (selectedConv) {
            sendMutation.mutate({
              leadId: selectedConv.leadId ?? undefined,
              channel: selectedConv.channel || "whatsapp",
              content: `🎤 [audio:${base64}]`,
              phone: selectedConv.phone ?? undefined,
            });
          }
        };
        reader.readAsDataURL(blob);
      }

      setIsRecording(false);
      setRecordingDuration(0);
    };

    recorder.stop();
  }, [selectedConv, sendMutation]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stream.getTracks().forEach((t) => t.stop());
      recorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleQuickReply = (content: string) => { setMessageText(content); setShowQuickReplies(false); };

  const handleStartNewConversation = (lead: Lead) => {
    const existing = conversations.find((c) => c.leadId === lead.id);
    setSelectedConversation(existing ? existing.conversationKey : lead.id);
    setShowNewConversation(false);
    setNewConvSearch("");
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("تم نسخ الرسالة");
    setMessageMenuOpen(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingConversations || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <InboxSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-xl border bg-card">
      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — Conversation List (RTL = start side)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="w-[340px] flex-shrink-0 flex flex-col border-e bg-card">

        {/* List header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">المحادثات</h2>
          <div className="flex items-center gap-1">
            {totalUnread > 0 && (
              <Badge className="h-5 min-w-5 text-[10px] px-1.5 justify-center bg-primary hover:bg-primary/90 text-white border-0">
                {totalUnread}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowNewConversation(!showNewConversation)}
              title="محادثة جديدة"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9 text-sm rounded-full bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Label filter chips */}
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {LABEL_OPTIONS.map((l) => (
            <Badge
              key={l}
              variant="outline"
              className={cn(
                "text-[10px] cursor-pointer transition-all",
                labelFilter === l ? LABEL_COLORS[l] : "opacity-40 hover:opacity-70"
              )}
              onClick={() => setLabelFilter(labelFilter === l ? null : l)}
            >
              {l}
            </Badge>
          ))}
          {labelFilter && (
            <button className="text-destructive/60 hover:text-destructive" onClick={() => setLabelFilter(null)}>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* New conversation picker */}
        {showNewConversation && (
          <div className="px-4 pb-3 space-y-2 border-b bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground">محادثة جديدة — اختر عميل:</p>
            <Input
              placeholder="بحث عن عميل..."
              value={newConvSearch}
              onChange={(e) => setNewConvSearch(e.target.value)}
              className="h-8 text-xs rounded-lg"
              autoFocus
            />
            <ScrollArea className="max-h-36">
              <div className="space-y-0.5">
                {leads.filter((l) => {
                  if (!newConvSearch.trim()) return true;
                  const q = newConvSearch.toLowerCase();
                  const name = ((l as any).customer?.firstName || "") + " " + ((l as any).customer?.lastName || "");
                  return name.toLowerCase().includes(q) || (l.id || "").includes(q);
                }).slice(0, 10).map((lead) => {
                  const name = (lead as any).customer?.firstName || (lead as any).customer?.phone || lead.id;
                  return (
                    <button
                      key={lead.id}
                      className="w-full text-start px-2 py-2 rounded-lg text-xs hover:bg-muted transition-colors flex items-center gap-2.5"
                      onClick={() => handleStartNewConversation(lead)}
                    >
                      <ContactAvatar name={name} size="sm" />
                      <span className="truncate font-medium">{name}</span>
                    </button>
                  );
                })}
                {leads.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">لا يوجد عملاء</p>}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Conversation list */}
        {filteredConversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title={searchQuery || labelFilter ? "لا توجد نتائج" : "لا توجد محادثات"}
              description={!searchQuery && !labelFilter ? "ابدأ محادثة جديدة مع عميل" : undefined}
            />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.conversationKey}
                onClick={() => setSelectedConversation(conv.conversationKey)}
                className={cn(
                  "w-full text-start px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 border-b border-border/40",
                  selectedConversation === conv.conversationKey && "bg-muted/70"
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <ContactAvatar name={conv.contactName} online={conv.unreadCount > 0 ? true : undefined} />
                  {conv.pinned && (
                    <div className="absolute -top-1 -start-1 h-4 w-4 rounded-full bg-card flex items-center justify-center shadow-sm border">
                      <Pin className="h-2.5 w-2.5 text-primary" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground")}>
                      {conv.contactName}
                    </span>
                    <span className={cn("text-[11px] flex-shrink-0", conv.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground")}>
                      {getShortTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground")}>
                      {conv.lastMessageDirection === "OUTBOUND" && (
                        <MessageStatusIcon status={conv.unreadCount > 0 ? "DELIVERED" : "READ"} />
                      )}
                      {conv.lastMessageDirection === "OUTBOUND" && " "}
                      {conv.lastMessageContent}
                    </p>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conv.unreadCount > 0 && (
                        <span className="h-5 min-w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Labels */}
                  {(conv.labels || []).length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {conv.labels!.map((l) => (
                        <Badge key={l} variant="outline" className={cn("text-[9px] h-4 px-1.5 rounded-full", LABEL_COLORS[l] || "")}>
                          {l}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </ScrollArea>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LEFT PANEL — Chat Thread
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-muted/20">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center bg-[radial-gradient(circle_at_center,hsl(var(--muted)/0.5),transparent_70%)]">
            <div className="text-center space-y-3">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <MessageSquare className="h-9 w-9 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-foreground/70">اختر محادثة</p>
                <p className="text-sm text-muted-foreground mt-1">اختر محادثة من القائمة لعرض الرسائل</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ─────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <ContactAvatar name={selectedConv?.contactName || "?"} size="lg" online />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {selectedConv?.contactName || "محادثة"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-primary font-medium">متصل</span>
                    {selectedConv?.phone && (
                      <span className="text-xs text-muted-foreground" dir="ltr">{selectedConv.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header action icons — like the reference design */}
              <div className="flex items-center gap-1">
                {selectedConv?.phone && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => window.open(`tel:${selectedConv.phone}`, "_self")}
                      title="مكالمة صوتية"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" title="مكالمة فيديو">
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </>
                )}

                {/* Three-dot menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>

                  {showHeaderMenu && selectedConv && (
                    <div className="absolute top-full end-0 mt-1 bg-popover border rounded-xl shadow-xl p-1.5 z-50 min-w-44 animate-in fade-in slide-in-from-top-1 duration-150">
                      {selectedConv.leadId && (
                        <button
                          className="w-full text-start px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-muted transition-colors"
                          onClick={() => { setLocation("/home/platform/leads"); setShowHeaderMenu(false); }}
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          ملف العميل
                        </button>
                      )}
                      <button
                        className="w-full text-start px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-muted transition-colors"
                        onClick={() => {
                          pinMutation.mutate({ key: selectedConv.conversationKey, pin: !selectedConv.pinned });
                          setShowHeaderMenu(false);
                        }}
                      >
                        {selectedConv.pinned ? <PinOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
                        {selectedConv.pinned ? "إلغاء التثبيت" : "تثبيت المحادثة"}
                      </button>

                      <div className="my-1 h-px bg-border" />
                      <p className="px-3 py-1 text-[10px] text-muted-foreground font-medium">تصنيف</p>
                      {LABEL_OPTIONS.map((label) => {
                        const isActive = (selectedConv.labels || []).includes(label);
                        return (
                          <button
                            key={label}
                            className={cn("w-full text-start px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-muted transition-colors", isActive && "font-bold")}
                            onClick={() => {
                              if (isActive) removeLabelMutation.mutate({ key: selectedConv.conversationKey, label });
                              else addLabelMutation.mutate({ key: selectedConv.conversationKey, label });
                              setShowHeaderMenu(false);
                            }}
                          >
                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 rounded-full", LABEL_COLORS[label])}>{label}</Badge>
                            {isActive && <Check className="h-3 w-3 text-primary ms-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Messages area ────────────────────────────────────────────── */}
            <ScrollArea className="flex-1 px-6 py-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner size="lg" className="text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">لا توجد رسائل بعد — ابدأ المحادثة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messagesWithSeparators.map((item, idx) => {
                    if (item.type === "separator") {
                      return (
                        <div key={`sep-${idx}`} className="flex items-center justify-center my-5">
                          <span className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-3 py-1 rounded-full">
                            {item.date}
                          </span>
                        </div>
                      );
                    }
                    const msg = item.message;
                    const mine = msg.isMine ?? msg.direction === "OUTBOUND";
                    const isHovered = hoveredMessage === msg.id;
                    const isMenuOpen = messageMenuOpen === msg.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex items-end gap-1 group relative", mine ? "justify-end" : "justify-start")}
                        onMouseEnter={() => setHoveredMessage(msg.id)}
                        onMouseLeave={() => { setHoveredMessage(null); if (isMenuOpen) setMessageMenuOpen(null); }}
                      >
                        {/* Message bubble actions (three-dot) */}
                        {mine && (isHovered || isMenuOpen) && (
                          <div className="relative flex-shrink-0">
                            <button
                              className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                              onClick={() => setMessageMenuOpen(isMenuOpen ? null : msg.id)}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                            {isMenuOpen && (
                              <div className="absolute bottom-full start-0 mb-1 bg-popover border rounded-lg shadow-lg p-1 z-50 min-w-28 animate-in fade-in duration-100">
                                <button className="w-full text-start px-2.5 py-1.5 rounded text-[11px] flex items-center gap-2 hover:bg-muted" onClick={() => handleCopyMessage(msg.content)}>
                                  <Copy className="h-3 w-3" /> نسخ
                                </button>
                                <button className="w-full text-start px-2.5 py-1.5 rounded text-[11px] flex items-center gap-2 hover:bg-muted" onClick={() => { setMessageText(msg.content); setMessageMenuOpen(null); }}>
                                  <Reply className="h-3 w-3 rtl:-scale-x-100" /> إعادة إرسال
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className={cn(
                            "max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                            mine
                              ? "bg-primary text-primary-foreground rounded-ee-sm"
                              : "bg-card text-foreground border rounded-es-sm"
                          )}
                        >
                          {msg.content.startsWith("🎤 [audio:") ? (
                            <div className="flex items-center gap-2 min-w-[200px]">
                              <Mic className="h-4 w-4 shrink-0" />
                              <audio
                                src={msg.content.replace("🎤 [audio:", "").replace(/\]$/, "")}
                                controls
                                className="h-8 w-full max-w-[250px]"
                                style={{ filter: mine ? "invert(1) brightness(2)" : "none" }}
                              />
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                          <div className={cn(
                            "flex items-center gap-1 mt-1.5 text-[10px]",
                            mine ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"
                          )}>
                            <span>
                              {new Date(msg.sentAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {mine && <MessageStatusIcon status={msg.status} />}
                          </div>
                        </div>

                        {/* Actions on the other side for inbound messages */}
                        {!mine && (isHovered || isMenuOpen) && (
                          <div className="relative flex-shrink-0">
                            <button
                              className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                              onClick={() => setMessageMenuOpen(isMenuOpen ? null : msg.id)}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                            {isMenuOpen && (
                              <div className="absolute bottom-full end-0 mb-1 bg-popover border rounded-lg shadow-lg p-1 z-50 min-w-28 animate-in fade-in duration-100">
                                <button className="w-full text-start px-2.5 py-1.5 rounded text-[11px] flex items-center gap-2 hover:bg-muted" onClick={() => handleCopyMessage(msg.content)}>
                                  <Copy className="h-3 w-3" /> نسخ
                                </button>
                                <button className="w-full text-start px-2.5 py-1.5 rounded text-[11px] flex items-center gap-2 hover:bg-muted" onClick={() => { setMessageText(msg.content); setMessageMenuOpen(null); }}>
                                  <Reply className="h-3 w-3 rtl:-scale-x-100" /> إعادة إرسال
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* ── Quick replies panel ──────────────────────────────────────── */}
            {showQuickReplies && (
              <div className="border-t bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">ردود سريعة</p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm" className="h-6 text-[10px] gap-1"
                      onClick={() => setShowTemplateManager(!showTemplateManager)}
                    >
                      <Plus className="h-3 w-3" />
                      {showTemplateManager ? "إلغاء" : "إدارة"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowQuickReplies(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {showTemplateManager && (
                  <div className="mb-3 p-2.5 rounded-xl border bg-muted/30 space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="اسم القالب" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="h-7 text-xs flex-1 rounded-lg" />
                      <Input placeholder="نص الرسالة" value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} className="h-7 text-xs flex-[2] rounded-lg" />
                      <Button size="sm" className="h-7 text-xs rounded-lg" disabled={!newTemplateName.trim() || !newTemplateContent.trim() || createTemplateMutation.isPending} onClick={() => createTemplateMutation.mutate({ title: newTemplateName.trim(), content: newTemplateContent.trim() })}>
                        حفظ
                      </Button>
                    </div>
                    {templates.length > 0 && (
                      <div className="space-y-1">
                        {templates.map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-card">
                            <span className="font-medium">{t.title}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/70 hover:text-destructive" onClick={() => deleteTemplateMutation.mutate(t.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {allTemplates.map((t) => (
                    <Button
                      key={t.id} variant="outline" size="sm"
                      className="h-auto py-1.5 px-3 text-xs rounded-full whitespace-normal text-start"
                      onClick={() => handleQuickReply(t.content)} title={t.content}
                    >
                      {t.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Message input bar ────────────────────────────────────────── */}
            <div className="px-4 py-3 border-t bg-card">
              {isRecording ? (
                /* ── Recording UI ──────────────────────────────────────────── */
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full flex-shrink-0 text-destructive" onClick={cancelRecording} title="إلغاء">
                    <Trash2 className="h-5 w-5" />
                  </Button>

                  <div className="flex-1 flex items-center gap-3 bg-destructive/5 rounded-full px-4 py-2">
                    <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm font-mono font-bold text-destructive tabular-nums">
                      {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, "0")}
                    </span>
                    <div className="flex-1 flex items-center gap-0.5">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-destructive/40"
                          style={{ height: `${Math.random() * 16 + 4}px`, transition: "height 0.3s" }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {MAX_RECORDING_SECONDS - recordingDuration}s
                    </span>
                  </div>

                  <Button size="icon" className="h-9 w-9 rounded-full flex-shrink-0" onClick={() => stopRecording(true)} title="إرسال">
                    <Send className="h-4 w-4 rtl:-scale-x-100" />
                  </Button>
                </div>
              ) : (
                /* ── Normal input UI ───────────────────────────────────────── */
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full flex-shrink-0" title="رموز تعبيرية">
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full flex-shrink-0" title="إرفاق ملف">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className={cn("h-9 w-9 rounded-full flex-shrink-0", showQuickReplies && "bg-muted")}
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    title="ردود سريعة"
                  >
                    <Zap className="h-5 w-5 text-muted-foreground" />
                  </Button>

                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالة..."
                    className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 h-10"
                    disabled={sendMutation.isPending}
                  />

                  {messageText.trim() ? (
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-full flex-shrink-0"
                      onClick={handleSend}
                      disabled={sendMutation.isPending}
                    >
                      {sendMutation.isPending ? <Spinner size="sm" /> : <Send className="h-4 w-4 rtl:-scale-x-100" />}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full flex-shrink-0"
                      title="رسالة صوتية (حتى دقيقة)"
                      onClick={startRecording}
                    >
                      <Mic className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
