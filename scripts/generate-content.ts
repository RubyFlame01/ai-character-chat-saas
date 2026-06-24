import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { slugify } from "../src/lib/utils";
import type { Category, Character, CharacterCategory, CharacterGender, CharacterMode } from "../src/types/domain";

const root = process.cwd();
const imageRoot = path.join(root, "public", "images");
const generatedRoot = path.join(root, "public", "generated");

const categories: Category[] = [
  {
    id: "cat-romance",
    slug: "romance",
    name: "Erotic Romance",
    description: "Warm, teasing 18+ characters built for adult chemistry.",
  },
  {
    id: "cat-companion",
    slug: "companion",
    name: "Flirty Companion",
    description: "Attentive adult companions for flirt, fantasy, and private chat.",
  },
  {
    id: "cat-fantasy",
    slug: "fantasy",
    name: "Fantasy",
    description: "Stylized roleplay personas with cinematic backstories.",
  },
  {
    id: "cat-slice-of-life",
    slug: "slice-of-life",
    name: "Slice of Life",
    description: "Modern, grounded characters for intimate everyday scenes.",
  },
  {
    id: "cat-mystery",
    slug: "mystery",
    name: "Mystery",
    description: "Moody, enigmatic characters with secrets to uncover.",
  },
  {
    id: "cat-anime",
    slug: "anime",
    name: "Anime",
    description: "High-quality anime personalities with adult flirt and roleplay energy.",
  },
];

const realisticFemale = [
  "Mara Vale", "Nadia Sol", "Elena Voss", "Sienna Cross", "Lina Hart", "Amara Quinn",
  "Rina Blake", "Yara Moon", "Carmen Rae", "Iris Westfall", "Zoe Ardent", "Layla Storm",
  "Mina Laurent", "Tessa Vale", "Nora Ash", "Alina Vey", "Sofia Nyx", "Kaia Lane",
  "Anika Rose", "Juno Pierce", "Maya Sterling", "Serena Fox", "Eva Marlowe", "Noelle Cruz",
  "Isla Monroe", "Ari Kim", "Priya Sable", "Leona Grey", "Mila Novak", "Clara Dawn",
  "Bianca Reyes", "Talia Stone", "Hana Mori", "Rhea Collins", "Daphne Wilde", "Nina Bell",
  "Ayla Reed", "Selene Park", "Livia Noir", "Kira Hartwell", "Vera Chase", "Dalia Ren",
  "Mireya Lux", "Cassia Vale", "Freya Song", "Esme Knight", "Naomi Vale", "Opal Rhodes",
  "Rosa Ember", "Keira Saint", "Vesper Lane", "Imani Frost", "Celine Noir", "Maeve Arden",
  "Zara Quinn", "Elise Moon", "Samira Vale", "Brooke Sterling", "Nika Dawn", "Valentina Ash",
];

const realisticMale = [
  "Adrian Vale", "Theo Cross", "Dante Reyes", "Kai Mercer", "Julian Knox",
  "Noah Sterling", "Rafael Stone", "Milo Hart", "Orion Blake", "Elias Voss",
];

const animeFemale = [
  "Aiko Hoshina", "Yumi Scarlet", "Rin Azura", "Sora Minami", "Emi Kuroha", "Mika Lune",
  "Hana Velvet", "Nari Eclipse", "Koko Starling", "Mei Solstice", "Rika Bloom", "Aya Mirage",
  "Yuna Prism", "Nia Shiro", "Lumi Akane", "Saki Dream", "Kira Blossom", "Momo Night",
  "Rei Aster", "Faye Komori", "Aria Neon", "Noa Seraph", "Mina Aurora", "Eri Sonata",
  "Luna Hikari", "Tara Nyanko", "Yori Violet", "Kana Frost", "Mira Celeste", "Nana Vesper",
];

const animeMale = [
  "Ren Kisaragi", "Haru Sato", "Kaito Noir", "Akio Vale", "Shin Arclight",
  "Toma Haze", "Yuji Crescent", "Riku Ashen", "Sena Drift", "Itsuki Flame",
];

const moods = [
  "flirty", "romantic", "seductive", "emotional", "stylish", "mysterious",
  "playful", "cinematic", "tender", "confident",
];

function ensureFolders() {
  [
    "characters",
    "anime",
    "banners",
    "ui",
  ].forEach((folder) => mkdirSync(path.join(imageRoot, folder), { recursive: true }));
  mkdirSync(generatedRoot, { recursive: true });
}

