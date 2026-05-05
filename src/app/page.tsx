"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "@/src/components/ThemeToggle";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] text-black dark:text-white flex flex-col transition-colors duration-200">
      {/* ── Header ───────────────────────────── */}
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#141920]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <svg
              width="18"
              height="18"
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
          <span className="font-semibold tracking-tight text-black dark:text-white/90">
            WhisperBox
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white transition px-2 py-1"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/register")}
            className="px-3 sm:px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-black dark:text-white">
            Private messaging.
            <br />
            <span className="text-indigo-500 dark:text-indigo-400">
              Actually private.
            </span>
          </h1>

          <p className="mt-4 text-gray-500 dark:text-white/50 text-base sm:text-lg max-w-lg mx-auto">
            WhisperBox uses end-to-end encryption so only you and your recipient
            can read your messages — not even the server.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push("/register")}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition w-full sm:w-auto"
            >
              Create Account
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-sm font-medium transition w-full sm:w-auto"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* ── Feature cards ─────────────────── */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-indigo-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-black dark:text-white/80">
              End-to-End Encryption
            </p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
              Messages are encrypted before leaving your device.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-indigo-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-black dark:text-white/80">
              Zero Access Server
            </p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
              Even we cannot read your conversations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-indigo-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-black dark:text-white/80">
              Secure Key Storage
            </p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
              Your private key is encrypted with your password.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────── */}
      <footer className="text-center text-xs text-gray-400 dark:text-white/30 py-5 border-t border-gray-200 dark:border-white/10">
        WhisperBox © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
