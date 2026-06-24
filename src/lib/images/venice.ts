// Venice AI image generation — uncensored cloud API ($0.01/image)
// Model: lustify-v8 (trait: most_uncensored) for explicit chat photos
// Docs: https://docs.venice.ai/api-reference/endpoint/image/generate

import { env } from "@/lib/config";

export type ImageStyle = "realistic" | "anime";

// lustify-v8 is flagged "most_uncensored" on Venice's model list.
// It handles both realistic and anime-leaning styles well enough for chat photos.
const MODEL = "lustify-v8";

const QUALITY_PREFIX: Record<ImageStyle, string> = {
  realistic:
    "masterpiece, best quality, ultra photorealistic 8k photo, highly detailed realistic skin texture, cinematic lighting, razor sharp focus,",
  anime:
    "masterpiece anime art, best quality, semi-realistic anime illustration, highly detailed, expressive eyes, soft cinematic lighting, razor sharp focus,",
};

const NEGATIVE =
  "minor, child, teen, underage, youthful childlike appearance, violence, deformed anatomy, " +
  "extra fingers, bad hands, bad face, cross-eye, low resolution, blurry, watermark, text, logo, " +
  "jpeg artifacts, duplicate body, mutated limbs";

// Turkish body-part terms → English before passing to CLIP
const TR_TO_EN: [RegExp, string][] = [
  [/\bmemeler(in|inin|ini|i)?\b/gi, "breasts"],
  [/\bgöğüsler(in|inin|ini|i)?\b/gi, "breasts"],
  [/\bkalça(lar|larını|sını|sı)?\b/gi, "hips and buttocks"],
  [/\bpopo(su|sunu|yu)?\b/gi, "buttocks"],
  [/\bgöt(ü|ünü)?\b/gi, "buttocks"],
  [/\bam(ı|ını|ım)?\b/gi, "vagina"],
  [/\baçık\b/gi, "exposed"],
  [/\bçıplak\b/gi, "nude"],
  [/\bgönder\w*\b/gi, ""],
  [/\bmisin\b/gi, ""],
  [/\byakın(dan)?\b/gi, "close-up"],
];

function cleanDescription(raw: string): string {
  let s = raw;
  for (const [re, replacement] of TR_TO_EN) {
    s = s.replace(re, replacement);
  }
  return s
    .replace(/[?!,;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type GenerationResult =
  | { ok: true; imageDataUrl: string }
  | { ok: false; error: string };

type VeniceResponse = {
  images?: Array<{ b64_json?: string; url?: string } | string>;
  data?: Array<{ b64_json?: string; url?: string }>;
  request_id?: string;
};

export async function generateChatImage(params: {
  character: { gender: string; age: number; tags: string[]; relationship: string };
  description: string;
  style: ImageStyle;
  isExplicitContext?: boolean;
}): Promise<GenerationResult> {
  const nonVisualTerms = new Set([
    "playful","dominant","shy","romantic","mysterious","bratty","caring",
    "confident","submissive","sadistic","nurturing","flirty","sweet","dark",
    "cheerful","adventurous","bold","seductive","alluring","passionate","lust",
  ]);

  const visualTags = params.character.tags
    .filter((t) => !nonVisualTerms.has(t.toLowerCase()))
    .slice(0, 5)
    .join(", ");

  const genderLabel = params.character.gender === "female" ? "woman" : "man";
  const base = [`${genderLabel} ${params.character.age}+`, visualTags, params.character.relationship]
    .filter(Boolean)
    .join(", ");

  const cleanedDesc = cleanDescription(params.description);
  const isExplicit = params.isExplicitContext ?? false;
  const defaultAction = isExplicit
    ? "seductive selfie, intimate boudoir pose, revealing lingerie"
    : "seductive selfie, alluring pose, stylish outfit, tasteful glamour";
  const action = cleanedDesc || defaultAction;

  const prompt = `${QUALITY_PREFIX[params.style]} ${base}, ${action}, adult 21+`;

  try {
    const res = await fetch("https://api.venice.ai/api/v1/image/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.veniceApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        negative_prompt: NEGATIVE,
        aspect_ratio: "3:4",
        safe_mode: false,
        format: "jpeg",
        return_binary: false,
        hide_watermark: true,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Venice ${res.status}: ${text.slice(0, 200)}` };
    }

    const json = (await res.json()) as VeniceResponse;

    // Venice native format: { images: [{ b64_json }] } or { images: ["base64string"] }
    // OpenAI-compat fallback:  { data: [{ b64_json }] }
    const raw = json.images?.[0] ?? json.data?.[0];

    if (typeof raw === "string") {
      return { ok: true, imageDataUrl: `data:image/jpeg;base64,${raw}` };
    }
    if (raw?.b64_json) {
      return { ok: true, imageDataUrl: `data:image/jpeg;base64,${raw.b64_json}` };
    }
    if (raw?.url) {
      const imgRes = await fetch(raw.url, { signal: AbortSignal.timeout(30_000) });
      if (!imgRes.ok) return { ok: false, error: "Failed to download image from Venice" };
      const bytes = Buffer.from(await imgRes.arrayBuffer());
      const ct = imgRes.headers.get("content-type") ?? "image/jpeg";
      return { ok: true, imageDataUrl: `data:${ct};base64,${bytes.toString("base64")}` };
    }

    return { ok: false, error: "No image in Venice response" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
