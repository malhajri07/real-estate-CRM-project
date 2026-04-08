/**
 * ChatWidget.tsx — Floating chatbot for public pages
 *
 * Guides visitors through a conversation flow to capture leads.
 */

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "bot" | "user";
  options?: string[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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
      setMessages([{ id: "0", content: data.message, sender: "bot", options: data.options }]);
    } catch {
      setMessages([{ id: "0", content: "مرحباً! كيف يمكنني مساعدتك؟", sender: "bot" }]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId || completed) return;

    const userMsg: Message = { id: `u-${Date.now()}`, content: text, sender: "user" };
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

      const botMsg: Message = { id: `b-${Date.now()}`, content: data.message, sender: "bot", options: data.options };
      setMessages((prev) => [...prev, botMsg]);

      if (data.completed) setCompleted(true);
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, content: "حدث خطأ. يرجى المحاولة مرة أخرى.", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={startChat}
          className="fixed bottom-6 end-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 end-6 z-50 w-80 max-h-[500px] bg-card border rounded-xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <span className="font-bold text-sm">المساعد العقاري</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/20 rounded p-1">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[350px]">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-start" : "justify-end")}>
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                  msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  <p>{msg.content}</p>
                  {msg.options && msg.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => sendMessage(opt)}
                          disabled={loading}
                          className="text-xs bg-card/80 text-foreground rounded-full px-2.5 py-1 hover:bg-card transition-colors border"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">جاري الكتابة...</div>
              </div>
            )}
          </div>

          {/* Input */}
          {!completed && (
            <div className="border-t p-2 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
                placeholder="اكتب رسالتك..."
                className="flex-1 h-9 text-sm"
                disabled={loading}
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                <Send size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
