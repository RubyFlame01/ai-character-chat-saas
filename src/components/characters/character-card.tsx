import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { Character } from "@/types/domain";
import { engagementStats, fmt } from "@/components/characters/engagement";

function CardInner({ character }: { character: Character }) {
  const { likes, msgs } = engagementStats(character.slug);
  return (
    <div className="relative aspect-[3/4] overflow-hidden">
      <Image
        src={character.imagePath}
        alt={character.name}
        fill
        sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
        className="object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

      {/* Online badge */}
      <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
        <span className="online-dot size-1.5 rounded-full bg-emerald-400" />
        Online
      </div>

      {/* Mode badge */}
      <div className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-bold capitalize text-violet-200 backdrop-blur-md">
        {character.mode}
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h3 className="text-base font-black leading-tight text-white">{character.name}</h3>
            <p className="mt-0.5 text-xs font-semibold text-zinc-300">{character.age} years old</p>
          </div>
          <span className="brand-gradient flex size-9 shrink-0 items-center justify-center rounded-full opacity-0 shadow-[0_0_20px_rgba(168,85,247,.5)] transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 scale-90">
            <MessageCircle size={16} className="text-white" />
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-zinc-400">
          <span className="flex items-center gap-1">
            <Heart size={11} className="text-pink-400" />
            {fmt(likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={11} className="text-violet-400" />
            {fmt(msgs)}
          </span>
        </div>
      </div>
    </div>
  );
}

const cardClass =
  "card-shine group relative block overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--card-bg)] transition duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-[0_20px_60px_rgba(109,40,217,.3)]";

export function CharacterCard({
  character,
  priority = false,
  onClick,
}: {
  character: Character;
  priority?: boolean;
  onClick?: (character: Character) => void;
}) {
  if (onClick) {
    return (
      <button type="button" onClick={() => onClick(character)} className={cardClass}>
        <CardInner character={character} />
      </button>
    );
  }

  return (
    <Link href={`/characters/${character.slug}`} className={cardClass}>
      <CardInner character={character} />
    </Link>
  );
}
