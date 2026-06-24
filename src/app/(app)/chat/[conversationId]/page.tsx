import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat/chat-panel";
import { createOpeningMessage } from "@/lib/chat/opening-message";
import { localizeCharacter } from "@/lib/characters/localize";
import { getDictionary, getLocale } from "@/lib/i18n";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { getCurrentUser } from "@/lib/server/auth";
import { findCharacter } from "@/lib/server/characters";
import { findOrCreateConversation, getConversationMessages, getUserConversationList } from "@/lib/server/conversations";
import type { ConversationSummary } from "@/lib/server/conversations";
import type { ChatMessage } from "@/types/domain";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId: slug } = await params;
  const locale = await getLocale();
  const rawCharacter = await findCharacter(slug);
  if (!rawCharacter) notFound();
  const character = localizeCharacter(rawCharacter, locale);
  const dictionary = getDictionary(locale);
  const user = await getCurrentUser();

  // Load existing conversation so the user can resume where they left off.
  let initialConversationId: string | null = null;
  let initialMessages: ChatMessage[] = [];
  let initialConversations: ConversationSummary[] = [];

  if (user && user.id !== "demo-user" && hasSupabaseAdminEnv()) {
    try {
      const [convId, convList] = await Promise.all([
        findOrCreateConversation(user.id, rawCharacter.id, rawCharacter.name),
        getUserConversationList(user.id),
      ]);
      initialConversationId = convId;
      initialMessages = await getConversationMessages(convId);
      initialConversations = convList;
    } catch {
      // Non-fatal — fall back to fresh greeting.
    }
  }

  return (
    <ChatPanel
      character={character}
      userCredits={user?.credits ?? 0}
      labels={dictionary.chat}
      locale={locale}
      initialGreeting={createOpeningMessage(character, locale)}
      initialConversationId={initialConversationId}
      initialMessages={initialMessages}
      initialConversations={initialConversations}
      entitlements={user?.entitlements ?? {
        tier: "free",
        label: "Free",
        monthlyCredits: 100,
        maxMemoryCharacters: 0,
        canUseStandardModel: false,
        canUsePremiumModel: false,
        canChooseModel: false,
        canUseAdvancedMemory: false,
        priorityGeneration: false,
      }}
    />
  );
}
