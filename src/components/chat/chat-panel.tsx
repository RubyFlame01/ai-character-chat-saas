"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CreditCard, Edit3, Heart, ImageOff, Lock, MessageCircle, RotateCcw, Send, StepForward } from "lucide-react";
import type { Character, ChatMessage } from "@/types/domain";
import { Button, LinkButton } from "@/components/ui/button";
import type { PlanEntitlements } from "@/lib/subscriptions";
import { engagementStats, fmt } from "@/components/characters/engagement";
import { getIcebreakers } from "@/lib/chat/icebreakers";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/server/conversations";

type ApiResponse = {
  assistantMessage?: ChatMessage;
  credits?: number;
  error?: string;
  suggestions?: string[];
  conversationId?: string;
  imageDataUrl?: string | null;
};

type ImageBubble = {
  id: string;
  messageId: string;
  status: "ready" | "failed";
  imageUrl?: string;
};

type ChatLabels = {
  privateChat: string;
  providerNote: string;
  credits: string;
  creditsPerMessage: string;
  model: string;
  regenerate: string;
  continue: string;
  edit: string;
  typing: string;
  placeholder: string;
  fallbackError: string;
  outOfCreditsTitle: string;
  outOfCreditsDescription: string;
  lockedModelTitle: string;
  lockedModelDescription: string;
  upgradeCta: string;
  freshStart: string;
  historyNotice: string;
};

const modelTiers = [
  { id: "free", label: "Free Chatbot", multiplier: 1, requiredTier: "free" },
  { id: "premium", label: "Erotik", multiplier: 3, requiredTier: "silver" },
] as const;

type ModelTier = (typeof modelTiers)[number]["id"];

