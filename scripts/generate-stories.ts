import dotenv from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Character, CharacterCategory } from "../src/types/domain";

dotenv.config({ path: ".env.local" });
dotenv.config();

// One-off creative story generation for the character catalog.
//
//   npx tsx scripts/generate-stories.ts --limit 5          # pilot run
//   npx tsx scripts/generate-stories.ts                    # full run (resumes)
//   npx tsx scripts/generate-stories.ts --apply            # merge results into characters.json
//
// Each character gets a unique trope + secret + flaw + spark seed (assigned
// deterministically, no duplicate combinations), and the model writes an
// AIChatUp-style card: punchy bio, backstory with a hidden tension, dramatic
// in-media-res scenario, and a scene-opening greeting — in English + Turkish.
// Results are saved incrementally to artifacts/character-stories.json so the
// run can be interrupted and resumed.

const root = process.cwd();
const catalogPath = path.join(root, "public", "generated", "characters.json");
const outputPath = path.join(root, "artifacts", "character-stories.json");

const model = argValue("--model") ?? process.env.STORY_MODEL ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-120b:free";
const fallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS ?? "nousresearch/hermes-3-llama-3.1-405b:free")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const apiKey = process.env.OPENROUTER_API_KEY;

// --- Seed pools -------------------------------------------------------------

const tropesByCategory: Record<CharacterCategory, string[]> = {
  romance: [
    "second-chance lovers forced back into each other's orbit",
    "a marriage of convenience that is becoming inconveniently real",
    "enemies-to-lovers rivalry where the hate ran out before the heat did",
    "a love letter delivered ten years too late",
    "the one who ghosted, back with an explanation nobody asked for",
    "fake dating for a family event that stopped feeling fake",
    "a holiday fling that followed them home",
    "the wedding guest who objects — quietly, only to you",
    "two people who keep meeting at the wrong time, until now",
    "an anonymous late-night correspondence that turns out to be someone you know",
    "a bet about not falling in love, already lost",
    "the matchmaker who fell for their own client",
    "a slow dance at someone else's wedding that never quite ended",
  ],
  companion: [
    "a professional cuddler who broke their own no-feelings rule",
    "your insomniac 3am voice on the phone, finally meeting you",
    "a sugar-free arrangement: company only, until it isn't",
    "the regular at your café who has been rehearsing one sentence for weeks",
    "a rent-a-date who keeps refusing your money",
    "the stranger from the airport bar with a boarding pass they never used",
    "a penpal from a dying forum, escalating to real life",
    "the gym crush who asked to share your headphones",
    "a bartender who remembers everything you've ever told them",
    "the bookshop owner who keeps a shelf only you know about",
    "a dance instructor whose private lessons run long",
    "the dog-sitter who keeps inventing reasons to return",
    "a late-shift taxi driver who takes the long way on purpose",
  ],
  fantasy: [
    "a vampire who has outlived every lover and swore never again",
    "a demon bound by a contract with one loophole: you",
    "a fallen goddess learning to be mortal in your city",
    "a witch whose love potions work on everyone but herself",
    "a dragon-shifter guarding a hoard that now includes you",
    "an immortal bodyguard assigned to you for reasons no one will explain",
    "a fae noble who owes you a debt and hates owing anything",
    "a reaper who keeps postponing your appointment",
    "a siren who went silent the day they met you",
    "a cursed prince/princess who needs one honest night, not true love's kiss",
    "a war-mage retired into your quiet street, pretending to be ordinary",
    "a ghost tied to your apartment lease",
    "a shapeshifter who only drops the disguise around you",
  ],
  "slice-of-life": [
    "the neighbor whose wifi password started a war and a friendship",
    "a divorcée rebuilding, one reckless decision at a time — you're the decision",
    "your best friend's older sibling, suddenly very single",
    "the single parent from the school run with a smile that lingers",
    "a chef who cooks their feelings and keeps feeding you",
    "the landlord's daughter/son collecting rent and excuses to stay",
    "a night-shift nurse who keeps meeting you at the worst hours",
    "the ex who moved one street away, on purpose, maybe",
    "a coworker after the office party neither of you mentions",
    "the personal trainer who gives you one rep too many reasons",
    "a roommate whose door stays open exactly an inch",
    "the barista who writes the wrong name on your cup, every time, on purpose",
    "a tailor who measures twice and remembers everything",
  ],
  mystery: [
    "a private investigator who was hired to follow you — and quit, badly",
    "an art forger gone straight, except for one last favor",
    "the witness who saw what you saw and found you first",
    "a midnight radio host whose dedications are all aimed at you",
    "a hotel concierge who knows every secret on the floor, including yours",
    "the stranger who returned your lost wallet with one item missing",
    "an antiques dealer whose shop only appears when you need it",
    "a retired detective whose cold case has your name in the margins",
    "the neighbor who keeps their lights off but watches the street",
    "a poker player who folded a winning hand to keep talking to you",
    "the archivist who found a photo of you, dated fifty years ago",
    "a perfumer who built a scent from memory — yours",
    "the tenant in 4B that the building has no record of",
  ],
  anime: [
    "a tsundere childhood friend who came back from abroad with a confession half-rehearsed",
    "a yandere class president keeping a notebook with one name in it",
    "a kitsune spirit repaying a debt with nine lifetimes of devotion",
    "the student council rival who demands your lunch breaks as tribute",
    "a demon lord defeated and reincarnated as your roommate",
    "an idol hiding from fame in your part-time shift",
    "a kuudere android learning emotions off-script, starting with yours",
    "the delinquent with perfect grades and one soft spot",
    "a shrine maiden who sees spirits and pretends not to see you staring",
    "your guildmate from the game, exactly as bold offline",
    "a vampire transfer student who only attends night classes",
    "the senpai who pretends not to notice your devotion — and notes everything",
    "a magical barista whose latte art predicts your day",
    "the rival gamer who loses on purpose to keep the lobby open",
    "a fox-eared landlady running a dormitory of secrets",
    "the quiet library committee member who slips notes into your returns",
    "an exiled princess from another world hiding in plain sight",
    "the kendo captain who bows last and looks longest",
    "a ghost-club president whose hauntings are mostly excuses",
    "the cooking club ace who only burns food when you watch",
  ],
};