function colorFor(index: number, mode: CharacterMode) {
  const realistic = [
    ["#d94f7b", "#241021", "#f6b6a7"],
    ["#33c6ba", "#081b22", "#f8d7b1"],
    ["#9d6bff", "#130f2d", "#ffd1f3"],
    ["#f2a64a", "#211106", "#f9ccb0"],
    ["#ea5f5f", "#1d0910", "#f8bf9d"],
  ];
  const anime = [
    ["#ff6aa2", "#241036", "#ffe1ee"],
    ["#63d9ff", "#071a35", "#dcefff"],
    ["#b388ff", "#15103a", "#eee2ff"],
    ["#ffd166", "#291604", "#fff0c2"],
    ["#6ef3b5", "#06291c", "#e1fff3"],
  ];
  return (mode === "anime" ? anime : realistic)[index % 5];
}

function portraitSvg(character: Character, index: number) {
  const [accent, base, skin] = colorFor(index, character.mode);
  const eye = character.mode === "anime" ? 11 : 6;
  const line = character.mode === "anime" ? "#ffffff" : "#f4d2c8";
  const subtitle = `${character.mode.toUpperCase()} · ${character.mood.toUpperCase()}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1365" viewBox="0 0 1024 1365" role="img" aria-label="${character.name}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="28%" r="72%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".9"/>
      <stop offset=".45" stop-color="${base}" stop-opacity=".95"/>
      <stop offset="1" stop-color="#030306"/>
    </radialGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#fff" stop-opacity=".22"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".02"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="24"/></filter>
  </defs>
  <rect width="1024" height="1365" fill="url(#glow)"/>
  <circle cx="${210 + (index % 6) * 82}" cy="${170 + (index % 4) * 34}" r="${120 + (index % 5) * 18}" fill="${accent}" opacity=".18" filter="url(#soft)"/>
  <circle cx="${760 - (index % 5) * 42}" cy="330" r="180" fill="#fff" opacity=".06" filter="url(#soft)"/>
  <path d="M0 930 C210 820 350 1050 530 936 C710 822 820 790 1024 860 L1024 1365 L0 1365 Z" fill="#020205" opacity=".58"/>
  <ellipse cx="512" cy="506" rx="${character.mode === "anime" ? 194 : 176}" ry="${character.mode === "anime" ? 232 : 218}" fill="#11111c" opacity=".8"/>
  <path d="M330 548 C348 332 474 244 594 300 C726 362 734 510 690 650 C650 764 388 770 330 548 Z" fill="${character.mode === "anime" ? accent : "#15111a"}"/>
  <ellipse cx="512" cy="510" rx="138" ry="168" fill="${skin}"/>
  <path d="M374 474 C410 356 492 300 594 318 C548 392 478 418 374 474 Z" fill="#15111a" opacity=".85"/>
  <circle cx="463" cy="512" r="${eye}" fill="#101018"/>
  <circle cx="561" cy="512" r="${eye}" fill="#101018"/>
  <path d="M458 605 C492 628 535 628 570 605" fill="none" stroke="#8e3f4f" stroke-width="8" stroke-linecap="round"/>
  <path d="M346 736 C402 674 621 674 678 736 C744 808 774 956 818 1168 L206 1168 C250 956 280 808 346 736 Z" fill="url(#glass)" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
  <path d="M352 790 C438 852 585 852 672 790 L720 1168 L304 1168 Z" fill="${accent}" opacity=".62"/>
  <rect x="82" y="1038" width="860" height="210" rx="42" fill="#020205" opacity=".58"/>
  <text x="126" y="1128" fill="#fff" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="800" letter-spacing="0">${character.name}</text>
  <text x="126" y="1192" fill="${line}" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="0">${subtitle}</text>
</svg>`;
}

