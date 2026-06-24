import { hasSupabaseAdminEnv } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatMessage } from "@/types/domain";

export type ConversationSummary = {
  id: string;
  characterSlug: string;
  characterName: string;
  characterImagePath: string;
  characterMode: string;
  lastMessagePreview: string;
  lastMessageRole: "user" | "assistant";
  updatedAt: string;
};

export async function createFreshConversation(
  userId: string,
  characterId: string,
  characterName: string,
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("conversations")
    .insert({ user_id: userId, character_id: characterId, title: `Chat with ${characterName}` })
    .select("id")
    .single();
  return data!.id;
}

export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  // messages cascade-deleted by FK, or delete manually first
  await supabase.from("messages").delete().eq("conversation_id", conversationId);
  await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId); // guard: only owner can delete
}

export async function deleteAllUserConversations(userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: convs } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);
  if (convs?.length) {
    await supabase
      .from("messages")
      .delete()
      .in("conversation_id", convs.map((c) => c.id));
  }
  await supabase.from("conversations").delete().eq("user_id", userId);
}

export async function findOrCreateConversation(
  userId: string,
  characterId: string,
  characterName: string,
): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("conversations")
    .insert({ user_id: userId, character_id: characterId, title: `Chat with ${characterName}` })
    .select("id")
    .single();

  return created!.id;
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(120);

  if (!data) return [];
  return data.map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    role: m.role as ChatMessage["role"],
    content: m.content,
    createdAt: m.created_at,
  }));
}

export async function getUserConversationList(userId: string): Promise<ConversationSummary[]> {
  if (!hasSupabaseAdminEnv()) return [];
  const supabase = createSupabaseAdminClient();

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, updated_at, character_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(24);

  if (!convs?.length) return [];

  const characterIds = [...new Set(convs.map((c) => c.character_id))];
  const convIds = convs.map((c) => c.id);

  const [{ data: chars }, { data: msgs }] = await Promise.all([
    supabase.from("characters").select("id, slug, name, image_path, mode").in("id", characterIds),
    supabase
      .from("messages")
      .select("conversation_id, content, role, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false }),
  ]);

  const charMap = new Map((chars ?? []).map((c) => [c.id, c]));
  const lastMsgMap = new Map<string, { content: string; role: string }>();
  for (const msg of msgs ?? []) {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, { content: msg.content, role: msg.role });
    }
  }

  return convs
    .map((conv) => {
      const char = charMap.get(conv.character_id);
      if (!char) return null;
      const lastMsg = lastMsgMap.get(conv.id);
      return {
        id: conv.id,
        characterSlug: char.slug,
        characterName: char.name,
        characterImagePath: char.image_path,
        characterMode: char.mode,
        lastMessagePreview: lastMsg?.content?.slice(0, 80) ?? "—",
        lastMessageRole: (lastMsg?.role ?? "assistant") as "user" | "assistant",
        updatedAt: conv.updated_at,
      };
    })
    .filter(Boolean) as ConversationSummary[];
}

export type UserCharacterSummary = {
  slug: string;
  name: string;
  imagePath: string;
  mode: string;
  portraitStatus: string;
  createdAt: string;
};

export async function getUserCharacters(userId: string): Promise<UserCharacterSummary[]> {
  if (!hasSupabaseAdminEnv()) return [];
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("characters")
    .select("slug, name, image_path, mode, portrait_status, created_at")
    .eq("created_by", userId)
    .eq("visible", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!data) return [];
  return data.map((c) => ({
    slug: c.slug,
    name: c.name,
    imagePath: c.image_path,
    mode: c.mode,
    portraitStatus: c.portrait_status,
    createdAt: c.created_at,
  }));
}