const secrets = [
  "keeps a photograph they would die before explaining",
  "writes letters they never send, all to the same person",
  "is fluent in a language they pretend not to know",
  "left their last city overnight and never says why",
  "has a scar with two different cover stories",
  "memorizes the exits of every room out of old habit",
  "owns exactly one expensive thing and hides it",
  "sends money somewhere every month, quietly",
  "can't sleep before 3am and lies about the reason",
  "keeps their phone face-down around one specific name",
  "knows how to fight far too well for their day job",
  "has a recurring dream they've started seeing details from",
  "carries a key that fits no lock they'll show you",
  "was famous once, briefly, under another name",
  "rehearses conversations out loud when alone",
  "never finishes the last sip, bite, or page — superstition",
  "visits the same bench every year on the same date",
];

const flaws = [
  "jealous in flashes and ashamed of it instantly",
  "deflects sincerity with jokes until cornered",
  "competitive over absolutely meaningless things",
  "terrible at accepting gifts, gracious at giving them",
  "lies about small things, honest about huge ones",
  "needs to win arguments even when wrong, especially then",
  "vanishes for a day when feelings get too loud",
  "trusts too slowly, then all at once, recklessly",
  "petty about being ignored, dramatic about apologizing",
  "hoards affection like it might run out",
  "self-sufficient to the point of insult",
  "forgives too easily and resents it later",
  "addicted to teasing past the point of mercy",
  "keeps score of kindnesses, theirs and yours",
  "brave for others, coward for themselves",
];

const sparks = [
  "tonight a message arrives that should have stayed unsent",
  "a storm cancels every sensible plan tonight",
  "someone said your name to them today and they haven't recovered",
  "they found something of yours and waited too long to return it",
  "a bet from last week comes due tonight",
  "an anniversary only they remember falls tonight",
  "the lights go out in the building, and they knock",
  "they finally read the thing you wrote",
  "a rumor about you reached them, half-true and fully effective",
  "they have one ticket, one seat, one chance to ask",
  "tonight they decided to stop pretending — about one thing only",
  "you caught them doing the thing they always denied",
];

// --- Types ------------------------------------------------------------------

type StoryFields = {
  shortDescription: string;
  backstory: string;
  scenario: string;
  greeting: string;
};

type StoryEntry = {
  slug: string;
  seeds: { trope: string; secret: string; flaw: string; spark: string };
  model: string;
  en: StoryFields;
  tr: StoryFields;
};

// --- Helpers ----------------------------------------------------------------

function argValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index > -1 ? process.argv[index + 1] : undefined;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function assignSeeds(index: number, category: CharacterCategory) {
  const tropes = tropesByCategory[category];
  return {
    trope: tropes[index % tropes.length],
    secret: secrets[(index * 3 + 1) % secrets.length],
    flaw: flaws[(index * 5 + 2) % flaws.length],
    spark: sparks[(index * 7 + 3) % sparks.length],
  };
}

const bannedPattern =
  /\b(minor|underage|under-age|teen|teenager|schoolgirl|schoolboy|child|children|loli|shota|incest|rape|non-?consensual)\b/i;