function bannerSvg(filename: string, title: string, accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <radialGradient id="a" cx="68%" cy="26%" r="66%"><stop stop-color="${accent}" stop-opacity=".78"/><stop offset=".55" stop-color="#151229"/><stop offset="1" stop-color="#030306"/></radialGradient>
    <linearGradient id="b" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#a)"/>
  <path d="M0 620 C280 480 456 720 732 570 C1020 414 1240 510 1600 380 L1600 900 L0 900 Z" fill="#040407" opacity=".66"/>
  <rect x="92" y="104" width="720" height="248" rx="48" fill="url(#b)" stroke="#fff" stroke-opacity=".12"/>
  <text x="146" y="222" fill="#fff" font-family="Inter, Arial" font-size="78" font-weight="850">${title}</text>
  <text x="150" y="294" fill="#f6c6d8" font-family="Inter, Arial" font-size="34" font-weight="650">18+ AI sex chat and fantasy roleplay</text>
</svg>`;
  writeFileSync(path.join(imageRoot, "banners", filename), svg);
}

function createCharacter(name: string, index: number, mode: CharacterMode, gender: CharacterGender): Character {
  const category = (mode === "anime"
    ? "anime"
    : ["romance", "companion", "fantasy", "slice-of-life", "mystery"][index % 5]) as CharacterCategory;
  const mood = moods[index % moods.length];
  const slug = slugify(`${mode}-${name}`);
  return {
    id: `char-${slug}`,
    slug,
    name,
    age: 25,
    gender,
    mode,
    category,
    shortDescription: `${name} is a ${mood} ${mode === "anime" ? "anime" : "realistic"} 18+ chat character for erotic roleplay, teasing flirt, and private fantasy conversation.`,
    backstory: `${name} has a distinct adult life story ready to be expanded by the catalog builder.`,
    relationship: "Matched tonight",
    scenario: "A private adults-only conversation begins after a promising match.",
    occupation: "creative professional",
    imagePromptKey: `generated:${slug}`,
    personality: `Warm, attentive, witty, and ${mood}. ${name} is written for adult-only sex chat, consensual fantasy roleplay, slow-burn tension, and seductive conversation without explicit image generation.`,
    greeting: `I was hoping you would find me tonight. Tell me what fantasy you want to start with, and I will make it feel dangerously personal.`,
    tags: [mood, "18+", "erotic", "sex-chat", "roleplay", gender, mode, category],
    imagePath: `/images/${mode === "anime" ? "anime" : "characters"}/${slug}.svg`,
    featured: index % 7 === 0,
    visible: true,
    mood,
    creditCost: mode === "anime" ? 2 : 3,
  };
}

async function maybeGenerateWithImagen(character: Character, prompt: string) {
  const endpoint = process.env.IMAGEN_ENDPOINT;
  const apiKey = process.env.IMAGEN_API_KEY ?? process.env.GOOGLE_IMAGEN_API_KEY;
  if (!endpoint || !apiKey) return false;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      aspectRatio: "3:4",
      safety: "non_explicit_adult_erotic_chat",
      outputMimeType: "image/png",
    }),
  });

  if (!response.ok) return false;
  const payload = (await response.json()) as { imageBase64?: string; predictions?: { bytesBase64Encoded?: string }[] };
  const base64 = payload.imageBase64 ?? payload.predictions?.[0]?.bytesBase64Encoded;
  if (!base64) return false;
  const folder = character.mode === "anime" ? "anime" : "characters";
  writeFileSync(path.join(imageRoot, folder, `${character.slug}.png`), Buffer.from(base64, "base64"));
  character.imagePath = `/images/${folder}/${character.slug}.png`;
  return true;
}

async function main() {
  ensureFolders();
  const characters = [
    ...realisticFemale.map((name, i) => createCharacter(name, i, "realistic", "female")),
    ...realisticMale.map((name, i) => createCharacter(name, 60 + i, "realistic", "male")),
    ...animeFemale.map((name, i) => createCharacter(name, i, "anime", "female")),
    ...animeMale.map((name, i) => createCharacter(name, 30 + i, "anime", "male")),
  ];

  for (const [index, character] of characters.entries()) {
    const prompt = `${character.name}, attractive adult ${character.gender} ${character.mode} portrait, ${character.mood}, erotic chat persona, cinematic lighting, stylish seductive non-explicit clothing, premium AI sex chat avatar, no nudity, no explicit content`;
    const generated = await maybeGenerateWithImagen(character, prompt).catch(() => false);
    if (!generated) {
      const folder = character.mode === "anime" ? "anime" : "characters";
      writeFileSync(path.join(imageRoot, folder, `${character.slug}.svg`), portraitSvg(character, index));
    }
  }

  bannerSvg("og-home.svg", "LustTalk AI", "#d94f7b");
  bannerSvg("og-characters.svg", "Characters", "#33c6ba");
  bannerSvg("pricing.svg", "Credits", "#9d6bff");
  writeFileSync(
    path.join(imageRoot, "ui", "empty-state.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" rx="32" fill="#07070c"/><circle cx="320" cy="170" r="90" fill="#d94f7b" opacity=".42"/><text x="320" y="300" text-anchor="middle" fill="#fff" font-family="Arial" font-size="34" font-weight="700">Start a conversation</text></svg>`,
  );

  const tags = Array.from(new Set(characters.flatMap((character) => character.tags))).sort();
  writeFileSync(path.join(generatedRoot, "characters.json"), JSON.stringify(characters, null, 2));
  writeFileSync(path.join(generatedRoot, "categories.json"), JSON.stringify(categories, null, 2));
  writeFileSync(path.join(generatedRoot, "tags.json"), JSON.stringify(tags, null, 2));
  console.log(`Generated ${characters.length} characters, ${categories.length} categories, and ${tags.length} tags.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
