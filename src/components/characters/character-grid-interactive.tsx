"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import type { Character } from "@/types/domain";
import { CharacterGrid } from "@/components/characters/character-grid";
import { CharacterModal } from "@/components/characters/character-modal";

export function CharacterGridInteractive({
  characters,
  showSearch = false,
}: {
  characters: Character[];
  showSearch?: boolean;
}) {
  const [selected, setSelected] = useState<Character | null>(null);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? characters.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.shortDescription?.toLowerCase().includes(query.toLowerCase()) ||
          c.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase())),
      )
    : characters;

  return (
    <>
      {showSearch && (
        <div className="relative mb-5 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companions…"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-8 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/40 focus:bg-white/[0.06]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 && query && (
        <p className="py-10 text-center text-sm text-zinc-500">No companions match &ldquo;{query}&rdquo;</p>
      )}

      <CharacterGrid characters={filtered} onCardClick={setSelected} />

      {selected && (
        <CharacterModal character={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