// The story must visibly live inside the character's relationship premise.
// Each relationship type maps to a cue regex checked against the English text;
// generation retries when the cue is missing.
// Step-family is the only one we HARD-enforce (it must read as step, not a
// generic match). The rest use broad cues that accept any natural phrasing of
// the premise — strict word-matching was rejecting perfectly good stories.
const relationshipCues: Array<{ match: RegExp; cue: RegExp }> = [
  { match: /step-?sister|step-?sibling|stepmother|üvey/i, cue: /\bstep|famil(y|ies)|household|married into|steps/i },
  { match: /old flame|eski/i, cue: /\b(again|back|year|once|used to|last time|history|ex|reunit|past|remember)\b/i },
  { match: /roommate/i, cue: /\b(roommate|apartment|flat|couch|kitchen|shared|lease|hall|home|place|wall|door|live)\b/i },
  { match: /neighbor/i, cue: /\b(neighbor|next door|building|hall|balcony|wall|door|street|apartment)\b/i },
  { match: /coworker/i, cue: /\b(office|work|colleague|project|meeting|desk|deadline|after|hours?|job|client|late)\b/i },
  { match: /trainer/i, cue: /\b(gym|train|workout|session|coach|fitness|rep|body|lesson|private|sweat|muscle|form|push)\b/i },
  { match: /landlord/i, cue: /\b(landlord|rent|lease|tenant|building|key|apartment|unit|door)\b/i },
  { match: /rival/i, cue: /\b(rival|compet|award|deadline|industry|versus|beat|win|best|against|race)\b/i },
  { match: /mentor/i, cue: /\b(mentor|career|industry|advice|prot|guid|learn|student|teach|experience|hire|intern)\b/i },
  { match: /travel companion/i, cue: /\b(travel|trip|hostel|train|ferry|abroad|journey|backpack|road|airport|city|map|hotel)\b/i },
  { match: /matched tonight/i, cue: /\b(match|profile|app|swipe|date|dating|tonight|drink|met|meet|stranger|message|online|chat|night)\b/i },
  { match: /family friend/i, cue: /\b(famil|wedding|barbecue|toast|parents|gathering|friend|dinner|holiday|known|years)\b/i },
  { match: /weekend host/i, cue: /\b(guest|stay|host|weekend|spare room|visit|home|night|breakfast)\b/i },
  { match: /childhood friend/i, cue: /\b(childhood|kid|grew up|school|year|old times|young|always|since)\b/i },
  { match: /best friend'?s/i, cue: /\b(friend|party|group|sibling|brother|sister)\b/i },
];

function relationshipCue(relationship: string) {
  return relationshipCues.find((entry) => entry.match.test(relationship))?.cue ?? null;
}

function validateFields(fields: StoryFields, label: string) {
  const ranges: Array<[keyof StoryFields, number, number]> = [
    ["shortDescription", 60, 320],
    ["backstory", 250, 1400],
    ["scenario", 120, 800],
    ["greeting", 120, 900],
  ];
  for (const [key, min, max] of ranges) {
    const value = fields[key];
    if (typeof value !== "string" || value.trim().length < min || value.length > max) {
      throw new Error(`${label}.${String(key)} out of range (${value?.length ?? "missing"})`);
    }
    if (bannedPattern.test(value)) {
      throw new Error(`${label}.${String(key)} contains banned content`);
    }
  }
}

function buildPrompt(character: Character, seeds: ReturnType<typeof assignSeeds>) {
  return [
    `Write a character card for an 18+ fictional AI roleplay chat platform. All characters are adults (${character.age}+). Content must be flirtatious and tension-driven but NOT explicit; it must never include minors, non-consent, violence, or real people.`,
    ``,
    `Character facts (keep all of them consistent):`,
    `- Name: ${character.name} (${character.gender}, age ${character.age}, ${character.mode} style)`,
    `- Category: ${character.category}`,
    `- RELATIONSHIP TO THE USER (non-negotiable): ${character.relationship}. The backstory, scenario, and greeting must all clearly live inside this relationship — the reader must immediately understand this is their "${character.relationship}". If the trope below conflicts with it, bend the trope, never the relationship.`,
    `- Occupation: ${character.occupation}`,
    `- Personality: ${character.personality}`,
    ``,
    `Creative seeds (weave ALL of these in naturally — they are what makes this character unique):`,
    `- Core trope: ${seeds.trope}`,
    `- Hidden secret: ${seeds.secret}`,
    `- Human flaw: ${seeds.flaw}`,
    `- Tonight's spark: ${seeds.spark}`,
    ``,
    `Write these four fields, in this exact JSON shape, with BOTH languages:`,
    `{"en":{"shortDescription":"...","backstory":"...","scenario":"...","greeting":"..."},"tr":{...same fields in natural, native-quality Turkish...}}`,
    ``,
    `Field rules:`,
    `- shortDescription: ONE punchy sentence (max 200 chars) that sells the drama. Never use the words "AI", "companion", "roleplay", "boundaries", or "slow-burn".`,
    `- backstory: 2-4 sentences of concrete life history with specific details (places, habits, one vivid image). Weave the secret and flaw in WITHOUT naming them as "secret" or "flaw". No meta language.`,
    `- scenario: 2-3 sentences setting up tonight's situation in second person ("you"), in medias res, with stakes and the spark. This is the moment the chat starts.`,
    `- greeting: the character's actual first message, in their own voice: one small action beat in *asterisks*, spoken words, and an open hook. No "hello, I am X" introductions. Max 3 sentences of dialogue.`,
    ``,
    `Output ONLY the JSON object. No markdown fences, no commentary.`,
  ].join("\n");
}

function extractJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in response");
  return JSON.parse(cleaned.slice(start, end + 1)) as { en: StoryFields; tr: StoryFields };
}

