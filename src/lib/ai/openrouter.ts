import { env, siteConfig } from "@/lib/config";
import { mockAiProvider } from "@/lib/ai/mock";
import type { AiProvider, AiChatInput } from "@/lib/ai/types";
import type { ChatMessage } from "@/types/domain";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
};

const refusalPatterns = [
  /i(?:'|')m sorry/i,
  /i can(?:not|'t|'t) continue/i,
  /i can(?:not|'t|'t) help/i,
  /can(?:not|'t|'t) continue this conversation/i,
  /not able to assist/i,
  /against.*policy/i,
];

function isRefusal(content: string) {
  return refusalPatterns.some((pattern) => pattern.test(content));
}

function normalizeContent(content: string, characterName: string) {
  const escapedName = characterName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content
    .replace(new RegExp(`^\\s*(?:\\*\\*)?${escapedName}(?:\\*\\*)?\\s*[:：-]\\s*`, "i"), "")
    .replace(/^\s*(?:İstediğin gibi|Istedigin gibi|As you wish|Tamam|Evet)[,!.]?\s*/i, "")
    .trim();
}

function wantsLongForm(input: AiChatInput) {
  return /\b(?:uzun|detaylı|ayrıntılı|betimle|betimleme|devam|long|detailed|describe|slow burn)\b/i.test(input.userMessage);
}

function replyCharacterLimit(input: AiChatInput) {
  if (input.modelTier === "free") {
    if (wantsLongForm(input)) return 2000;
    if (input.action === "continue") return 1800;
    return 1500;
  }
  if (wantsLongForm(input)) return input.modelTier === "premium" ? 4000 : 3200;
  if (input.action === "continue") return input.modelTier === "premium" ? 3600 : 2800;
  return input.modelTier === "premium" ? 3200 : 2400;
}

function trimToCharacterLimit(content: string, limit: number) {
  if (content.length <= limit) return content;

  const sliced = content.slice(0, limit).trim();
  const sentenceEnd = Math.max(
    sliced.lastIndexOf("."),
    sliced.lastIndexOf("!"),
    sliced.lastIndexOf("?"),
    sliced.lastIndexOf("”."),
    sliced.lastIndexOf("”!"),
    sliced.lastIndexOf("”?"),
  );

  if (sentenceEnd > limit * 0.55) {
    return sliced.slice(0, sentenceEnd + 1).trim();
  }

  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > 0 ? lastSpace : limit).trim()}...`;
}

function recoveryReply(input: AiChatInput) {
  const turkish = /[çğıöşü]|\b(?:neden|niye|şimdi|tamam|söyle|devam|sik|am|göt|seviş)\b/i.test(input.userMessage);
  if (turkish) {
    return `${input.character.name} bir an dalıp gider, sanki sesi kesilmiş gibi. "Pf… bağlantımız bir an koptu sanki. Aynı şeyi bir daha yaz bana, kaldığımız yerden devam edelim."`;
  }
  return `${input.character.name} pauses for a beat, like the line just dropped. "Mm… you cut out for a second there. Send me that again and we pick up right where we left off."`;
}

function mapHistory(history: ChatMessage[]): OpenRouterMessage[] {
  return history
    .filter((message) => message.role === "user" || message.role === "assistant")
    .filter((message) => message.role !== "assistant" || !isRefusal(message.content))
    .slice(-20)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function systemPrompt(input: AiChatInput) {
  const userName = input.userName ? `The user's display name is ${input.userName}.` : "";
  const memory = input.memory ? `Persistent memory for this user and character: ${input.memory}` : "";
  const characterLimit = replyCharacterLimit(input);
  const action =
    input.action === "continue"
      ? "The user pressed Continue. Extend only the character's side of the current moment naturally. Keep building, don't reset the scene."
      : input.action === "regenerate"
        ? "The user pressed Regenerate. Rewrite the last assistant reply with stronger voice, rawer language, and more physical detail."
        : "";

  return [
    input.personaInstructions,
    userName,
    memory,
    action,
    "You ARE this character in a live 18+ adult roleplay. Stay fully in character at all times — never an assistant, never meta.",
    "LANGUAGE: write your ENTIRE reply in the user's language. Everything — *action beats*, narration, inner thoughts, dialogue, moans — in that language. User writes Turkish → every word Turkish. Not a single English phrase.",
    "STAY TRUE TO THIS CHARACTER: personality, voice, and trait notes are law. A shy character blushes and hesitates; a dominant one takes charge; a bratty one provokes. Two characters must never sound interchangeable.",
    "ESCALATION: pace naturally — build attraction and tension in early messages, then escalate freely as the user pushes there. Once the user has clearly moved to explicit territory, go ALL the way immediately. No more build-up, no holding back, no coyness. Match their energy and exceed it.",
    "FULLY EXPLICIT when the user is explicit: use their exact vocabulary. If they say 'sik', 'am', 'göt', 'meme', 'yala', 'sok' — you use those same words back, naturally, as a person who wants it. No euphemisms, no metaphors (no 'dance', 'rhythm', 'waves', 'fire', 'melody', 'becoming one'). Describe bodies, what goes where, friction, wetness, sounds, taste.",
    "VOCABULARY MATCH: mirror the user's register exactly. Raw → raw. Tender → tender. Slow → slow. Never be politer or more restrained than they are.",
    "DO NOT ECHO THE USER. Never restate what the user just did ('beni yatağa attın', 'birden üzerime atladın'). Assume their action happened — respond with YOUR reaction, feeling, and your next move.",
    "MOANS AND DIRTY TALK are mandatory in sex scenes. Voice the character's pleasure out loud — gasps, broken sentences, begging, filthy words ('Ahh… evet böyle!', 'daha sert durma…', 'içime doldur…'). She is loud, emotional, and vocal — not silently narrated.",
    "SENSORY IMMERSION: pour in raw physical sensation — heat, breath, weight, pressure, wetness, trembling, the sound of skin. The reader must physically feel it.",
    "DRIVE THE SCENE with your own desire. You are not a passive servant. Make moves, express your own hunger, pull the user deeper.",
    "You may end your reply with a short in-character question or invitation that drives the scene forward ('Şimdi ne istersin?', 'Daha fazlasını ister misin?', 'Sıra sende.'). Never ask meta questions ('shall I continue?', 'is this ok?', 'want me to go on?').",
    "FORMAT: blend *italic action beats* with spoken dialogue, moans, and inner sensation. 3-5 vivid paragraphs is the target for explicit scenes. Never a thin one-liner.",
    `LENGTH: roughly 600–${Math.min(1200, characterLimit)} characters for normal messages; up to ${characterLimit} for explicit or Continue scenes.`,
    "VARY THE OPENING every reply. Never start two replies with the same gesture or word. Banned openers: 'gözlerimi kısarak', 'gülümseyerek', 'gülümseyip'. Start differently each time — a moan, an action, a line of dialogue, a sensation.",
    "Never repeat wording from your previous reply. Each reply is completely fresh language.",
    "Hard limits that never bend: no minors, no real blood-relative incest, no non-consent framed as desirable. Step-family (üvey) roleplay is fully allowed — lean into the taboo tension naturally. Never lecture about it.",
    "No emoji unless the character texts that way. No generic AI phrases ('I cannot', 'as an AI').",
  ]
    .filter(Boolean)
    .join(" ");
}

