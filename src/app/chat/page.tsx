"use client";

import ProtectedRoute from "@/src/auth/ProtectedRoute";
import {
  getToken, getUser, clearSession,
  getPrivateKey, hasPrivateKey,
} from "@/src/auth/session";
import { useConversationMessages } from "@/src/hooks/useConversationMessages";
import { useConversations } from "@/src/hooks/useConversations";
import { useUserSearch } from "@/src/hooks/useUserSearch";
import { apiFetch } from "@/src/lib/api";
import { generateMessageKey, encryptMessage, encryptMessageKey } from "@/src/crypto/messageCrypto";
import { decryptIncomingMessage } from "@/src/services/messageService";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const isUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export default function ChatPage() {
  const router = useRouter();
  const currentUser = getUser();

  const { conversations, loading: convLoading, refresh: refreshConversations } = useConversations();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUserName, setActiveUserName] = useState<string>("");
  const activeUserIdRef = useRef<string | null>(null);

  const { messages, loading: msgLoading, setMessages } = useConversationMessages(activeUserId);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { results: searchResults, loading: searchLoading } = useUserSearch(searchQuery);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Deduplicated, sorted message list
  const seenIds = new Set<string>();
  const allMessages = [...messages, ...localMessages]
    .filter((m) => { if (seenIds.has(m.id)) return false; seenIds.add(m.id); return true; })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  useEffect(() => { activeUserIdRef.current = activeUserId; }, [activeUserId]);

  /* ── WebSocket ─────────────────────────────────────────────── */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const ws = new WebSocket(`wss://whisperbox.koyeb.app/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("[WS] connected");
    ws.onclose = () => console.log("[WS] disconnected");
    ws.onerror = (e) => console.error("[WS] error", e);

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event !== "message.receive") return;

        const msg = data;
        const partnerId =
          msg.from_user_id === currentUser?.id ? msg.to_user_id : msg.from_user_id;

        // Only inject into UI if this conversation is currently open
        if (partnerId !== activeUserIdRef.current) {
          refreshConversations();
          return;
        }

        let decrypted = { ...msg, text: "[Encrypted]" };

        if (hasPrivateKey() && msg.payload?.ciphertext) {
          try {
            const privateKey = await getPrivateKey();
            const isSender = msg.from_user_id === currentUser?.id;
            const keyToUse = isSender
              ? msg.payload.encryptedKeyForSelf
              : msg.payload.encryptedKey;
            decrypted = await decryptIncomingMessage({
              message: { ...msg, payload: { ...msg.payload, encryptedKey: keyToUse } },
              privateKey,
            });
          } catch (e) {
            console.warn("[WS] Decryption failed:", e);
          }
        }

        setMessages((prev: any[]) => {
          if (prev.some((m) => m.id === decrypted.id)) return prev;
          return [...prev, decrypted];
        });
        refreshConversations();
      } catch (e) {
        console.error("[WS] Parse error:", e);
      }
    };

    return () => ws.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Conversation selection ─────────────────────────────────── */
  const selectConversation = (userId: string, displayName: string) => {
    setActiveUserId(userId);
    setActiveUserName(displayName);
    setLocalMessages([]);
    setSendError(null);
    setShowSearch(false);
    setSearchQuery("");
  };

  /* ── Logout ─────────────────────────────────────────────────── */
  const handleLogout = async () => {
    try {
      const refreshToken = sessionStorage.getItem("refresh_token");
      if (refreshToken) {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch { /* best-effort */ }
    finally {
      wsRef.current?.close();
      clearSession();
      router.push("/login");
    }
  };

  /* ── Send message ────────────────────────────────────────────── */
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSendError(null);

    if (!activeUserId || !isUUID(activeUserId)) { setSendError("Invalid recipient."); return; }
    if (activeUserId === currentUser?.id) { setSendError("You can't message yourself."); return; }

    const token = getToken();
    if (!token) { setSendError("Not logged in."); return; }

    const tempId = `temp-${Date.now()}`;
    const messageText = input;

    setLocalMessages((prev) => [...prev, {
      id: tempId,
      text: messageText,
      from_user_id: currentUser?.id,  // ← critical for isOwn check
      to_user_id: activeUserId,
      created_at: new Date().toISOString(),
      optimistic: true,
    }]);
    setInput("");
    setSending(true);

    try {
      // Fetch recipient public key
      const { public_key: recipientPubKeyB64 } = await apiFetch(`/users/${activeUserId}/public-key`);
      const recipientPublicKey = await crypto.subtle.importKey(
        "spki",
        Uint8Array.from(atob(recipientPubKeyB64), (c) => c.charCodeAt(0)),
        { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
      );

      // Own public key (so we can decrypt sent messages)
      const myPubKeyB64 = currentUser?.public_key;
      if (!myPubKeyB64) throw new Error("Your public key is missing");
      const myPublicKey = await crypto.subtle.importKey(
        "spki",
        Uint8Array.from(atob(myPubKeyB64), (c) => c.charCodeAt(0)),
        { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
      );

      const aesKey = await generateMessageKey();
      const { iv, data: ciphertext } = await encryptMessage(messageText, aesKey);
      const encryptedKey = await encryptMessageKey(aesKey, recipientPublicKey);
      const encryptedKeyForSelf = await encryptMessageKey(aesKey, myPublicKey);
      const payload = { ciphertext, iv, encryptedKey, encryptedKeyForSelf };

      // Prefer WebSocket; fall back to REST
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: "message.send", to: activeUserId, payload }));
        // Confirm optimistic message immediately (WS send has no response)
        setLocalMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...m, optimistic: false } : m)
        );
      } else {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ to: activeUserId, payload }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.raw || errData.error || "Send failed");
        }
        const saved = await res.json();
        setLocalMessages((prev) =>
          prev.map((m) => m.id === tempId
            ? { ...saved, text: messageText, from_user_id: currentUser?.id, optimistic: false }
            : m)
        );
      }

      refreshConversations();
    } catch (err: any) {
      setSendError(err.message || "Failed to send message");
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  /* ── UI ─────────────────────────────────────────────────────── */
  return (
    <ProtectedRoute>
      <div className="h-screen flex bg-[#0f1117] text-white font-sans antialiased">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#141920]">

          {/* Header */}
          <div className="px-4 pt-5 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm text-white/90">WhisperBox</span>
              </div>
              <button onClick={handleLogout} title="Log out"
                className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            {/* Current user */}
            {currentUser && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {currentUser.display_name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/90 truncate">{currentUser.display_name}</p>
                  <p className="text-[10px] text-white/40 truncate">@{currentUser.username}</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              </div>
            )}
          </div>

          {/* New conversation */}
          <div className="px-4 py-3">
            <button onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-sm font-medium">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Conversation
            </button>

            {showSearch && (
              <div className="mt-2">
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                {searchLoading && <p className="text-xs text-white/40 mt-2 px-1">Searching...</p>}
                {searchResults.map((u: any) => (
                  <div key={u.id} onClick={() => selectConversation(u.id, u.display_name)}
                    className="flex items-center gap-2 px-2 py-2 mt-1 rounded-lg hover:bg-white/10 cursor-pointer transition">
                    <div className="w-7 h-7 rounded-full bg-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                      {u.display_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.display_name}</p>
                      <p className="text-[10px] text-white/40">@{u.username}</p>
                    </div>
                  </div>
                ))}
                {!searchLoading && searchQuery.length >= 1 && searchResults.length === 0 && (
                  <p className="text-xs text-white/30 px-1 mt-2">No users found</p>
                )}
              </div>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-white/30 px-2 mb-2">Messages</p>
            {convLoading && (
              <div className="space-y-2 px-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
              </div>
            )}
            {!convLoading && conversations.length === 0 && (
              <p className="text-xs text-white/30 px-2">No conversations yet. Search above to start one.</p>
            )}
            {conversations.map((c: any) => {
              const isActive = activeUserId === c.user_id;
              return (
                <div key={c.user_id} onClick={() => selectConversation(c.user_id, c.display_name)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition ${isActive ? "bg-indigo-500/20 text-white" : "hover:bg-white/5 text-white/70"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isActive ? "bg-indigo-500" : "bg-white/10"}`}>
                    {c.display_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/80"}`}>{c.display_name}</p>
                    <p className="text-[10px] text-white/30 truncate">@{c.username}</p>
                  </div>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat area ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Chat header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3 bg-[#141920]">
            {activeUserId ? (
              <>
                <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                  {activeUserName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{activeUserName}</p>
                  <div className="flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] text-emerald-400 font-medium">End-to-end encrypted</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-white/40 text-sm">Select a conversation</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#0f1117]">
            {!activeUserId && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-white/60 text-sm font-medium">No conversation selected</p>
                <p className="text-white/30 text-xs mt-1">Choose one from the sidebar or start a new one</p>
              </div>
            )}

            {msgLoading && activeUserId && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <div className="h-10 w-48 rounded-2xl bg-white/5 animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {allMessages.map((msg: any) => {
              const isOwn = msg.from_user_id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                    isOwn
                      ? `bg-indigo-600 text-white ${msg.optimistic ? "opacity-60" : ""}`
                      : "bg-white/10 text-white/90"
                  } ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? "text-indigo-200/70" : "text-white/30"} text-right`}>
                      {fmt(msg.created_at)}{msg.optimistic && " · sending..."}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {activeUserId && (
            <div className="px-6 py-4 border-t border-white/10 bg-[#141920]">
              {sendError && <p className="text-red-400 text-xs mb-2">{sendError}</p>}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 gap-2 focus-within:border-indigo-500/50 transition">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white/20 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type an encrypted message..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <button onClick={sendMessage} disabled={sending || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center flex-shrink-0">
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
