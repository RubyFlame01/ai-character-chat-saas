import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const REFERRAL_BONUS = 50; // credits for both referrer and referee

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.id === "demo-user") {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { code } = (await request.json()) as { code?: string };
  if (!code?.trim()) {
    return NextResponse.json({ error: "Referral code is required." }, { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) return NextResponse.json({ ok: true, bonus: REFERRAL_BONUS });

  const supabase = createSupabaseAdminClient();

  // Check user hasn't already been referred
  const { data: myProfile } = await (supabase as any)
    .from("users_profile")
    .select("referred_by,credits")
    .eq("id", user.id)
    .single();

  if (myProfile?.referred_by) {
    return NextResponse.json({ error: "You've already used a referral code." }, { status: 400 });
  }

  // Find referrer by code
  const { data: referrer } = await (supabase as any)
    .from("users_profile")
    .select("id,credits,referral_count")
    .eq("referral_code", code.trim().toLowerCase())
    .single();

  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code." }, { status: 404 });
  }

  if ((referrer as any).id === user.id) {
    return NextResponse.json({ error: "Cannot use your own referral code." }, { status: 400 });
  }

  // Credit both users
  await Promise.all([
    (supabase as any)
      .from("users_profile")
      .update({
        referred_by: referrer.id,
        credits: (myProfile?.credits ?? 0) + REFERRAL_BONUS,
      })
      .eq("id", user.id),
    (supabase as any)
      .from("users_profile")
      .update({
        credits: (referrer.credits ?? 0) + REFERRAL_BONUS,
        referral_count: (referrer.referral_count ?? 0) + 1,
      })
      .eq("id", referrer.id),
    supabase.from("credit_transactions").insert([
      { user_id: user.id, amount: REFERRAL_BONUS, reason: "referral_signup" },
      { user_id: referrer.id, amount: REFERRAL_BONUS, reason: "referral_reward" },
    ]),
  ]);

  return NextResponse.json({ ok: true, bonus: REFERRAL_BONUS });
}
