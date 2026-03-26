// =============================================================================
// WERA — Login Page
// Supabase Auth — protects admin routes
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/callback?next=/account` }
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      setResetSent(true);
    } catch {
      setError("Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/">
            <span className="font-heading text-[48px] font-extrabold tracking-[-0.03em]
                           text-white leading-none">
              WERA
            </span>
          </Link>
          <p className="text-body-sm text-[#666] mt-3">Admin login</p>
        </div>

        {/* Card */}
        <div className="border border-[#222] p-8 md:p-10">
          {mode === "login" ? (
            <>
              <h1 className="font-heading text-h2 uppercase tracking-tight mb-8 text-center">
                Sign In
              </h1>

              {error && (
                <div className="flex items-center gap-3 border border-red-500/30 bg-red-500/10
                               p-4 mb-6 text-red-400 text-body-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full bg-transparent border border-[#333] px-5 py-3.5
                               text-white placeholder:text-[#555]
                               focus:outline-none focus:border-brand-yellow"
                    placeholder="admin@wera.in"
                  />
                </div>

                <div>
                  <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5 pr-12
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666]
                                 hover:text-white transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-black border-t-transparent
                                     animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Sign In
                    </>
                  )}
                </button>
              </form>

              <button
                onClick={() => {
                  setMode("forgot");
                  setError(null);
                }}
                className="w-full text-center text-body-sm text-[#666]
                           hover:text-brand-yellow transition-colors mt-6"
              >
                Forgot password?
              </button>
            </>
          ) : (
            <>
              <h1 className="font-heading text-h2 uppercase tracking-tight mb-4 text-center">
                Reset Password
              </h1>
              {resetSent ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-yellow/10 border border-brand-yellow/30
                                 flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-brand-yellow" />
                  </div>
                  <p className="text-body text-[#ccc] mb-2">Check your email</p>
                  <p className="text-body-sm text-[#666] mb-8">
                    We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong>
                  </p>
                  <button
                    onClick={() => { setMode("login"); setResetSent(false); }}
                    className="btn-ghost w-full"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-body-sm text-[#666] mb-8 text-center">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>

                  {error && (
                    <div className="flex items-center gap-3 border border-red-500/30
                                   bg-red-500/10 p-4 mb-6 text-red-400 text-body-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                      placeholder="admin@wera.in"
                    />
                    <button type="submit" disabled={isLoading} className="btn-primary w-full">
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>

                  <button
                    onClick={() => { setMode("login"); setError(null); }}
                    className="w-full text-center text-body-sm text-[#666]
                               hover:text-brand-yellow transition-colors mt-6"
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-caption text-[#555] text-center mt-8">
          © {new Date().getFullYear()} WERA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
