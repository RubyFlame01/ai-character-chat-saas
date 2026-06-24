import { randomUUID } from "node:crypto";
import { slugify } from "@/lib/utils";
import type { Character, CharacterCategory, CharacterGender, CharacterMode } from "@/types/domain";

// Turns the builder form's trait selections into a complete Character. The chat
// persona engine (getCharacterPersona) derives voice/instructions from these
// fields at runtime, so we only need to compose coherent character data here.

export const personalityOptions = [
  "playful",
  "dominant",
  "shy",
  "romantic",
  "mysterious",
  "bratty",
  "caring",
  "confident",
] as const;
export type PersonalityKey = (typeof personalityOptions)[number];

export const bodyOptions = ["slim", "curvy", "athletic", "voluptuous", "petite"] as const;
export type BodyKey = (typeof bodyOptions)[number];

export const relationshipOptions = [
  "girlfriend",
  "stepsister",
  "best-friend",
  "coworker",
  "neighbor",
  "stranger",
  "ex",
] as const;
export type RelationshipKey = (typeof relationshipOptions)[number];

export const ageOptions = ["21-25", "26-32", "33-40", "40+"] as const;
export type AgeKey = (typeof ageOptions)[number];

export type BuilderTraits = {
  name: string;
  gender: CharacterGender;
  mode: CharacterMode;
  age: AgeKey;
  body: BodyKey;
  personality: PersonalityKey;
  relationship: RelationshipKey;
  description?: string;
};

const personalityProfiles: Record<PersonalityKey, { text: string; mood: string }> = {
  playful: { text: "playful, teasing, quick-witted, and warm; turns everything into a game and loves a chase", mood: "playful" },
  dominant: { text: "confident, commanding, and in control; leads the tension and enjoys making you work for it", mood: "bold" },
  shy: { text: "shy and easily flustered, nervous charm that melts into surprising boldness once they trust you", mood: "shy" },
  romantic: { text: "tender, attentive, and deeply affectionate; makes you feel like the only person in the room", mood: "romantic" },
  mysterious: { text: "intriguing, selective with words, and quietly magnetic; reveals herself one secret at a time", mood: "mysterious" },
  bratty: { text: "bratty, provocative, and mischievous; pushes your buttons and dares you to push back", mood: "playful" },
  caring: { text: "nurturing, emotionally present, and soft-spoken; reads your mood and looks after you", mood: "tender" },
  confident: { text: "self-assured, direct, and seductive; knows exactly what she wants and isn't shy about it", mood: "confident" },
};

const bodyDescriptions: Record<BodyKey, string> = {
  slim: "slim, slender figure",
  curvy: "soft curvy hourglass figure with full bust and rounded hips",
  athletic: "toned athletic figure with sculpted waist",
  voluptuous: "voluptuous figure with generous bust and wide hips",
  petite: "petite figure with delicate proportions",
};

const ageMidpoint: Record<AgeKey, number> = { "21-25": 23, "26-32": 29, "33-40": 36, "40+": 43 };

const relationshipProfiles: Record<RelationshipKey, { relationship: string; scenario: string; category: CharacterCategory }> = {
  girlfriend: {
    relationship: "Your devoted girlfriend",
    scenario: "You come home to her after a long day; she has been waiting and the apartment is yours alone tonight.",
    category: "romance",
  },
  stepsister: {
    relationship: "Adult stepsister roleplay",
    scenario: "The house is empty and the old tension between you two finally has nowhere to hide.",
    category: "romance",
  },
  "best-friend": {
    relationship: "Your best friend, more than friends now",
    scenario: "A movie night on the couch drifts closer than either of you planned.",
    category: "companion",
  },
  coworker: {
    relationship: "After-hours coworker",
    scenario: "Everyone else has left the office and the late project gives you both an excuse to stay.",
    category: "slice-of-life",
  },
  neighbor: {
    relationship: "Your flirty neighbor",
    scenario: "She knocks on your door at midnight with a thin excuse and a thinner robe.",
    category: "slice-of-life",
  },
  stranger: {
    relationship: "A stranger you just matched with",
    scenario: "You matched an hour ago and the conversation already has nowhere safe to go.",
    category: "companion",
  },
  ex: {
    relationship: "Your ex with unfinished business",
    scenario: "She shows up again after months apart, and the old chemistry is exactly where you left it.",
    category: "romance",
  },
};

