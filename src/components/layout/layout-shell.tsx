"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { SiteSidebar } from "./site-sidebar";

type SidebarUser = {
  id: string;
  displayName: string;
  credits: number;
  isAdmin: boolean;
} | null;

export function LayoutShell({
  user,
  children,
}: {
  user: SidebarUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — visible only below lg */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[var(--sidebar-bg)] px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="brand-gradient flex size-7 items-center justify-center rounded-lg shadow-[0_0_16px_rgba(168,85,247,.4)]">
            <Sparkles size={13} className="text-white" />
          </span>
          <span className="text-sm font-black text-white">LustTalk AI</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Close button for mobile sidebar */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed left-[228px] top-4 z-[110] rounded-full bg-white/[0.08] p-1.5 text-zinc-400 hover:text-white lg:hidden"
        >
          <X size={16} />
        </button>
      )}

      <SiteSidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Content area */}
      <div className="flex min-h-screen flex-col pt-14 lg:ml-[220px] lg:pt-0">
        {children}
      </div>
    </>
  );
}