export function ChatPanel({
  character,
  userCredits,
  labels,
  locale,
  initialGreeting,
  initialConversationId = null,
  initialMessages = [],
  entitlements,
  initialConversations = [],
}: {
  character: Character;
  userCredits: number;
  labels: ChatLabels;
  locale: string;
  initialGreeting: string;
  initialConversationId?: string | null;
  initialMessages?: ChatMessage[];
  entitlements: PlanEntitlements;
  initialConversations?: ConversationSummary[];
}) {
  const [input, setInput] = useState("");
  const [credits, setCredits] = useState(userCredits);
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState<Record<string, "up" | "down" | null>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [imageBubbles, setImageBubbles] = useState<ImageBubble[]>([]);
  const [freshStart, setFreshStart] = useState(false);
  const hasHistory = initialMessages.length > 0;
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [photoDesc, setPhotoDesc] = useState("");
  const [icebreakerCategory, setIcebreakerCategory] = useState<"sweet" | "spicy">("sweet");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [modelTier, setModelTier] = useState<ModelTier>(
    entitlements.canUseStandardModel ? "premium" : "free",
  );

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: "greeting",
            conversationId: character.slug,
            role: "assistant",
            content: initialGreeting,
            createdAt: new Date().toISOString(),
          },
        ],
  );

  const activeTier = modelTiers.find((tier) => tier.id === modelTier) ?? modelTiers[0];
  const canUseSelectedModel =
    modelTier === "free" || (modelTier === "premium" && entitlements.canUseStandardModel);
  const messageCost = character.creditCost * activeTier.multiplier;
  const canSend = input.trim().length > 0 && !loading && credits >= messageCost && canUseSelectedModel;
  const needsCredits = credits < messageCost;
  const showUpgradePrompt = needsCredits || !canUseSelectedModel;
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const hasAssistantReply = messages.some((message) => message.role === "assistant" && message.id !== "greeting");
  // Show icebreakers when no real messages exchanged yet (only greeting exists)
  const showIcebreakers = messages.length === 1 && messages[0].id === "greeting" && !hasHistory;

  const subtitle = useMemo(
    () => `${character.mode} · ${character.mood} · ${messageCost} ${labels.creditsPerMessage}`,
    [character, labels.creditsPerMessage, messageCost],
  );

  const icebreakers = useMemo(() => getIcebreakers(character, locale), [character, locale]);
  const { likes, msgs: msgCount } = engagementStats(character.slug);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, suggestions, imageBubbles]);

  async function requestReply({
    content,
    nextMessages,
    action,
    appendUser = true,
  }: {
    content: string;
    nextMessages: ChatMessage[];
    action: "message" | "regenerate" | "continue";
    appendUser?: boolean;
  }) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId: conversationId ?? character.slug,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const optimisticMessages = appendUser ? [...nextMessages, userMessage] : nextMessages;
    setMessages(optimisticMessages);
    setSuggestions([]);
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: freshStart ? null : conversationId,
        freshStart,
        characterSlug: character.slug,
        content,
        modelTier,
        action,
        history: nextMessages,
      }),
    });
    const data = (await response.json()) as ApiResponse;

    if (data.conversationId) setConversationId(data.conversationId);
    if (freshStart) setFreshStart(false);

    if (data.assistantMessage) {
      setMessages((current) => [...current, data.assistantMessage!]);
      setCredits(data.credits ?? credits - messageCost);
      setSuggestions(data.suggestions ?? []);
      if (data.imageDataUrl) {
        setImageBubbles((current) => [
          ...current,
          { id: crypto.randomUUID(), messageId: data.assistantMessage!.id, status: "ready", imageUrl: data.imageDataUrl! },
        ]);
      }
    } else {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          conversationId: conversationId ?? character.slug,
          role: "assistant",
          content: data.error ?? labels.fallbackError,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  }

  function toggleReaction(messageId: string, reaction: "up" | "down") {
    const next = reactions[messageId] === reaction ? null : reaction;
    setReactions((prev) => ({ ...prev, [messageId]: next }));
    fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, reaction: next }),
    }).catch(() => null);
  }

  async function sendMessage() {
    if (!canSend) return;
    const content = input.trim();
    setInput("");
    await requestReply({ content, nextMessages: messages, action: "message" });
  }

  async function sendPhotoRequest(description: string) {
    if (loading || credits < messageCost || !canUseSelectedModel) return;
    setShowPhotoInput(false);
    setPhotoDesc("");
    const base = locale === "tr" ? "Bana bir fotoğraf gönderir misin?" : "Could you send me a photo?";
    const phrase = description.trim()
      ? locale === "tr" ? `Bana fotoğraf gönderir misin? ${description.trim()}` : `Could you send me a photo? ${description.trim()}`
      : base;
    await requestReply({ content: phrase, nextMessages: messages, action: "message" });
  }

  async function sendSuggestion(suggestion: string) {
    if (loading || credits < messageCost || !canUseSelectedModel) return;
    await requestReply({ content: suggestion, nextMessages: messages, action: "message" });
  }

  async function sendIcebreaker(prompt: string) {
    if (loading || credits < messageCost || !canUseSelectedModel) return;
    await requestReply({ content: prompt, nextMessages: messages, action: "message" });
  }

  async function regenerateLast() {
    if (!lastUserMessage || loading || credits < messageCost || !canUseSelectedModel) return;
    const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf("assistant");
    const trimmed = lastAssistantIndex > -1 ? messages.slice(0, lastAssistantIndex) : messages;
    await requestReply({ content: lastUserMessage.content, nextMessages: trimmed, action: "regenerate", appendUser: false });
  }

  async function continueScene() {
    if (loading || credits < messageCost || !canUseSelectedModel) return;
    await requestReply({
      content: locale === "tr" ? "Sahneyi doğal şekilde devam ettir." : "Continue the scene naturally.",
      nextMessages: messages,
      action: "continue",
      appendUser: false,
    });
  }

  function editLastUserMessage() {
    if (!lastUserMessage || loading) return;
    const index = messages.findIndex((m) => m.id === lastUserMessage.id);
    setInput(lastUserMessage.content);
    setMessages(messages.slice(0, index));
  }

  const filteredIcebreakers = icebreakers.filter((b) => b.category === icebreakerCategory);

  return (
    <section className="grid h-[calc(100dvh-3.5rem)] overflow-hidden bg-[var(--background)] lg:h-dvh lg:grid-cols-[240px_1fr_260px]">

      {/* ── LEFT: Conversations list ── */}
      <aside className="hidden border-r border-white/[0.06] bg-[var(--sidebar-bg)] lg:flex lg:flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
          <h2 className="text-sm font-black text-white">Messages</h2>
          <Link href="/messages" className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-300">
            {locale === "tr" ? "Tümü" : "All"}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          {initialConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <p className="text-xs text-zinc-500">{locale === "tr" ? "Henüz sohbet yok" : "No chats yet"}</p>
              <Link href="/characters" className="text-xs text-violet-400 hover:text-violet-300">
                {locale === "tr" ? "Keşfet →" : "Explore →"}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {initialConversations.map((conv) => (
                <li key={conv.id}>
                  <Link
                    href={`/chat/${conv.characterSlug}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 transition hover:bg-white/[0.04]",
                      conv.characterSlug === character.slug && "bg-violet-600/10 border-l-2 border-violet-500",
                    )}
                  >
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-full border border-white/10">
                      <Image src={conv.characterImagePath} alt={conv.characterName} fill sizes="36px" className="object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-white">{conv.characterName}</p>
                      <p className="truncate text-[11px] text-zinc-500">
                        {conv.lastMessageRole === "user" ? (locale === "tr" ? "Sen: " : "You: ") : ""}
                        {conv.lastMessagePreview}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* ── CENTER: Chat area ── */}
      <div className="flex h-full min-h-0 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative size-9 shrink-0 overflow-hidden rounded-full border border-white/10">
              <Image src={character.imagePath} alt={character.name} fill sizes="36px" className="object-cover" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white">{character.name}</h2>
                <span className="online-dot size-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-zinc-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={modelTier}
              onChange={(e) => {
                const next = e.target.value as ModelTier;
                if (!(next === "premium" && !entitlements.canUseStandardModel)) setModelTier(next);
              }}
              aria-label={labels.model}
              className="rounded-full border border-white/10 bg-[var(--card-bg)] px-3 py-1.5 text-xs font-bold text-white outline-none lg:hidden"
            >
              {modelTiers.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === "premium" && !entitlements.canUseStandardModel} className="bg-zinc-900">
                  {t.label}{t.id === "premium" && !entitlements.canUseStandardModel ? " 🔒" : ""}
                </option>
              ))}
            </select>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-violet-200">
              {credits.toLocaleString(locale)} {labels.credits}
            </span>
          </div>
        </div>

        {/* Messages / Icebreakers */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {showIcebreakers ? (
            /* ── Icebreaker screen ── */
            <div className="flex h-full flex-col items-center justify-center px-6 py-8">
              <div className="relative size-20 overflow-hidden rounded-full border-2 border-violet-500/50 shadow-[0_0_30px_rgba(124,58,237,.4)]">
                <Image src={character.imagePath} alt={character.name} fill sizes="80px" className="object-cover" />
              </div>
              <h3 className="mt-4 text-lg font-black text-white">
                {locale === "tr" ? `${character.name} ile sohbet başlat` : `Start a conversation with ${character.name}`}
              </h3>
              <p className="mt-1 max-w-sm text-center text-xs text-zinc-500">
                {locale === "tr" ? "Bir senaryo seç ya da kendi mesajını yaz" : "Pick a scenario or write your own message"}
              </p>

              {/* Category tabs */}
              <div className="mt-5 flex gap-2">
                {([["sweet", "😊"], ["spicy", "🌶️"]] as const).map(([cat, emoji]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setIcebreakerCategory(cat)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border text-base transition",
                      icebreakerCategory === cat
                        ? "border-violet-500/50 bg-violet-600/20"
                        : "border-white/[0.08] bg-white/[0.04] hover:border-violet-400/30",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Scenario cards */}
              <div className="mt-5 grid w-full max-w-xl gap-2.5 sm:grid-cols-3">
                {filteredIcebreakers.map((ib) => (
                  <button
                    key={ib.title}
                    type="button"
                    disabled={loading || credits < messageCost || !canUseSelectedModel}
                    onClick={() => sendIcebreaker(ib.prompt)}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 text-left transition hover:border-violet-500/30 hover:bg-violet-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <p className="text-xs font-black text-white">{ib.title}</p>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-400">{ib.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Chat messages ── */
            <div className="space-y-4 px-4 py-5 sm:px-5">
              {hasHistory && !freshStart ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm">
                  <span className="text-zinc-400">{labels.historyNotice}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFreshStart(true);
                      setConversationId(null);
                      setMessages([{ id: "greeting-fresh", conversationId: character.slug, role: "assistant", content: initialGreeting, createdAt: new Date().toISOString() }]);
                      setSuggestions([]);
                    }}
                    className="shrink-0 rounded-lg border border-violet-300/30 bg-violet-300/[.08] px-3 py-1.5 text-xs font-bold text-violet-200 transition hover:border-violet-300/60 hover:bg-violet-300/[.18] hover:text-white"
                  >
                    {labels.freshStart}
                  </button>
                </div>
              ) : null}
              {messages.map((message) => (
                <div key={message.id} className="group">
                  <div
                    className={cn(
                      "rise-in max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6",
                      message.role === "user"
                        ? "brand-gradient ml-auto rounded-br-sm text-white"
                        : "rounded-bl-sm border border-white/5 bg-white/[.07] text-zinc-100",
                    )}
                  >
                    {message.content}
                  </div>
                  {imageBubbles.filter((b) => b.messageId === message.id).map((bubble) => (
                    <div key={bubble.id} className="rise-in mt-2 max-w-sm rounded-2xl rounded-bl-sm border border-white/5 bg-white/[.07] p-2">
                      {bubble.status === "ready" && bubble.imageUrl ? (
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                          <Image src={bubble.imageUrl} alt="Generated" fill sizes="320px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-24 items-center justify-center gap-2 text-xs text-zinc-500">
                          <ImageOff size={16} />
                          <span>{locale === "tr" ? "Fotoğraf oluşturulamadı." : "Photo generation failed."}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {message.role === "assistant" && (
                    <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => toggleReaction(message.id, "up")}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs transition",
                          reactions[message.id] === "up"
                            ? "border-violet-500/60 bg-violet-600/30 text-violet-200"
                            : "border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:border-violet-400/40 hover:text-violet-300",
                        )}
                        aria-label="Thumbs up"
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleReaction(message.id, "down")}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs transition",
                          reactions[message.id] === "down"
                            ? "border-red-500/60 bg-red-600/20 text-red-300"
                            : "border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:border-zinc-400/40 hover:text-zinc-300",
                        )}
                        aria-label="Thumbs down"
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && messages.length > 0 && messages[messages.length - 1]?.role === "user" ? (
                <div className="flex items-center gap-2.5">
                  <span className="relative size-7 shrink-0 overflow-hidden rounded-full border border-white/10">
                    <Image src={character.imagePath} alt={character.name} fill sizes="28px" className="object-cover" />
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-white/5 bg-white/[.07] px-4 py-3">
                    <span className="size-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="size-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="size-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-white/[0.06] p-4">
          {showUpgradePrompt ? (
            <div className="mb-3 flex flex-col gap-3 rounded-lg border border-violet-300/30 bg-violet-300/[.08] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-400 text-zinc-950">
                  {needsCredits ? <CreditCard size={15} /> : <Lock size={15} />}
                </span>
                <div>
                  <p className="text-xs font-black text-white">{needsCredits ? labels.outOfCreditsTitle : labels.lockedModelTitle}</p>
                  <p className="mt-0.5 text-xs leading-5 text-violet-50/80">{needsCredits ? labels.outOfCreditsDescription : labels.lockedModelDescription}</p>
                </div>
              </div>
              <LinkButton href="/pricing" className="shrink-0 text-xs py-1.5">{labels.upgradeCta}</LinkButton>
            </div>
          ) : null}
          {suggestions.length > 0 && !loading ? (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={credits < messageCost || !canUseSelectedModel}
                  onClick={() => sendSuggestion(s)}
                  className="rounded-full border border-violet-300/40 bg-violet-300/[.08] px-3 py-1.5 text-left text-xs font-semibold text-violet-100 transition hover:border-violet-300/70 hover:bg-violet-300/[.18] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          {showPhotoInput ? (
            <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-300/[.08] px-3 py-2">
              <Camera size={14} className="shrink-0 text-violet-300" />
              <input
                autoFocus
                type="text"
                value={photoDesc}
                onChange={(e) => setPhotoDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendPhotoRequest(photoDesc);
                  if (e.key === "Escape") { setShowPhotoInput(false); setPhotoDesc(""); }
                }}
                placeholder={locale === "tr" ? "Nasıl bir fotoğraf? (boş = sürpriz)" : "Describe the photo..."}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <button type="button" onClick={() => sendPhotoRequest(photoDesc)} className="shrink-0 rounded-lg bg-violet-400/20 px-2.5 py-1 text-xs font-bold text-violet-200 hover:bg-violet-400/40">
                {locale === "tr" ? "Gönder" : "Send"}
              </button>
              <button type="button" onClick={() => { setShowPhotoInput(false); setPhotoDesc(""); }} className="shrink-0 text-zinc-500 hover:text-zinc-300 text-lg leading-none">×</button>
            </div>
          ) : null}
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <Button type="button" variant="secondary" disabled={!hasAssistantReply || loading || credits < messageCost || !canUseSelectedModel} onClick={regenerateLast} className="gap-1.5 px-2.5 py-1.5 text-xs">
              <RotateCcw size={13} />{labels.regenerate}
            </Button>
            <Button type="button" variant="secondary" disabled={loading || credits < messageCost || !canUseSelectedModel} onClick={continueScene} className="gap-1.5 px-2.5 py-1.5 text-xs">
              <StepForward size={13} />{labels.continue}
            </Button>
            <Button type="button" variant="secondary" disabled={!lastUserMessage || loading} onClick={editLastUserMessage} className="gap-1.5 px-2.5 py-1.5 text-xs">
              <Edit3 size={13} />{labels.edit}
            </Button>
            <Button
              type="button" variant="secondary"
              disabled={loading || credits < messageCost || !canUseSelectedModel}
              onClick={() => setShowPhotoInput((v) => !v)}
              className={cn("gap-1.5 px-2.5 py-1.5 text-xs", showPhotoInput && "border-violet-300/50 bg-violet-300/[.16] text-white")}
            >
              <Camera size={13} />{locale === "tr" ? "Fotoğraf" : "Photo"}
            </Button>
          </div>
          <div className="flex gap-2.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder={labels.placeholder}
              className="min-h-11 flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-violet-500/40"
            />
            <Button onClick={sendMessage} disabled={!canSend} className="h-auto px-3.5">
              <Send size={17} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Character profile panel ── */}
      <aside className="hidden border-l border-white/[0.06] bg-[var(--sidebar-bg)] lg:flex lg:flex-col lg:overflow-y-auto">
        {/* Portrait card */}
        <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden">
          <Image src={character.imagePath} alt={character.name} fill priority sizes="260px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
            <span className="online-dot size-1.5 rounded-full bg-emerald-400" />
            Online
          </div>
          <div className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-bold capitalize text-violet-200 backdrop-blur-md">
            {character.mode}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <h1 className="text-xl font-black text-white">{character.name}</h1>
            <p className="mt-0.5 text-xs font-semibold text-zinc-300">{character.age} years old</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-zinc-400">
              <span className="flex items-center gap-1"><Heart size={10} className="text-pink-400" />{fmt(likes)}</span>
              <span className="flex items-center gap-1"><MessageCircle size={10} className="text-violet-400" />{fmt(msgCount)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col gap-3 p-3.5">
          <p className="text-[11px] leading-5 text-zinc-400">{character.personality}</p>

          {/* Model selector */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{labels.model}</p>
            <div className="mt-2 grid gap-1.5">
              {modelTiers.map((tier) => {
                const locked = tier.id === "premium" && !entitlements.canUseStandardModel;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    disabled={locked}
                    onClick={() => setModelTier(tier.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                      modelTier === tier.id
                        ? "border-violet-500/50 bg-violet-600/20 text-white"
                        : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-violet-400/30 hover:text-white",
                    )}
                  >
                    <span className="flex items-center gap-1.5">{locked ? <Lock size={11} /> : null}{tier.label}</span>
                    <span className="text-[10px] text-zinc-500">x{tier.multiplier}{locked ? " · Silver" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credits */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{labels.credits}</p>
            <p className="mt-0.5 text-xl font-black text-white">{credits.toLocaleString(locale)}</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
