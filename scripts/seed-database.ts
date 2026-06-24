import dotenv from "dotenv";
import characters from "../public/generated/characters.json";
import categories from "../public/generated/categories.json";
import { createClient } from "@supabase/supabase-js";
import type { Category, Character } from "../src/types/domain";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const categoryRows = (categories as Category[]).map((category) => ({
    slug: category.slug,
    name: category.name,
    description: category.description,
  }));

  const { error: categoryError } = await supabase
    .from("categories")
    .upsert(categoryRows, { onConflict: "slug" });

  if (categoryError) throw categoryError;

  const { data: savedCategories, error: readCategoriesError } = await supabase
    .from("categories")
    .select("id,slug");

  if (readCategoriesError) throw readCategoriesError;

  const categoryIdBySlug = new Map(savedCategories.map((category) => [category.slug, category.id]));
  const characterRows = (characters as Character[]).map((character) => ({
    slug: character.slug,
    name: character.name,
    age: character.age,
    gender: character.gender,
    mode: character.mode,
    category_id: categoryIdBySlug.get(character.category) ?? null,
    short_description: character.shortDescription,
    backstory: character.backstory,
    relationship: character.relationship,
    scenario: character.scenario,
    occupation: character.occupation,
    image_prompt_key: character.imagePromptKey,
    localizations: character.localizations ?? {},
    personality: character.personality,
    greeting: character.greeting,
    tags: character.tags,
    image_path: character.imagePath,
    featured: character.featured,
    visible: character.visible,
    mood: character.mood,
    credit_cost: character.creditCost,
  }));

  const { error: characterError } = await supabase
    .from("characters")
    .upsert(characterRows, { onConflict: "slug" });

  if (characterError) throw characterError;

  const sampleUserId = process.env.SAMPLE_USER_ID;
  if (sampleUserId) {
    const { data: firstCharacter } = await supabase
      .from("characters")
      .select("id,name")
      .limit(1)
      .single();

    if (firstCharacter) {
      const { data: conversation } = await supabase
        .from("conversations")
        .insert({
          user_id: sampleUserId,
          character_id: firstCharacter.id,
          title: `Sample chat with ${firstCharacter.name}`,
        })
        .select("id")
        .single();

      if (conversation) {
        await supabase.from("messages").insert([
          {
            conversation_id: conversation.id,
            role: "assistant",
            content: "I saved this sample conversation so the dashboard has history after seeding.",
          },
          {
            conversation_id: conversation.id,
            role: "user",
            content: "Perfect. Let us test the launch flow.",
          },
        ]);
      }
    }
  }

  console.log(`Seeded ${categoryRows.length} categories and ${characterRows.length} characters.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
