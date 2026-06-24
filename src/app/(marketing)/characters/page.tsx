import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CharacterGridInteractive } from "@/components/characters/character-grid-interactive";
import { localizeCharacters } from "@/lib/characters/localize";
import { demoCategories } from "@/lib/data";
import { getDictionary, getLocale } from "@/lib/i18n";
import { listCharacters } from "@/lib/server/characters";
import type { Character } from "@/types/domain";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore Companions",
  description: "Browse realistic and anime 18+ AI companions for erotic roleplay, flirty chat, and adult fantasy conversations.",
  openGraph: {
    images: ["/images/banners/og-characters.svg"],
  },
};

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const characters = await listCharacters();
  const dictionary = getDictionary(locale);
  const localized = localizeCharacters(characters, locale);

  const groups = [
    { id: "female", label: "Female", match: (c: Character) => c.gender === "female" && c.mode === "realistic" },
    { id: "male", label: "Male", match: (c: Character) => c.gender === "male" && c.mode === "realistic" },
    { id: "anime-female", label: "Anime Female", match: (c: Character) => c.mode === "anime" && c.gender === "female" },
    { id: "anime-male", label: "Anime Male", match: (c: Character) => c.mode === "anime" && c.gender === "male" },
  ];
  const activeGroup = groups.find((g) => g.id === params.group);

  const filtered = localized.filter((character) => {
    if (activeGroup && !activeGroup.match(character)) return false;
    if (params.category && character.category !== params.category) return false;
    if (params.tag && !character.tags.includes(params.tag)) return false;
    return true;
  });

  const hrefWith = (next: { group?: string | null; category?: string | null; tag?: string | null }) => {
    const group = next.group === undefined ? params.group : next.group;
    const category = next.category === undefined ? params.category : next.category;
    const tag = next.tag === undefined ? params.tag : next.tag;
    const q = new URLSearchParams();
    if (group) q.set("group", group);
    if (category) q.set("category", category);
    if (tag) q.set("tag", tag);
    const s = q.toString();
    return s ? `/characters?${s}` : "/characters";
  };

  return (
    <div className="cinematic-bg min-h-screen px-8 py-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">
          All <span className="brand-gradient-text">Companions</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Browse and discover all available companions</p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Search — handled inside CharacterGridInteractive */}

        {/* Gender / style filters */}
        {groups.map((group) => (
          <Link
            key={group.id}
            href={hrefWith({ group: activeGroup?.id === group.id ? null : group.id })}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-semibold transition",
              activeGroup?.id === group.id
                ? "border-violet-500/50 bg-violet-600/20 text-white"
                : "border-white/[0.09] bg-white/[0.04] text-zinc-400 hover:border-violet-400/30 hover:text-white",
            )}
          >
            {group.label}
          </Link>
        ))}

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 border-l border-white/[0.08] pl-2">
          <Link
            href={hrefWith({ category: null })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              !params.category
                ? "border-violet-500/50 bg-violet-600/20 text-white"
                : "border-white/[0.09] bg-white/[0.04] text-zinc-400 hover:text-white",
            )}
          >
            All
          </Link>
          {demoCategories.map((category) => (
            <Link
              key={category.slug}
              href={hrefWith({ category: params.category === category.slug ? null : category.slug })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                params.category === category.slug
                  ? "border-violet-500/50 bg-violet-600/20 text-white"
                  : "border-white/[0.09] bg-white/[0.04] text-zinc-400 hover:text-white",
              )}
            >
              {dictionary.categories[category.slug] ?? category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid with live search */}
      <CharacterGridInteractive characters={filtered} showSearch />

      {/* Create Your Own CTA */}
      <div className="mt-10 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/5 p-6">
        <div className="flex items-center gap-4">
          <span className="brand-gradient flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_0_28px_rgba(124,58,237,.4)]">
            <Plus size={22} />
          </span>
          <div>
            <p className="font-black text-white">Create Your Own Companion</p>
            <p className="mt-0.5 text-sm text-zinc-400">Bring your fantasy to life with a custom character.</p>
          </div>
          <Link
            href="/create-character"
            className="brand-gradient ml-auto shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,.3)] transition hover:opacity-90"
          >
            Create Now
          </Link>
        </div>
      </div>
    </div>
  );
}
