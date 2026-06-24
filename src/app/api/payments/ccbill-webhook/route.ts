import { NextResponse } from "next/server";
import { env, hasSupabaseAdminEnv } from "@/lib/config";
import { pricingPlans } from "@/lib/pricing";
import { applySubscriptionReset } from "@/lib/server/subscription-billing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/types/domain";

// CCBill Webhooks endpoint. Configure in the CCBill admin as:
//   https://<site>/api/payments/ccbill-webhook?token=<CCBILL_WEBHOOK_SECRET>
// CCBill appends ?eventType=... and posts the event payload. Custom fields
// (orderId, userId, planId) set at checkout are echoed back in the payload.
// Before go-live, verify field names against the CCBill Webhooks reference
// for your account type — sandbox-test NewSaleSuccess and RenewalSuccess.

type CcbillEvent = Record<string, string>;

const FULFILLING_EVENTS = new Set(["NewSaleSuccess", "RenewalSuccess"]);

async function parseEvent(request: Request): Promise<CcbillEvent> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as CcbillEvent;
  }
  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
}

function field(event: CcbillEvent, name: string) {
  return event[name] ?? event[`X-${name}`] ?? event[name.toLowerCase()];
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (!env.ccbillWebhookSecret || url.searchParams.get("token") !== env.ccbillWebhookSecret) {
    return NextResponse.json({ error: "Invalid webhook token." }, { status: 401 });
  }

  const event = await parseEvent(request);
  const eventType = url.searchParams.get("eventType") ?? field(event, "eventType");

  if (!eventType || !FULFILLING_EVENTS.has(eventType)) {
    // Acknowledge non-fulfilling events (cancellations, chargebacks, etc.)
    // so CCBill stops retrying; handle them explicitly as the product grows.
    return NextResponse.json({ received: true, eventType });
  }

  const orderId = field(event, "orderId");
  const userId = field(event, "userId");
  const planId = field(event, "planId") as SubscriptionTier | undefined;
  const plan = pricingPlans.find((item) => item.id === planId);

  if (!userId || !plan || !planId) {
    return NextResponse.json({ error: "Missing custom fields on event.", eventType }, { status: 400 });
  }

  await applySubscriptionReset({
    userId,
    tier: planId,
    source: eventType === "RenewalSuccess" ? "scheduled_renewal" : "checkout",
    providerOrderId: orderId,
  });

  if (hasSupabaseAdminEnv() && orderId) {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("payment_orders")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
        metadata: { ccbill_subscription_id: field(event, "subscriptionId") ?? null, event_type: eventType },
      })
      .eq("provider_order_id", orderId)
      .eq("user_id", userId);
  }

  return NextResponse.json({ received: true, eventType });
}
