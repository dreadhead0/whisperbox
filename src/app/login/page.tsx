"use client";

import { useState, useEffect } from "react";
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
        <div className="flex flex-col items-center mb-6 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">WhisperBox</h1>
          <p className="text-gray-500 dark:text-white/40 text-sm">
            Secure messaging
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-[#141920] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
          <input
            placeholder="Username"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-white/30">
            Don’t have an account?{" "}
            <Link href="/register" className="text-indigo-500">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
