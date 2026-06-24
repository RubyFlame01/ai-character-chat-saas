"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import type { Dictionary } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

type BuilderLabels = Dictionary["builder"];

const genders = ["female", "male"] as const;
const styles = ["realistic", "anime"] as const;
const ages = ["21-25", "26-32", "33-40", "40+"] as const;
const bodies = ["slim", "curvy", "athletic", "voluptuous", "petite"] as const;
const personalities = ["playful", "dominant", "shy", "romantic", "mysterious", "bratty", "caring", "confident"] as const;
const relationships = ["girlfriend", "stepsister", "best-friend", "coworker", "neighbor", "stranger", "ex"] as const;

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        active ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white" : "border-white/10 bg-white/[.04] text-zinc-400 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

export function CharacterBuilder({
  labels,
  cost,
  initialCredits,
  creditsLabel,
}: {
  labels: BuilderLabels;
  cost: number;
  initialCredits: number;
  creditsLabel: string;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<(typeof genders)[number]>("female");
  const [style, setStyle] = useState<(typeof styles)[number]>("realistic");
  const [age, setAge] = useState<(typeof ages)[number]>("26-32");
  const [body, setBody] = useState<(typeof bodies)[number]>("curvy");
  const [personality, setPersonality] = useState<(typeof personalities)[number]>("playful");
  const [relationship, setRelationship] = useState<(typeof relationships)[number]>("girlfriend");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ slug: string } | null>(null);

  const canCreate = name.trim().length > 0 && !loading && initialCredits >= cost;

  async function pollPortrait(slug: string, promptId: string) {
    // Best-effort; the character is already usable, this just fills the avatar.
    for (let i = 0; i < 80; i += 1) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/characters/portrait?slug=${slug}&promptId=${promptId}`);
        const data = (await res.json()) as { status?: string };
        if (data.status === "ready" || data.status === "failed") return;
      } catch {
        // keep trying
      }
    }
  }

  async function create() {
    if (!canCreate) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/characters/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), gender, mode: style, age, body, personality, relationship, description: description.trim() || undefined }),
      });
      const data = (await res.json()) as { slug?: string; promptId?: string; error?: string; code?: string };
      if (!res.ok || !data.slug) {
        setLoading(false);
        if (res.status === 401) setError(labels.loginRequired);
        else if (data.code === "no-credits" || res.status === 402) setError(labels.outOfCredits);
        else setError(data.error ?? labels.error);
        return;
      }
      setDone({ slug: data.slug });
      if (data.promptId) void pollPortrait(data.slug, data.promptId);
    } catch {
      setLoading(false);
      setError(labels.error);
    }
  }

  if (done) {
    return (
      <div className="premium-panel mx-auto max-w-md rounded-2xl p-8 text-center">
        <span className="brand-gradient mx-auto flex size-14 items-center justify-center rounded-2xl text-white">
          <Sparkles size={26} />
        </span>
        <h2 className="mt-5 text-2xl font-black text-white">{labels.successTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{labels.successBody}</p>
        <LinkButton href={`/chat/${done.slug}`} className="mt-6 w-full">{labels.goChat}</LinkButton>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-400">{labels.nameLabel}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={labels.namePlaceholder}
            maxLength={40}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/50"
          />
        </div>

        <Group label={labels.genderLabel}>
          {genders.map((g) => <Chip key={g} active={gender === g} onClick={() => setGender(g)}>{labels.gender[g]}</Chip>)}
        </Group>
        <Group label={labels.styleLabel}>
          {styles.map((s) => <Chip key={s} active={style === s} onClick={() => setStyle(s)}>{labels.style[s]}</Chip>)}
        </Group>
        <Group label={labels.ageLabel}>
          {ages.map((a) => <Chip key={a} active={age === a} onClick={() => setAge(a)}>{a}</Chip>)}
        </Group>
        <Group label={labels.bodyLabel}>
          {bodies.map((b) => <Chip key={b} active={body === b} onClick={() => setBody(b)}>{labels.body[b]}</Chip>)}
        </Group>
        <Group label={labels.personalityLabel}>
          {personalities.map((p) => <Chip key={p} active={personality === p} onClick={() => setPersonality(p)}>{labels.personality[p]}</Chip>)}
        </Group>
        <Group label={labels.relationshipLabel}>
          {relationships.map((r) => <Chip key={r} active={relationship === r} onClick={() => setRelationship(r)}>{labels.relationship[r]}</Chip>)}
        </Group>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-400">{labels.descLabel}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={labels.descPlaceholder}
            rows={3}
            maxLength={400}
            className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/50"
          />
        </div>
      </div>

      {/* Summary / action */}
      <div className="premium-panel h-fit rounded-2xl p-6 lg:sticky lg:top-20">
        <div className="flex items-center gap-2 text-fuchsia-200">
          <Wand2 size={18} />
          <span className="text-sm font-black uppercase tracking-wide">{labels.eyebrow}</span>
        </div>
        <p className="mt-4 text-2xl font-black text-white">{name.trim() || labels.namePlaceholder}</p>
        <p className="mt-1 text-sm text-zinc-400">
          {labels.gender[gender]} · {labels.style[style]} · {age} · {labels.personality[personality]}
        </p>
        <p className="mt-1 text-sm text-zinc-400">{labels.relationship[relationship]}</p>

        <Button onClick={create} disabled={!canCreate} className="mt-6 w-full gap-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? labels.creating : labels.cta}
        </Button>
        <p className="mt-3 text-center text-xs text-zinc-500">
          {labels.costNote.replace("{n}", String(cost))} · {initialCredits.toLocaleString()} {creditsLabel}
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-3 text-sm text-fuchsia-100">
            <p>{error}</p>
            {error === labels.outOfCredits ? <LinkButton href="/pricing" className="mt-3 w-full">{labels.cta}</LinkButton> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
