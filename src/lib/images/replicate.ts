import { readFile } from "node:fs/promises";
import path from "node:path";
import Replicate from "replicate";
import { env } from "@/lib/config";

// Cloud image generation via Replicate (stability-ai/sdxl).
// disable_safety_checker is available through the API only (not the web UI),
// which is exactly what we use here.
// Interface is intentionally identical to comfy.ts so callers need no changes.

const SDXL_VERSION = "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc";

export type ImageStyle = "realistic" | "anime";
export type ImageShape = "portrait" | "square";

const QUALITY_PREFIX: Record<ImageStyle, string> = {
  realistic:
    "masterpiece, best quality, ultra photorealistic 8k photo, highly detailed realistic skin texture, cinematic lighting, razor sharp focus,",
  anime:
    "masterpiece anime art, best quality, modern semi-realistic anime illustration, highly detailed, expressive eyes, soft cinematic lighting, razor sharp focus,",
};

const NEGATIVE_BASE =
  "minor, child, teen, underage, youthful childlike appearance, exposed genitals, visible vulva, visible labia, " +
  "exposed pubic area, pubic hair, pornographic sex act, penetration, cum, " +
  "violence, deformed anatomy, extra fingers, bad hands, bad face, cross-eye, low resolution, blurry, watermark, " +
  "text, logo, jpeg artifacts, duplicate body, mutated limbs";

const NEGATIVE: Record<ImageStyle, string> = {
  realistic: `${NEGATIVE_BASE}, anime, manga, cartoon, illustration, cel shading, 3d render, cgi, doll, plastic skin`,
  anime: `${NEGATIVE_BASE}, photorealistic photo, real person, live action, 3d render, cgi, doll, plastic skin, Ghibli, chibi, childish proportions, western cartoon`,
};

const SHAPE_DIMENSIONS: Record<ImageShape, { width: number; height: number }> = {
  portrait: { width: 768, height: 1024 },
  square: { width: 1024, height: 1024 },
};

export function buildPositivePrompt(userPrompt: string, style: ImageStyle) {
  const cleaned = userPrompt.trim().replace(/\s+/g, " ");
  return `${QUALITY_PREFIX[style]} ${cleaned}, adult 21+, bold adult styling`;
}

function client() {
  return new Replicate({ auth: env.replicateApiKey! });
}

