import { hasSupabaseBrowserEnv } from "@/lib/config";
import { getPlanEntitlements, normalizeSubscriptionTier } from "@/lib/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  if (!hasSupabaseBrowserEnv()) {
    const subscriptionTier = "platinum" as const;
    return {
      id: "demo-user",
      email: "demo@velvet.ai",
      credits: 18000,
      isAdmin: true,
      displayName: "Demo Creator",
      subscriptionTier,
      subscriptionStatus: "active",
      subscriptionRenewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionStartedAt: new Date().toISOString(),
      entitlements: getPlanEntitlements(subscriptionTier),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await (supabase as any)
    .from("users_profile")
    .select("credits,is_admin,display_name,subscription_tier,subscription_status,subscription_started_at,subscription_renews_at,referral_code,referral_count")
    .eq("id", user.id)
    .single();
  const subscriptionTier = normalizeSubscriptionTier(profile?.subscription_tier);

  return {
    id: user.id,
    email: user.email ?? null,
    credits: profile?.credits ?? 0,
    isAdmin: profile?.is_admin ?? false,
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "User",
    subscriptionTier,
    subscriptionStatus: profile?.subscription_status ?? "free",
    subscriptionRenewsAt: profile?.subscription_renews_at ?? null,
    subscriptionStartedAt: profile?.subscription_started_at ?? null,
    entitlements: getPlanEntitlements(subscriptionTier),
    referralCode: (profile as any)?.referral_code ?? null,
    referralCount: (profile as any)?.referral_count ?? 0,
  };
}
