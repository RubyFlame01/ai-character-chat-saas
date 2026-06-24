import Image from "next/image";
import { ArrowRight, Flame, Lock, Sparkles, Zap } from "lucide-react";
import { CharacterGridInteractive } from "@/components/characters/character-grid-interactive";
import { LinkButton } from "@/components/ui/button";
import { localizeCharacters } from "@/lib/characters/localize";
import { getFeaturedCharacters } from "@/lib/data";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();
  const featured = localizeCharacters(getFeaturedCharacters().slice(0, 8), locale);
  const dictionary = getDictionary(locale);

  return (
    <div className="cinematic-bg min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-8 py-20">
        {/* Subtle background image */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image src="/images/banners/lusttalk-hero.png" alt="" fill className="object-cover object-top" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/30 via-transparent to-[var(--background)]" />
        </div>

        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-sm font-semibold text-violet-200">
            <Flame size={14} />
            {dictionary.home.eyebrow}
          </div>
          <h1 className="text-5xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            <span className="brand-gradient-text">{dictionary.home.title}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            {dictionary.home.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/characters" className="gap-2">
              {dictionary.home.browse} <ArrowRight size={17} />
            </LinkButton>
            <LinkButton href="/pricing" variant="secondary">
              {dictionary.home.pricing}
            </LinkButton>
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative mt-12 flex flex-wrap gap-3">
          {[
            [Sparkles, dictionary.home.stats[0]],
            [Zap, dictionary.home.stats[1]],
            [Lock, dictionary.home.stats[2]],
          ].map(([Icon, label]) => (
            <div
              key={label as string}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-300"
            >
              <Icon size={15} className="text-violet-400" />
              {label as string}
            </div>
          ))}
        </div>
      </section>

      {/* Featured characters */}
      <section className="px-8 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-400">{dictionary.home.featuredEyebrow}</p>
            <h2 className="mt-1.5 text-2xl font-black text-white">{dictionary.home.featuredTitle}</h2>
          </div>
          <LinkButton href="/characters" variant="secondary" className="hidden sm:inline-flex text-xs py-2">
            {dictionary.home.allCharacters} →
          </LinkButton>
        </div>
        <CharacterGridInteractive characters={featured} />
      </section>
    </div>
  );
}
