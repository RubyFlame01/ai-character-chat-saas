import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { checkGeneration } from "@/lib/images/replicate";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Polled by the builder success screen. When the ComfyUI portrait is ready it
// saves the image and points the character row at it.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const promptId = url.searchParams.get("promptId");
  if (!slug || !/^user-[a-z0-9-]+$/.test(slug) || !promptId || !/^[a-zA-Z0-9-]+$/.test(promptId)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const result = await checkGeneration(promptId).catch(() => ({ status: "pending" as const }));
  if (result.status === "pending") return NextResponse.json({ status: "pending" });

  if (result.status === "failed") {
    if (hasSupabaseAdminEnv()) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("characters").update({ portrait_status: "failed" }).eq("slug", slug).eq("created_by", user.id);
    }
    return NextResponse.json({ status: "failed" });
  }

  const dir = path.join(process.cwd(), "public", "images", "characters", slug);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "avatar.png");
  await writeFile(file, result.imageBytes);
  const imagePath = `/images/characters/${slug}/avatar.png`;

  if (hasSupabaseAdminEnv()) {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("characters")
      .update({ image_path: imagePath, portrait_status: "ready", updated_at: new Date().toISOString() })
      .eq("slug", slug)
      .eq("created_by", user.id);
  }

  return NextResponse.json({ status: "ready", url: imagePath });
}
