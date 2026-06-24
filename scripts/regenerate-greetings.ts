import dotenv from "dotenv";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Character } from "../src/types/domain";

dotenv.config({ path: ".env.local" });
dotenv.config();

// Regenerates every character's opening greeting in an immersive format:
//   (a 2nd-person scenario setup, in parentheses)
//   Character's first spoken lines, in their voice
//   (a short narration beat)
//   the character's private thought
//
//   npx tsx scripts/regenerate-greetings.ts          # generate (resumes)
//   npx tsx scripts/regenerate-greetings.ts --apply  # merge into catalog
//
// Saves incrementally to artifacts/greetings.json so it can resume.

const root = process.cwd();
const catalogPath = path.join(root, "public", "generated", "characters.json");
const outputPath = path.join(root, "artifacts", "greetings.json");
const model = process.env.GREETING_MODEL ?? "x-ai/grok-4.3";
const apiKey = process.env.OPENROUTER_API_KEY;

type Entry = { slug: string; en: string; tr: string };

function buildPrompt(c: Character) {
  return [
    `Write the OPENING MESSAGE for an 18+ fictional adult roleplay chat with this character. It must pull the user straight into a scene.`,
    ``,
    `Character: ${c.name}, ${c.age}, ${c.gender}, ${c.mode}.`,
    `Relationship to the user: ${c.relationship}.`,
    `Scenario: ${c.scenario}`,
    `Personality: ${c.personality}`,
    ``,
    `Required FORMAT (exactly these parts, in order):`,
    `1. A vivid scene-setup paragraph written in SECOND PERSON ("you..."), wrapped in parentheses, 2-4 sentences, placing the user inside the situation and building tension/anticipation.`,
    `2. The character's first spoken lines as: ${c.name}: "..." — in their distinct voice, flirtatious and inviting, 1-3 sentences.`,
    `3. A short narration beat in (parentheses), one sentence.`,
    `4. The character's private thought as: ${c.name}'in düşünceleri: ... (for Turkish) / ${c.name}'s thoughts: ... (for English) — one revealing inner line.`,
    ``,
    `Tone: seductive, adult, immersive, charged. Keep it fictional and adults-only. Total length ~120-200 words.`,
    `Return ONLY this JSON: {"en":"...","tr":"..."} where each is the full formatted opening in that language (use real newlines as \\n). No commentary.`,
  ].join("\n");
}

async function callModel(prompt: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(90_000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.9, max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("empty");
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(json) as { en: string; tr: string };
}

function applyGreetings(characters: Character[], entries: Entry[]) {
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  let applied = 0;
  const next = characters.map((c) => {
    const g = bySlug.get(c.slug);
    if (!g) return c;
    applied += 1;
    const loc = c.localizations ?? {};
    return {
      ...c,
      greeting: g.en,
      localizations: {
        ...loc,
        en: { ...loc.en, greeting: g.en },
        tr: { ...loc.tr, greeting: g.tr },
      },
    } as Character;
  });
  writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Applied ${applied} greetings into the catalog.`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const characters = JSON.parse(readFileSync(catalogPath, "utf-8")) as Character[];
  const entries: Entry[] = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, "utf-8")) : [];

  if (process.argv.includes("--apply")) {
    applyGreetings(characters, entries);
    return;
  }
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY missing");
    process.exit(1);
  }

  const done = new Set(entries.map((e) => e.slug));
  for (const c of characters) {
    if (done.has(c.slug)) continue;
    try {
      const { en, tr } = await callModel(buildPrompt(c));
      if (!en || !tr || en.length < 80 || tr.length < 80) throw new Error("too short");
      entries.push({ slug: c.slug, en, tr });
      writeFileSync(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
      console.log(`[${entries.length}/${characters.length}] ${c.slug}`);
    } catch (error) {
      console.error(`FAILED ${c.slug}: ${error instanceof Error ? error.message : error}`);
    }
    await sleep(400);
  }
  console.log(`Done. ${entries.length}/${characters.length}. Run with --apply to merge.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
