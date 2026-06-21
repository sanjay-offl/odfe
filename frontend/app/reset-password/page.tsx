"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LuLock, LuEye, LuEyeOff } from "react-icons/lu";

import { fetchApi } from "@/utils/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = typeof response.json === "function" ? await response.json() : response;

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        throw new Error(data.message || data.error || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-10">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <div className="relative h-12 w-32 mx-auto">
            <Image
              src="/logo/dark_logo.png"
              alt="ODFE Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <h1 className="mt-8 text-3xl">
          Reset Password
        </h1>

        <p className="mt-3 text-sm text-cafe-text-secondary font-sans">
          {success ? "Password reset successful" : "Create a new password for your account"}
        </p>
      </div>

      {/* Form card */}
      <div className="glass-panel p-8">
        {error && (
          <div className="mb-4 rounded-btn border border-[rgba(180,60,30,0.15)] bg-[rgba(180,60,30,0.06)] p-3 text-sm text-[#B43C1E] font-sans">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="text-center py-4">
            <div className="mb-4 rounded-btn border border-[rgba(30,180,60,0.15)] bg-[rgba(30,180,60,0.06)] p-3 text-sm text-[#1E8C3C] font-sans">
              Password has been reset successfully!
            </div>
            <p className="text-sm text-cafe-text-secondary mt-4">
              Redirecting you to login...
            </p>
            <button
              onClick={() => router.push("/login")}
              className="btn-primary block w-full text-center !py-3 mt-6"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-cafe-text-secondary font-sans">
                New Password
              </label>
              <div className="relative">
                <LuLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!token || isLoading}
                  placeholder="Enter new password"
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cafe-text-secondary/50 hover:text-cafe-accent transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <LuEyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <LuEye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-cafe-text-secondary font-sans">
                Confirm New Password
              </label>
              <div className="relative">
                <LuLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" strokeWidth={1.5} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!token || isLoading}
                  placeholder="Confirm new password"
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cafe-text-secondary/50 hover:text-cafe-accent transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? (
                    <LuEyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <LuEye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="btn-primary block w-full text-center !py-3"
            >
              {isLoading ? "Please wait..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-medium text-cafe-accent hover:text-cafe-hover transition-colors text-sm font-sans"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cafe-light flex items-center justify-center p-4 sm:p-8 font-sans">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
