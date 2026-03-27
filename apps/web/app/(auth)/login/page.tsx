// =============================================================================
// WERA — Login/Registration Page (Firebase Edition)
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setCookie, destroyCookie } from "nookies";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSession = async (user: any) => {
    const idToken = await user.getIdToken();
    setCookie(null, "session", idToken, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSession(userCredential.user);
      
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid login credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await handleSession(userCredential.user);

      setSuccessMsg("Account created successfully!");
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Password reset link sent! Check your inbox.");
      setMode("login");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/">
            <span className="font-heading text-[48px] font-extrabold tracking-[-0.03em]
                           text-white leading-none">
              WERA
            </span>
          </Link>
          <p className="text-body-sm text-[#666] mt-3">
            {mode === "signup" ? "Create your account" : "Admin login (Firebase)"}
          </p>
        </div>

        {/* Card */}
        <div className="border border-[#222] p-8 md:p-10">
          {mode === "forgot" ? (
            <>
              <h1 className="font-heading text-h2 uppercase tracking-tight mb-4 text-center">
                Reset Password
              </h1>
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
                  placeholder="name@gmail.com"
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
          ) : (
            <>
              <h1 className="font-heading text-h2 uppercase tracking-tight mb-8 text-center">
                {mode === "login" ? "Sign In" : "Register"}
              </h1>

              {error && (
                <div className="flex items-center gap-3 border border-red-500/30 bg-red-500/10
                               p-4 mb-6 text-red-400 text-body-sm overflow-hidden text-ellipsis">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-3 border border-green-500/30 bg-green-500/10
                               p-4 mb-6 text-green-400 text-body-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              <form onSubmit={mode === "login" ? handleLogin : handleSignUp} className="space-y-5">
                {mode === "signup" && (
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                      placeholder="Your Name"
                    />
                  </div>
                )}

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
                    placeholder="name@gmail.com"
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
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {mode === "login" ? (
                        <><Lock className="w-4 h-4" /> Sign In</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> Create Account</>
                      )}
                    </>
                  )}
                </button>
              </form>

              <div className="flex flex-col gap-4 mt-6">
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full text-center text-body-sm text-[#666]
                             hover:text-brand-yellow transition-colors"
                >
                  {mode === "login" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
                </button>

                {mode === "login" && (
                  <button
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                    }}
                    className="w-full text-center text-body-sm text-[#666]
                               hover:text-brand-yellow transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
