"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LuMail, LuLock, LuEye, LuEyeOff, LuUser,
} from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { apiPost } from "@/utils/useApi";
import { supabase } from "../../utils/supabaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getDeptRedirect(dept: string): string {
  const d = dept.toLowerCase();
  if (d === "kitchen") return "/kitchen";
  if (d === "orders") return "/orders";
  if (d === "billing") return "/payments";
  return "/pos"; // Cashier default
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, role, profile } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cafeName: "",
  });

  // Already authenticated → go to correct dashboard
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === "ADMIN") {
        router.replace("/dashboard");
      } else if (role === "EMPLOYEE") {
        const dept = profile?.department || (typeof window !== "undefined" ? localStorage.getItem("odfe_dept") || "" : "");
        router.replace(getDeptRedirect(dept));
      } else {
        router.replace("/self-order");
      }
    }
  }, [isAuthenticated, role, profile, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getAuthErrorMessage = (err: any) => {
    if (!err) return "An unexpected error occurred";
    const msg = err.message || "";
    const code = err.code || "";
    const status = err.status;

    if (msg.includes("Email not confirmed") || code === "email_not_confirmed") {
      return "Email not confirmed. In Supabase Dashboard → Authentication → Providers → Email → disable 'Confirm Email'.";
    }
    if (msg.includes("Invalid login credentials") || code === "invalid_credentials") {
      return "Invalid email or password. Make sure demo accounts are seeded (run: npx prisma db seed).";
    }
    if (msg.includes("User already registered") || code === "user_already_exists") {
      return "An account with this email already exists. Please sign in.";
    }
    if (msg.includes("Password should be at least") || code === "weak_password") {
      return "Password is too weak. Please use a stronger password.";
    }
    if (status === 429 || msg.includes("rate limit") || code === "over_email_send_rate_limit") {
      return "Too many requests. Please try again in a moment.";
    }
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      return "Network error. Please check your connection.";
    }
    return msg;
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // ── Forgot Password ──────────────────────────────────────────────────────
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
        if (error) throw error;
        setSuccessMessage("Password reset link sent! Check your inbox.");
        setIsLoading(false);
        return;
      }

      // ── Register ─────────────────────────────────────────────────────────────
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.name, cafe_name: formData.cafeName || "" },
          },
        });

        if (error) throw error;

        if (data.user?.identities && data.user.identities.length === 0) {
          throw new Error("User already registered");
        }

        if (data.user) {
          await apiPost("/auth/signup", {
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            cafeName: formData.cafeName,
          });
        }

        if (data.session) {
          await supabase.auth.signOut();
        }

        setIsRegister(false);
        setFormData((prev) => ({ ...prev, password: "" }));
        setSuccessMessage("Registration successful! You can now sign in.");
        setIsLoading(false);
        return;
      }

      // ── Sign In ──────────────────────────────────────────────────────────────
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("Login failed: no session returned.");
      }

      // Fetch profile from backend to get role & department
      const profileRes = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.session.access_token}`,
        },
      });

      let userRole = "ADMIN";
      let dept = "";

      if (profileRes.ok) {
        const json = await profileRes.json();
        if (json.success && json.data) {
          userRole = json.data.role || "ADMIN";
          dept = json.data.employeeProfile?.position || "";

          // Persist for subsequent requests
          if (typeof window !== "undefined") {
            localStorage.setItem("odfe_role", userRole);
            localStorage.setItem("odfe_name", json.data.name || "User");
            if (dept) localStorage.setItem("odfe_dept", dept);
          }

          // Set cookies so middleware can redirect server-side
          setCookie("odfe_role", userRole);
          if (dept) setCookie("odfe_dept", dept);
        }
      } else {
        // Profile not found (user not seeded yet) — use email heuristic
        const email = formData.email.toLowerCase();
        if (email.includes("admin")) userRole = "ADMIN";
        else {
          userRole = "EMPLOYEE";
          if (email.includes("kitchen")) dept = "Kitchen";
          else if (email.includes("billing")) dept = "Billing";
          else if (email.includes("cashier2") || email.includes("orders")) dept = "Orders";
          else dept = "Cashier";
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("odfe_role", userRole);
          if (dept) localStorage.setItem("odfe_dept", dept);
        }
        setCookie("odfe_role", userRole);
        if (dept) setCookie("odfe_dept", dept);
      }

      // Navigate to role-based home
      if (userRole === "ADMIN") {
        router.replace("/dashboard");
      } else if (userRole === "EMPLOYEE") {
        router.replace(getDeptRedirect(dept));
      } else {
        router.replace("/self-order");
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-cafe-bg px-4">
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-cafe-accent/6 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-cafe-surface/30 blur-[60px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo height={46} linked={false} />
          </Link>

          <h1 className="mt-8 text-3xl">
            {isForgotPassword ? "Reset Password" : isRegister ? "Create Account" : "Welcome Back"}
          </h1>

          <p className="mt-3 text-sm text-cafe-text-secondary font-sans">
            {isForgotPassword
              ? "Enter your email to receive a reset link"
              : isRegister
              ? "Register your ODFE cafe workspace"
              : "Sign in to your ODFE account"}
          </p>
        </div>

        <div className="glass-panel p-8">
          {error && (
            <div className="mb-4 rounded-btn border border-[rgba(180,60,30,0.15)] bg-[rgba(180,60,30,0.06)] p-3 text-sm text-[#B43C1E] font-sans">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-btn border border-[rgba(30,180,60,0.15)] bg-[rgba(30,180,60,0.06)] p-3 text-sm text-[#1E8C3C] font-sans">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && !isForgotPassword && (
              <div>
                <label className="mb-2 block text-sm font-medium text-cafe-text-secondary font-sans">
                  Full Name
                </label>
                <div className="relative">
                  <LuUser className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" strokeWidth={1.5} />
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleChange} required placeholder="Your name"
                    className="input-field pl-11"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-cafe-text-secondary font-sans">
                Email
              </label>
              <div className="relative">
                <LuMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" strokeWidth={1.5} />
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} required placeholder="you@example.com"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="mb-2 block text-sm font-medium text-cafe-text-secondary font-sans">
                  Password
                </label>
                <div className="relative">
                  <LuLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" strokeWidth={1.5} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password" value={formData.password}
                    onChange={handleChange} required
                    placeholder={isRegister ? "Create password" : "Enter password"}
                    className="input-field pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cafe-text-secondary/50 hover:text-cafe-accent transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <LuEyeOff className="h-4 w-4" strokeWidth={1.5} /> : <LuEye className="h-4 w-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
            )}

            {isRegister && !isForgotPassword && (
              <div>
                <label className="mb-2 block text-sm font-medium text-cafe-text-secondary font-sans">
                  Cafe Name <span className="text-cafe-text-secondary/40">(Optional)</span>
                </label>
                <input
                  type="text" name="cafeName" value={formData.cafeName}
                  onChange={handleChange} placeholder="ODFE Cafe"
                  className="input-field"
                />
              </div>
            )}

            {!isRegister && !isForgotPassword && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-cafe-text-secondary font-sans cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-cafe-border accent-cafe-dark" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMessage(null); }}
                  className="text-sm font-medium text-cafe-accent hover:text-cafe-hover transition-colors font-sans"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="btn-primary block w-full text-center !py-3"
            >
              {isLoading ? "Please wait..." : isForgotPassword ? "Send Reset Link" : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          {!isForgotPassword && (
            <>
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="flex-1 border-t border-cafe-border" />
                <span className="text-sm font-sans text-cafe-text-secondary">Or continue with</span>
                <div className="flex-1 border-t border-cafe-border" />
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-btn border border-cafe-border bg-cafe-surface/30 px-4 py-3 text-sm font-medium text-cafe-text font-sans transition-all hover:bg-cafe-surface/50"
                >
                  <FcGoogle className="h-5 w-5" />
                  Google
                </button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMessage(null); }}
                className="font-medium text-cafe-accent hover:text-cafe-hover transition-colors text-sm font-sans"
              >
                Back to Sign In
              </button>
            ) : (
              <p className="text-sm text-cafe-text-secondary font-sans">
                {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(null); setSuccessMessage(null); }}
                  className="font-medium text-cafe-accent hover:text-cafe-hover transition-colors"
                >
                  {isRegister ? "Sign In" : "Register"}
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-cafe-border">
            <p className="text-xs text-center text-cafe-text-secondary/60 font-sans leading-relaxed">
              <strong>Admin:</strong> admin@odfe.local / Admin@123<br />
              <strong>Cashier:</strong> cashier1@odfe.local / Cashier@123<br />
              <strong>Kitchen:</strong> kitchen@odfe.local / Kitchen@123<br />
              <strong>Billing:</strong> billing@odfe.local / Billing@123
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
