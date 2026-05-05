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
import ThemeToggle from "@/src/components/ThemeToggle";

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
      const wrappedPrivateKey = await wrapPrivateKey(
        keyPair.privateKey,
        wrappingKey,
      );
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1117] text-black dark:text-white p-4 relative transition-colors duration-200">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-3">
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-indigo-500 dark:text-indigo-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">WhisperBox</h1>
          <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
            End-to-end encrypted messaging
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-50 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-medium">Create your account</h2>

          <div className="space-y-3">
            <input
              placeholder="Username"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <input
              placeholder="Display Name"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
            <input
              placeholder="Password"
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
              <svg
                className="animate-spin shrink-0"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                name="text-indigo-500"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <p className="text-indigo-600 dark:text-indigo-400 text-sm">
                Generating encryption keys…
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-red-500 mt-0.5 shrink-0"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={
              loading || !username.trim() || !displayName.trim() || !password
            }
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-white/30">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-500 hover:text-indigo-400 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
