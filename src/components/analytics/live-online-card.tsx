"use client";

import { Activity } from "lucide-react";
import { useOnlineCount } from "@/lib/hooks/use-online-count";

/** Admin dashboard card showing the live online visitor count. */
export function LiveOnlineCard() {
  const count = useOnlineCount();

  return (
    <div className="rounded-lg border border-white/10 bg-white/[.045] p-6">
      <div className="flex items-center gap-2 text-emerald-300">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
        </span>
        <Activity size={16} />
        <p className="text-xs font-black uppercase tracking-widest">Live now</p>
      </div>
      <p className="mt-4 text-4xl font-black text-white">
        {count === null ? "—" : count.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        {count === 1 ? "visitor online right now" : "visitors online right now"}
      </p>
    </div>
  );
}
