import { NextResponse } from "next/server";
import { z } from "zod";
import { pricingPlans } from "@/lib/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { getCurrentUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ planId: z.string() });

export async function POST(request: Request) {
  const { planId } = schema.parse(await request.json());
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const plan = pricingPlans.find((item) => item.id === planId);
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  const amountCents = Number(plan.price.replace(/\D/g, "")) * 100;
  const checkout = await getPaymentProvider().createCheckout({
    userId: user.id,
    planId: plan.id,
    subscriptionTier: plan.id,
    amountCents,
    credits: plan.credits,
  });

  if (hasSupabaseAdminEnv() && user.id !== "demo-user") {
    const supabase = createSupabaseAdminClient();
    await supabase.from("payment_orders").insert({
      user_id: user.id,
      provider: checkout.provider,
      provider_order_id: checkout.orderId,
      status: "pending",
      amount_cents: amountCents,
      credits: plan.credits,
      plan_id: plan.id,
      subscription_tier: plan.id,
      metadata: { checkout_url: checkout.checkoutUrl },
    });
  }

  return NextResponse.json(checkout);
}
