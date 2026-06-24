import type { Metadata } from "next";
import { CharacterBuilderWizard } from "@/components/builder/character-builder-wizard";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/server/auth";

const CREATE_COST = 25;

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = getDictionary(await getLocale());
  return { title: dictionary.builder.title, description: dictionary.builder.description };
}

export default async function CreateCharacterPage() {
  const locale = await getLocale();
  const user = await getCurrentUser();

  return (
    <CharacterBuilderWizard
      cost={CREATE_COST}
      initialCredits={user?.credits ?? 0}
      locale={locale}
    />
  );
}
