import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai";
import { env, hasSupabaseAdminEnv, hasVeniceEnv } from "@/lib/config";
import { generateChatImage } from "@/lib/images/venice";
import { getCurrentUser } from "@/lib/server/auth";
import { findCharacter } from "@/lib/server/characters";
import { createFreshConversation, findOrCreateConversation } from "@/lib/server/conversations";
import { getCharacterPersona } from "@/lib/server/personas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Character } from "@/types/domain";

const chatSchema = z.object({
  // Actual DB conversation UUID; null/absent on first message → find-or-create.
  conversationId: z.string().uuid().nullable().optional(),
  freshStart: z.boolean().optional().default(false),
  characterSlug: z.string().min(1),
  content: z.string().min(1).max(4000),
  modelTier: z.enum(["free", "standard", "premium"]).default("free"),
  action: z.enum(["message", "regenerate", "continue"]).default("message"),
  history: z
    .array(
      z.object({
        id: z.string(),
        conversationId: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        createdAt: z.string(),
      }),
    )
    .default([]),
});

const modelCreditMultiplier = {
  free: 1,
  standard: 3,
  premium: 3,
} as const;

const PHOTO_RE =
  /\b(photo|picture|pic\b|image|selfie|görsel|fotoğraf|foto|resim|çek|gönder.*resim|resim.*gönder)\b|(çıplak|naked|nude|topless|açık\s+poz|poz\s+gönder)|(kalça|popo|göğüs|meme|göt).{0,25}(göster|çek|at\b|gönder|yolla)|göster.{0,25}(kalça|popo|göğüs|meme|göt)/i;

