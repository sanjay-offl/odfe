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

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, role, profile, login, signup } = useAuth();

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

  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === "ADMIN") {
        router.replace("/dashboard");
      } else if (role === "EMPLOYEE") {
        const dept = profile?.department || (typeof window !== "undefined" ? localStorage.getItem("odfe_dept") || "" : "");
        router.replace(dept.toLowerCase() === "kitchen" ? "/kitchen" : dept.toLowerCase() === "orders" ? "/orders" : dept.toLowerCase() === "billing" ? "/payments" : "/pos");
      } else {
        router.replace("/self-order");
      }
    }
  }, [isAuthenticated, role, profile, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isForgotPassword) {
        setError("Password reset is handled via the backend. Please use Sign In.");
        setIsLoading(false);
        return;
      }

      if (isRegister) {
        const result = await signup(formData.name || "Cafe Owner", formData.email, formData.password);
        if (!result.success) {
          setError(result.message || "Sign up failed");
        } else {
          setIsRegister(false);
          setSuccessMessage("Your account has been created. Please check your email and verify your address before logging in.");
          setFormData((prev) => ({ ...prev, password: "" })); // Clear password, keep email
        }
      } else {
        const result = await login(formData.email, formData.password);

        if (!result.success) {
          setError(result.message || "Login failed");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
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
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex-1 border-t border-cafe-border" />
              <span className="text-sm font-sans text-cafe-text-secondary">Or continue with</span>
              <div className="flex-1 border-t border-cafe-border" />
            </div>
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
