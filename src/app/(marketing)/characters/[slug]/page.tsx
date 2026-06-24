import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { CharacterGallery } from "@/components/characters/character-gallery";
import { CharacterGrid } from "@/components/characters/character-grid";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { localizeCharacter, localizeCharacters } from "@/lib/characters/localize";
import { getRelatedCharacters } from "@/lib/data";
import { getDictionary, getLocale } from "@/lib/i18n";
import { findCharacter } from "@/lib/server/characters";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rawCharacter = await findCharacter(slug);
  if (!rawCharacter) return {};
  const locale = await getLocale();
  const character = localizeCharacter(rawCharacter, locale);

  return {
    title: `${character.name} AI Chat`,
    description: character.shortDescription,
    openGraph: {
      title: `${character.name} - 18+ AI Chat`,
      description: character.shortDescription,
      images: [character.imagePath],
    },
  };
}

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawCharacter = await findCharacter(slug);
  if (!rawCharacter) notFound();
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const character = localizeCharacter(rawCharacter, locale);
  const related = localizeCharacters(getRelatedCharacters(slug), locale);

  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[430px_1fr] lg:px-8">
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <CharacterGallery
            mainImage={character.heroImagePath ?? character.imagePath}
            gallery={character.gallery ?? [character.heroImagePath ?? character.imagePath]}
            name={character.name}
          />
        </div>
        <div className="self-center">
          <p className="text-sm font-black uppercase tracking-wide text-fuchsia-200">{character.mode} · {character.age}+ chat</p>
          <h1 className="mt-3 text-5xl font-black text-white">{character.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">{character.shortDescription}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {character.tags.map((tag) => (
              <Link key={tag} href={`/characters?tag=${encodeURIComponent(tag)}`}>
                <Badge>{tag}</Badge>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[.05] p-4">
              <p className="text-xs font-black uppercase text-zinc-500">{dictionary.characterDetail.relationship}</p>
              <p className="mt-2 font-bold text-white">{character.relationship}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[.05] p-4">
              <p className="text-xs font-black uppercase text-zinc-500">{dictionary.characterDetail.occupation}</p>
              <p className="mt-2 font-bold capitalize text-white">{character.occupation}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[.05] p-4">
              <p className="text-xs font-black uppercase text-zinc-500">{dictionary.characterDetail.age}</p>
              <p className="mt-2 font-bold text-white">{character.age}+</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[.05] p-5">
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">{dictionary.characterDetail.lifeStory}</p>
            <p className="mt-3 leading-7 text-zinc-200">{character.backstory}</p>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[.05] p-5">
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">{dictionary.characterDetail.startingPoint}</p>
            <p className="mt-3 leading-7 text-zinc-200">{character.scenario}</p>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[.05] p-5">
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">{dictionary.characterDetail.personality}</p>
            <p className="mt-3 leading-7 text-zinc-200">{character.personality}</p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href={`/chat/${character.slug}`} className="gap-2">
              <MessageCircle size={18} />
              {dictionary.characterDetail.startPrivateChat}
            </LinkButton>
            <LinkButton href="/characters" variant="secondary">{dictionary.characterDetail.backToLibrary}</LinkButton>
          </div>
        </div>
      </section>
      {related.length ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-black text-white">{dictionary.characterDetail.relatedCharacters}</h2>
          <CharacterGrid characters={related} />
        </section>
      ) : null}
    </div>
  );
}
