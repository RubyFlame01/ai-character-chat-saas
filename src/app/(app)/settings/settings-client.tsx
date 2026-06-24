"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Check, Eye, EyeOff, Loader2, Lock, Trash2, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseBrowserEnv } from "@/lib/config";

export function SettingsClient({
  userId,
  initialDisplayName,
  email,
}: {
  userId: string;
  initialDisplayName: string;
  email: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [nameStatus, setNameStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [pwError, setPwError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "error">("idle");

  const isDemoUser = userId === "demo-user";

  async function saveDisplayName() {
    if (!displayName.trim() || isDemoUser) return;
    setNameStatus("loading");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    setNameStatus(res.ok ? "ok" : "error");
    if (res.ok) router.refresh();
    setTimeout(() => setNameStatus("idle"), 2000);
  }

  async function changePassword() {
    if (!newPassword || isDemoUser || !hasSupabaseBrowserEnv()) return;
    setPwStatus("loading");
    setPwError("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
      setPwStatus("error");
    } else {
      setPwStatus("ok");
      setCurrentPassword("");
      setNewPassword("");
    }
    setTimeout(() => setPwStatus("idle"), 3000);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE" || isDemoUser) return;
    setDeleteStatus("loading");
    const res = await fetch("/api/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setDeleteStatus("error");
    }
  }

  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-2xl font-black text-white">Account Settings</h1>

        {/* Display name */}
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <User size={13} /> Profile
          </div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">Email</label>
          <p className="mb-4 text-sm text-zinc-300">{email}</p>

          <label className="mb-1 block text-xs font-semibold text-zinc-400">Display Name</label>
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
              placeholder="Your display name"
              maxLength={50}
            />
            <button
              type="button"
              onClick={saveDisplayName}
              disabled={nameStatus === "loading" || !displayName.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              {nameStatus === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : nameStatus === "ok" ? (
                <Check size={14} />
              ) : (
                "Save"
              )}
            </button>
          </div>
          {nameStatus === "error" && (
            <p className="mt-2 text-xs text-red-300">Failed to save. Please try again.</p>
          )}
        </div>

        {/* Password change */}
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Lock size={13} /> Change Password
          </div>

          <label className="mb-1 block text-xs font-semibold text-zinc-400">New Password</label>
          <div className="relative mb-3">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
              placeholder="New password (min 6 chars)"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {pwError && <p className="mb-2 text-xs text-red-300">{pwError}</p>}

          <button
            type="button"
            onClick={changePassword}
            disabled={newPassword.length < 6 || pwStatus === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {pwStatus === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : pwStatus === "ok" ? (
              <><Check size={14} /> Password updated</>
            ) : (
              "Update Password"
            )}
          </button>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
            <AlertTriangle size={13} /> Danger Zone
          </div>

          <p className="mb-4 text-sm text-zinc-400">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <label className="mb-1 block text-xs font-semibold text-zinc-400">
            Type <span className="font-black text-red-400">DELETE</span> to confirm
          </label>
          <div className="flex gap-2">
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="flex-1 rounded-xl border border-red-500/20 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500/50"
              placeholder="DELETE"
            />
            <button
              type="button"
              onClick={deleteAccount}
              disabled={deleteConfirm !== "DELETE" || deleteStatus === "loading"}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-40"
            >
              {deleteStatus === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <><Trash2 size={14} /> Delete</>
              )}
            </button>
          </div>
          {deleteStatus === "error" && (
            <p className="mt-2 text-xs text-red-300">Failed to delete account. Please contact support.</p>
          )}
        </div>
      </section>
    </div>
  );
}
