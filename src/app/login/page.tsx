"use client";

import { useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { deriveKey, base64ToUint8, unwrapPrivateKey } from "@/src/crypto/keys";
import { setSession, setPrivateKey } from "@/src/auth/session";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    try {
      setLoading(true);
      setError(null);
      console.log({ username: username.trim(), password })

      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const { access_token, refresh_token, user } = res;

      const salt = base64ToUint8(user.pbkdf2_salt);
      const wrappingKey = await deriveKey(password, salt);
      const privateKey = await unwrapPrivateKey(user.wrapped_private_key, wrappingKey);

      setSession({ access_token, refresh_token, user });
      await setPrivateKey(privateKey); // ← now async; must await

      router.push("/chat");
    } catch (err: any) {
      setError(err?.detail || err?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-white p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-3">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">WhisperBox</h1>
          <p className="text-white/40 text-sm mt-1">End-to-end encrypted messaging</p>
        </div>

        <div className="bg-[#141920] border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-medium text-white/80">Sign in to your account</h2>

          <div className="space-y-3">
            <input
              placeholder="Username"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
            <input
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : "Sign In"}
          </button>

          <p className="text-center text-sm text-white/30">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
