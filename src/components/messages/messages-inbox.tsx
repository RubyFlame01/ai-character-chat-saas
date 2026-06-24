"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, MessageCircle, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversationSummary } from "@/lib/server/conversations";

type Labels = {
  empty: string;
  deleteBtn: string;
  clearAll: string;
  confirmClear: string;
  resume: string;
};

// Same deterministic hash used in character-card.tsx for consistent stats
function engagementStats(slug: string) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const likes = 800 + (h % 18000);
  const msgs = likes * (10 + ((h >>> 8) % 35));
  return { likes, msgs };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function MessagesInbox({
  conversations: initial,
  labels,
  locale,
}: {
  conversations: ConversationSummary[];
  labels: Labels;
  locale: string;
}) {
  const router = useRouter();
  const [convs, setConvs] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id }),
    });
    setConvs((c) => c.filter((conv) => conv.id !== id));
    setDeleting(null);
  }

  async function handleClearAll() {
    if (!window.confirm(labels.confirmClear)) return;
    setClearing(true);
    await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setConvs([]);
    setClearing(false);
  }

  if (convs.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] text-violet-300">
          <MessageSquare size={28} />
        </span>
        <p className="text-zinc-400">{labels.empty}</p>
        <a
          href="/characters"
          className="mt-2 rounded-full border border-violet-300/40 bg-violet-300/[.08] px-6 py-2.5 text-sm font-bold text-violet-100 transition hover:border-violet-300/70 hover:bg-violet-300/[.18] hover:text-white"
        >
          {locale === "tr" ? "Karakterlere göz at" : "Browse characters"}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{convs.length} {locale === "tr" ? "aktif sohbet" : "active chats"}</p>
        <Button
          variant="secondary"
          disabled={clearing}
          onClick={handleClearAll}
          className="gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300"
        >
          <Trash2 size={13} />
          {labels.clearAll}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {convs.map((conv) => {
          const { likes, msgs } = engagementStats(conv.characterSlug);
          return (
            <div key={conv.id} className="group relative">
              <a
                href={`/chat/${conv.characterSlug}`}
                className="card-shine relative block overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--card-bg)] transition duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-[0_20px_60px_rgba(109,40,217,.3)]"
              >
                {/* Portrait image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={conv.characterImagePath}
                    alt={conv.characterName}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

                  {/* Online badge */}
                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    <span className="online-dot size-1.5 rounded-full bg-emerald-400" />
                    Online
                  </div>

                  {/* Mode badge */}
                  <div className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-bold capitalize text-violet-200 backdrop-blur-md">
                    {conv.characterMode}
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black leading-tight text-white">{conv.characterName}</h3>
                        {conv.lastMessagePreview && (
                          <p className="mt-0.5 truncate text-[11px] text-zinc-300/80">
                            {conv.lastMessageRole === "user" ? (locale === "tr" ? "Sen: " : "You: ") : ""}
                            {conv.lastMessagePreview}
                          </p>
                        )}
                      </div>
                      {/* Chat button on hover */}
                      <span className="brand-gradient flex size-8 shrink-0 items-center justify-center rounded-full opacity-0 shadow-[0_0_20px_rgba(168,85,247,.5)] transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-90">
                        <MessageCircle size={14} className="text-white" />
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Heart size={10} className="text-pink-400" />
                        {fmt(likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={10} className="text-violet-400" />
                        {fmt(msgs)}
                      </span>
                    </div>
                  </div>
                </div>
              </a>

              {/* Delete button */}
              <button
                type="button"
                aria-label={labels.deleteBtn}
                disabled={deleting === conv.id}
                onClick={(e) => handleDelete(conv.id, e)}
                className="absolute right-2 top-10 z-10 rounded-full bg-black/60 p-1.5 text-zinc-400 opacity-0 backdrop-blur-sm transition hover:bg-red-500/30 hover:text-red-400 group-hover:opacity-100 disabled:cursor-wait"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
