"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-4">
      <div className="absolute inset-0 bg-noise" />
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
              <span className="text-lg font-extrabold text-white">O</span>
            </div>
            <span className="text-xl font-bold text-white">ODFE</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-surface-400">
            Sign in to your ODFE account
          </p>
        </div>

        <div className="glass-strong p-8">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-300">
                Email
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-surface-500 outline-none transition-colors focus:border-brand-500/50 focus:bg-white/8"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-surface-300">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm text-white placeholder-surface-500 outline-none transition-colors focus:border-brand-500/50 focus:bg-white/8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white"
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-surface-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-500"
                />
                Remember me
              </label>
              <a
                href="#"
                className="text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                Forgot password?
              </a>
            </div>

            <Link href="/dashboard" className="btn-primary block w-full text-center !py-3">
              Sign In
            </Link>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              Don&apos;t have an account?{" "}
              <a href="#" className="font-medium text-brand-400 hover:text-brand-300">
                Contact Admin
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
