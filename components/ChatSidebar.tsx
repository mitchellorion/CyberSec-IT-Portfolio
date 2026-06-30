"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, ChevronLeft, ChevronRight, X, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import type { ChatMessage } from "@/lib/models";

const POLL_MS = 5000;

function timeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Stable color per username so chat names are easy to tell apart.
function colorFor(name: string): string {
  const palette = ["#9d5cf5", "#06b6d4", "#10b981", "#f59e0b", "#e0115f", "#2f6fed", "#a855f7"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

function ChatPanel({ onClose }: { onClose?: () => void }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  const refresh = useCallback(async () => {
    const msgs = await store.listChat();
    setMessages(msgs);
  }, []);

  // initial load + poll
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // keep pinned to bottom when already at bottom
  useEffect(() => {
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !user) return;
    setSending(true);
    atBottomRef.current = true;
    const msg = await store.sendChat(token, text);
    setSending(false);
    if (msg) {
      setDraft("");
      refresh();
    }
  };

  const online = new Set(messages.map((m) => m.author)).size;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-card)" }}>
      {/* header */}
      <div className="flex items-center justify-between px-3 h-12 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <MessageCircle size={16} style={{ color: "var(--accent-bright)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Community Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--green)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            <Users size={11} /> {online}
          </span>
          {onClose && (
            <button onClick={onClose} className="lg:hidden" style={{ color: "var(--text-muted)" }} aria-label="Close chat">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {messages.length === 0 ? (
          <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
            No messages yet. Say hi 👋
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold truncate" style={{ color: colorFor(m.author) }}>
                  {m.author}
                </span>
                <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                  {timeShort(m.createdAt)}
                </span>
              </div>
              <p className="text-xs break-words" style={{ color: "var(--text-secondary)" }}>{m.body}</p>
            </div>
          ))
        )}
      </div>

      {/* composer */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        {user ? (
          <form onSubmit={send} className="flex items-center gap-2">
            <input
              type="text" value={draft} maxLength={300}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message…"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
            />
            <button type="submit" disabled={!draft.trim() || sending}
              className="shrink-0 p-2 rounded-lg transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }} aria-label="Send">
              <Send size={15} />
            </button>
          </form>
        ) : (
          <Link href="/account"
            className="block text-center text-xs py-2 rounded-lg font-medium"
            style={{ background: "var(--accent-glow)", color: "var(--accent-bright)", border: "1px solid rgba(124,58,237,0.3)" }}>
            Sync your account to chat
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ChatSidebar() {
  const [collapsed, setCollapsed] = useState(false); // desktop
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* desktop: persistent collapsible rail */}
      <aside
        className="hidden lg:flex sticky top-0 h-screen shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? 0 : 300,
          borderRight: collapsed ? "none" : "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div className="flex flex-col w-[300px] h-full">
          <ChatPanel />
        </div>
      </aside>

      {/* desktop collapse/expand handle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="hidden lg:flex items-center justify-center fixed bottom-4 z-50 h-9 w-9 rounded-full shadow-lg transition-all"
        style={{
          left: collapsed ? 16 : 268,
          background: "var(--accent)", color: "#fff",
        }}
        aria-label={collapsed ? "Open chat" : "Collapse chat"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* mobile: floating button + overlay drawer */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 h-12 w-12 rounded-full shadow-lg flex items-center justify-center"
        style={{ background: "var(--accent)", color: "#fff" }}
        aria-label="Open chat"
      >
        <MessageCircle size={20} />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setMobileOpen(false)} />
          <div className="relative w-[85%] max-w-[340px] h-full" style={{ borderRight: "1px solid var(--border)" }}>
            <ChatPanel onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
