"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, ImageIcon, Loader2, Lock, Mail, MessageCircle, Sparkles, Users, X } from "lucide-react";
import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const PERKS = [
  { icon: MessageCircle, label: "Roleplay Chat" },
  { icon: Users, label: "Free Companion" },
  { icon: Sparkles, label: "100 Free Credits" },
  { icon: ImageIcon, label: "Custom Images" },
];

export function AuthModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("auth") as "login" | "signup" | null;
  const isOpen = mode === "login" || mode === "signup";

  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "discord" | "apple" | null>(null);
  const [showPw, setShowPw] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowEmail(false);
      setEmail("");
      setPassword("");
      setMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const query = params.toString();
    router.push(query ? `?${query}` : window.location.pathname, { scroll: false });
  }

  function continueAfterAuth() {
    const next = searchParams.get("next") ?? "/dashboard";
    close();
    router.push(next);
    router.refresh();
  }

  async function signInWithOAuth(provider: "google" | "discord" | "apple") {
    if (!hasSupabaseBrowserEnv()) { continueAfterAuth(); return; }
    setOauthLoading(provider);
    const next = searchParams.get("next") ?? "/dashboard";
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: provider === "apple" ? "apple" : provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setOauthLoading(null);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!hasSupabaseBrowserEnv()) {
      setMessage("Demo mode active.");
      setTimeout(continueAfterAuth, 500);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

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

    setLoading(false);
    continueAfterAuth();
  }

  if (!isOpen) return null;

  const isSignup = mode === "signup";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === backdropRef.current) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Background character photo */}
        <div className="absolute inset-0">
          <Image
            src="/images/characters/realistic-samira-vale/avatar.jpg"
            alt=""
            fill
            className="object-cover object-top opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95" />
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={15} />
        </button>

        {/* Content */}
        <div className="relative z-10 px-7 pb-7 pt-8">
          {/* Heading */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-white">
              {isSignup ? "Sign Up for Free" : "Welcome Back"}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              {isSignup
                ? "1,000,000+ AI companions are waiting for you"
                : "Sign in to continue your conversations"}
            </p>
          </div>

          {!showEmail ? (
            <>
              {/* OAuth buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => signInWithOAuth("google")}
                  disabled={oauthLoading !== null}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {oauthLoading === "google" ? (
                    <Loader2 size={16} className="animate-spin text-gray-600" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                      <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.4 5.6-5 7.3v6h8.1c4.8-4.4 7.2-10.9 7.2-17.5z" fill="#4285F4"/>
                      <path d="M24 48c6.5 0 12-2.1 15.9-5.8l-8.1-6c-2.2 1.5-5 2.3-7.8 2.3-6 0-11-4-12.8-9.4H2.9v6.2C6.8 42.7 14.9 48 24 48z" fill="#34A853"/>
                      <path d="M11.2 29.1c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6V13.7H2.9C1 17.2 0 20.9 0 24.5s1 7.3 2.9 10.8l8.3-6.2z" fill="#FBBC05"/>
                      <path d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.5-6.5C35.9 2.6 30.4.5 24 .5 14.9.5 6.8 5.8 2.9 13.7l8.3 6.2C13 14.5 18 9.5 24 9.5z" fill="#EA4335"/>
                    </svg>
                  )}
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => signInWithOAuth("apple")}
                  disabled={oauthLoading !== null}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-bold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {oauthLoading === "apple" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <svg width="16" height="19" viewBox="0 0 814 1000" fill="currentColor">
                      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 405.6 0 172.4 0 174.3c0-5.8 0-19.2 3.2-29.5 13-50.2 47.3-82.6 78.9-110.7C116.8 6.5 156.6 0 193 0c64.3 0 117.2 42.6 155.5 42.6 36.6 0 98.8-42.6 171.1-42.6 27.5 0 108.2 2.6 168.3 68.3zm-56.9-172.7c30.3-35.9 52.6-85.5 52.6-135.1 0-6.5-.6-13-1.9-19.2C726.2 19 655.3 59.5 617.7 105.5c-28.2 33.9-51.9 83.5-51.9 130.8 0 7.1 1.3 14.2 1.9 16.5 2.6.3 5.2.6 7.8.6 44.3 0 109.1-38.5 156.7-84.2z"/>
                    </svg>
                  )}
                  Apple
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 border-t border-white/[0.1]" />
                  <span className="text-xs text-zinc-500">or continue with</span>
                  <div className="flex-1 border-t border-white/[0.1]" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmail(true)}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.15] bg-white/[0.08] text-sm font-bold text-white transition hover:bg-white/[0.12]"
                >
                  <Mail size={16} />
                  Email
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Email form */}
              <form onSubmit={submit} className="space-y-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    className="h-12 w-full rounded-xl border border-white/[0.12] bg-white/[0.08] pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.12]"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    className="h-12 w-full rounded-xl border border-white/[0.12] bg-white/[0.08] pl-10 pr-11 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.12]"
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {message && (
                  <p className={cn("rounded-xl px-3 py-2.5 text-sm", message.includes("Demo") ? "bg-blue-500/10 text-blue-200" : "bg-red-500/10 text-red-200")}>
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,.4)] transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? "Working..." : isSignup ? "Create Account" : "Sign In"}
                </button>

                <button type="button" onClick={() => setShowEmail(false)} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300">
                  ← Back to options
                </button>
              </form>
            </>
          )}

          {/* Switch mode */}
          <p className="mt-4 text-center text-xs text-zinc-500">
            {isSignup ? (
              <>Already have an account?{" "}
                <Link href="?auth=login" className="font-bold text-violet-300 hover:text-white">Sign In</Link>
              </>
            ) : (
              <>New here?{" "}
                <Link href="?auth=signup" className="font-bold text-violet-300 hover:text-white">Create account</Link>
              </>
            )}
          </p>

          {/* Perks */}
          {isSignup && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 border-t border-white/[0.07]" />
                <span className="text-xs text-zinc-600">Free forever features</span>
                <div className="flex-1 border-t border-white/[0.07]" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PERKS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5">
                    <Icon size={16} className="text-violet-400" />
                    <span className="text-center text-[9px] font-bold leading-tight text-zinc-400">{label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-[10px] leading-4 text-zinc-600">
                By continuing you confirm you are 18+ and agree to our{" "}
                <Link href="/terms" onClick={close} className="text-zinc-500 underline">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" onClick={close} className="text-zinc-500 underline">Privacy Policy</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
