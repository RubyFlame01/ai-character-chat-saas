import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { getDictionary, getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Membership Plans",
  description: "Free trial plus Silver, Gold, and Platinum memberships for AI character chat credits, memory, and Premium AI access.",
  openGraph: { images: ["/images/banners/pricing.svg"] },
};

export default async function PricingPage() {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-wide text-fuchsia-200">{dictionary.pricing.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">{dictionary.pricing.title}</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-300">
            {dictionary.pricing.description}
          </p>
        </div>
        <div className="mt-10">
          <PricingCards labels={dictionary.pricing} locale={locale} />
        </div>
      </section>
    </div>
  );
}
