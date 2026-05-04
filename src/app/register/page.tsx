"use client";

import { useState } from "react";
import { apiFetch } from "@/src/lib/api";
import {
  generateKeyPair,
  exportPublicKey,
  generateSalt,
  deriveKey,
  wrapPrivateKey,
  encodeSalt,
} from "@/src/crypto/keys";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    if (!username.trim() || !displayName.trim() || !password) return;
    try {
      setLoading(true);
      setError(null);

      const keyPair = await generateKeyPair();
      const publicKey = await exportPublicKey(keyPair.publicKey);

      const salt = generateSalt();
      const wrappingKey = await deriveKey(password, salt);
      const wrappedPrivateKey = await wrapPrivateKey(keyPair.privateKey, wrappingKey);
      const encodedSalt = encodeSalt(salt);

      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          display_name: displayName.trim(),
          password,
          public_key: publicKey,
          wrapped_private_key: wrappedPrivateKey,
          pbkdf2_salt: encodedSalt,
        }),
      });

      router.push("/login");
    } catch (err: any) {
      const msg =
        err?.detail?.[0]?.msg ||
        err?.detail ||
        err?.message ||
        "Registration failed";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
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
          <h2 className="text-base font-medium text-white/80">Create your account</h2>

          <div className="space-y-3">
            <input
              placeholder="Username (3–32 chars)"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              placeholder="Display Name"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <input
              placeholder="Password (min 8 chars)"
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
            />
          </div>

          {loading && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin flex-shrink-0" />
              <p className="text-indigo-300 text-sm">Generating encryption keys…</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading || !username.trim() || !displayName.trim() || !password}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            {loading ? "Creating Account…" : "Create Account"}
          </button>

          <p className="text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