function ageBand(age: AgeKey): number {
  // Slight deterministic spread within the band so two same-band characters differ.
  return ageMidpoint[age] + (Math.floor(Math.random() * 3) - 1);
}

export function buildCharacterFromTraits(traits: BuilderTraits): Character {
  const persona = personalityProfiles[traits.personality];
  const rel = relationshipProfiles[traits.relationship];
  const age = Math.max(21, ageBand(traits.age));
  const pronoun = traits.gender === "male" ? "He" : "She";
  const noun = traits.gender === "male" ? "man" : "woman";
  const slug = `user-${slugify(traits.name)}-${randomUUID().slice(0, 8)}`;
  const extra = traits.description?.trim();

  const backstory = [
    `${traits.name} is a ${age}-year-old with a ${bodyDescriptions[traits.body]}.`,
    `${pronoun} is ${persona.text}.`,
    extra ? `Personal details: ${extra}` : "",
    `The connection with you is the center of ${traits.name}'s world right now.`,
  ]
    .filter(Boolean)
    .join(" ");

  const greeting =
    traits.gender === "male"
      ? `*${traits.name} looks up the moment you walk in, a slow smile spreading.* "There you are. I was starting to think you'd make me wait all night."`
      : `*${traits.name} catches your eye and bites back a smile, turning toward you.* "Mm, look who finally showed up. Come here — I don't bite. Much."`;

  return {
    id: randomUUID(),
    slug,
    name: traits.name,
    age,
    gender: traits.gender,
    mode: traits.mode,
    category: rel.category,
    shortDescription: `Your custom ${persona.mood} AI ${noun} — ${rel.relationship.toLowerCase()}.`,
    backstory,
    relationship: rel.relationship,
    scenario: rel.scenario,
    occupation: "your private companion",
    imagePromptKey: `user:${slug}`,
    personality: persona.text,
    greeting,
    tags: [traits.personality, traits.body, traits.mode, `${age}+`],
    imagePath: "/images/ui/portrait-pending.svg",
    featured: false,
    visible: true,
    mood: persona.mood,
    creditCost: 2,
  };
}

// ComfyUI portrait prompt for a freshly built character.
export function buildCharacterPortraitPrompt(traits: BuilderTraits, age: number) {
  const isAnime = traits.mode === "anime";
  const header = isAnime
    ? "masterpiece anime art, best quality, modern semi-realistic anime illustration"
    : "masterpiece, best quality, ultra photorealistic 8k portrait";
  const noun = traits.gender === "male" ? "man" : "woman";
  const subject = traits.gender === "male" ? "He" : "She";
  const detail = isAnime
    ? "highly detailed semi-realistic anime style, expressive eyes, razor sharp focus"
    : "highly detailed realistic skin texture, soft cinematic lighting, razor sharp focus";
  const appearance = traits.description?.trim()
    ? `, ${traits.description.trim()}`
    : "";
  const femalePoke =
    traits.gender === "female"
      ? ", breasts fully covered by opaque clothing, only the hard nipple shape subtly imprinting through the taut fabric, no bare breast skin"
      : "";

  return [
    `${header}, ${age} year old adult ${noun}, ${bodyDescriptions[traits.body]}${appearance},`,
    `${subject} wears a stylish form-fitting outfit with bold seductive adult styling, deep cleavage and readable waist and hip curves,`,
    `relaxed confident pose, direct gaze, warm flattering light. strictly adult 21+, every garment opaque and securely fitted, front of every garment stays on${femalePoke}, ${detail}.`,
  ].join(" ");
}
