import type { Metadata } from "next";
import { ImageGenerator } from "@/components/generate/image-generator";
import { env } from "@/lib/config";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = getDictionary(await getLocale());
  return {
    title: dictionary.generate.title,
    description: dictionary.generate.metaDescription,
  };
}

export default async function GeneratePage() {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const user = await getCurrentUser();

  return (
    <div className="cinematic-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wide text-fuchsia-300">{dictionary.generate.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{dictionary.generate.title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-7 text-zinc-300">{dictionary.generate.description}</p>

        <div className="mt-10">
          <ImageGenerator
            labels={dictionary.generate}
            cost={env.imageCreditCost}
            initialCredits={user?.credits ?? 0}
            creditsLabel={dictionary.nav.credits}
          />
        </div>
      </div>
    </div>
  );
}
