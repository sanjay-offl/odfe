"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Logo from "@/components/Logo";
import { fetchApi } from "@/utils/api";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create customer record in backend
        const syncResponse = await fetchApi("/auth/customer/register", {
          method: "POST",
          body: JSON.stringify({
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
          })
        });

        if (!syncResponse.success) {
          throw new Error(syncResponse.error || "Failed to create customer record");
        }

        router.push("/self-order");
      }
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || "Failed to register");
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
          <h1 className="mt-8 text-3xl">Create Account</h1>
          <p className="mt-3 text-sm text-cafe-text-secondary font-sans">
            Register to start your self-order journey
          </p>
        </div>

        <div className="glass-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cafe-text-secondary">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-4 py-3 text-sm text-cafe-text-primary outline-none transition-all focus:border-brand-500/50 focus:bg-cafe-surface/80"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cafe-text-secondary">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-4 py-3 text-sm text-cafe-text-primary outline-none transition-all focus:border-brand-500/50 focus:bg-cafe-surface/80"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cafe-text-secondary">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-4 py-3 text-sm text-cafe-text-primary outline-none transition-all focus:border-brand-500/50 focus:bg-cafe-surface/80"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cafe-text-secondary">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-4 py-3 text-sm text-cafe-text-primary outline-none transition-all focus:border-brand-500/50 focus:bg-cafe-surface/80"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-cafe-text-secondary">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-4 py-3 text-sm text-cafe-text-primary outline-none transition-all focus:border-brand-500/50 focus:bg-cafe-surface/80"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2"
            >
              {isLoading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cafe-text-secondary">
            Already have an account?{" "}
            <Link href="/customer/login" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
