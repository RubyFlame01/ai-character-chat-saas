import { randomInt } from "node:crypto";
import { env } from "@/lib/config";

// Server-side ComfyUI client for the free, local image generator. Mirrors the
// workflow used by scripts/queue_external_character_prompts.py (z_image_turbo
// GGUF + Qwen3 CLIP). Generation runs on the local GPU, so there is no API cost.

export type ImageStyle = "realistic" | "anime";
export type ImageShape = "portrait" | "square";

const QUALITY_PREFIX: Record<ImageStyle, string> = {
  realistic: "masterpiece, best quality, ultra photorealistic 8k photo, highly detailed realistic skin texture, cinematic lighting, razor sharp focus,",
  anime: "masterpiece anime art, best quality, modern semi-realistic anime illustration, highly detailed, expressive eyes, soft cinematic lighting, razor sharp focus,",
};

// SFW: used for catalog portraits — covers explicit content.
const NEGATIVE_SFW =
  "minor, child, teen, underage, youthful childlike appearance, exposed genitals, visible vulva, visible labia, " +
  "exposed pubic area, pubic hair, bare exposed nipples, bare areola, pornographic sex act, penetration, cum, " +
  "violence, deformed anatomy, extra fingers, bad hands, bad face, cross-eye, low resolution, blurry, watermark, " +
  "text, logo, jpeg artifacts, duplicate body, mutated limbs";
const NEGATIVE: Record<ImageStyle, string> = {
  realistic: `${NEGATIVE_SFW}, anime, manga, cartoon, illustration, cel shading, 3d render, cgi, doll, plastic skin`,
  anime: `${NEGATIVE_SFW}, photorealistic photo, real person, live action, 3d render, cgi, doll, plastic skin, Ghibli, chibi, childish proportions, western cartoon`,
};

// NSFW: used for explicit in-chat photos — only blocks illegal/harmful content.
const NEGATIVE_NSFW: Record<ImageStyle, string> = {
  realistic: "minor, child, teen, underage, youthful childlike appearance, violence, deformed anatomy, extra fingers, bad hands, bad face, cross-eye, low resolution, blurry, watermark, text, logo, jpeg artifacts, duplicate body, mutated limbs, anime, manga, cartoon, 3d render, cgi, doll, plastic skin",
  anime: "minor, child, teen, underage, youthful childlike appearance, violence, deformed anatomy, extra fingers, bad hands, bad face, cross-eye, low resolution, blurry, watermark, text, logo, jpeg artifacts, duplicate body, mutated limbs, photorealistic photo, real person, Ghibli, chibi, childish proportions",
};

const SHAPE_DIMENSIONS: Record<ImageShape, { width: number; height: number }> = {
  portrait: { width: 720, height: 960 },
  square: { width: 832, height: 832 },
};

export function buildPositivePrompt(userPrompt: string, style: ImageStyle) {
  const cleaned = userPrompt.trim().replace(/\s+/g, " ");
  return `${QUALITY_PREFIX[style]} ${cleaned}, adult 21+, bold non-explicit adult styling, every garment opaque, front of every garment stays on, no wardrobe malfunction`;
}

type ComfyWorkflow = Record<string, { class_type: string; inputs: Record<string, unknown> }>;

function buildWorkflow(
  positive: string,
  style: ImageStyle,
  shape: ImageShape,
  filenamePrefix: string,
  nsfw = false,
): ComfyWorkflow {
  const { width, height } = SHAPE_DIMENSIONS[shape];
  const negative = nsfw ? NEGATIVE_NSFW[style] : NEGATIVE[style];
  return {
    "1": { class_type: "UnetLoaderGGUF", inputs: { unet_name: "z_image_turbo-Q5_K_M.gguf" } },
    "2": { class_type: "ModelSamplingAuraFlow", inputs: { model: ["1", 0], shift: 3.0 } },
    "3": { class_type: "CLIPLoaderGGUF", inputs: { clip_name: "Qwen3-4B-Q4_K_M.gguf", type: "qwen_image" } },
    "4": { class_type: "CLIPTextEncode", inputs: { clip: ["3", 0], text: positive } },
    "5": { class_type: "CLIPTextEncode", inputs: { clip: ["3", 0], text: negative } },
    "6": { class_type: "EmptySD3LatentImage", inputs: { width, height, batch_size: 1 } },
    "7": {
      class_type: "KSampler",
      inputs: {
        model: ["2", 0], positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0],
        seed: randomInt(1, 1_000_000_000_000), steps: 6, cfg: 1.0,
        sampler_name: "euler", scheduler: "simple", denoise: 1.0,
      },
    },
    "8": { class_type: "VAELoader", inputs: { vae_name: "ae.safetensors" } },
    "9": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["8", 0] } },
    "10": { class_type: "SaveImage", inputs: { images: ["9", 0], filename_prefix: filenamePrefix } },
  };
}

