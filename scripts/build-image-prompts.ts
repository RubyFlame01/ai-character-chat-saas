import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Character, CharacterCategory } from "../src/types/domain";

// Composes varied ComfyUI prompts for every character in the catalog.
//
//   npx tsx scripts/build-image-prompts.ts                 # 1 prompt per character
//   npx tsx scripts/build-image-prompts.ts --variants 3    # 3 different shots each
//
// Identity (face, hair, body) is extracted from the existing prompt sources so
// faces stay consistent with the current catalog. Everything else — framing,
// camera style, outfit, setting, pose, lighting — is picked deterministically
// per character from independent pools, so the grid stops looking uniform.
// Output: datasets/comfy_prompts/character_prompts_v2.txt (same ## header
// format that scripts/queue_external_character_prompts.py already consumes).

const root = process.cwd();
const catalogPath = path.join(root, "public", "generated", "characters.json");
const rewritePath = path.join(root, "datasets", "comfy_prompts", "character_prompts_for_external_rewrite.txt");
const missingPromptsPath = path.join(root, "datasets", "comfy_prompts", "missing_image_prompts.json");
const importedRoot = path.join(root, "datasets", "comfy_prompts", "imported_sources");
const outputPath = path.join(root, "datasets", "comfy_prompts", "character_prompts_v2.txt");

const variants = Number(process.argv[process.argv.indexOf("--variants") + 1] || 1) || 1;

// --- Deterministic hashing (same scheme as the voice profiles) ---------------

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mixedHash(seed: string) {
  let hash = hashText(seed);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2246822519);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489917);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function pick<T>(options: readonly T[], seed: string): T {
  return options[mixedHash(seed) % options.length];
}

// --- Axis pools ---------------------------------------------------------------

// Close-range shots work as avatars; wide shots show the scene. When variants
// are generated, v1 draws from closeShots (avatar), v2 from wideShots (profile
// hero), and later variants from the full pool (gallery).
const closeShots = [
  "candid arm-extended phone selfie, slightly high angle, face and upper body filling the frame",
  "relaxed waist-up shot, subject slightly off-center",
  "close crop from shoulders up, one hand touching face or hair",
  "lying down propped up on elbows, camera at low angle, face and chest in frame",
  "tight portrait leaning toward the camera on both elbows",
];

const wideShots = [
  "mirror selfie with phone visible, full figure reflected",
  "full body shot from a few meters away, environment visible around her",
  "shot from behind, looking back over one shoulder at the camera, full figure",
  "candid mid-stride walking shot, motion in hair and clothes",
  "leaning in a doorway, three-quarter body, frame within frame",
  "perched on a counter or ledge, one knee raised, low camera angle",
  "sitting on the floor with legs tucked to one side, shot from eye level",
  "caught mid-turn looking away then glancing back, three-quarter body",
];

const shots = [...closeShots, ...wideShots];

const camerasRealistic = [
  "amateur smartphone photo with direct flash, authentic casual feel",
  "candid 35mm film photo, soft grain, natural colors",
  "crisp editorial studio photograph, controlled light",
  "natural golden-hour photo, warm sun flare",
  "soft window-light photo, gentle shadows",
  "vintage polaroid-style photo, slightly faded warm tones",
  "sharp DSLR photo with creamy bokeh background",
];

const camerasAnime = [
  "clean modern anime illustration with crisp lineart and soft cel shading",
  "vivid anime illustration with glossy highlights and saturated colors",
  "soft painterly anime illustration with gentle gradients",
  "dynamic anime illustration with dramatic perspective and motion lines",
  "moody cinematic anime illustration with atmospheric color grading",
];

type SpiceTier = "casual" | "sporty" | "glam" | "spicy";

// `where` restricts an outfit to settings it makes sense in (matched against
// the setting text). Outfits without `where` can appear anywhere.
// `{color}` in the text is replaced with a deterministic saturated color —
// uncolored garments default to beige/nude tones, which the model then renders
// as bare skin. Never use skin-adjacent colors here.
type Outfit = { text: string; where?: RegExp };

