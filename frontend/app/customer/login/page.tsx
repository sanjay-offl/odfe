"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Logo from "@/components/Logo";
import { fetchApi } from "@/utils/api";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Backend sync for customer login (to update auth_user_id)
        const syncResponse = await fetchApi("/auth/customer/login", {
          method: "POST",
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
          })
        });

        if (!syncResponse.success) {
          throw new Error(syncResponse.error || "Customer profile not found");
        }

        router.push("/self-order");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-cafe-bg px-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo height={46} linked={false} />
          </Link>
          <h1 className="mt-8 text-3xl">Customer Login</h1>
          <p className="mt-3 text-sm text-cafe-text-secondary font-sans">
            Sign in to your customer account
          </p>
        </div>

        <div className="glass-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cafe-text-secondary">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-4 py-3 text-sm text-cafe-text-primary outline-none transition-all focus:border-brand-500/50 focus:bg-cafe-surface/80"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cafe-text-secondary">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-4 py-3 text-sm text-cafe-text-primary outline-none transition-all focus:border-brand-500/50 focus:bg-cafe-surface/80"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cafe-text-secondary">
            Don't have an account?{" "}
            <Link href="/customer/register" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
