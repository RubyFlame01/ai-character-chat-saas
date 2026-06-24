import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { env, hasSupabaseAdminEnv } from "@/lib/config";
import { checkGeneration } from "@/lib/images/replicate";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const GENERATED_DIR = path.join(process.cwd(), "public", "images", "generated");

export async function GET(request: Request) {
  const promptId = new URL(request.url).searchParams.get("promptId");
  if (!promptId || !/^[a-zA-Z0-9-]+$/.test(promptId)) {
    return NextResponse.json({ error: "Invalid promptId." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const result = await checkGeneration(promptId).catch(() => ({ status: "pending" as const }));

  if (result.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }

  if (result.status === "failed") {
    // Refund the credits charged at submit time.
    if (hasSupabaseAdminEnv() && user.id !== "demo-user") {
      const supabase = createSupabaseAdminClient();
      await supabase
        .from("users_profile")
        .update({ credits: user.credits + env.imageCreditCost, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: env.imageCreditCost,
        reason: "image_generation_refund",
        metadata: { prompt_id: promptId },
      });
    }
    return NextResponse.json({ status: "failed", credits: user.credits + env.imageCreditCost });
  }

  // ready — persist the image and return its URL.
  const fileName = `${promptId}.png`;
  await mkdir(GENERATED_DIR, { recursive: true });
  await writeFile(path.join(GENERATED_DIR, fileName), result.imageBytes);
  return NextResponse.json({ status: "ready", url: `/images/generated/${fileName}` });
}
