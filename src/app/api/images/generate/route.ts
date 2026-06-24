import { NextResponse } from "next/server";
import { z } from "zod";
import { env, hasReplicateEnv, hasSupabaseAdminEnv } from "@/lib/config";
import { submitGeneration } from "@/lib/images/replicate";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  prompt: z.string().min(3).max(1000),
  style: z.enum(["realistic", "anime"]).default("realistic"),
  shape: z.enum(["portrait", "square"]).default("portrait"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!hasReplicateEnv()) {
    return NextResponse.json({ error: "Image generator is not configured." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to generate images." }, { status: 401 });

  const cost = env.imageCreditCost;
  if (user.credits < cost) {
    return NextResponse.json({ error: "Not enough credits.", code: "no-credits" }, { status: 402 });
  }

  let promptId: string;
  try {
    ({ promptId } = await submitGeneration({
      userPrompt: parsed.data.prompt,
      style: parsed.data.style,
      shape: parsed.data.shape,
      userId: user.id,
    }));
  } catch (error) {
    console.error("[images/generate]", error);
    return NextResponse.json({ error: "Could not reach the image generator. Try again." }, { status: 502 });
  }

  // Deduct credits up front; the status route refunds if generation fails.
  const nextCredits = Math.max(0, user.credits - cost);
  if (hasSupabaseAdminEnv() && user.id !== "demo-user") {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("users_profile")
      .update({ credits: nextCredits, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -cost,
      reason: "image_generation",
      metadata: { prompt_id: promptId, style: parsed.data.style, shape: parsed.data.shape },
    });
  }

  return NextResponse.json({ promptId, credits: nextCredits, cost });
}
