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
  const [showPw, setShowPw] = useState(false);

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
                <>Already have an account? <Link href="/login" className="font-bold text-violet-300 hover:text-white">Sign In</Link></>
              ) : (
                <>New here? <Link href="/signup" className="font-bold text-violet-300 hover:text-white">Create an account</Link></>
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
