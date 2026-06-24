import type { Character } from "@/types/domain";
import { CharacterCard } from "@/components/characters/character-card";

export function CharacterGrid({
  characters,
  onCardClick,
}: {
  characters: Character[];
  onCardClick?: (character: Character) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {characters.map((character, index) => (
        <CharacterCard
          key={character.id}
          character={character}
          priority={index < 4}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