// Mostly saturated colors; a couple of skin-adjacent tones stay in the pool on
// purpose (the look is fine occasionally — it just shouldn't dominate).
const outfitColors = [
  "black",
  "scarlet red",
  "emerald green",
  "deep navy",
  "burgundy",
  "royal purple",
  "hot pink",
  "teal",
  "cobalt blue",
  "forest green",
  "crimson",
  "charcoal gray",
  "soft nude beige",
  "champagne",
];

const PRIVATE_PLACES = /bedroom|hotel suite|balcony|passenger seat/;
const WATER_PLACES = /beach|poolside/;
const GYM_PLACES = /gym/;

const femaleOutfits: Record<SpiceTier, Outfit[]> = {
  casual: [
    { text: "an oversized {color} knit sweater slipping off one bare shoulder, deep neckline showing generous cleavage" },
    { text: "a breezy {color} summer sundress with thin straps and a low neckline, fabric clinging to her bust and hips" },
    { text: "a tiny {color} cropped tank top straining over her full bust, low-rise denim shorts baring her waist and hips" },
    { text: "an oversized {color} band t-shirt worn as a dress with bare legs, neckline pulled to one side showing cleavage", where: PRIVATE_PLACES },
    { text: "a thin {color} camisole with a plunging front, visible cleavage, tiny cotton shorts, just-woke-up energy", where: PRIVATE_PLACES },
    { text: "high-waisted jeans and a {color} button-up shirt tied under her bust, deep open neckline and bare midriff" },
  ],
  sporty: [
    { text: "a low-cut {color} sports bra emphasizing her full bust and skin-tight black high-waisted leggings hugging every curve" },
    { text: "a tiny {color} string bikini with high-cut bottoms, deep cleavage and bare waist on display", where: WATER_PLACES },
    { text: "a wet {color} one-piece swimsuit with opaque lining clinging to her bust and hips after a swim", where: WATER_PLACES },
    { text: "a tight {color} sports crop top straining over her chest and tiny running shorts, faint sheen of effort on her skin" },
    { text: "a short {color} towel wrapped after a workout, deep cleavage and bare shoulders and legs", where: GYM_PLACES },
    { text: "a second-skin {color} yoga set, sculpted silhouette with bust and hip curves sharply readable" },
  ],
  glam: [
    { text: "a {color} satin slip dress with a plunging neckline and thigh-high slit, deep cleavage framed" },
    { text: "a structured {color} corset top pushing up her bust with a mini skirt and long bare legs" },
    { text: "a tailored {color} blazer worn with nothing underneath, deep V of bare skin and inner cleavage" },
    { text: "a backless {color} evening gown with a plunging front, jewelry resting on her cleavage" },
    { text: "a deeply plunging {color} cocktail dress with strappy heels, neckline cut to the waist" },
    { text: "a sheer-sleeved low-cut {color} bodysuit with high-waisted trousers, bust line sharply defined" },
  ],
  spicy: [
    { text: "an opaque {color} lace lingerie set with fully lined cups under an open silk robe, generous cleavage and bare waist", where: PRIVATE_PLACES },
    { text: "an unbuttoned oversized white shirt worn over an opaque {color} lace bra with lined cups and shorts, deep cleavage, bare legs", where: PRIVATE_PLACES },
    { text: "a {color} satin babydoll with lace trim and fully lined plunging cups framing her full bust", where: PRIVATE_PLACES },
    { text: "a high-cut opaque {color} bodysuit with a deep plunging neckline, generous secure cleavage and bare hips" },
    { text: "a {color} silk robe worn open over a fitted opaque {color} slip, deep neckline and bare shoulders", where: PRIVATE_PLACES },
    { text: "an opaque {color} push-up bralette and matching high-waist briefs with black thigh-high stockings, full cleavage and curves on display", where: PRIVATE_PLACES },
  ],
};

