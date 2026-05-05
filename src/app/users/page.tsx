"use client";

import { useState } from "react";
import { useUserSearch } from "@/src/hooks/useUserSearch";
import { fetchUserPublicKey } from "@/src/hooks/useUserPublicKey";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const { results, loading } = useUserSearch(query);

  const handleSelectUser = async (user: any) => {
    const publicKey = await fetchUserPublicKey(user.id);

    sessionStorage.setItem("recipient_public_key", publicKey);
    sessionStorage.setItem("chat_user", JSON.stringify(user));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-xl mb-4">Find Users</h1>

      <input
        className="p-3 w-full bg-slate-800 rounded"
        placeholder="Search username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className="mt-4 text-gray-400">Searching...</p>}

      <div className="mt-4 space-y-2">
        {results.map((u) => (
          <div
            key={u.id}
            onClick={() => handleSelectUser(u)}
            className="p-3 bg-slate-800 rounded cursor-pointer hover:bg-slate-700"
          >
            <p className="font-bold">{u.display_name}</p>
            <p className="text-sm text-gray-400">@{u.username}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
