"use client";

import { useState } from "react";
import { useUserSearch } from "@/src/hooks/useUserSearch";
import { fetchUserPublicKey } from "@/src/hooks/useUserPublicKey";
import ThemeToggle from "@/src/components/ThemeToggle";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const { results, loading } = useUserSearch(query);

  const handleSelectUser = async (user: any) => {
    const publicKey = await fetchUserPublicKey(user.id);
    sessionStorage.setItem("recipient_public_key", publicKey);
    sessionStorage.setItem("chat_user", JSON.stringify(user));
    alert(`Selected ${user.username}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] text-black dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-3 bg-white dark:bg-[#0f1117] border-b border-gray-200 dark:border-white/10">
        <h1 className="text-base font-semibold">Find Users</h1>
        <ThemeToggle />
      </div>

      <div className="p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            placeholder="Search username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-white/40">
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Searching…
          </div>
        )}

        {/* Results */}
        {!loading && query && results.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-white/40 text-center py-8">
            No users found for "{query}"
          </p>
        )}

        <div className="space-y-2">
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelectUser(u)}
              className="w-full text-left p-4 rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-white/10 transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <span className="text-indigo-500 dark:text-indigo-400 text-sm font-medium">
                    {u.display_name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {u.display_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/40 truncate">
                    @{u.username}
                  </p>
                </div>
                <svg
                  className="ml-auto shrink-0 text-gray-300 dark:text-white/20"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