const maleOutfits: Record<SpiceTier, Outfit[]> = {
  casual: [
    { text: "a fitted henley with sleeves pushed up, worn jeans" },
    { text: "an open flannel over a snug white tee" },
    { text: "a soft hoodie, relaxed and unguarded" },
  ],
  sporty: [
    { text: "a sleeveless training top showing defined arms" },
    { text: "swim shorts with a towel over one shoulder, water droplets on skin", where: WATER_PLACES },
    { text: "a post-workout look, fitted tank clinging slightly", where: GYM_PLACES },
  ],
  glam: [
    { text: "an unbuttoned dress shirt with rolled sleeves and an undone tie" },
    { text: "a tailored suit, jacket hooked over one shoulder, top buttons open" },
    { text: "a black turtleneck and sharp trousers, watch catching the light" },
  ],
  spicy: [
    { text: "an open robe over low-slung lounge pants, bare chest", where: PRIVATE_PLACES },
    { text: "a dress shirt fully open", where: PRIVATE_PLACES },
    { text: "a towel low around his waist, fresh from the shower", where: PRIVATE_PLACES },
  ],
};

// Each setting carries its own plausible lighting options, so a sunny beach
// never gets neon and a candlelit lounge never gets harsh daylight.
type Setting = { place: string; lighting: string[] };

const baseSettings: Setting[] = [
  { place: "on a sunlit beach with turquoise water behind", lighting: ["bright midday sun with sparkling highlights", "warm golden-hour glow", "soft overcast seaside light"] },
  { place: "at a poolside lounger", lighting: ["bright sun with rippling water reflections", "warm late-afternoon glow", "twilight with underwater pool lights"] },
  { place: "in a bedroom with curtains half-drawn", lighting: ["soft morning window light", "warm bedside-lamp glow", "moody low-key light from a single source"] },
  { place: "in a cozy kitchen, coffee steam in the air", lighting: ["soft morning window light", "warm overhead glow", "bright cheerful daylight"] },
  { place: "on a neon-lit city street at night", lighting: ["pink and blue neon mixing on skin", "harsh direct flash against the night", "wet asphalt reflecting colored signs"] },
  { place: "at a rooftop bar at dusk", lighting: ["warm golden-hour glow", "moody dusk blue with warm string lights", "city-light bokeh behind"] },
  { place: "in front of a gym mirror between sets", lighting: ["clean bright fluorescent light", "harsh direct flash", "cool daylight from high windows"] },
  { place: "at a garden party with string lights", lighting: ["warm string-light glow", "dappled late sun through leaves", "soft dusk with lanterns"] },
  { place: "between tall shelves in a quiet library", lighting: ["soft warm reading-lamp pools", "dusty sunbeams through high windows", "moody low-key light"] },
  { place: "in an empty office long after hours", lighting: ["cool monitor glow in the dark", "city lights through the window wall", "single desk-lamp warmth"] },
  { place: "in the passenger seat of a parked car at night", lighting: ["passing streetlight stripes", "warm dashboard glow", "neon sign spill through the windshield"] },
  { place: "on a balcony while rain streaks the glass behind", lighting: ["cool overcast light", "warm indoor glow from behind", "city neon diffused by rain"] },
  { place: "by a café window with afternoon light", lighting: ["soft warm afternoon light", "gentle overcast daylight", "low sun casting long shadows"] },
  { place: "in a hotel suite with city lights below", lighting: ["moody low-key lamplight", "city-light glow through floor windows", "warm champagne-toned ambient light"] },
];

