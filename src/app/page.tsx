// src/app/page.tsx

"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
      {/* ── Header ───────────────────────────── */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/10 bg-[#141920]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <svg
              width="18"
              height="18"
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
          <span className="font-semibold tracking-tight text-white/90">
            WhisperBox
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-white/70 hover:text-white transition"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/register")}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Private messaging.
            <br />
            <span className="text-indigo-400">Actually private.</span>
          </h1>

          <p className="mt-4 text-white/50 text-lg">
            WhisperBox uses end-to-end encryption so only you and your recipient
            can read your messages — not even the server.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/register")}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition w-full sm:w-auto"
            >
              Create Account
            </button>

            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition w-full sm:w-auto"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* ── Feature cards ─────────────────── */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left">
            <p className="text-sm font-medium text-white/80">
              End-to-End Encryption
            </p>
            <p className="text-xs text-white/40 mt-1">
              Messages are encrypted before leaving your device.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left">
            <p className="text-sm font-medium text-white/80">
              Zero Access Server
            </p>
            <p className="text-xs text-white/40 mt-1">
              Even we cannot read your conversations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left">
            <p className="text-sm font-medium text-white/80">
              Secure Key Storage
            </p>
            <p className="text-xs text-white/40 mt-1">
              Your private key is encrypted with your password.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────── */}
      <footer className="text-center text-xs text-white/30 py-6 border-t border-white/10">
        WhisperBox © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
