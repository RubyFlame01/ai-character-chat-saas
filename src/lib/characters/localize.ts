import type { Locale } from "@/lib/i18n";
import type { Character } from "@/types/domain";

function cleanTurkishText(text: string) {
  return text
    .replaceAll("Yetişkin üvey kız kardeş rol yapımı", "Yetişkin üvey kız kardeş")
    .replaceAll("yetişkin üvey kız kardeş rol yapımı", "yetişkin üvey kız kardeş")
    .replaceAll("Yetişkin üvey kardeş rol yapımı", "Yetişkin üvey kardeş")
    .replaceAll("yetişkin üvey kardeş rol yapımı", "yetişkin üvey kardeş")
    .replaceAll("Yetişkin üvey anne rol yapımı", "Yetişkin üvey anne")
    .replaceAll("yetişkin üvey anne rol yapımı", "yetişkin üvey anne")
    .replaceAll("Kurgu, yetişkinlere özel", "Yetişkinlere özel kurgu")
    .replaceAll("kurgusal, yetişkinlere özel", "yetişkinlere özel kurgusal");
}

function cleanLocalizedText(text: string, locale: Locale) {
  return locale === "tr" ? cleanTurkishText(text) : text;
}

export function localizeCharacter(character: Character, locale: Locale): Character {
  if (locale === "en") return character;

  const localized = character.localizations?.[locale];
  if (!localized) return character;

  return {
    ...character,
    shortDescription: cleanLocalizedText(localized.shortDescription ?? character.shortDescription, locale),
    backstory: cleanLocalizedText(localized.backstory ?? character.backstory, locale),
    relationship: cleanLocalizedText(localized.relationship ?? character.relationship, locale),
    scenario: cleanLocalizedText(localized.scenario ?? character.scenario, locale),
    occupation: cleanLocalizedText(localized.occupation ?? character.occupation, locale),
    personality: cleanLocalizedText(localized.personality ?? character.personality, locale),
    greeting: cleanLocalizedText(localized.greeting ?? character.greeting, locale),
  };
}

export function localizeCharacters(characters: Character[], locale: Locale) {
  return characters.map((character) => localizeCharacter(character, locale));
}