export type SubmitResult = { promptId: string };

// English body-part synonyms for common Turkish explicit terms.
const TR_TO_EN: [RegExp, string][] = [
  [/\bmemeler(in|inin|ini|i)?\b/gi, "breasts"],
  [/\bgöğüsler(in|inin|ini|i)?\b/gi, "breasts"],
  [/\bkalça(lar|larını|sını|sı)?\b/gi, "hips and buttocks"],
  [/\bpopo(su|sunu|yu|yu)?\b/gi, "buttocks"],
  [/\bgöt(ü|ünü|ü)?\b/gi, "buttocks"],
  [/\bam(ı|ını|ım)?\b/gi, "vagina"],
  [/\baçık\b/gi, "exposed"],
  [/\bçıplak\b/gi, "nude"],
  [/\bgönder\w*\b/gi, ""],
  [/\bmisin\b/gi, ""],
  [/\byakın(dan)?\b/gi, "close-up"],
];

function cleanExplicitDescription(raw: string): string {
  let s = raw;
  for (const [re, replacement] of TR_TO_EN) {
    s = s.replace(re, replacement);
  }
  // Remove stray punctuation and double spaces left after stripping
  return s.replace(/[?!,;]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function submitGeneration(params: {
  userPrompt: string;
  style: ImageStyle;
  shape: ImageShape;
  userId: string;
}): Promise<SubmitResult> {
  const positive = buildPositivePrompt(params.userPrompt, params.style);
  return submitWorkflow(buildWorkflow(positive, params.style, params.shape, `usergen/${params.userId}`));
}

// Explicit in-chat photo generation via z-image-turbo (uncensored).
// Uses NEGATIVE_NSFW so nudity is not blocked.
export async function submitChatImage(params: {
  character: { gender: string; age: number; tags: string[]; relationship: string };
  description: string;
  style: ImageStyle;
}): Promise<SubmitResult> {
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

  // Translate Turkish body terms to English before passing to CLIP
  const cleanedDesc = cleanExplicitDescription(params.description);
  const action = cleanedDesc || "seductive selfie";

  const positive = `${QUALITY_PREFIX[params.style]} ${base}, ${action}, adult 21+`;
  return submitWorkflow(buildWorkflow(positive, params.style, "portrait", "chat/explicit", true));
}

// Submit an already-composed positive prompt (used by the character builder,
// which builds its own portrait prompt from traits). `front` jumps the ComfyUI
// queue so a user's own creation doesn't wait behind a long batch.
export async function submitPortrait(params: {
  positive: string;
  style: ImageStyle;
  shape: ImageShape;
  slug: string;
  front?: boolean;
}): Promise<SubmitResult> {
  const workflow = buildWorkflow(params.positive, params.style, params.shape, `userchar/${params.slug}`);
  return submitWorkflow(workflow, params.front);
}

async function submitWorkflow(workflow: ComfyWorkflow, front = false): Promise<SubmitResult> {
  const response = await fetch(`${env.comfyuiUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(front ? { prompt: workflow, front: true } : { prompt: workflow }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`ComfyUI submit failed: ${response.status} ${(await response.text()).slice(0, 200)}`);
  }
  const data = (await response.json()) as { prompt_id?: string };
  if (!data.prompt_id) throw new Error("ComfyUI did not return a prompt_id");
  return { promptId: data.prompt_id };
}

export type GenerationStatus =
  | { status: "pending" }
  | { status: "ready"; imageBytes: Buffer; contentType: string }
  | { status: "failed"; error: string };

type HistoryEntry = {
  status?: { completed?: boolean; status_str?: string };
  outputs?: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>;
};

export async function checkGeneration(promptId: string): Promise<GenerationStatus> {
  const response = await fetch(`${env.comfyuiUrl}/history/${promptId}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return { status: "pending" };

  const history = (await response.json()) as Record<string, HistoryEntry>;
  const entry = history[promptId];
  if (!entry) return { status: "pending" };

  if (entry.status?.status_str === "error") {
    return { status: "failed", error: "ComfyUI reported a generation error" };
  }

  const image = entry.outputs
    ? Object.values(entry.outputs).flatMap((output) => output.images ?? [])[0]
    : undefined;
  if (!entry.status?.completed || !image) return { status: "pending" };

  const params = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder, type: image.type });
  const view = await fetch(`${env.comfyuiUrl}/view?${params.toString()}`, { signal: AbortSignal.timeout(20000) });
  if (!view.ok) return { status: "pending" };

  const imageBytes = Buffer.from(await view.arrayBuffer());
  return { status: "ready", imageBytes, contentType: view.headers.get("content-type") ?? "image/png" };
}
