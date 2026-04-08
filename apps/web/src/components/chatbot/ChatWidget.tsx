/**
 * ChatWidget.tsx — Smart Floating Chatbot
 *
 * Features:
 *  - Multi-step conversation with branching
 *  - Property listing cards with photos
 *  - WhatsApp handoff button
 *  - Option pills for quick replies
 *  - Arabic RTL layout
 */

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, ExternalLink, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PropertyCard {
  id: string;
  title: string;
  city: string;
  district?: string;
  price: number | null;
  bedrooms?: number;
  area?: number;
  photo?: string;
  url: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: "bot" | "user";
  options?: string[];
  listings?: PropertyCard[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const startChat = async () => {
    setIsOpen(true);
    if (sessionId) return;

    try {
      const res = await fetch("/api/chatbot/init");
      const data = await res.json();
      setSessionId(data.sessionId);
      if (data.messages) {
        setMessages(data.messages.map((m: any, i: number) => ({
          id: `init-${i}`,
          content: m.content,
          sender: "bot" as const,
          options: m.options,
          listings: m.listings,
        })));
      }
    } catch {
      setMessages([{ id: "err", content: "مرحباً! كيف يمكنني مساعدتك؟", sender: "bot" }]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId || completed || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, content: text, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();

      if (data.messages) {
        const botMsgs: ChatMessage[] = data.messages.map((m: any, i: number) => ({
          id: `b-${Date.now()}-${i}`,
          content: m.content,
          sender: "bot" as const,
          options: m.options,
          listings: m.listings,
        }));
        setMessages((prev) => [...prev, ...botMsgs]);
      }

      if (data.completed) setCompleted(true);

      // WhatsApp handoff
      if (data.whatsappHandoff) {
        const { phone, prefilledText } = data.whatsappHandoff;
        setTimeout(() => {
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(prefilledText)}`, "_blank");
        }, 1500);
      }
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, content: "حدث خطأ. يرجى المحاولة مرة أخرى.", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} مليون`;
    if (n >= 1000) return `${Math.round(n / 1000)} ألف`;
    return `${n}`;
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={startChat}
          className="fixed bottom-6 end-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center animate-in fade-in zoom-in"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 end-6 z-50 w-[360px] max-h-[550px] bg-card border rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="font-bold text-sm">المساعد العقاري</p>
                <p className="text-[10px] opacity-80">متصل الآن</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/20 rounded p-1.5 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[400px] bg-muted/20">
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Message bubble */}
                <div className={cn("flex", msg.sender === "user" ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border text-foreground rounded-bl-sm"
                  )}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>

                {/* Property cards */}
                {msg.listings && msg.listings.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {msg.listings.map((listing) => (
                      <a
                        key={listing.id}
                        href={listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-14 w-14 rounded-lg bg-muted shrink-0 overflow-hidden">
                          {listing.photo ? (
                            <img src={listing.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center"><Building size={16} className="text-muted-foreground" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{listing.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin size={8} />{listing.city}{listing.district ? ` - ${listing.district}` : ""}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] mt-0.5">
                            {listing.price && <span className="font-bold text-primary">{formatPrice(listing.price)} ر.س</span>}
                            {listing.bedrooms && <span className="text-muted-foreground">{listing.bedrooms} غرف</span>}
                            {listing.area && <span className="text-muted-foreground">{listing.area} م²</span>}
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Option pills */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => sendMessage(opt)}
                        disabled={loading || completed}
                        className="text-xs bg-card border rounded-full px-3 py-1.5 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-card border rounded-xl px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          {!completed ? (
            <div className="border-t p-2.5 flex gap-2 bg-card">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="اكتب رسالتك..."
                className="flex-1 h-9 text-sm rounded-full border-muted"
                disabled={loading}
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                <Send size={14} />
              </Button>
            </div>
          ) : (
            <div className="border-t p-3 text-center bg-primary/5">
              <p className="text-xs text-muted-foreground">تم إنهاء المحادثة. شكراً لاستخدامك عقاركم!</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