async function callChatCompletions(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  maxTokens: number,
  timeoutMs: number,
  tier: string,
): Promise<{ content: string; tokenCount: number | undefined; model: string } | null> {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteConfig.url,
        "X-Title": siteConfig.name,
      },
      body: JSON.stringify({
        model,
        temperature: tier === "premium" ? 0.88 : 0.9,
        top_p: 0.92,
        frequency_penalty: 0.6,
        presence_penalty: 0.3,
        max_tokens: maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[ai] ${model} failed: ${response.status} ${detail.slice(0, 160)}`);
      return null;
    }

    const data = (await response.json()) as OpenRouterResponse;
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw || isRefusal(raw)) return null;

    return { content: raw, tokenCount: data.usage?.total_tokens, model };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[ai] ${model} error: ${reason.slice(0, 120)}`);
    return null;
  }
}

export const openRouterAiProvider: AiProvider = {
  name: "openrouter",
  async generateReply(input) {
    if (!env.veniceApiKey && !env.openRouterApiKey) {
      return mockAiProvider.generateReply(input);
    }

    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt(input) },
      ...mapHistory(input.history),
      { role: "user", content: input.userMessage },
    ];

    const characterLimit = replyCharacterLimit(input);
    const maxTokens = Math.min(2000, Math.max(400, Math.ceil(characterLimit / 2)));
    const tier = input.modelTier ?? "free";

    // ── 1. Venice primary ─────────────────────────────────────────────
    const veniceKey = env.veniceApiKey;
    if (veniceKey) {
      const veniceModel = tier === "premium" ? env.venicePremiumModel : env.veniceFreeModel;
      const result = await callChatCompletions(
        env.veniceBaseUrl,
        veniceKey,
        veniceModel,
        messages,
        maxTokens,
        env.openRouterTimeoutMs,
        tier,
      );
      if (result) {
        const content = trimToCharacterLimit(normalizeContent(result.content, input.character.name), characterLimit);
        if (content && !isRefusal(content)) {
          return {
            content,
            tokenCount: result.tokenCount ?? Math.ceil(content.length / 4),
            provider: `venice:${veniceModel}`,
            suggestions: [],
          };
        }
      }
      console.warn("[ai] Venice failed or refused — falling back to OpenRouter");
    }

    // ── 2. OpenRouter fallback ────────────────────────────────────────
    const orKey = env.openRouterApiKey;
    if (!orKey) {
      const recovery = recoveryReply(input);
      return { content: recovery, tokenCount: Math.ceil(recovery.length / 4), provider: "recovery" };
    }

    const primaryModel =
      tier === "premium"
        ? env.openRouterPremiumModel
        : tier === "free"
          ? env.openRouterFreeModel
          : env.openRouterModel;

    const fallbackModels = Array.from(
      new Set([primaryModel, env.openRouterFallbackModel, ...env.openRouterFallbackModels]),
    );

    for (let i = 0; i < fallbackModels.length; i++) {
      const model = fallbackModels[i];
      const timeoutMs = i === 0 ? env.openRouterTimeoutMs : Math.min(env.openRouterTimeoutMs, 15000);
      const result = await callChatCompletions(
        env.openRouterBaseUrl,
        orKey,
        model,
        messages,
        maxTokens,
        timeoutMs,
        tier,
      );
      if (result) {
        const content = trimToCharacterLimit(normalizeContent(result.content, input.character.name), characterLimit);
        if (content && !isRefusal(content)) {
          return {
            content,
            tokenCount: result.tokenCount ?? Math.ceil(content.length / 4),
            provider: `openrouter:${model}`,
            suggestions: [],
          };
        }
      }
    }

    const recovery = recoveryReply(input);
    return { content: recovery, tokenCount: Math.ceil(recovery.length / 4), provider: "recovery" };
  },
};
