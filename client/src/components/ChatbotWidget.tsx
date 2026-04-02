import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, RotateCcw, Loader2 } from "lucide-react";
import { chapters } from "@/lib/cookbookData";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WIDGET_BG = "oklch(0.18 0.02 40)";
const MAX_MESSAGES = 20;

export default function ChatbotWidget({ departmentContext }: { departmentContext?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);

    abortRef.current = new AbortController();

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: (() => {
            const msgs = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
            // Add department context if available
            if (departmentContext) {
              msgs.unshift({
                role: "user",
                content: `[Department context: ${departmentContext}. Tailor your prompt engineering advice to this department's specific workflows and document types.]`,
              });
            }
            // Add page context if on a chapter
            const hash = window.location.hash.replace("#", "");
            if (hash) {
              const ch = chapters.find((c) => c.id === hash);
              if (ch) {
                msgs.unshift({
                  role: "user",
                  content: `[Context: I'm currently reading "${ch.title}" — ${ch.subtitle}. Help me with questions about this topic.]`,
                });
              }
            }
            return msgs;
          })(),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.content || parsed.choices?.[0]?.delta?.content || parsed.token || parsed.text || "";
              accumulated += token;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: accumulated };
                return next;
              });
            } catch {
              if (data.trim()) {
                accumulated += data;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: accumulated };
                  return next;
                });
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: "Sorry, I could not connect to the server. Please try again later.",
          };
          return next;
        });
      }
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, departmentContext]);

  const handleNewChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const atLimit = messages.filter((m) => m.role === "user").length >= MAX_MESSAGES;

  return (
    <>
      {/* Toggle button — Menu Planning FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
            aria-label="Open Menu Planning assistant"
          >
            {/* Breathing glow */}
            <motion.div
              className="absolute -inset-1 rounded-2xl"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.16 50 / 0.25), oklch(0.45 0.14 30 / 0.15))", filter: "blur(8px)" }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.25, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Main pill */}
            <motion.div
              className="relative flex items-center gap-3 pl-4 pr-6 py-3.5 rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, oklch(0.28 0.10 50), oklch(0.20 0.06 38), oklch(0.16 0.04 30))",
                boxShadow: "0 10px 40px oklch(0.08 0.04 40 / 0.55), 0 2px 8px oklch(0.15 0.06 45 / 0.30), inset 0 1px 0 oklch(0.45 0.08 55 / 0.25)",
                border: "1px solid oklch(0.38 0.08 50 / 0.5)",
              }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Warm shimmer line */}
              <motion.div
                className="absolute inset-0"
                style={{ background: "linear-gradient(105deg, transparent 40%, oklch(0.55 0.14 55 / 0.08) 50%, transparent 60%)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              />
              {/* Chef icon with gentle wobble */}
              <motion.span
                className="text-[28px] relative z-10"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                👨‍🍳
              </motion.span>
              <div className="text-left relative z-10">
                <span
                  className="text-[14px] font-extrabold block leading-tight"
                  style={{ color: "oklch(0.96 0.05 58)", textShadow: "0 1px 2px oklch(0.10 0.04 40 / 0.3)" }}
                >
                  Menu Planning
                </span>
                <span className="text-[10px] font-semibold block mt-0.5" style={{ color: "oklch(0.68 0.12 55)" }}>
                  What are we cooking?
                </span>
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-6 right-6 z-50 flex flex-col rounded-xl overflow-hidden shadow-2xl"
            style={{
              width: 420,
              height: 580,
              maxWidth: "calc(100vw - 48px)",
              maxHeight: "calc(100vh - 48px)",
              background: WIDGET_BG,
              border: "1px solid oklch(0.28 0.03 40)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid oklch(0.28 0.03 40)" }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" style={{ color: "oklch(0.78 0.12 55)" }} />
                <span className="font-serif font-bold text-sm" style={{ color: "oklch(0.90 0.03 75)" }}>
                  Prompt Helper
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewChat}
                  className="p-1.5 rounded-md transition-opacity hover:opacity-80"
                  style={{ color: "oklch(0.60 0.03 55)" }}
                  title="New chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md transition-opacity hover:opacity-80"
                  style={{ color: "oklch(0.60 0.03 55)" }}
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.35 0.04 45)" }} />
                  <p className="text-sm leading-relaxed max-w-[300px] mx-auto" style={{ color: "oklch(0.60 0.03 55)" }}>
                    I help Manatee County staff write better AI prompts. Ask me anything about prompting techniques, templates, or best practices.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background: "oklch(0.35 0.05 220)",
                            color: "oklch(0.92 0.02 75)",
                          }
                        : {
                            background: "oklch(0.24 0.02 40)",
                            color: "oklch(0.85 0.02 75)",
                          }
                    }
                  >
                    {msg.content || (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        style={{ color: "oklch(0.55 0.04 55)" }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div
              className="flex-shrink-0 px-4 py-3"
              style={{ borderTop: "1px solid oklch(0.28 0.03 40)" }}
            >
              {atLimit ? (
                <button
                  onClick={handleNewChat}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "oklch(0.35 0.05 220)", color: "oklch(0.92 0.02 75)" }}
                >
                  Start a new chat
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about prompting..."
                    disabled={streaming}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "oklch(0.24 0.02 40)",
                      color: "oklch(0.88 0.02 75)",
                      border: "1px solid oklch(0.30 0.03 40)",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || streaming}
                    className="p-2 rounded-lg transition-all"
                    style={{
                      background: input.trim() && !streaming ? "oklch(0.78 0.12 55)" : "oklch(0.30 0.03 40)",
                      color: input.trim() && !streaming ? "oklch(0.18 0.02 40)" : "oklch(0.50 0.03 50)",
                      cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                    }}
                  >
                    {streaming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
