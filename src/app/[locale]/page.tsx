"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-gray-900">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/golf-bg-pattern.png')" }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900/80 via-gray-900/90 to-black"></div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-10 text-center">

          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-5xl font-bold text-white">G</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              NBK Golf
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl font-light tracking-wide">
              Premium Tournament System
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 py-8">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/50 transition-colors">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm text-gray-300">Live Scoring</div>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/50 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-300">Real-time Stats</div>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/50 transition-colors">
              <div className="text-2xl mb-2">📱</div>
              <div className="text-sm text-gray-300">Mobile First</div>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/50 transition-colors">
              <div className="text-2xl mb-2">⛳</div>
              <div className="text-sm text-gray-300">Course Mgmt</div>
            </div>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <button
              onClick={login}
              className="group w-full py-4 px-6 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transform transition-all hover:scale-[1.02] active:scale-[0.98] duration-200 flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M20.4 10c0-5.5-4.5-10-10-10S.4 4.5.4 10c0 4.9 3.6 9 8.2 9.9v-7H6.3v-2.9h2.3V7.5c0-2.3 1.4-3.5 3.4-3.5.9 0 1.9.2 1.9.2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4v1.7h2.5l-.4 2.9h-2.1v7c4.6-.9 8.2-5 8.2-9.9z" />
              </svg>
              <span className="text-lg">Login with LINE</span>
            </button>
            <p className="text-xs text-gray-500">
              Secure access via LINE Login
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
