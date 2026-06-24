"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Sparkles } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────
type Gender = "female" | "male";
type Style = "realistic" | "anime";
type Ethnicity = "african-american" | "european" | "asian" | "latina" | "middle-eastern" | "scandinavian" | "custom";
type SkinTone = "pale" | "light" | "medium" | "tan" | "olive" | "brown" | "dark" | "custom";
type HairStyle = "short" | "medium" | "long" | "straight" | "wavy" | "curly" | "bob" | "braided" | "bangs" | "custom";
type HairColor = "brown" | "blonde" | "black" | "red" | "white" | "pink" | "blue" | "custom";
type EyeColor = "brown" | "blue" | "green" | "hazel" | "amber" | "custom";
type BodyType = "petite" | "athletic" | "average" | "curvy" | "plus-size" | "custom";
type Personality = "playful" | "dominant" | "shy" | "romantic" | "mysterious" | "bratty" | "caring" | "confident";
type Relationship = "girlfriend" | "stepsister" | "best-friend" | "coworker" | "neighbor" | "stranger" | "ex";
type Background = "plain" | "skyline" | "bedroom" | "nature";

interface WizardState {
  gender: Gender;
  style: Style;
  ethnicity: Ethnicity;
  ethnicityCustom: string;
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairStyleCustom: string;
  hairColor: HairColor;
  hairColorCustom: string;
  eyeColor: EyeColor;
  eyeColorCustom: string;
  bodyType: BodyType;
  bodyTypeCustom: string;
  personality: Personality;
  relationship: Relationship;
  name: string;
  age: number;
  location: string;
  features: string;
  background: Background;
}

// ── Option card components ──────────────────────────────────────────────
function ImageCard({
  label, selected, onClick, imageSrc, gradient, emoji,
}: {
  label: string; selected: boolean; onClick: () => void;
  imageSrc?: string; gradient?: string; emoji?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 transition-all duration-200",
        selected
          ? "border-violet-400 shadow-[0_0_20px_rgba(139,92,246,.4)]"
          : "border-white/[0.08] hover:border-violet-400/40",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={gradient ? { background: gradient } : {}}>
        {imageSrc ? (
          <Image src={imageSrc} alt={label} fill sizes="(max-width: 640px) 45vw, 380px" className="object-cover object-top" quality={90} />
        ) : emoji ? (
          <div className="flex h-full items-center justify-center text-5xl">{emoji}</div>
        ) : null}
        {selected && (
          <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-violet-500 text-white">
            <Check size={13} />
          </div>
        )}
      </div>
      <div
        className={cn(
          "px-3 py-2.5 text-center text-sm font-bold transition",
          selected ? "bg-violet-600/30 text-white" : "bg-[#0d0b1e] text-zinc-300",
        )}
      >
        {label}
      </div>
    </button>
  );
}

function ColorDot({ label, color, selected, onClick }: { label: string; color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full border-2 transition",
          selected ? "border-violet-400 scale-110 shadow-[0_0_14px_rgba(139,92,246,.5)]" : "border-transparent hover:border-violet-400/40",
        )}
        style={{ background: color }}
      >
        {selected && <Check size={14} className="text-white drop-shadow" />}
      </span>
      <span className={cn("text-[11px] font-semibold", selected ? "text-white" : "text-zinc-400")}>{label}</span>
    </button>
  );
}

function CustomCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 transition-all duration-200",
        selected ? "border-violet-400 shadow-[0_0_20px_rgba(139,92,246,.4)]" : "border-white/[0.08] hover:border-violet-400/40",
      )}
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-violet-900/30">
        <Pencil size={28} className="text-violet-300" />
      </div>
      <div className={cn("px-3 py-2.5 text-center text-sm font-bold", selected ? "bg-violet-600/30 text-white" : "bg-[#0d0b1e] text-zinc-300")}>
        {label}
      </div>
    </button>
  );
}

// ── Step heading ─────────────────────────────────────────────────────────
function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-3xl font-black text-white">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <p className="mb-3 text-sm font-black text-violet-300">{label}</p>;
}

