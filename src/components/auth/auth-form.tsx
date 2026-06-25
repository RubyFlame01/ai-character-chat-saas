"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageCircle, ImageIcon, Sparkles, Users } from "lucide-react";
import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const FREE_PERKS = [
  { icon: MessageCircle, label: "Roleplay Chat" },
  { icon: Users, label: "Free Companion" },
  { icon: Sparkles, label: "100 Free Credits" },
  { icon: ImageIcon, label: "Custom Images" },
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "discord" | null>(null);
  const [showPw, setShowPw] = useState(false);

  async function signInWithOAuth(provider: "google" | "discord") {
    if (!hasSupabaseBrowserEnv()) {
      router.push("/dashboard");
      return;
    }
    setOauthLoading(provider);
    const next = searchParams.get("next") ?? "/dashboard";
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setOauthLoading(null);
  }

  async function continueAfterAuth() {
    const planId = searchParams.get("plan");
    const next = searchParams.get("next");

    if (planId) {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
        router.refresh();
        return;
      }
      if (data.error) {
        setMessage(data.error);
        return;
      }
    }

    router.push(next ?? "/dashboard");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!hasSupabaseBrowserEnv()) {
      setMessage("Demo mode active — signed in as demo user.");
      setTimeout(() => router.push("/dashboard"), 500);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      // Apply referral code on signup
      if (mode === "signup") {
        const refCode = searchParams.get("ref");
        if (refCode) {
          await fetch("/api/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: refCode }),
          }).catch(() => null);
        }
      }
      await continueAfterAuth();
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Background character photo */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/characters/realistic-samira-vale/avatar.jpg"
          alt=""
          fill
          className="object-cover object-top opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-[var(--background)]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.1] bg-[var(--background)]/80 p-7 shadow-2xl backdrop-blur-xl">
            {/* Heading */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-black text-white">
                {mode === "signup" ? "Sign Up for Free" : "Welcome Back"}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-400">
                {mode === "signup"
                  ? "1,000,000+ AI companions are waiting for you"
                  : "Sign in to continue your conversations"}
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="mb-4 space-y-2.5">
              <button
                type="button"
                onClick={() => signInWithOAuth("google")}
                disabled={oauthLoading !== null}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.06] text-sm font-bold text-white transition hover:bg-white/[0.1] disabled:opacity-50"
              >
                {oauthLoading === "google" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.4 5.6-5 7.3v6h8.1c4.8-4.4 7.2-10.9 7.2-17.5z" fill="#4285F4"/>
                    <path d="M24 48c6.5 0 12-2.1 15.9-5.8l-8.1-6c-2.2 1.5-5 2.3-7.8 2.3-6 0-11-4-12.8-9.4H2.9v6.2C6.8 42.7 14.9 48 24 48z" fill="#34A853"/>
                    <path d="M11.2 29.1c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6V13.7H2.9C1 17.2 0 20.9 0 24.5s1 7.3 2.9 10.8l8.3-6.2z" fill="#FBBC05"/>
                    <path d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.5-6.5C35.9 2.6 30.4.5 24 .5 14.9.5 6.8 5.8 2.9 13.7l8.3 6.2C13 14.5 18 9.5 24 9.5z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => signInWithOAuth("discord")}
                disabled={oauthLoading !== null}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.06] text-sm font-bold text-white transition hover:bg-white/[0.1] disabled:opacity-50"
              >
                {oauthLoading === "discord" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
                    <path d="M16.93 1.25A16.5 16.5 0 0 0 12.86.02a.06.06 0 0 0-.07.03c-.18.32-.38.73-.52 1.05a15.24 15.24 0 0 0-4.54 0A10.7 10.7 0 0 0 7.2.05a.06.06 0 0 0-.07-.03 16.46 16.46 0 0 0-4.07 1.23.06.06 0 0 0-.03.02C.45 5.37-.27 9.38.08 13.33c0 .02.01.04.03.05a16.6 16.6 0 0 0 4.98 2.5.06.06 0 0 0 .07-.02c.38-.52.72-1.07 1.01-1.65a.06.06 0 0 0-.03-.08 10.93 10.93 0 0 1-1.56-.74.06.06 0 0 1-.01-.1c.1-.08.21-.16.31-.24a.06.06 0 0 1 .06-.01c3.28 1.49 6.82 1.49 10.06 0a.06.06 0 0 1 .06.01c.1.08.2.16.31.24a.06.06 0 0 1-.01.1c-.5.29-1.02.54-1.56.74a.06.06 0 0 0-.03.08c.3.58.64 1.13 1.01 1.65.02.02.04.03.07.02a16.56 16.56 0 0 0 5-2.5.06.06 0 0 0 .02-.05c.42-4.32-.7-8.3-2.97-11.71a.05.05 0 0 0-.03-.04zM6.68 10.9c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2c1.01 0 1.81.9 1.79 2 0 1.1-.79 2-1.79 2zm6.61 0c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2c1.01 0 1.81.9 1.79 2 0 1.1-.78 2-1.79 2z" fill="#5865F2"/>
                  </svg>
                )}
                Continue with Discord
              </button>
            </div>

            {/* Divider */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 border-t border-white/[0.08]" />
              <span className="text-xs text-zinc-600">or use email</span>
              <div className="flex-1 border-t border-white/[0.08]" />
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className="h-12 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.08]"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className="h-12 w-full rounded-xl border border-white/[0.1] bg-white/[0.06] pl-10 pr-11 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.08]"
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {message && (
                <p className={cn(
                  "rounded-xl px-3 py-2.5 text-sm",
                  message.includes("Demo") ? "bg-blue-500/10 text-blue-200" : "bg-red-500/10 text-red-200",
                )}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,.4)] transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Switch mode */}
            <p className="mt-4 text-center text-xs text-zinc-500">
              {mode === "signup" ? (
                <>Already have an account? <Link href="/?auth=login" className="font-bold text-violet-300 hover:text-white">Sign In</Link></>
              ) : (
                <>New here? <Link href="/?auth=signup" className="font-bold text-violet-300 hover:text-white">Create an account</Link></>
              )}
            </p>

            {mode === "signup" && (
              <>
                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="flex-1 border-t border-white/[0.08]" />
                  <span className="text-xs text-zinc-600">Free forever features</span>
                  <div className="flex-1 border-t border-white/[0.08]" />
                </div>

                {/* Free perks */}
                <div className="grid grid-cols-2 gap-2">
                  {FREE_PERKS.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3">
                      <Icon size={18} className="text-violet-400" />
                      <span className="text-center text-[11px] font-bold text-zinc-400">{label}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-center text-[10px] leading-4 text-zinc-600">
                  By continuing you confirm you are 18+ and agree to our{" "}
                  <Link href="/terms" className="text-zinc-500 underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-zinc-500 underline">Privacy Policy</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
