/**
 * inbox/index.tsx - WhatsApp Two-Way Chat Inbox
 *
 * Route: /home/platform/inbox
 *
 * Two-panel RTL layout:
 *   - Right panel: Conversation list (grouped by lead/phone)
 *   - Left panel:  Chat thread with message input
 */

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  Search,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/ui/empty-state";
import PageHeader from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { InboxSkeleton } from "@/components/skeletons/page-skeletons";
import { apiGet, apiPost } from "@/lib/apiClient";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

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
  /** Labels applied to this conversation (E12). Source: conversation_labels table. */
  labels?: string[];
}

/** Available conversation label options (E12). */
const LABEL_OPTIONS = ["عميل ساخن", "متابعة", "مكتمل"] as const;
const LABEL_COLORS: Record<string, string> = {
  "عميل ساخن": "bg-destructive/10 text-destructive border-destructive/30",
  "متابعة": "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]",
  "مكتمل": "bg-primary/10 text-primary border-primary/30",
};

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
  metadata: string | null;
}

// ── Status icon helper ───────────────────────────────────────────────────────

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "READ":
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    case "DELIVERED":
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    case "SENT":
      return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    case "FAILED":
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

// ── Channel badge ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: string }) {
  const labels: Record<string, string> = {
    whatsapp: "واتساب",
    sms: "رسالة قصيرة",
    email: "بريد",
  };
  const colors: Record<string, string> = {
    whatsapp: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    sms: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    email: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", colors[channel] || "bg-muted text-muted-foreground")}>
      {labels[channel] || channel}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function InboxPage() {
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  /** Search query for filtering conversations (E12). */
  const [searchQuery, setSearchQuery] = useState("");
  /** Active label filter — null = show all (E12). */
  const [labelFilter, setLabelFilter] = useState<string | null>(null);

  // ── Conversations list ─────────────────────────────────────────────────────
  const {
    data: conversations = [],
    isLoading: loadingConversations,
  } = useQuery<Conversation[]>({
    queryKey: ["/api/inbox"],
    queryFn: () => apiGet<Conversation[]>("/api/inbox"),
    refetchInterval: 10_000, // poll every 10s for new messages
  });

  /** Filter conversations by search query + label (E12). */
  const filteredConversations = conversations.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.contactName.toLowerCase().includes(q) && !c.lastMessageContent.toLowerCase().includes(q) && !(c.phone || "").includes(q)) return false;
    }
    if (labelFilter && !(c.labels || []).includes(labelFilter)) return false;
    return true;
  });

  /** Add/remove label mutation (E12). */
  const addLabelMutation = useMutation({
    mutationFn: ({ key, label }: { key: string; label: string }) =>
      apiPost(`/api/inbox/${key}/label`, { label }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/inbox"] }),
  });

  // Derive selected conversation metadata
  const selectedConv = conversations.find((c) => c.conversationKey === selectedConversation);

  // ── Message thread ─────────────────────────────────────────────────────────
  const {
    data: messages = [],
    isLoading: loadingMessages,
  } = useQuery<Message[]>({
    queryKey: ["/api/inbox", selectedConversation],
    queryFn: () => apiGet<Message[]>(`/api/inbox/${selectedConversation}`),
    enabled: !!selectedConversation,
    refetchInterval: 5_000,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message mutation ──────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (payload: { leadId?: string; channel: string; content: string; phone?: string }) =>
      apiPost("/api/inbox/send", payload),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox", selectedConversation] });
    },
    onError: () => {
      toast.error("فشل في إرسال الرسالة");
    },
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingConversations || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="صندوق الرسائل" subtitle="المحادثات والرسائل" />
        <InboxSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="صندوق الرسائل" subtitle="المحادثات والرسائل" />

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* ── Right panel: Conversation List (RTL = start side) ──────────── */}
        <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <h3 className="text-sm font-semibold text-foreground">المحادثات</h3>
          </div>

          {/* Search + label filter (E12) */}
          <div className="p-2 space-y-2 border-b">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-8 h-8 text-xs"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {LABEL_OPTIONS.map((l) => (
                <Badge
                  key={l}
                  variant="outline"
                  className={cn("text-[10px] cursor-pointer", labelFilter === l ? LABEL_COLORS[l] : "opacity-50")}
                  onClick={() => setLabelFilter(labelFilter === l ? null : l)}
                >
                  {l}
                </Badge>
              ))}
              {labelFilter && (
                <Badge variant="outline" className="text-[10px] cursor-pointer text-destructive border-0" onClick={() => setLabelFilter(null)}>
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>

          {loadingConversations ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" className="text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <EmptyState
                icon={MessageSquare}
                title={searchQuery || labelFilter ? "لا توجد نتائج" : "لا توجد محادثات"}
                description={!searchQuery && !labelFilter ? "ابدأ محادثة جديدة مع عميل" : undefined}
              />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.conversationKey}
                    onClick={() => setSelectedConversation(conv.conversationKey)}
                    className={cn(
                      "w-full text-start p-3 hover:bg-muted/50 transition-colors",
                      selectedConversation === conv.conversationKey && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {conv.channel === "whatsapp" ? (
                          <Phone className="h-4 w-4 text-green-600" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {conv.contactName}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessageDirection === "OUTBOUND" && "أنت: "}
                            {conv.lastMessageContent}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <ChannelBadge channel={conv.channel} />
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="h-5 min-w-5 text-[10px] px-1.5 justify-center">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Conversation labels (E12) */}
                        {(conv.labels || []).length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {conv.labels!.map((l) => (
                              <Badge key={l} variant="outline" className={cn("text-[9px] h-4 px-1", LABEL_COLORS[l] || "")}>
                                {l}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* ── Left panel: Chat Thread ────────────────────────────────────── */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="اختر محادثة"
                description="اختر محادثة من القائمة لعرض الرسائل"
              />
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-3 border-b flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {selectedConv?.contactName || "محادثة"}
                  </h3>
                  {selectedConv?.phone && (
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {selectedConv.phone}
                    </p>
                  )}
                </div>
                {selectedConv && <ChannelBadge channel={selectedConv.channel} />}
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Spinner size="lg" className="text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">لا توجد رسائل بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOutbound = msg.direction === "OUTBOUND";
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOutbound ? "justify-start" : "justify-end"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                              isOutbound
                                ? "bg-primary text-primary-foreground rounded-bl-sm"
                                : "bg-muted text-foreground rounded-br-sm"
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div
                              className={cn(
                                "flex items-center gap-1 mt-1 text-[10px]",
                                isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              <span>
                                {new Date(msg.sentAt).toLocaleTimeString("ar-SA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isOutbound && <MessageStatusIcon status={msg.status} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالة..."
                    className="flex-1"
                    disabled={sendMutation.isPending}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMutation.isPending}
                  >
                    {sendMutation.isPending ? (
                      <Spinner size="sm" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