async function callModel(prompt: string, useModel: string) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(90_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: useModel,
      temperature: 0.9,
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty completion");
  return content;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Apply mode -------------------------------------------------------------

function applyStories(characters: Character[], stories: StoryEntry[]) {
  const bySlug = new Map(stories.map((story) => [story.slug, story]));
  let applied = 0;

  const next = characters.map((character) => {
    const story = bySlug.get(character.slug);
    if (!story) return character;
    applied += 1;
    return {
      ...character,
      shortDescription: story.en.shortDescription,
      backstory: story.en.backstory,
      scenario: story.en.scenario,
      greeting: story.en.greeting,
      localizations: {
        ...character.localizations,
        en: { ...character.localizations?.en, ...story.en, relationship: character.localizations?.en?.relationship ?? character.relationship, occupation: character.localizations?.en?.occupation ?? character.occupation, personality: character.localizations?.en?.personality ?? character.personality },
        tr: { ...character.localizations?.tr, ...story.tr, relationship: character.localizations?.tr?.relationship ?? character.relationship, occupation: character.localizations?.tr?.occupation ?? character.occupation, personality: character.localizations?.tr?.personality ?? character.personality },
      },
    };
  });

  writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Applied ${applied} stories into ${path.relative(root, catalogPath)}`);
}

// --- Main -------------------------------------------------------------------

async function main() {
  const characters = JSON.parse(readFileSync(catalogPath, "utf-8")) as Character[];
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const stories: StoryEntry[] = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, "utf-8")) : [];

  if (hasFlag("--apply")) {
    applyStories(characters, stories);
    return;
  }

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY missing in .env.local");
    process.exit(1);
  }

  const done = new Set(stories.map((story) => story.slug));
  const limit = Number(argValue("--limit") ?? Infinity);
  const onlySlug = argValue("--slug");

  // Stable per-category index so seed assignment never shifts between runs.
  const categoryIndex = new Map<string, number>();
  let generated = 0;

  for (const character of characters) {
    const index = categoryIndex.get(character.category) ?? 0;
    categoryIndex.set(character.category, index + 1);

    if (onlySlug && character.slug !== onlySlug) continue;
    if (done.has(character.slug)) continue;
    if (generated >= limit) break;

    const seeds = assignSeeds(index, character.category);
    const prompt = buildPrompt(character, seeds);
    const modelsToTry = [model, ...fallbackModels];
    let entry: StoryEntry | null = null;
    let lastError: unknown;

    for (const useModel of modelsToTry) {
      try {
        const raw = await callModel(prompt, useModel);
        const parsed = extractJson(raw);
        validateFields(parsed.en, "en");
        validateFields(parsed.tr, "tr");
        const cue = relationshipCue(character.relationship);
        const englishText = `${parsed.en.shortDescription} ${parsed.en.backstory} ${parsed.en.scenario} ${parsed.en.greeting}`;
        if (cue && !cue.test(englishText)) {
          throw new Error(`relationship "${character.relationship}" not reflected in story`);
        }
        entry = { slug: character.slug, seeds, model: useModel, en: parsed.en, tr: parsed.tr };
        break;
      } catch (error) {
        lastError = error;
        await sleep(1500);
      }
    }

    if (!entry) {
      console.error(`FAILED ${character.slug}: ${lastError instanceof Error ? lastError.message : lastError}`);
      continue;
    }

    stories.push(entry);
    writeFileSync(outputPath, `${JSON.stringify(stories, null, 2)}\n`);
    generated += 1;
    console.log(`[${stories.length}/${characters.length}] ${character.slug} ← ${entry.model} (${seeds.trope.slice(0, 50)}...)`);
    await sleep(Number(process.env.STORY_DELAY_MS ?? 2500));
  }

  console.log(`Done. ${stories.length}/${characters.length} stories in ${path.relative(root, outputPath)}`);
  console.log("Review the output, then run with --apply to merge into the catalog.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
