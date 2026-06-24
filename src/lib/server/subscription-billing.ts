import { hasSupabaseAdminEnv } from "@/lib/config";
import { getPlanEntitlements } from "@/lib/subscriptions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/types/domain";

const paidTiers = ["silver", "gold", "platinum"] as const;

function nextRenewalDate(periodDays = 30) {
  const date = new Date();
  date.setDate(date.getDate() + periodDays);
  return date.toISOString();
}

function isPaidTier(tier: SubscriptionTier) {
  return paidTiers.includes(tier as (typeof paidTiers)[number]);
}

export async function applySubscriptionReset({
  userId,
  tier,
  source,
  providerOrderId,
  periodDays = 30,
}: {
  userId: string;
  tier: SubscriptionTier;
  source: "checkout" | "scheduled_renewal" | "admin";
  providerOrderId?: string;
  periodDays?: number;
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const entitlements = getPlanEntitlements(tier);
  const { data: profile, error: profileError } = await supabase
    .from("users_profile")
    .select("credits,subscription_started_at")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const nextCredits = entitlements.monthlyCredits;
  const paid = isPaidTier(tier);
  const now = new Date().toISOString();
  const renewsAt = paid ? nextRenewalDate(periodDays) : null;

  const { data: updatedProfile, error: updateError } = await supabase
    .from("users_profile")
    .update({
      credits: nextCredits,
      subscription_tier: tier,
      subscription_status: paid ? "active" : "free",
      subscription_started_at: profile?.subscription_started_at ?? now,
      subscription_renews_at: renewsAt,
      memory_enabled: entitlements.canUseAdvancedMemory,
      updated_at: now,
    })
    .eq("id", userId)
    .select("credits,subscription_tier,subscription_status,subscription_renews_at")
    .single();

  if (updateError) throw updateError;

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: nextCredits,
    reason: paid ? "subscription_renewal" : "free_trial_reset",
    metadata: {
      source,
      provider_order_id: providerOrderId ?? null,
      subscription_tier: tier,
      previous_credits: profile?.credits ?? 0,
      new_credits: nextCredits,
      unused_credits_reset: true,
      period_days: paid ? periodDays : null,
      renews_at: renewsAt,
    },
  });

  return updatedProfile;
}

export async function renewDueSubscriptions() {
  if (!hasSupabaseAdminEnv()) {
    return 0;
  }

  const supabase = createSupabaseAdminClient();
  const { data: dueProfiles, error } = await supabase
    .from("users_profile")
    .select("id,subscription_tier")
    .eq("subscription_status", "active")
    .in("subscription_tier", paidTiers)
    .lte("subscription_renews_at", new Date().toISOString());

  if (error) throw error;

  for (const profile of dueProfiles ?? []) {
    await applySubscriptionReset({
      userId: profile.id,
      tier: profile.subscription_tier,
      source: "scheduled_renewal",
    });
  }

  return dueProfiles?.length ?? 0;
}
