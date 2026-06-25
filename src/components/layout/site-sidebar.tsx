"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Compass,
  Crown,
  ImageIcon,
  Loader2,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type SidebarUser = {
  id: string;
  displayName: string;
  credits: number;
  isAdmin: boolean;
} | null;

const navMain = [
  { href: "/characters", icon: Compass, label: "Explore" },
  { href: "/messages", icon: MessageCircle, label: "Chat" },
  { href: "/generate", icon: ImageIcon, label: "Generate" },
  { href: "/create-character", icon: Plus, label: "Create" },
];

// ── Support modal ─────────────────────────────────────────────────────────────
function SupportModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function send() {
    if (!subject.trim() || !body.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-start sm:items-center sm:justify-start" onClick={onClose}>
      <div
        className="relative ml-[220px] mr-auto w-[320px] rounded-2xl border border-white/[0.1] bg-[#0d0b1e] p-5 shadow-2xl sm:ml-[232px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Contact Support</h3>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={17} />
          </button>
        </div>

        {status === "done" ? (
          <div className="rounded-xl border border-green-400/20 bg-green-400/[0.07] px-4 py-6 text-center">
            <p className="font-bold text-green-300">Message sent!</p>
            <p className="mt-1 text-xs text-zinc-400">We'll get back to you as soon as possible.</p>
            <button type="button" onClick={onClose} className="mt-4 text-xs font-bold text-violet-300 hover:text-white">Close</button>
          </div>
        ) : (
          <>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="mb-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your issue..."
              rows={4}
              className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
            />
            {status === "error" && (
              <p className="mb-2 text-xs text-red-300">Something went wrong. Please try again.</p>
            )}
            <button
              type="button"
              disabled={!subject.trim() || !body.trim() || status === "loading"}
              onClick={send}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {status === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {status === "loading" ? "Sending…" : "Send Message"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────
export function SiteSidebar({
  user,
  mobileOpen = false,
  onMobileClose,
}: {
  user: SidebarUser;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);

  async function logout() {
    if (hasSupabaseBrowserEnv()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/characters") return pathname === "/characters" || pathname.startsWith("/characters/");
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <aside className={cn(
        "fixed left-0 top-0 z-[100] flex h-screen w-[220px] flex-col border-r border-white/[0.06] bg-[var(--sidebar-bg)] transition-transform duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}>
        {/* Logo */}
        <div className="px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="brand-gradient flex size-8 shrink-0 items-center justify-center rounded-lg shadow-[0_0_20px_rgba(168,85,247,.4)]">
              <Sparkles size={15} className="text-white" />
            </span>
            <span className="text-sm font-black tracking-tight text-white">LustTalk AI</span>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5 px-3">
          {navMain.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                isActive(href)
                  ? "bg-violet-600/20 text-white ring-1 ring-violet-500/30"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}

          <div className="my-3 border-t border-white/[0.06]" />

          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
              isActive("/dashboard")
                ? "bg-violet-600/20 text-white ring-1 ring-violet-500/30"
                : "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            <Wallet size={17} />
            Dashboard
          </Link>

          {user && (
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                isActive("/settings")
                  ? "bg-violet-600/20 text-white ring-1 ring-violet-500/30"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <Settings size={17} />
              Settings
            </Link>
          )}

          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                isActive("/admin")
                  ? "bg-violet-600/20 text-white ring-1 ring-violet-500/30"
                  : "text-fuchsia-300/70 hover:bg-white/[0.05] hover:text-fuchsia-200",
              )}
            >
              <ShieldCheck size={17} />
              Admin
            </Link>
          )}
        </nav>

        {/* Bottom */}
        <div className="space-y-2 p-3">
          {/* Support button */}
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-300"
          >
            <Send size={13} />
            Support
          </button>

          {user ? (
            <>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
                <span className="text-xs font-bold text-zinc-500">Credits</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{user.credits.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={logout}
                    title="Log out"
                    className="text-zinc-600 transition hover:text-zinc-300"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
              <Link
                href="/pricing"
                className="brand-gradient flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,.35)] transition hover:opacity-90"
              >
                <Crown size={15} />
                Upgrade
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/?auth=login"
                className="flex w-full items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.09] hover:text-white"
              >
                <LogIn size={16} />
                Log In
              </Link>
              <Link
                href="/?auth=signup"
                className="brand-gradient flex w-full items-center gap-2 rounded-lg py-2.5 px-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,.3)] transition hover:opacity-90"
              >
                <UserPlus size={16} />
                Join Free
              </Link>
            </>
          )}
        </div>
      </aside>

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}
