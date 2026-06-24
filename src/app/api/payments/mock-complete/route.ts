import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { pricingPlans } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/server/auth";
import { applySubscriptionReset } from "@/lib/server/subscription-billing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/types/domain";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const planId = url.searchParams.get("plan") as SubscriptionTier | null;
  const providerOrderId = url.searchParams.get("order") ?? undefined;
  const plan = pricingPlans.find((item) => item.id === planId);
  const origin = url.origin;

  if (!plan || !planId) {
    return NextResponse.redirect(`${origin}/pricing?checkout=invalid-plan`);
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/pricing`);
  }

  await applySubscriptionReset({
    userId: user.id,
    tier: planId,
    source: "checkout",
    providerOrderId,
  });

  if (hasSupabaseAdminEnv() && providerOrderId && user.id !== "demo-user") {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("payment_orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("provider_order_id", providerOrderId)
      .eq("user_id", user.id);
  }

  return NextResponse.redirect(
    `${origin}/dashboard?checkout=mock-success&plan=${plan.id}&tier=${plan.id}&credits=${plan.credits}`,
  );
}