// ── Main wizard ──────────────────────────────────────────────────────────
export function CharacterBuilderWizard({
  cost,
  initialCredits,
  locale,
}: {
  cost: number;
  initialCredits: number;
  locale: string;
}) {
  const [step, setStep] = useState(1);
  const TOTAL = 9;

  const [state, setState] = useState<WizardState>({
    gender: "female", style: "realistic",
    ethnicity: "european", ethnicityCustom: "",
    skinTone: "medium", hairStyle: "long", hairStyleCustom: "",
    hairColor: "brown", hairColorCustom: "", eyeColor: "brown", eyeColorCustom: "",
    bodyType: "curvy", bodyTypeCustom: "", personality: "playful", relationship: "girlfriend",
    name: "", age: 25, location: "", features: "", background: "plain",
  });
  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ slug: string } | null>(null);

  async function create() {
    setError(null);
    setLoading(true);
    const extras = [
      state.ethnicity !== "custom" ? state.ethnicity : state.ethnicityCustom,
      `skin: ${state.skinTone}`,
      `hair: ${state.hairStyle !== "custom" ? state.hairStyle : state.hairStyleCustom} ${state.hairColor !== "custom" ? state.hairColor : state.hairColorCustom}`,
      `eyes: ${state.eyeColor !== "custom" ? state.eyeColor : state.eyeColorCustom}`,
      state.location ? `from ${state.location}` : "",
      state.features,
    ].filter(Boolean).join(", ");

    try {
      const res = await fetch("/api/characters/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim(),
          gender: state.gender,
          mode: state.style,
          age: `${state.age}`,
          body: state.bodyType === "custom" ? state.bodyTypeCustom || "average" : state.bodyType,
          personality: state.personality,
          relationship: state.relationship,
          description: extras,
        }),
      });
      const data = (await res.json()) as { slug?: string; error?: string; code?: string };
      if (!res.ok || !data.slug) {
        setError(data.code === "no-credits" ? "Yeterli krediniz yok." : (data.error ?? "Hata oluştu."));
        setLoading(false);
        return;
      }
      setDone({ slug: data.slug });
    } catch {
      setError("Bağlantı hatası.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-2xl border border-white/[0.08] bg-[var(--card-bg)] p-10 text-center">
          <span className="brand-gradient mx-auto flex size-16 items-center justify-center rounded-2xl text-white">
            <Sparkles size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-black text-white">
            {locale === "tr" ? `${state.name} hazır!` : `${state.name} is ready!`}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {locale === "tr" ? "Karakterin oluşturuldu, sohbet başlatabilirsin." : "Your companion has been created."}
          </p>
          <LinkButton href={`/chat/${done.slug}`} className="mt-6 gap-2">
            <Sparkles size={16} />
            {locale === "tr" ? "Sohbet Et" : "Start Chat"}
          </LinkButton>
        </div>
      </div>
    );
  }

  const progress = Math.round((step / TOTAL) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[var(--background)] px-6 py-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Step {step} of {TOTAL}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* ── Step 1: Gender + Style ── */}
          {step === 1 && (
            <>
              <StepHeading
                title={locale === "tr" ? "Hayalindeki Karakteri Tasarla" : "Design Your Dream Companion"}
                subtitle={locale === "tr" ? "Cinsiyet ve stil seç" : "Select a gender and style to get started"}
              />
              <div className="mb-6 flex justify-center gap-3">
                {(["female", "male"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set("gender", g)}
                    className={cn(
                      "rounded-full border px-5 py-2 text-sm font-bold transition",
                      state.gender === g ? "border-violet-400 bg-violet-600/20 text-white" : "border-white/[0.08] text-zinc-400 hover:text-white",
                    )}
                  >
                    {g === "female" ? "♀ " : "♂ "}{g === "female" ? (locale === "tr" ? "Kadın" : "Female") : (locale === "tr" ? "Erkek" : "Male")}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <ImageCard
                  label={locale === "tr" ? "Gerçekçi" : "Realistic"} selected={state.style === "realistic"}
                  onClick={() => set("style", "realistic")}
                  imageSrc="/images/characters/realistic-samira-vale/avatar.jpg"
                />
                <ImageCard
                  label="Anime" selected={state.style === "anime"}
                  onClick={() => set("style", "anime")}
                  imageSrc="/images/characters/anime-lumi-akane/avatar.jpg"
                />
              </div>
            </>
          )}

          {/* ── Step 2: Ethnicity + Skin Tone ── */}
          {step === 2 && (
            <>
              <StepHeading
                title={locale === "tr" ? "Etnisite ve Ten Rengi" : "Choose Ethnicity & Skin Tone"}
                subtitle={locale === "tr" ? "Bir seçenek seç ya da kendi değerini gir" : "Select an option or enter your own"}
              />
              <SectionLabel label={locale === "tr" ? "Etnisite" : "Ethnicity"} />
              <div className="mb-6 grid grid-cols-4 gap-3">
                {([
                  { id: "european", label: locale === "tr" ? "Avrupalı" : "European", gradient: "linear-gradient(135deg,#f5e6d3,#e8c9a0)" },
                  { id: "asian", label: locale === "tr" ? "Asyalı" : "Asian", gradient: "linear-gradient(135deg,#fde8d8,#f0c4a0)" },
                  { id: "latina", label: "Latina", gradient: "linear-gradient(135deg,#deb887,#c8a06e)" },
                  { id: "african-american", label: locale === "tr" ? "Afrikalı" : "African-American", gradient: "linear-gradient(135deg,#6b4226,#4a2d1a)" },
                  { id: "middle-eastern", label: locale === "tr" ? "Orta Doğulu" : "Middle Eastern", gradient: "linear-gradient(135deg,#c8956c,#a0724a)" },
                  { id: "scandinavian", label: locale === "tr" ? "İskandinav" : "Scandinavian", gradient: "linear-gradient(135deg,#fff0e0,#ffd9b0)" },
                  { id: "custom", label: "Custom" },
                ] as Array<{ id: Ethnicity; label: string; gradient?: string }>).map((opt) =>
                  opt.id === "custom" ? (
                    <CustomCard key={opt.id} label={opt.label} selected={state.ethnicity === "custom"} onClick={() => set("ethnicity", "custom")} />
                  ) : (
                    <ImageCard key={opt.id} label={opt.label} selected={state.ethnicity === opt.id}
                      onClick={() => set("ethnicity", opt.id)} gradient={opt.gradient} />
                  )
                )}
              </div>
              {state.ethnicity === "custom" && (
                <input
                  value={state.ethnicityCustom} onChange={(e) => set("ethnicityCustom", e.target.value)}
                  placeholder={locale === "tr" ? "Etnisite yaz..." : "Describe ethnicity..."}
                  className="mb-6 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              )}
              <SectionLabel label={locale === "tr" ? "Ten Rengi" : "Skin Tone"} />
              <div className="flex flex-wrap gap-4">
                {([
                  { id: "pale", label: locale === "tr" ? "Soluk" : "Pale", color: "#f5e6d0" },
                  { id: "light", label: locale === "tr" ? "Açık" : "Light", color: "#f0d5b0" },
                  { id: "medium", label: locale === "tr" ? "Orta" : "Medium", color: "#d4a070" },
                  { id: "tan", label: "Tan", color: "#c08050" },
                  { id: "olive", label: "Olive", color: "#a07040" },
                  { id: "brown", label: locale === "tr" ? "Kahve" : "Brown", color: "#7a4828" },
                  { id: "dark", label: locale === "tr" ? "Koyu" : "Dark", color: "#4a2810" },
                  { id: "custom", label: "Custom", color: "#7c3aed" },
                ] as Array<{ id: SkinTone; label: string; color: string }>).map((opt) => (
                  <ColorDot key={opt.id} label={opt.label} color={opt.color} selected={state.skinTone === opt.id} onClick={() => set("skinTone", opt.id)} />
                ))}
              </div>
            </>
          )}

          {/* ── Step 3: Hair Style + Color ── */}
          {step === 3 && (
            <>
              <StepHeading
                title={locale === "tr" ? "Saç Stili ve Rengi" : "Choose Hair Style & Color"}
                subtitle={locale === "tr" ? "Bir seçenek seç ya da kendi değerini gir" : "Select an option or enter your own"}
              />
              <SectionLabel label={locale === "tr" ? "Saç Stili" : "Hair Style"} />
              <div className="mb-6 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {([
                  { id: "short", label: locale === "tr" ? "Kısa" : "Short", emoji: "💇" },
                  { id: "medium", label: locale === "tr" ? "Orta" : "Medium", emoji: "👩" },
                  { id: "long", label: locale === "tr" ? "Uzun" : "Long", emoji: "🧖‍♀️" },
                  { id: "straight", label: locale === "tr" ? "Düz" : "Straight", emoji: "📏" },
                  { id: "wavy", label: locale === "tr" ? "Dalgalı" : "Wavy", emoji: "〰️" },
                  { id: "curly", label: locale === "tr" ? "Kıvırcık" : "Curly", emoji: "🌀" },
                  { id: "bob", label: "Bob", emoji: "✂️" },
                  { id: "braided", label: locale === "tr" ? "Örgülü" : "Braided", emoji: "🎀" },
                  { id: "bangs", label: locale === "tr" ? "Perçemli" : "Bangs", emoji: "🌟" },
                  { id: "custom", label: "Custom" },
                ] as Array<{ id: HairStyle; label: string; emoji?: string }>).map((opt) =>
                  opt.id === "custom" ? (
                    <CustomCard key={opt.id} label={opt.label} selected={state.hairStyle === "custom"} onClick={() => set("hairStyle", "custom")} />
                  ) : (
                    <ImageCard key={opt.id} label={opt.label} selected={state.hairStyle === opt.id}
                      onClick={() => set("hairStyle", opt.id)}
                      gradient="linear-gradient(135deg,#1a1030,#0d0b1e)" emoji={opt.emoji} />
                  )
                )}
              </div>
              {state.hairStyle === "custom" && (
                <input value={state.hairStyleCustom} onChange={(e) => set("hairStyleCustom", e.target.value)}
                  placeholder={locale === "tr" ? "Saç stili yaz..." : "Describe hair style..."}
                  className="mb-6 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              )}
              <SectionLabel label={locale === "tr" ? "Saç Rengi" : "Hair Color"} />
              <div className="flex flex-wrap gap-4">
                {([
                  { id: "brown", label: locale === "tr" ? "Kahve" : "Brown", color: "#6b3a2a" },
                  { id: "blonde", label: locale === "tr" ? "Sarı" : "Blonde", color: "#d4a843" },
                  { id: "black", label: locale === "tr" ? "Siyah" : "Black", color: "#1a1a1a" },
                  { id: "red", label: locale === "tr" ? "Kızıl" : "Red", color: "#9b2335" },
                  { id: "white", label: locale === "tr" ? "Beyaz" : "White", color: "#e8e4dc" },
                  { id: "pink", label: locale === "tr" ? "Pembe" : "Pink", color: "#e91e8c" },
                  { id: "blue", label: locale === "tr" ? "Mavi" : "Blue", color: "#1565c0" },
                  { id: "custom", label: "Custom", color: "#7c3aed" },
                ] as Array<{ id: HairColor; label: string; color: string }>).map((opt) => (
                  <ColorDot key={opt.id} label={opt.label} color={opt.color} selected={state.hairColor === opt.id} onClick={() => set("hairColor", opt.id)} />
                ))}
              </div>
              {state.hairColor === "custom" && (
                <input value={state.hairColorCustom} onChange={(e) => set("hairColorCustom", e.target.value)}
                  placeholder={locale === "tr" ? "Saç rengi yaz..." : "Describe hair color..."}
                  className="mt-4 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              )}
            </>
          )}

          {/* ── Step 4: Eye Color ── */}
          {step === 4 && (
            <>
              <StepHeading
                title={locale === "tr" ? "Göz Rengi" : "Choose Eye Color"}
                subtitle={locale === "tr" ? "Bir seçenek seç ya da kendi değerini gir" : "Select an option or enter your own"}
              />
              <div className="grid grid-cols-3 gap-5">
                {([
                  { id: "brown", label: locale === "tr" ? "Kahve" : "Brown", gradient: "radial-gradient(circle at 40% 40%,#8b4513,#4a2010,#1a0808)" },
                  { id: "blue", label: locale === "tr" ? "Mavi" : "Blue", gradient: "radial-gradient(circle at 40% 40%,#4488cc,#1a4a88,#0a1a40)" },
                  { id: "green", label: locale === "tr" ? "Yeşil" : "Green", gradient: "radial-gradient(circle at 40% 40%,#4a9a60,#1a5a30,#0a2010)" },
                  { id: "hazel", label: "Hazel", gradient: "radial-gradient(circle at 40% 40%,#8b7355,#5a4025,#2a1808)" },
                  { id: "amber", label: "Amber", gradient: "radial-gradient(circle at 40% 40%,#d4802a,#9a5010,#4a2005)" },
                  { id: "custom", label: "Custom" },
                ] as Array<{ id: EyeColor; label: string; gradient?: string }>).map((opt) =>
                  opt.id === "custom" ? (
                    <CustomCard key={opt.id} label={opt.label} selected={state.eyeColor === "custom"} onClick={() => set("eyeColor", "custom")} />
                  ) : (
                    <ImageCard key={opt.id} label={opt.label} selected={state.eyeColor === opt.id}
                      onClick={() => set("eyeColor", opt.id)} gradient={opt.gradient} />
                  )
                )}
              </div>
              {state.eyeColor === "custom" && (
                <input value={state.eyeColorCustom} onChange={(e) => set("eyeColorCustom", e.target.value)}
                  placeholder={locale === "tr" ? "Göz rengi yaz..." : "Describe eye color..."}
                  className="mt-5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              )}
            </>
          )}

          {/* ── Step 5: Body Type ── */}
          {step === 5 && (
            <>
              <StepHeading
                title={locale === "tr" ? "Vücut Tipi" : "Choose Body Type"}
                subtitle={locale === "tr" ? "Bir seçenek seç ya da kendi değerini gir" : "Select an option or enter your own"}
              />
              <div className="grid grid-cols-3 gap-5">
                {([
                  { id: "petite", label: locale === "tr" ? "İnce" : "Petite", emoji: "🌸", gradient: "linear-gradient(135deg,#1e1030,#140c20)" },
                  { id: "athletic", label: locale === "tr" ? "Atletik" : "Athletic", emoji: "💪", gradient: "linear-gradient(135deg,#0a1a30,#061220)" },
                  { id: "average", label: locale === "tr" ? "Orta" : "Average", emoji: "⚖️", gradient: "linear-gradient(135deg,#1a1020,#100a18)" },
                  { id: "curvy", label: locale === "tr" ? "Dolgun" : "Curvy", emoji: "🍑", gradient: "linear-gradient(135deg,#2a1030,#1a0820)" },
                  { id: "plus-size", label: locale === "tr" ? "Büyük Beden" : "Plus Size", emoji: "🌹", gradient: "linear-gradient(135deg,#200a20,#160818)" },
                  { id: "custom", label: "Custom" },
                ] as Array<{ id: BodyType; label: string; emoji?: string; gradient?: string }>).map((opt) =>
                  opt.id === "custom" ? (
                    <CustomCard key={opt.id} label={opt.label} selected={state.bodyType === "custom"} onClick={() => set("bodyType", "custom")} />
                  ) : (
                    <ImageCard key={opt.id} label={opt.label} selected={state.bodyType === opt.id}
                      onClick={() => set("bodyType", opt.id)} gradient={opt.gradient} emoji={opt.emoji} />
                  )
                )}
              </div>
              {state.bodyType === "custom" && (
                <input value={state.bodyTypeCustom} onChange={(e) => set("bodyTypeCustom", e.target.value)}
                  placeholder={locale === "tr" ? "Vücut tipi yaz..." : "Describe body type..."}
                  className="mt-5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              )}
            </>
          )}

          {/* ── Step 6: Personality + Relationship ── */}
          {step === 6 && (
            <>
              <StepHeading
                title={locale === "tr" ? "Kişilik ve İlişki" : "Personality & Relationship"}
                subtitle={locale === "tr" ? "Karakterinin kişiliğini ve seninle ilişkisini belirle" : "Define your companion's personality and relationship with you"}
              />
              <SectionLabel label={locale === "tr" ? "Kişilik" : "Personality"} />
              <div className="mb-6 grid grid-cols-4 gap-3">
                {([
                  { id: "playful", label: locale === "tr" ? "Oyuncu" : "Playful", emoji: "😜", gradient: "linear-gradient(135deg,#ff6b35,#f7931e)" },
                  { id: "dominant", label: locale === "tr" ? "Dominant" : "Dominant", emoji: "👑", gradient: "linear-gradient(135deg,#8b0000,#4a0000)" },
                  { id: "shy", label: locale === "tr" ? "Utangaç" : "Shy", emoji: "🌸", gradient: "linear-gradient(135deg,#ff9a9e,#fad0c4)" },
                  { id: "romantic", label: locale === "tr" ? "Romantik" : "Romantic", emoji: "💕", gradient: "linear-gradient(135deg,#e91e8c,#9c1060)" },
                  { id: "mysterious", label: locale === "tr" ? "Gizemli" : "Mysterious", emoji: "🌙", gradient: "linear-gradient(135deg,#1a1a2e,#16213e)" },
                  { id: "bratty", label: locale === "tr" ? "Şımarık" : "Bratty", emoji: "💅", gradient: "linear-gradient(135deg,#c471ed,#7b2d8b)" },
                  { id: "caring", label: locale === "tr" ? "Şefkatli" : "Caring", emoji: "🤗", gradient: "linear-gradient(135deg,#84fab0,#8fd3f4)" },
                  { id: "confident", label: locale === "tr" ? "Güvenli" : "Confident", emoji: "✨", gradient: "linear-gradient(135deg,#ffecd2,#fcb69f)" },
                ] as Array<{ id: Personality; label: string; emoji: string; gradient: string }>).map((opt) => (
                  <ImageCard key={opt.id} label={opt.label} selected={state.personality === opt.id}
                    onClick={() => set("personality", opt.id)} gradient={opt.gradient} emoji={opt.emoji} />
                ))}
              </div>
              <SectionLabel label={locale === "tr" ? "İlişki Türü" : "Relationship"} />
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "girlfriend", label: locale === "tr" ? "Sevgili" : "Girlfriend" },
                  { id: "stepsister", label: locale === "tr" ? "Üvey Kardeş" : "Stepsister" },
                  { id: "best-friend", label: locale === "tr" ? "En İyi Arkadaş" : "Best Friend" },
                  { id: "coworker", label: locale === "tr" ? "İş Arkadaşı" : "Coworker" },
                  { id: "neighbor", label: locale === "tr" ? "Komşu" : "Neighbor" },
                  { id: "stranger", label: locale === "tr" ? "Yabancı" : "Stranger" },
                  { id: "ex", label: "Ex" },
                ] as Array<{ id: Relationship; label: string }>).map((opt) => (
                  <button
                    key={opt.id} type="button" onClick={() => set("relationship", opt.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-bold transition",
                      state.relationship === opt.id
                        ? "border-violet-400 bg-violet-600/20 text-white"
                        : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 7: Name ── */}
          {step === 7 && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                <Sparkles size={28} />
              </div>
              <StepHeading
                title={locale === "tr" ? "İsim ne olsun?" : "What's her name?"}
                subtitle={locale === "tr" ? "Karakterine unutulmaz bir isim ver" : "Give your companion a memorable name"}
              />
              <input
                autoFocus
                value={state.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={locale === "tr" ? "İsim gir..." : "Enter a name..."}
                maxLength={40}
                className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 text-center text-lg font-bold text-white outline-none focus:border-violet-500/50"
              />
            </div>
          )}

          {/* ── Step 8: Age + Location ── */}
          {step === 8 && (
            <>
              <StepHeading
                title={locale === "tr" ? "Yaş ve Konum" : "Age & Location"}
                subtitle={locale === "tr" ? "Karakterinin yaşı ve nereden olduğu" : "Tell us about her age and where she's from"}
              />
              <div className="mb-8 text-center">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-violet-300">{locale === "tr" ? "Yaş" : "Age"}</p>
                <p className="text-6xl font-black text-white">{state.age}</p>
                <input
                  type="range" min={18} max={60} value={state.age}
                  onChange={(e) => set("age", Number(e.target.value))}
                  className="mt-4 w-full max-w-sm accent-violet-500"
                />
                <div className="mt-1 flex max-w-sm justify-between text-xs text-zinc-500 mx-auto">
                  <span>18</span><span>60</span>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-violet-300">{locale === "tr" ? "Konum" : "Location"}</p>
                <input
                  value={state.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder={locale === "tr" ? "ör. İstanbul, Türkiye" : "e.g., Los Angeles, CA"}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>
            </>
          )}

          {/* ── Step 9: Review + Features + Background ── */}
          {step === 9 && (
            <>
              <StepHeading
                title={locale === "tr" ? "İncele ve Tamamla" : "Review & Add Features"}
                subtitle={locale === "tr" ? "Seçimlerini incele ve özel özellikler ekle" : "Review your selections and add special features"}
              />
              {/* Overview */}
              <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">
                  {locale === "tr" ? "Karakter Özeti" : "Character Overview"}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: locale === "tr" ? "İsim" : "Name", value: state.name || "—" },
                    { label: locale === "tr" ? "Yaş" : "Age", value: String(state.age) },
                    { label: locale === "tr" ? "Cinsiyet" : "Gender", value: state.gender === "female" ? (locale === "tr" ? "Kadın" : "Female") : (locale === "tr" ? "Erkek" : "Male") },
                    { label: locale === "tr" ? "Stil" : "Style", value: state.style === "realistic" ? (locale === "tr" ? "Gerçekçi" : "Realistic") : "Anime" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-zinc-500">{label}</p>
                      <p className="mt-1 text-sm font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional features */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-violet-300">
                  {locale === "tr" ? "Ek Özellikler (İsteğe Bağlı)" : "Additional Features (Optional)"}
                </p>
                <div className="mb-2 flex items-start gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.05] px-3 py-2 text-xs text-yellow-200">
                  <span>💡</span>
                  <span>{locale === "tr" ? "Kişilikle ilgili özellikleri şimdilik bırak, sonra özelleştirebilirsin." : "Leave out personality related features for now. You will be able to customize them later on."}</span>
                </div>
                <textarea
                  value={state.features}
                  onChange={(e) => set("features", e.target.value)}
                  placeholder={locale === "tr" ? "ör. çil, dövme, ben..." : "e.g., dimples, freckles, tattoos, birthmarks..."}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Background */}
              <div className="mb-8">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-violet-300">
                  {locale === "tr" ? "Arka Plan Stili" : "Background Style"}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {([
                    { id: "plain", label: locale === "tr" ? "Sade" : "Plain", gradient: "linear-gradient(135deg,#e8e0d8,#d0c8c0)", emoji: "⬜" },
                    { id: "skyline", label: locale === "tr" ? "Şehir" : "Skyline", gradient: "linear-gradient(135deg,#0a0a2e,#1a1a4e)", emoji: "🌆" },
                    { id: "bedroom", label: locale === "tr" ? "Yatak Odası" : "Bedroom", gradient: "linear-gradient(135deg,#1a0a10,#2a1020)", emoji: "🛏️" },
                    { id: "nature", label: locale === "tr" ? "Doğa" : "Nature", gradient: "linear-gradient(135deg,#0a2010,#1a4020)", emoji: "🌿" },
                  ] as Array<{ id: Background; label: string; gradient: string; emoji: string }>).map((opt) => (
                    <ImageCard key={opt.id} label={opt.label} selected={state.background === opt.id}
                      onClick={() => set("background", opt.id)} gradient={opt.gradient} emoji={opt.emoji} />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 border-t border-white/[0.06] bg-[var(--background)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-4 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-30"
          >
            <ArrowLeft size={17} />
            {locale === "tr" ? "Geri" : "Back"}
          </button>
          {step < TOTAL ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}
              disabled={step === 7 && !state.name.trim()}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,.4)] transition hover:opacity-90 disabled:opacity-40"
            >
              {locale === "tr" ? "Devam Et" : "Continue"}
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={create}
              disabled={!state.name.trim() || loading || initialCredits < cost}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,.4)] transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {loading ? (locale === "tr" ? "Oluşturuluyor..." : "Creating...") : (locale === "tr" ? `Karakter Oluştur (${cost} kredi)` : `Create Companion (${cost} credits)`)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