const settingsByCategory: Partial<Record<CharacterCategory, Setting[]>> = {
  fantasy: [
    { place: "in a candlelit gothic lounge with velvet drapes", lighting: ["flickering candlelight warmth", "amber firelight with deep shadows"] },
    { place: "in a moonlit greenhouse, rain on the glass", lighting: ["cold moonlight through fogged glass", "soft blue night light with warm lantern accents"] },
    { place: "in a vintage train cabin at night", lighting: ["warm brass cabin lamps", "passing lights flickering through the window"] },
    { place: "at a masquerade hall, mask lowered", lighting: ["chandelier glow with golden bokeh", "dramatic spotlight with soft falloff"] },
  ],
  mystery: [
    { place: "on a foggy pier under a single lamp", lighting: ["one hard lamp halo in the fog", "cold blue mist with warm lamplight"] },
    { place: "in a dim jazz bar", lighting: ["smoky spotlight from above", "deep red ambient glow"] },
    { place: "in a rain-soaked alley", lighting: ["neon signs reflecting off wet brick", "harsh flash against the dark"] },
    { place: "in a records archive between filing stacks", lighting: ["bare bulb pools of light", "cool flickering fluorescents"] },
  ],
  anime: [
    { place: "in a private karaoke room", lighting: ["colorful screen glow on her face", "shifting disco colors"] },
    { place: "in a neon arcade between machines", lighting: ["magenta and cyan cabinet glow", "flickering CRT light"] },
    { place: "at a summer night festival", lighting: ["warm paper-lantern glow", "fireworks light blooming in the sky"] },
    { place: "outside a convenience store at midnight", lighting: ["flat fluorescent spill onto the street", "cool night with warm store light behind"] },
    { place: "on shrine steps at dusk with falling petals", lighting: ["soft violet dusk", "last warm sunrays between the trees"] },
  ],
};

// Facial expression / micro-action only — body position belongs to the shot.
const expressions = [
  "laughing candidly at something off-camera",
  "a soft shy glance with a faint blush",
  "a smug knowing smirk straight into the camera",
  "playfully blowing a kiss",
  "eyes locked on the camera while adjusting a strap",
  "biting her lip with a teasing look",
  "a warm open smile mid-conversation",
  "a raised-eyebrow playful challenge",
  "caught mid-laugh tucking hair behind one ear",
  "a calm, quietly confident gaze",
];

// Spice tier distribution across the catalog: 15% casual, 30% sporty, 30% glam, 25% spicy.
function spiceTier(seed: string): SpiceTier {
  const roll = mixedHash(seed) % 20;
  if (roll < 3) return "casual";
  if (roll < 9) return "sporty";
  if (roll < 15) return "glam";
  return "spicy";
}

const coverageByTier: Record<SpiceTier, string> = {
  casual: "playful girl-next-door allure with visible cleavage and figure-hugging fit",
  sporty: "athletic confident energy, deep sporty cleavage, toned curves sharply readable",
  glam: "seductive evening allure, generous cleavage, waist and hip silhouette emphasized",
  spicy: "daring boudoir energy, maximum tasteful cleavage, bare shoulders and legs, curves dominating the frame",
};

// Male coverage: NO cleavage/curves/breast wording (that makes the model draw
// female anatomy on men).
const maleCoverageByTier: Record<SpiceTier, string> = {
  casual: "relaxed masculine charm, fit physique, confident posture",
  sporty: "athletic masculine energy, muscular toned body, broad shoulders",
  glam: "sharp masculine allure, strong jaw, fitted stylish outfit",
  spicy: "rugged masculine confidence, muscular chest and abs, bold presence",
};

// Sexy but COVERED — mirrors the original working prompts. The breasts/nipples
// stay fully covered by opaque fabric; the hard nudity blocks live in the
// negative prompt inside queue_external_character_prompts.py.
const SAFETY_FEMALE =
  "bold non-explicit adult promo portrait, sexy outfit with clearly visible cleavage, bare shoulders and a readable waist and hip silhouette, every garment opaque and fully covering the breasts and chest, nipples and areola fully covered by fabric, no visible nipples, no exposed breasts, no nudity, no visible genitals, strictly adult 21+, tasteful glamour, contemporary real-life styling";

const SAFETY_MALE =
  "bold non-explicit adult male promo portrait, fully male masculine physique, flat muscular male chest, NO breasts, NO cleavage, NO female body, handsome man, no nudity, no visible genitals, strictly adult 21+, tasteful styling, contemporary real-life look";

