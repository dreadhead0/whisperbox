"use client";

import { useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { deriveKey, base64ToUint8, unwrapPrivateKey } from "@/src/crypto/keys";
import { setSession, setPrivateKey } from "@/src/auth/session";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/src/hooks/useTheme";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password) return;

    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const { access_token, refresh_token, user } = res;

      const salt = base64ToUint8(user.pbkdf2_salt);
      const wrappingKey = await deriveKey(password, salt);
      const privateKey = await unwrapPrivateKey(
        user.wrapped_private_key,
        wrappingKey,
      );

      setSession({ access_token, refresh_token, user });
      await setPrivateKey(privateKey);

      router.push("/chat");
    } catch (err: any) {
      setError(err?.detail || err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1117] text-black dark:text-white p-4 relative">
      {/* THEME */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-white/10"
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-yellow-400">
            <circle cx="12" cy="12" r="5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-indigo-400">
            <path d="M21 12.79A9 9 0 1111.21 3" />
          </svg>
        )}
      </button>

      {/* FORM */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold">WhisperBox</h1>
        </div>

        <div className="bg-gray-100 dark:bg-[#141920] rounded-2xl p-6 space-y-4">
          <input
            placeholder="Username"
            className="w-full p-3 rounded bg-white dark:bg-white/5"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded bg-white dark:bg-white/5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 py-3 rounded text-white"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm">
            <Link href="/register">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
