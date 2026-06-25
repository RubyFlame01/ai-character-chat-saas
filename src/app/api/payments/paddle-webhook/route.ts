import { NextResponse } from "next/server";
import { verifyPaddleWebhook } from "@/lib/payments/paddle";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { pricingPlans } from "@/lib/pricing";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("paddle-signature") ?? "";

  const valid = await verifyPaddleWebhook(body, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event_type: string;
    data: {
      id: string;
      status: string;
      customer_id?: string;
      items?: Array<{ price: { id: string } }>;
      custom_data?: { user_id?: string };
    };
  };

  if (
    event.event_type === "transaction.completed" ||
    event.event_type === "subscription.activated"
  ) {
    const userId = event.data.custom_data?.user_id;
    const priceId = event.data.items?.[0]?.price?.id;

    if (!userId || !priceId || !hasSupabaseAdminEnv()) {
      return NextResponse.json({ ok: true });
    }

    const plan = pricingPlans.find((p) => p.paddlePriceId === priceId);
    if (!plan) return NextResponse.json({ ok: true });

    const supabase = createSupabaseAdminClient();

    // Get current credits
    const { data: profile } = await supabase
      .from("users_profile")
      .select("credits")
      .eq("id", userId)
      .single();

    await supabase.from("users_profile").update({
      subscription_tier: plan.id,
      credits: (profile?.credits ?? 0) + plan.credits,
    }).eq("id", userId);

    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: plan.credits,
      reason: `subscription_${plan.id}`,
    });

    await supabase.from("payment_orders").insert({
      user_id: userId,
      provider: "paddle",
      provider_order_id: event.data.id,
      status: "completed",
      amount_cents: Number(plan.price.replace(/\D/g, "")) * 100,
      credits: plan.credits,
      plan_id: plan.id,
      subscription_tier: plan.id,
      metadata: { paddle_event: event.event_type, price_id: priceId },
    });
  }

  return NextResponse.json({ ok: true });
}