function detectPhotoRequest(content: string): { isPhoto: boolean; description: string } {
  if (!PHOTO_RE.test(content)) return { isPhoto: false, description: "" };
  const desc = content
    .replace(/\b(photo|picture|pic\b|image|selfie|görsel|fotoğraf|foto|resim|bana|bir|send|show|me|a|your|please|gönder|misin|atar|at|mısın)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return { isPhoto: true, description: desc };
}

const EXPLICIT_RE =
  /\b(sex|fuck|cock|pussy|dick|cum|naked|nude|nipple|breasts?|ass\b|orgasm|moan|thrust|penetrat|hardcore|explicit|erotic|sikiş|sik\b|am\b|göt\b|memeler?|çıplak|boşal|inle|sokma?|sert\s*yap|yat\s*benimle)\b/i;

function isExplicitConversation(history: { role: string; content: string }[]): boolean {
  const msgCount = history.filter((m) => m.role === "user").length;
  if (msgCount < 3) return false; // fresh chat → never explicit photos
  const recentText = history.slice(-10).map((m) => m.content).join(" ");
  return EXPLICIT_RE.test(recentText);
}

function memoryFromHistory(history: { role: string; content: string }[]) {
  const userMessages = history
    .filter((message) => message.role === "user")
    .slice(-6)
    .map((message) => message.content)
    .join(" | ");

  return userMessages
    ? `Recent user preferences and direction: ${userMessages.slice(0, 900)}`
    : null;
}

function wantsTurkish(content: string) {
  return /[çğıöşü]|\b(?:selam|nasılsın|anne|abla|kardeş|devam|şimdi|hadi|söyle|neden|niye)\b/i.test(content);
}

function fallbackReply(character: Character, content: string) {
  const turkish = wantsTurkish(content);
  const relationship = `${character.relationship} ${character.tags.join(" ")}`.toLowerCase();
  const isStepFamily =
    relationship.includes("step") ||
    relationship.includes("üvey") ||
    relationship.includes("stepmother") ||
    relationship.includes("stepsister");

  if (turkish) {
    if (isStepFamily) {
      return `${character.name} sana daha tanıdık bir ifadeyle yaklaşır. "Bu kurguda aramızdaki yakınlık yetişkin ve üvey; o yasaklı gibi hissettiren gerilimi aceleye getirmeden oynayabiliriz. Bana şimdi nasıl yaklaşmamı istediğini söyle, ben de karakterimden çıkmadan devam edeyim."`;
    }
    return `${character.name} gülümsemesini toparlayıp sana döner. "Tamam, bu anı bozmadan devam edelim. Uzun uzun anlatmadan, senin tonuna göre ilerleyeceğim; şimdi bana bir sonraki hamleni söyle."`;
  }

  if (isStepFamily) {
    return `${character.name} leans back into the familiar tension between you. "In this scene, our closeness is adult and step-family only. Tell me how you want me to move next, and I will stay right in character."`;
  }

  return `${character.name} refocuses on you with a softer smile. "Good, let's keep the moment alive. Tell me your next move, and I will answer in character without dragging it out."`;
}

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat payload." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please login to chat." }, { status: 401 });
  }

  const character = await findCharacter(parsed.data.characterSlug);
  if (!character) {
    return NextResponse.json({ error: "Character not found." }, { status: 404 });
  }

  if (
    (parsed.data.modelTier === "standard" || parsed.data.modelTier === "premium") &&
    !user.entitlements.canUseStandardModel
  ) {
    return NextResponse.json({ error: "A paid plan is required for the erotic model." }, { status: 403 });
  }

  const creditCost = character.creditCost * modelCreditMultiplier[parsed.data.modelTier];
  const { isPhoto, description: photoDescription } = detectPhotoRequest(parsed.data.content);
  const imageCost = isPhoto && hasVeniceEnv() ? env.chatImageCreditCost : 0;
  const totalCost = creditCost + imageCost;

  if (user.credits < totalCost) {
    return NextResponse.json({ error: "Not enough credits." }, { status: 402 });
  }

  // When a photo is being generated, instruct the AI to roleplay sending it.
  const photoInstruction =
    isPhoto && imageCost > 0
      ? " PHOTO SENDING MODE: The user just asked for a photo and one is being generated automatically. Your job is to roleplay SENDING it right now. Write a SHORT in-character response (1-3 sentences max): a brief action beat (like *picks up phone* or *strikes a pose*) followed by a flirty caption or comment — as if you just snapped and sent the photo. Do NOT say you cannot send images, do NOT mention AI, do NOT ask what kind of photo they want (it's already being generated). Just react naturally as if you pressed send."
      : "";

  const provider = getAiProvider();

  // Run LLM and Venice image generation in parallel to minimize total latency.
  const [result, imageResult] = await Promise.all([
    provider
      .generateReply({
        character,
        personaInstructions:
          getCharacterPersona(character, { messageCount: parsed.data.history.length + 1 }) +
          photoInstruction,
        userMessage: parsed.data.content,
        history: parsed.data.history,
        userName: user.displayName,
        modelTier: parsed.data.modelTier,
        action: parsed.data.action,
        memory: memoryFromHistory(parsed.data.history),
      })
      .catch((error) => {
        console.error(error);
        const content = fallbackReply(character, parsed.data.content);
        return {
          content,
          tokenCount: Math.ceil(content.length / 4),
          provider: "fallback",
          suggestions: [] as string[],
        };
      }),

    imageCost > 0
      ? generateChatImage({
          character: {
            gender: character.gender,
            age: character.age,
            tags: character.tags,
            relationship: character.relationship,
          },
          description: photoDescription,
          style: character.mode,
          isExplicitContext: isExplicitConversation(parsed.data.history),
        }).catch(() => ({ ok: false as const, error: "Venice generation failed" }))
      : Promise.resolve(null),
  ]);

  const assistantMessage = {
    id: crypto.randomUUID(),
    conversationId: parsed.data.conversationId ?? character.slug,
    role: "assistant" as const,
    content: result.content,
    createdAt: new Date().toISOString(),
  };

  const imageDataUrl = imageResult?.ok ? imageResult.imageDataUrl : null;

  const nextCredits = Math.max(0, user.credits - totalCost);
  let savedConversationId: string | null = parsed.data.conversationId ?? null;

  if (hasSupabaseAdminEnv() && user.id !== "demo-user") {
    const supabase = createSupabaseAdminClient();

    const convId = parsed.data.freshStart
      ? await createFreshConversation(user.id, character.id, character.name)
      : await findOrCreateConversation(user.id, character.id, character.name);
    savedConversationId = convId;

    await Promise.all([
      supabase.from("messages").insert([
        {
          conversation_id: convId,
          role: "user",
          content: parsed.data.content,
          credit_cost: 0,
          token_count: Math.ceil(parsed.data.content.length / 4),
        },
        {
          conversation_id: convId,
          role: "assistant",
          content: result.content,
          credit_cost: creditCost,
          token_count: result.tokenCount,
        },
      ]),
      supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId),
      supabase
        .from("users_profile")
        .update({ credits: nextCredits, updated_at: new Date().toISOString() })
        .eq("id", user.id),
      supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -totalCost,
        reason: "chat_message",
        metadata: {
          character_id: character.id,
          provider: result.provider,
          model_tier: parsed.data.modelTier,
          conversation_id: convId,
          image_generated: Boolean(imageDataUrl),
        },
      }),
    ]);
  }

  return NextResponse.json({
    assistantMessage,
    credits: nextCredits,
    suggestions: result.suggestions ?? [],
    conversationId: savedConversationId,
    imageDataUrl,
  });
}