// Read a character's image from the public folder and return a base64 data-URL
// suitable for Replicate's img2img `image` field.
async function readCharacterImageDataUrl(publicImagePath: string): Promise<string | null> {
  try {
    const fullPath = path.join(process.cwd(), "public", publicImagePath.replace(/^\//, ""));
    const buf = await readFile(fullPath);
    const mime = fullPath.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function submitToReplicate(
  positive: string,
  style: ImageStyle,
  shape: ImageShape,
  imgRef?: { dataUrl: string; strength: number },
  negativeExtra?: string,
): Promise<SubmitResult> {
  const { width, height } = SHAPE_DIMENSIONS[shape];
  const negative = negativeExtra ? `${NEGATIVE[style]}, ${negativeExtra}` : NEGATIVE[style];
  const prediction = await client().predictions.create({
    version: SDXL_VERSION,
    input: {
      prompt: positive,
      negative_prompt: negative,
      width,
      height,
      num_outputs: 1,
      num_inference_steps: 35,
      guidance_scale: 9,
      apply_watermark: false,
      disable_safety_checker: true,
      refine: "expert_ensemble_refiner",
      ...(imgRef
        ? { image: imgRef.dataUrl, prompt_strength: imgRef.strength }
        : {}),
    },
  });
  return { promptId: prediction.id };
}

export type SubmitResult = { promptId: string };

export async function submitGeneration(params: {
  userPrompt: string;
  style: ImageStyle;
  shape: ImageShape;
  userId: string;
}): Promise<SubmitResult> {
  const positive = buildPositivePrompt(params.userPrompt, params.style);
  return submitToReplicate(positive, params.style, params.shape);
}

export async function submitPortrait(params: {
  positive: string;
  style: ImageStyle;
  shape: ImageShape;
  slug: string;
  front?: boolean;
}): Promise<SubmitResult> {
  return submitToReplicate(params.positive, params.style, params.shape);
}

export type GenerationStatus =
  | { status: "pending" }
  | { status: "ready"; imageBytes: Buffer; contentType: string; rawUrl: string }
  | { status: "failed"; error: string };

// Build a prompt for an in-chat photo that matches the character's look as closely
// as possible without LoRA — uses their visual tags and relationship as anchors.
const EXPLICIT_RE = /(nude|naked|topless|nipple|explicit|çıplak|meme|göğüs|bare\s*breast|açık\s*poz|poz\s*açık)/i;

export function buildChatImagePrompt(
  character: { gender: string; age: number; tags: string[]; relationship: string },
  userDescription: string,
  style: ImageStyle,
): { prompt: string; isExplicit: boolean } {
  const nonVisualTerms = new Set([
    "playful","dominant","shy","romantic","mysterious","bratty","caring",
    "confident","submissive","sadistic","nurturing","flirty","sweet","dark",
    "cheerful","adventurous","bold","seductive","alluring","passionate","lust",
  ]);
  const visualTags = character.tags
    .filter((t) => !nonVisualTerms.has(t.toLowerCase()))
    .slice(0, 5)
    .join(", ");

  const genderLabel = character.gender === "female" ? "woman" : "man";
  const base = [`${genderLabel} ${character.age}+`, visualTags, character.relationship]
    .filter(Boolean)
    .join(", ");

  const action = userDescription.trim() || "seductive selfie, intimate boudoir pose";
  const isExplicit = EXPLICIT_RE.test(userDescription);

  const explicitBoost = isExplicit
    ? ", completely topless, bare breasts fully exposed, nipples visible, no top, no bra, no clothing on chest"
    : "";

  return { prompt: buildPositivePrompt(`${base}, ${action}${explicitBoost}`, style), isExplicit };
}

const CLOTHING_NEGATIVE = "clothed, dressed, wearing clothes, bra, shirt, top, blouse, lingerie, bikini, swimsuit, bodysuit, covered chest, fabric on chest";

export async function submitChatImage(params: {
  character: { gender: string; age: number; tags: string[]; relationship: string };
  description: string;
  style: ImageStyle;
  characterImagePath?: string;
}): Promise<SubmitResult> {
  const { prompt, isExplicit } = buildChatImagePrompt(params.character, params.description, params.style);

  // Explicit requests: pure txt2img — img2img with a clothed catalog photo actively
  // prevents nudity even at high prompt_strength (model learns the outfit from the ref).
  // Regular poses: img2img with 0.65 strength for character likeness.
  let imgRef: { dataUrl: string; strength: number } | undefined;
  if (!isExplicit && params.characterImagePath) {
    const dataUrl = await readCharacterImageDataUrl(params.characterImagePath);
    if (dataUrl) imgRef = { dataUrl, strength: 0.65 };
  }

  const negativeExtra = isExplicit ? CLOTHING_NEGATIVE : undefined;
  return submitToReplicate(prompt, params.style, "portrait", imgRef, negativeExtra);
}

export async function checkGeneration(promptId: string): Promise<GenerationStatus> {
  try {
    const prediction = await client().predictions.get(promptId);

    if (prediction.status === "succeeded") {
      const outputs = prediction.output as string[] | null;
      const imageUrl = outputs?.[0];
      if (!imageUrl) return { status: "failed", error: "No output from model" };

      // Download so callers (status/portrait routes) can save bytes to disk.
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) return { status: "pending" };
      const imageBytes = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? "image/png";
      return { status: "ready", imageBytes, contentType, rawUrl: imageUrl };
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      return { status: "failed", error: String(prediction.error ?? "Generation failed") };
    }

    return { status: "pending" };
  } catch {
    return { status: "pending" };
  }
}

const FACE_SWAPPER_VERSION = "8b13ba2a79d97de3f36b5e79fa71347716102e5c3412e35b8830689dd68fe1b1";

// Swap the character's face onto an already-generated explicit body image.
// Uses naimish-gami/face-swapper on Replicate.
// Returns base64 data URL of the face-swapped image, or null on failure.
export async function swapFace(params: {
  generatedImageUrl: string;  // raw Replicate output URL of the body image
  characterImagePath: string; // path relative to /public
}): Promise<string | null> {
  try {
    const faceDataUrl = await readCharacterImageDataUrl(params.characterImagePath);
    if (!faceDataUrl) return null;

    const prediction = await client().predictions.create({
      version: FACE_SWAPPER_VERSION,
      input: {
        input_image: params.generatedImageUrl,
        swap_image: faceDataUrl,
        enhance: true,
      },
    });

    // Poll up to 60 s (15 × 4 s) for the result
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const result = await client().predictions.get(prediction.id);
      if (result.status === "succeeded") {
        const outputUrl = (result.output as string | string[] | null);
        const url = Array.isArray(outputUrl) ? outputUrl[0] : outputUrl;
        if (!url) return null;
        const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) return null;
        const bytes = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        return `data:${ct};base64,${bytes.toString("base64")}`;
      }
      if (result.status === "failed" || result.status === "canceled") return null;
    }
    return null;
  } catch {
    return null;
  }
}
