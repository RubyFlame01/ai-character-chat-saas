import { hasSupabaseBrowserEnv } from "@/lib/config";
import { demoCategories, demoCharacters, getCharacterBySlug, getVisibleCharacters } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Character, CharacterLocalizedContent } from "@/types/domain";

type CharacterLocalizations = Partial<Record<string, CharacterLocalizedContent>>;

function fromRow(row: {
  id: string;
  slug: string;
  name: string;
  age?: number;
  gender: string;
  mode: string;
  category_id: string | null;
  short_description: string;
  backstory?: string;
  relationship?: string;
  scenario?: string;
  occupation?: string;
  image_prompt_key?: string;
  localizations?: unknown;
  personality: string;
  greeting: string;
  tags: string[];
  image_path: string;
  featured: boolean;
  visible: boolean;
  mood: string;
  credit_cost: number;
  categories?: { slug: string } | null;
}): Character {
  const category = (
    row.categories?.slug ??
    demoCategories.find((item) => item.id === row.category_id)?.slug ??
    "romance"
  ) as Character["category"];
  // The generated catalog is the source of truth for imagery (hero/gallery
  // variants live only there); fall back to the DB path when no local entry.
  const local = getCharacterBySlug(row.slug);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    age: row.age ?? 21,
    gender: row.gender as Character["gender"],
    mode: row.mode as Character["mode"],
    category,
    shortDescription: row.short_description,
    backstory: row.backstory ?? row.short_description,
    relationship: row.relationship ?? "Matched tonight",
    scenario: row.scenario ?? "A private adults-only conversation begins.",
    occupation: row.occupation ?? "creative professional",
    imagePromptKey: row.image_prompt_key ?? `legacy:${row.slug}`,
    localizations: (row.localizations ?? {}) as CharacterLocalizations,
    personality: row.personality,
    greeting: row.greeting,
    tags: row.tags,
    imagePath: local?.imagePath ?? row.image_path,
    heroImagePath: local?.heroImagePath,
    gallery: local?.gallery,
    featured: row.featured,
    visible: row.visible,
    mood: row.mood,
    creditCost: row.credit_cost,
  };
}

export async function listCharacters() {
  if (!hasSupabaseBrowserEnv()) return getVisibleCharacters();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*,categories(slug)")
    .eq("visible", true)
    .is("created_by", null)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data?.length) return getVisibleCharacters();
  return data.map(fromRow);
}

export async function findCharacter(slug: string) {
  if (!hasSupabaseBrowserEnv()) return getCharacterBySlug(slug) ?? null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("characters")
    .select("*,categories(slug)")
    .eq("slug", slug)
    .eq("visible", true)
    .single();

  return data ? fromRow(data) : getCharacterBySlug(slug) ?? null;
}

export async function listAdminCharacters() {
  if (!hasSupabaseBrowserEnv()) return demoCharacters;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("characters")
    .select("*,categories(slug)")
    .order("created_at", { ascending: false });

  return data?.map(fromRow) ?? demoCharacters;
}
