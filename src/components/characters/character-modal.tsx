"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, X } from "lucide-react";
import type { Character } from "@/types/domain";
import { getRelatedCharacters } from "@/lib/data";
import { engagementStats, fmt } from "@/components/characters/engagement";

export function CharacterModal({
  character,
  onClose,
}: {
  character: Character;
  onClose: () => void;
}) {
  const related = getRelatedCharacters(character.slug, 4);
  const gallery = character.gallery?.length ? character.gallery : [character.imagePath];
  const [photoIndex, setPhotoIndex] = useState(0);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { likes, msgs } = engagementStats(character.slug);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative flex w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0b1e] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex-col sm:flex-row">

        {/* ── Left: image column ── */}
        <div className="relative shrink-0 sm:w-[300px] w-full">
          {/* Portrait image box — 3:4 shows face + upper body cleanly */}
          <div className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-full overflow-hidden bg-zinc-950">
            <Image
              src={gallery[photoIndex] ?? character.imagePath}
              alt={character.name}
              fill
              sizes="(max-width: 640px) 100vw, 300px"
              quality={92}
              priority
              className="object-cover object-top transition duration-300"
            />

            {/* Subtle bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Character name on image (bottom-left) */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-2xl font-black text-white leading-tight">{character.name}</h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                {character.age} years old · <span className="capitalize">{character.relationship}</span>
              </p>
            </div>

            {/* Gallery controls */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((i) => (i + 1) % gallery.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      className={`size-1.5 rounded-full transition ${i === photoIndex ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: info column ── */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
          >
            <X size={15} />
          </button>

          {/* Mode badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-bold capitalize text-violet-200">
              {character.mode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold capitalize text-zinc-400">
              {character.mood}
            </span>
          </div>

          {/* Bio */}
          <p className="text-sm leading-6 text-zinc-300">{character.shortDescription}</p>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {character.tags.map((tag) => (
              <Link
                key={tag}
                href={`/characters?tag=${encodeURIComponent(tag)}`}
                onClick={onClose}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-zinc-400 transition hover:border-violet-400/40 hover:text-violet-300"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 text-sm font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Heart size={14} className="text-pink-400" />
              {fmt(likes)}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={14} className="text-violet-400" />
              {fmt(msgs)}
            </span>
          </div>

          <div className="my-4 border-t border-white/[0.07]" />

          {/* CTA buttons */}
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">Start here</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/chat/${character.slug}`}
              onClick={onClose}
              className="brand-gradient flex flex-col items-center gap-1.5 rounded-xl p-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,.3)] transition hover:opacity-90"
            >
              <MessageCircle size={20} />
              New Chat
            </Link>
            <Link
              href={`/characters/${character.slug}`}
              onClick={onClose}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 text-sm font-bold text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
            >
              <span className="text-lg leading-none">👤</span>
              Profile
            </Link>
          </div>

          {/* Similar characters */}
          {related.length > 0 && (
            <>
              <div className="my-4 border-t border-white/[0.07]" />
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">Similar characters</p>
              <div className="grid grid-cols-2 gap-2.5">
                {related.slice(0, 4).map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/characters/${rel.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[var(--card-bg)] p-2.5 transition hover:border-violet-500/30"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                      <Image src={rel.imagePath} alt={rel.name} fill sizes="40px" className="object-cover object-top" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white">{rel.name}</p>
                      <p className="text-[10px] text-zinc-500">{rel.age} yo</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
