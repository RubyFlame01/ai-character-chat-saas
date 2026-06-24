import categoriesJson from "../../public/generated/categories.json";
import charactersJson from "../../public/generated/characters.json";
import tagsJson from "../../public/generated/tags.json";
import type { Category, Character } from "@/types/domain";

export const demoCategories = categoriesJson as Category[];
export const demoCharacters = charactersJson as Character[];
export const demoTags = tagsJson as string[];

export function getVisibleCharacters() {
  return demoCharacters.filter((character) => character.visible);
}

export function getFeaturedCharacters() {
  return getVisibleCharacters().filter((character) => character.featured).slice(0, 12);
}

export function getCharacterBySlug(slug: string) {
  return getVisibleCharacters().find((character) => character.slug === slug);
}

export function getRelatedCharacters(slug: string, limit = 4) {
  const current = getCharacterBySlug(slug);
  return getVisibleCharacters()
    .filter((character) => character.slug !== slug && character.category === current?.category)
    .slice(0, limit);
}
