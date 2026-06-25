import Link from "next/link";
import { MessageSquare, Sparkles, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/server/auth";
import { LinkButton } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function SiteNav() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07040d]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-black tracking-wide text-white">
          <span className="flex size-9 items-center justify-center brand-gradient rounded-xl text-white shadow-[0_0_24px_rgba(192,38,211,.4)]">
            <Sparkles size={18} />
          </span>
          LustTalk AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-300 md:flex">
          <Link href="/characters" className="hover:text-white">{dictionary.nav.characters}</Link>
          <Link href="/create-character" className="brand-gradient-text font-bold hover:opacity-80">{dictionary.nav.builder}</Link>
          <Link href="/generate" className="brand-gradient-text font-bold hover:opacity-80">{dictionary.nav.generate}</Link>
          <Link href="/pricing" className="hover:text-white">{dictionary.nav.pricing}</Link>
          {user ? (
            <Link href="/messages" className="inline-flex items-center gap-1.5 hover:text-white">
              <MessageSquare size={15} />
              {dictionary.nav.messages}
            </Link>
          ) : null}
          <Link href="/dashboard" className="hover:text-white">{dictionary.nav.dashboard}</Link>
          {user?.isAdmin ? (
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-fuchsia-200 hover:text-white">
              <ShieldCheck size={16} />
              {dictionary.nav.admin}
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          {user ? (
            <LinkButton href="/dashboard" variant="secondary" className="hidden sm:inline-flex">
              {user.credits.toLocaleString()} {dictionary.nav.credits}
            </LinkButton>
          ) : (
            <LinkButton href="/?auth=login" variant="secondary" className="hidden sm:inline-flex">{dictionary.nav.login}</LinkButton>
          )}
          <LinkButton href="/characters">{dictionary.nav.startChat}</LinkButton>
        </div>
      </div>
    </header>
  );
}
