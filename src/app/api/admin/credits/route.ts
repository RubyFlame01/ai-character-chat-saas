import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, delta } = (await request.json()) as { userId?: string; delta?: number };
  if (!userId || typeof delta !== "number" || delta === 0) {
    return NextResponse.json({ error: "userId and non-zero delta required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Get current credits
  const { data: profile, error: fetchErr } = await supabase
    .from("users_profile")
    .select("credits")
    .eq("id", userId)
    .single();

  if (fetchErr || !profile) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const newCredits = Math.max(0, (profile.credits ?? 0) + delta);
  const { error: updateErr } = await supabase
    .from("users_profile")
    .update({ credits: newCredits })
    .eq("id", userId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, newCredits });
}
