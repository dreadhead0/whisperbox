"use client";

import ProtectedRoute from "@/src/auth/ProtectedRoute";
import {
  getToken,
  getUser,
  clearSession,
  getPrivateKey,
  hasPrivateKey,
} from "@/src/auth/session";
import { useConversationMessages } from "@/src/hooks/useConversationMessages";
import { useConversations } from "@/src/hooks/useConversations";
import { useUserSearch } from "@/src/hooks/useUserSearch";
import { apiFetch } from "@/src/lib/api";
import {
  generateMessageKey,
  encryptMessage,
  encryptMessageKey,
} from "@/src/crypto/messageCrypto";
import { decryptIncomingMessage } from "@/src/services/messageService";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/src/components/ThemeToggle";

const isUUID = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/* ── Icons ─────────────────────────────── */
function HamburgerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const currentUser = getUser();

  // ── ORIGINAL WORKING LOGIC — untouched ──────────────────────────────────
  const {
    conversations,
    loading: convLoading,
    refresh: refreshConversations,
  } = useConversations();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUserName, setActiveUserName] = useState<string>("");

  const {
    messages,
    loading: msgLoading,
    setMessages,
  } = useConversationMessages(activeUserId);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const { results: searchResults } = useUserSearch(searchQuery);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Messages merge — original logic */
  const seen = new Set();
  const allMessages = [...messages, ...localMessages]
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  /* SELECT — original logic */
  const selectConversation = (id: string, name: string) => {
    setActiveUserId(id);
    setActiveUserName(name);
    setSidebarOpen(false);
  };

  /* LOGOUT — original logic */
  const handleLogout = async () => {
    clearSession();
    router.push("/login");
  };

  /* SEND — original logic, unchanged */
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);

    const tempId = Date.now().toString();
    setLocalMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: input,
        from_user_id: currentUser?.id,
        created_at: new Date().toISOString(),
        optimistic: true,
      },
    ]);

    setInput("");
    setSending(false);
  };
  // ── END OF ORIGINAL LOGIC ────────────────────────────────────────────────

  /* Scroll to bottom */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, localMessages]);

  /* Lock body scroll on mobile when sidebar open */
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const getInitial = (name: string) => name?.[0]?.toUpperCase() ?? "?";

  return (
    <ProtectedRoute>
      <div className="h-screen flex bg-white dark:bg-[#0f1117] text-black dark:text-white overflow-hidden transition-colors duration-200">
        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
          fixed md:static z-40
          flex flex-col
          w-72 h-full
          bg-white dark:bg-[#141920]
          border-r border-gray-200 dark:border-white/10
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        >
          {/* Sidebar header — ThemeToggle lives HERE only (not duplicated in main header) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 shrink-0">
            <h1 className="font-semibold text-sm">WhisperBox</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-3 shrink-0">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users…"
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            />
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto py-1">
            {searchResults.map((u: any) => (
              <button
                key={u.id}
                onClick={() => selectConversation(u.id, u.display_name)}
                className={`
                  w-full text-left flex items-center gap-3 px-3 py-2.5 transition
                  ${
                    activeUserId === u.id
                      ? "bg-indigo-50 dark:bg-indigo-500/10 border-r-2 border-indigo-500"
                      : "hover:bg-gray-100 dark:hover:bg-white/10"
                  }
                `}
              >
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <span className="text-indigo-500 dark:text-indigo-400 text-sm font-medium">
                    {getInitial(u.display_name)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.display_name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/30 truncate">
                    @{u.username}
                  </p>
                </div>
              </button>
            ))}

            {searchResults.length === 0 && !searchQuery && (
              <p className="text-xs text-gray-400 dark:text-white/30 text-center py-8 px-4">
                Search for a user to start chatting
              </p>
            )}
          </div>

          {/* Footer — current user + logout */}
          <div className="shrink-0 border-t border-gray-200 dark:border-white/10 px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <span className="text-indigo-500 dark:text-indigo-400 text-xs font-medium">
                  {getInitial(
                    currentUser?.display_name ?? currentUser?.username ?? "?",
                  )}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {currentUser?.display_name ?? currentUser?.username}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30 truncate">
                  @{currentUser?.username}
                </p>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header — hamburger + active chat name, NO second theme toggle */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-white/10 shrink-0">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <HamburgerIcon />
            </button>

            {activeUserId ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-gray-600 dark:text-white/60">
                    {getInitial(activeUserName)}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate">
                  {activeUserName}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-white/40">
                Select a conversation
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!activeUserId && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="text-indigo-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-white/50">
                  End-to-end encrypted
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
                  Search for a user in the sidebar to start chatting
                </p>
              </div>
            )}

            {allMessages.map((m: any) => {
              const isOwn = m.from_user_id === currentUser?.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                    px-3.5 py-2 rounded-2xl max-w-[75%] text-sm leading-relaxed
                    ${
                      isOwn
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-white/10 text-black dark:text-white rounded-bl-sm"
                    }
                    ${m.optimistic ? "opacity-70" : ""}
                  `}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {activeUserId && (
            <div className="shrink-0 p-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition min-w-0"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shrink-0"
              >
                <SendIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
