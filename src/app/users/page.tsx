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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
          >
            <path
              strokeWidth="2"
              d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36l-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.42 1.41M7.05 16.95l-1.41 1.41"
            />
          </svg>
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
