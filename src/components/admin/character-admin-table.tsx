"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Star } from "lucide-react";
import type { Character } from "@/types/domain";
import { Button } from "@/components/ui/button";

export function CharacterAdminTable({ characters }: { characters: Character[] }) {
  const [rows, setRows] = useState(characters);

  async function toggle(slug: string, field: "featured" | "visible") {
    setRows((current) =>
      current.map((character) =>
        character.slug === slug ? { ...character, [field]: !character[field] } : character,
      ),
    );
    await fetch("/api/admin/characters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, field }),
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[.04]">
      <div className="grid min-w-[760px] grid-cols-[70px_1.2fr_.7fr_.7fr_180px] border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
        <span>Image</span>
        <span>Name</span>
        <span>Mode</span>
        <span>Cost</span>
        <span>Actions</span>
      </div>
      <div className="max-h-[680px] min-w-[760px] overflow-y-auto">
        {rows.map((character) => (
          <div key={character.id} className="grid grid-cols-[70px_1.2fr_.7fr_.7fr_180px] items-center border-b border-white/10 px-4 py-3 text-sm text-zinc-200 last:border-b-0">
            <div className="relative size-12 overflow-hidden rounded-lg bg-zinc-900">
              <Image src={character.imagePath} alt={character.name} fill className="object-cover" />
            </div>
            <div>
              <p className="font-black text-white">{character.name}</p>
              <p className="text-xs text-zinc-500">{character.slug}</p>
            </div>
            <p className="capitalize">{character.mode}</p>
            <p>{character.creditCost}</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="size-10 p-0" onClick={() => toggle(character.slug, "featured")} aria-label="Toggle featured">
                <Star size={16} className={character.featured ? "fill-fuchsia-300 text-fuchsia-300" : ""} />
              </Button>
              <Button variant="secondary" className="size-10 p-0" onClick={() => toggle(character.slug, "visible")} aria-label="Toggle visibility">
                {character.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
