import { NextResponse } from "next/server";
import { z } from "zod";
import { env, hasReplicateEnv, hasSupabaseAdminEnv } from "@/lib/config";
import {
  ageOptions,
  bodyOptions,
  buildCharacterFromTraits,
  buildCharacterPortraitPrompt,
  personalityOptions,
  relationshipOptions,
} from "@/lib/characters/builder";
import { submitPortrait } from "@/lib/images/replicate";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CREATE_COST = env.characterCreditCost;

const schema = z.object({
  name: z.string().min(1).max(40),
  gender: z.enum(["female", "male"]),
  mode: z.enum(["realistic", "anime"]),
  age: z.enum(ageOptions),
  body: z.enum(bodyOptions),
  personality: z.enum(personalityOptions),
  relationship: z.enum(relationshipOptions),
  description: z.string().max(400).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid character details." }, { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Character builder requires a configured account database." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to create a character." }, { status: 401 });
  if (user.id === "demo-user") {
    return NextResponse.json({ error: "Sign in with a real account to save characters." }, { status: 403 });
  }
  if (user.credits < CREATE_COST) {
    return NextResponse.json({ error: "Not enough credits.", code: "no-credits" }, { status: 402 });
  }

  const character = buildCharacterFromTraits(parsed.data);

  // Kick off the portrait (jumps the queue so the creator doesn't wait behind
  // any bulk batch). Failure here is non-fatal — the character still works.
  let promptId: string | null = null;
  if (hasReplicateEnv()) {
    try {
      const positive = buildCharacterPortraitPrompt(parsed.data, character.age);
      ({ promptId } = await submitPortrait({ positive, style: character.mode, shape: "portrait", slug: character.slug, front: true }));
    } catch (error) {
      console.error("[characters/create] portrait submit failed", error);
    }
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("characters").insert({
    slug: character.slug,
    name: character.name,
    age: character.age,
    gender: character.gender,
    mode: character.mode,
    category_id: null,
    short_description: character.shortDescription,
    backstory: character.backstory,
    relationship: character.relationship,
    scenario: character.scenario,
    occupation: character.occupation,
    image_prompt_key: character.imagePromptKey,
    localizations: {},
    personality: character.personality,
    greeting: character.greeting,
    tags: character.tags,
    image_path: character.imagePath,
    featured: false,
    visible: true,
    mood: character.mood,
    credit_cost: character.creditCost,
    created_by: user.id,
    portrait_status: promptId ? "pending" : "ready",
  });

  if (error) {
    console.error("[characters/create]", error);
    return NextResponse.json({ error: "Could not save the character." }, { status: 500 });
  }

  const nextCredits = Math.max(0, user.credits - CREATE_COST);
  await supabase
    .from("users_profile")
    .update({ credits: nextCredits, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: -CREATE_COST,
    reason: "character_creation",
    metadata: { slug: character.slug },
  });

  return NextResponse.json({ slug: character.slug, promptId, credits: nextCredits });
}
