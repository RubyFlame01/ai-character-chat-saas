"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageIcon, Loader2, Sparkles } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GenerateLabels = {
  promptLabel: string;
  promptPlaceholder: string;
  style: string;
  realistic: string;
  anime: string;
  shape: string;
  portrait: string;
  square: string;
  cta: string;
  generating: string;
  costNote: string;
  emptyState: string;
  error: string;
  outOfCredits: string;
  loginRequired: string;
};

type Style = "realistic" | "anime";
type Shape = "portrait" | "square";

type GeneratedImage = { id: string; url: string; shape: Shape };

export function ImageGenerator({
  labels,
  cost,
  initialCredits,
  creditsLabel,
}: {
  labels: GenerateLabels;
  cost: number;
  initialCredits: number;
  creditsLabel: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<Style>("realistic");
  const [shape, setShape] = useState<Shape>("portrait");
  const [credits, setCredits] = useState(initialCredits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canGenerate = prompt.trim().length >= 3 && !loading && credits >= cost;

  async function pollStatus(promptId: string, currentShape: Shape) {
    const started = Date.now();
    const tick = async () => {
      // Stop after ~5 minutes to avoid an endless loop.
      if (Date.now() - started > 5 * 60 * 1000) {
        setError(labels.error);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/images/status?promptId=${encodeURIComponent(promptId)}`);
        const data = (await res.json()) as { status: string; url?: string; credits?: number };
        if (data.status === "ready" && data.url) {
          setImages((current) => [{ id: promptId, url: data.url!, shape: currentShape }, ...current]);
          setLoading(false);
          return;
        }
        if (data.status === "failed") {
          if (typeof data.credits === "number") setCredits(data.credits);
          setError(labels.error);
          setLoading(false);
          return;
        }
      } catch {
        // transient; keep polling
      }
      pollRef.current = setTimeout(tick, 3000);
    };
    pollRef.current = setTimeout(tick, 3000);
  }

  async function generate() {
    if (!canGenerate) return;
    setError(null);
    setLoading(true);
    const currentShape = shape;
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), style, shape: currentShape }),
      });
      const data = (await res.json()) as { promptId?: string; credits?: number; error?: string; code?: string };
      if (!res.ok || !data.promptId) {
        setLoading(false);
        if (res.status === 401) setError(labels.loginRequired);
        else if (data.code === "no-credits" || res.status === 402) setError(labels.outOfCredits);
        else setError(data.error ?? labels.error);
        return;
      }
      if (typeof data.credits === "number") setCredits(data.credits);
      await pollStatus(data.promptId, currentShape);
    } catch {
      setLoading(false);
      setError(labels.error);
    }
  }

  const styleOptions: Array<{ id: Style; label: string }> = [
    { id: "realistic", label: labels.realistic },
    { id: "anime", label: labels.anime },
  ];
  const shapeOptions: Array<{ id: Shape; label: string }> = [
    { id: "portrait", label: labels.portrait },
    { id: "square", label: labels.square },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Controls */}
      <div className="premium-panel h-fit rounded-2xl p-6">
        <label className="text-xs font-black uppercase tracking-wide text-zinc-400">{labels.promptLabel}</label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={labels.promptPlaceholder}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/50"
        />

        <p className="mt-5 text-xs font-black uppercase tracking-wide text-zinc-400">{labels.style}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {styleOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStyle(option.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                style === option.id
                  ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white"
                  : "border-white/10 bg-white/[.04] text-zinc-400 hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-wide text-zinc-400">{labels.shape}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {shapeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setShape(option.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                shape === option.id
                  ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white"
                  : "border-white/10 bg-white/[.04] text-zinc-400 hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button onClick={generate} disabled={!canGenerate} className="mt-6 w-full gap-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? labels.generating : labels.cta}
        </Button>
        <p className="mt-3 text-center text-xs text-zinc-500">
          {labels.costNote.replace("{n}", String(cost))} · {credits.toLocaleString()} {creditsLabel}
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-3 text-sm text-fuchsia-100">
            <p>{error}</p>
            {(error === labels.outOfCredits) ? (
              <LinkButton href="/pricing" className="mt-3 w-full">{labels.cta}</LinkButton>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Results */}
      <div>
        {loading && images.length === 0 ? (
          <div className="flex aspect-square max-w-md items-center justify-center rounded-2xl border border-white/10 bg-white/[.03]">
            <div className="text-center text-zinc-400">
              <Loader2 size={32} className="mx-auto animate-spin text-fuchsia-300" />
              <p className="mt-3 text-sm">{labels.generating}</p>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex aspect-square max-w-md items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[.02]">
            <div className="text-center text-zinc-500">
              <ImageIcon size={32} className="mx-auto" />
              <p className="mt-3 text-sm">{labels.emptyState}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {loading ? (
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-white/10 bg-white/[.03]">
                <Loader2 size={28} className="animate-spin text-fuchsia-300" />
              </div>
            ) : null}
            {images.map((image) => (
              <a
                key={image.id}
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900",
                  image.shape === "portrait" ? "aspect-[3/4]" : "aspect-square",
                )}
              >
                <Image src={image.url} alt="Generated" fill sizes="(min-width:1024px) 280px, 45vw" className="object-cover" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
