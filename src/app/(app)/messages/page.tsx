import { redirect } from "next/navigation";
import { MessagesInbox } from "@/components/messages/messages-inbox";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/server/auth";
import { getUserConversationList } from "@/lib/server/conversations";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const conversations =
    user.id !== "demo-user" ? await getUserConversationList(user.id) : [];

  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wide text-fuchsia-200">
          {dict.messages.subtitle}
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">{dict.messages.title}</h1>
        <MessagesInbox conversations={conversations} labels={dict.messages} locale={locale} />
      </section>
    </div>
  );
}
