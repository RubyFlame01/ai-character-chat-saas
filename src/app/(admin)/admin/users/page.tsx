"use client";

import { useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  credits: number;
  subscription_tier: string | null;
  subscription_status: string | null;
  is_admin: boolean;
  created_at: string;
};

const TIER_BADGE: Record<string, string> = {
  free: "bg-zinc-500/20 text-zinc-300",
  silver: "bg-blue-500/20 text-blue-200",
  gold: "bg-yellow-500/20 text-yellow-200",
  platinum: "bg-violet-500/20 text-violet-200",
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searched, setSearched] = useState(false);

  const [selectedId, setSelectedId] = useState("");
  const [delta, setDelta] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState("");

  async function search() {
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    const data = (await res.json()) as { users?: UserRow[]; error?: string };
    setUsers(data.users ?? []);
    setLoading(false);
  }

  async function adjustCredits() {
    const d = parseInt(delta, 10);
    if (!selectedId || isNaN(d) || d === 0) return;
    setAdjusting(true);
    setAdjustMsg("");
    const res = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedId, delta: d }),
    });
    const data = (await res.json()) as { ok?: boolean; newCredits?: number; error?: string };
    if (data.ok) {
      setAdjustMsg(`Done. New balance: ${data.newCredits?.toLocaleString()}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedId ? { ...u, credits: data.newCredits ?? u.credits } : u)),
      );
      setDelta("");
    } else {
      setAdjustMsg(data.error ?? "Error");
    }
    setAdjusting(false);
  }

  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-black uppercase tracking-widest text-violet-400">Admin</p>
        <h1 className="mt-2 text-3xl font-black text-white">Users & Credits</h1>

        {/* Search */}
        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search by email…"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
            />
          </div>
          <button
            type="button"
            onClick={search}
            disabled={loading}
            className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-50 hover:bg-violet-500"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>

        {/* Results table */}
        {searched && (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.08]">
            {users.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">No users found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-right">Credits</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={cn(
                        "border-b border-white/[0.04] transition hover:bg-white/[0.02]",
                        selectedId === u.id && "bg-violet-600/5",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.is_admin && <ShieldCheck size={13} className="shrink-0 text-violet-400" />}
                          <div>
                            <p className="font-bold text-white">{u.display_name ?? "—"}</p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold capitalize", TIER_BADGE[u.subscription_tier ?? "free"] ?? TIER_BADGE.free)}>
                          {u.subscription_tier ?? "free"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-white">
                        {u.credits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => { setSelectedId(u.id); setAdjustMsg(""); }}
                          className="rounded-lg border border-violet-500/30 bg-violet-600/10 px-2 py-1 text-xs font-bold text-violet-200 hover:bg-violet-600/20"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Credit adjustment panel */}
        {selectedId && (
          <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-600/5 p-5">
            <p className="mb-3 text-sm font-bold text-white">
              Adjust credits for: <span className="text-violet-300">{users.find((u) => u.id === selectedId)?.email}</span>
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="e.g. +500 or -200"
                className="h-10 w-40 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/50"
              />
              <button
                type="button"
                onClick={adjustCredits}
                disabled={adjusting || !delta}
                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-50 hover:bg-violet-500"
              >
                {adjusting ? <Loader2 size={14} className="animate-spin" /> : null}
                Apply
              </button>
              <button
                type="button"
                onClick={() => setSelectedId("")}
                className="h-10 rounded-xl border border-white/[0.08] px-3 text-sm text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            {adjustMsg && (
              <p className="mt-2 text-xs font-bold text-emerald-300">{adjustMsg}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
