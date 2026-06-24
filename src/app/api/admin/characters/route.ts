import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  slug: z.string(),
  field: z.enum(["featured", "visible"]),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin required." }, { status: 403 });

  const payload = patchSchema.parse(await request.json());

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const supabase = createSupabaseAdminClient();
  const { data: character, error: readError } = await supabase
    .from("characters")
    .select("featured,visible")
    .eq("slug", payload.slug)
    .single();

  if (readError || !character) {
    return NextResponse.json({ error: "Character not found." }, { status: 404 });
  }

  const current = character[payload.field] as boolean;
  const update =
    payload.field === "featured"
      ? { featured: !current, updated_at: new Date().toISOString() }
      : { visible: !current, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("characters")
    .update(update)
    .eq("slug", payload.slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true });
}