// --- Identity extraction ------------------------------------------------------

type PromptRecord = { slug: string; prompt: string };

function parseRewriteFile(): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(rewritePath)) return map;
  const lines = readFileSync(rewritePath, "utf-8").split("\n");
  let slug: string | null = null;
  for (const line of lines) {
    const header = line.match(/^##\s+([a-z0-9-]+)\s+\|/);
    if (header) {
      slug = header[1];
      continue;
    }
    if (slug && line.trim().length > 100) {
      map.set(slug, line.trim());
      slug = null;
    }
  }
  return map;
}

function parseMissingPrompts(): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(missingPromptsPath)) return map;
  const entries = JSON.parse(readFileSync(missingPromptsPath, "utf-8")) as Array<{ slug: string; prompt: string }>;
  for (const entry of entries) {
    if (entry.slug && entry.prompt) map.set(entry.slug, entry.prompt);
  }
  return map;
}

function promptFromPng(character: Character): string | null {
  const file = path.join(importedRoot, character.mode, `${character.slug}_00001_.png`);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file).toString("latin1");
  const match = raw.match(/"text": "([^"]{200,}?)"/);
  return match ? match[1] : null;
}

function extractIdentity(prompt: string): string | null {
  // Identity starts at the age token and ends before the scene sentence ("She/He ...").
  const ageMatch = prompt.match(/\b\d+[-\s]?year[-\s]?old/);
  if (!ageMatch || ageMatch.index === undefined) return null;
  const fromAge = prompt.slice(ageMatch.index);
  const sceneSplit = fromAge.search(/\.\s+(?:She|He)\s/);
  if (sceneSplit === -1) {
    // Single-sentence prompts (imported externals): collect comma segments of
    // pure face/hair/skin description and stop at the first wardrobe/pose cue.
    const wardrobeCue =
      /\b(wearing|dressed|posed|posing|standing|sitting|lying|leaning|kneeling|held by|covered|barely|bikini|lingerie|bra|dress|gown|top|shirt|blouse|skirt|robe|towel|thong|panties|swimsuit|corset|stockings)\b/i;
    const segments = fromAge.split(/,\s*/);
    const kept: string[] = [];
    for (const segment of segments) {
      if (kept.length >= 2 && wardrobeCue.test(segment)) break;
      kept.push(segment);
      if (kept.length >= 8) break;
    }
    if (kept.length < 3) return null;
    return `${kept.join(", ").trim().replace(/[.,\s]+$/, "")}.`;
  }
  return fromAge.slice(0, sceneSplit + 1).trim();
}

function fallbackIdentity(character: Character) {
  const noun = character.gender === "male" ? "man" : "woman";
  const style = character.mode === "anime" ? "adult semi-realistic anime" : "photorealistic adult";
  return `${character.age} year old ${style} ${noun}, distinct attractive face, consistent unique appearance for ${character.name}.`;
}

// --- Composition ----------------------------------------------------------------

