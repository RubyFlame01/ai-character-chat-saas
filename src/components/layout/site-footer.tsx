import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function SiteFooter() {
  const dictionary = getDictionary(await getLocale());

  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-zinc-400 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <p>{dictionary.footer.description}</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-white">{dictionary.footer.privacy}</Link>
          <Link href="/terms" className="hover:text-white">{dictionary.footer.terms}</Link>
          <Link href="/refund-policy" className="hover:text-white">{dictionary.footer.refunds}</Link>
          <Link href="/content-policy" className="hover:text-white">{dictionary.footer.contentPolicy}</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-8 text-xs text-zinc-500 sm:px-6 lg:px-8">
        <p>18+ | {dictionary.footer.adultNotice}</p>
        <p className="mt-2">
          <a href="https://www.rtalabel.org" rel="noopener noreferrer" target="_blank" className="hover:text-zinc-300">
            RTA-labeled. Parents, protect your children from adult content with parental control tools.
          </a>
        </p>
      </div>
    </footer>
  );
}
