"use client";

import { useState } from "react";
import { useUserSearch } from "@/src/hooks/useUserSearch";
import { fetchUserPublicKey } from "@/src/hooks/useUserPublicKey";
import { useTheme } from "@/src/hooks/useTheme";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const { results, loading } = useUserSearch(query);
  const { theme, toggleTheme } = useTheme();

  const handleSelectUser = async (user: any) => {
    const publicKey = await fetchUserPublicKey(user.id);
    sessionStorage.setItem("recipient_public_key", publicKey);
    sessionStorage.setItem("chat_user", JSON.stringify(user));
    alert(`Selected ${user.username}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] text-black dark:text-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg sm:text-xl font-semibold">Find Users</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-200 dark:bg-white/10"
        >
          {theme === "dark" ? (
            // Sun (filled)
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-yellow-400">
              <circle cx="12" cy="12" r="5" />
              <g stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
              </g>
            </svg>
          ) : (
            // Moon (filled)
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-indigo-400">
              <path d="M21 12.79A9 9 0 1111.21 3c0 .34.02.67.05 1A7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Input */}
      <input
        className="p-3 w-full rounded-lg bg-gray-100 dark:bg-slate-800"
        placeholder="Search username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className="mt-3 text-sm text-gray-400">Searching...</p>}

      {/* Results */}
      <div className="mt-4 space-y-2">
        {results.map((u) => (
          <div
            key={u.id}
            onClick={() => handleSelectUser(u)}
            className="p-3 rounded-lg cursor-pointer bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
          >
            <p className="font-medium">{u.display_name}</p>
            <p className="text-xs text-gray-500">@{u.username}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