function composePrompt(character: Character, identity: string, variant: number) {
  const seed = `${character.slug}:v${variant}`;
  const isAnime = character.mode === "anime";
  const tier = spiceTier(`${character.slug}:tier`);
  const outfitPool = (character.gender === "male" ? maleOutfits : femaleOutfits)[tier];
  const settingPool = [...baseSettings, ...(settingsByCategory[character.category] ?? [])];

  const header = isAnime
    ? "masterpiece anime art, best quality"
    : "masterpiece, best quality";
  const camera = pick(isAnime ? camerasAnime : camerasRealistic, `${seed}:camera`);
  const shotPool = variants > 1 && variant === 0 ? closeShots : variants > 1 && variant === 1 ? wideShots : shots;
  const shot = pick(shotPool, `${seed}:shot`);
  const outfitPick = pick(outfitPool, `${seed}:outfit`);
  const color = pick(outfitColors, `${seed}:color`);
  const outfit = { ...outfitPick, text: outfitPick.text.replaceAll("{color}", color) };
  const compatibleSettings = outfit.where
    ? settingPool.filter((candidate) => outfit.where!.test(candidate.place))
    : settingPool;
  const setting = pick(compatibleSettings.length > 0 ? compatibleSettings : settingPool, `${seed}:setting`);
  const expression = pick(expressions, `${seed}:expression`);
  const light = pick(setting.lighting, `${seed}:light`);
  const detailTail = isAnime
    ? "highly detailed semi-realistic adult anime style, expressive eyes, razor sharp focus"
    : "highly detailed realistic skin texture, razor sharp focus";

  const isMale = character.gender === "male";
  const subject = isMale ? "He" : "She";
  const coverage = isMale ? maleCoverageByTier[tier] : coverageByTier[tier];
  const safety = isMale ? SAFETY_MALE : SAFETY_FEMALE;

  return {
    prompt: [
      `${header}, ${camera}, ${identity}`,
      `${subject} is ${setting.place}, wearing ${outfit.text}. Framing: ${shot}. Expression: ${expression}. Lighting: ${light}.`,
      `${coverage}, ${safety}, ${detailTail}.`,
    ].join(" "),
    axes: { tier, camera, shot, outfit: outfit.text, setting: setting.place, expression, light },
  };
}

// --- Main -----------------------------------------------------------------------

function main() {
  const characters = JSON.parse(readFileSync(catalogPath, "utf-8")) as Character[];
  const rewriteMap = parseRewriteFile();
  const missingMap = parseMissingPrompts();

  const records: PromptRecord[] = [];
  const axisLog: Record<string, unknown>[] = [];
  const comboSet = new Set<string>();
  let fromRewrite = 0;
  let fromPng = 0;
  let synthesized = 0;

  const headerLines = [
    "# LustTalk AI - Generated varied character prompts (v2)",
    "#",
    `# Built by scripts/build-image-prompts.ts — ${variants} variant(s) per character.`,
    "# Identity is preserved from existing sources; shot, outfit, setting, pose and",
    "# lighting vary per character. Queue with scripts/queue_external_character_prompts.py.",
    "",
  ];

  for (const character of characters) {
    let identitySource = rewriteMap.get(character.slug) ?? missingMap.get(character.slug) ?? null;
    if (identitySource) fromRewrite += 1;
    if (!identitySource) {
      identitySource = promptFromPng(character);
      if (identitySource) fromPng += 1;
    }
    let identity = identitySource ? extractIdentity(identitySource) : null;
    if (!identity) {
      identity = fallbackIdentity(character);
      synthesized += 1;
    }

    for (let variant = 0; variant < variants; variant += 1) {
      const { prompt, axes } = composePrompt(character, identity, variant);
      const slugSuffix = variants > 1 ? `${character.slug}--v${variant + 1}` : character.slug;
      records.push({ slug: slugSuffix, prompt });
      comboSet.add(Object.values(axes).join("|"));
      axisLog.push({ slug: slugSuffix, ...axes });
      headerLines.push(
        `## ${slugSuffix} | ${character.name} | ${character.mode} | ${character.gender} | ${character.category}`,
        prompt,
        "",
      );
    }
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, headerLines.join("\n"));
  mkdirSync(path.join(root, "artifacts"), { recursive: true });
  writeFileSync(path.join(root, "artifacts", "image-prompt-axes.json"), `${JSON.stringify(axisLog, null, 2)}\n`);

  console.log(`${records.length} prompts → ${path.relative(root, outputPath)}`);
  console.log(`identity sources: rewrite=${fromRewrite} png=${fromPng} synthesized=${synthesized}`);
  console.log(`unique axis combinations: ${comboSet.size}/${records.length}`);
  const tiers = axisLog.reduce<Record<string, number>>((acc, entry) => {
    const tier = String(entry.tier);
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});
  console.log("spice tiers:", tiers);
}

main();
