"use client";

import { useState, useEffect } from "react";
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1117] text-black dark:text-white p-4 relative">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-white/10"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
        >
          <path strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3" />
        </svg>
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-3">
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-indigo-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold">WhisperBox</h1>
          <p className="text-gray-500 dark:text-white/40 text-xs sm:text-sm mt-1">
            End-to-end encrypted messaging
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-sm sm:text-base font-medium">
            Create your account
          </h2>

          <div className="space-y-3">
            <input
              placeholder="Username"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              placeholder="Display Name"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {loading && (
            <p className="text-sm text-indigo-500">
              Generating encryption keys…
            </p>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleRegister}
            disabled={
              loading || !username.trim() || !displayName.trim() || !password
            }
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-white/30">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
