"use client";

import { AlertCircle, Check, Crown, Sparkles, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { pricingPlans } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { usePaddleCheckout, isPaddleConfigured } from "@/components/payments/paddle-checkout";

export function PricingCards({
  labels,
  locale,
  userId,
  userEmail,
}: {
  labels: { buyCredits: string; oneTime: string };
  locale: string;
  userId?: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const { openCheckout } = usePaddleCheckout();

  async function checkout(planId: string, paddlePriceIdMonthly?: string, paddlePriceIdYearly?: string) {
    setError("");

    // Not logged in → show auth modal
    if (!userId) {
      router.push(`/?auth=signup&next=/pricing&plan=${planId}`);
      return;
    }

    const priceId = billing === "yearly" ? paddlePriceIdYearly : paddlePriceIdMonthly;

    // Paddle overlay checkout. When Paddle is configured we ONLY use Paddle —
    // never fall back to a server checkout that could grant free credits.
    if (isPaddleConfigured()) {
      if (!priceId) {
        setError("This plan is not available for the selected billing period yet.");
        return;
      }
      setLoadingPlan(planId);
      const opened = await openCheckout({ priceId, userId, userEmail, onError: setError });
      setLoadingPlan(null);
      if (!opened) {
        setError("Payment could not be opened. Please try again or contact support.");
      }
      return;
    }

    // Fallback: server-side checkout (mock / ccbill) — only when Paddle is not configured
    setLoadingPlan(planId);
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, billing }),
    });
    const data = (await response.json()) as { checkoutUrl?: string; error?: string };
    setLoadingPlan(null);
    if (!response.ok) {
      setError(data.error ?? "Checkout could not be started. Please try again.");
      return;
    }
    if (data.checkoutUrl) router.push(data.checkoutUrl);
  }

  void searchParams;

  const yearlyDiscount = 0.23; // approx 77% off if monthly is 4x

  return (
    <div>
      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
          <AlertCircle size={17} /> {error}
        </div>
      ) : null}

      {/* Billing toggle */}
      <div className="mb-10 flex justify-center">
        <div className="relative flex items-center rounded-full border border-white/[0.1] bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-bold transition",
              billing === "monthly" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={cn(
              "relative rounded-full px-5 py-2 text-sm font-bold transition",
              billing === "yearly" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            Yearly
            <span className="absolute -right-1 -top-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[9px] font-black text-white">
              77% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {pricingPlans.map((plan) => {
          const isFree = plan.id === "free";
          const isHighlighted = plan.highlighted;
          const basePrice = parseFloat(plan.price.replace("$", ""));
          const yearlyMonthly = (basePrice * (1 - yearlyDiscount)).toFixed(2);
          const yearlyTotal = (basePrice * (1 - yearlyDiscount) * 12).toFixed(2);

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border transition-all",
                isHighlighted
                  ? "border-violet-500/50 bg-gradient-to-b from-violet-900/30 to-[var(--card-bg)] shadow-[0_0_40px_rgba(124,58,237,.2)]"
                  : "border-white/[0.08] bg-[var(--card-bg)]",
              )}
            >
              {/* Most popular badge */}
              {isHighlighted && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <span className="rounded-full border border-violet-400/40 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-[0_0_16px_rgba(124,58,237,.4)]">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col p-6 pt-8">
                {/* Header */}
                <div className="mb-5">
                  <div className="mb-1 flex items-center gap-2">
                    {isHighlighted ? (
                      <Crown size={16} className="text-violet-300" />
                    ) : isFree ? (
                      <Sparkles size={16} className="text-zinc-400" />
                    ) : (
                      <Zap size={16} className="text-fuchsia-300" />
                    )}
                    <p className={cn("text-xs font-black uppercase tracking-widest", isHighlighted ? "text-violet-300" : isFree ? "text-zinc-500" : "text-fuchsia-300")}>
                      {plan.tierLabel}
                    </p>
                  </div>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-400">{plan.description}</p>
                </div>

                {/* Price */}
                {isFree ? (
                  <div className="mb-5">
                    <span className="text-4xl font-black text-white">Free</span>
                  </div>
                ) : (
                  <div className="mb-1">
                    {billing === "yearly" ? (
                      <>
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-black text-white">${yearlyMonthly}</span>
                          <span className="pb-1 text-sm text-zinc-400">/mo</span>
                          <span className="pb-1 text-sm text-zinc-500 line-through">{plan.price}/mo</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">Billed ${yearlyTotal}/year</p>
                      </>
                    ) : (
                      <>
                        {plan.originalPrice && (
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm text-zinc-500 line-through">{plan.originalPrice}/mo</span>
                            {plan.discountLabel && (
                              <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[10px] font-black text-white">
                                {plan.discountLabel}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-black text-white">{plan.price}</span>
                          <span className="pb-1 text-sm text-zinc-400">/mo</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Credits */}
                <p className={cn("mb-5 text-sm font-black", isHighlighted ? "text-violet-200" : "text-fuchsia-200/70")}>
                  {plan.credits.toLocaleString(locale)} credits/month
                </p>

                {/* CTA */}
                <button
                  type="button"
                  disabled={loadingPlan === plan.id}
                  onClick={() => checkout(plan.id, plan.paddlePriceId, plan.paddlePriceIdYearly)}
                  className={cn(
                    "mb-6 w-full rounded-xl py-3 text-sm font-bold transition",
                    isHighlighted
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_24px_rgba(124,58,237,.4)] hover:opacity-90 disabled:opacity-50"
                      : isFree
                        ? "border border-white/[0.1] bg-white/[0.05] text-zinc-300 hover:bg-white/[0.09]"
                        : "border border-violet-500/30 bg-violet-600/10 text-violet-200 hover:bg-violet-600/20",
                  )}
                >
                  {loadingPlan === plan.id ? "Opening..." : isFree ? "Start Free" : `Get ${plan.name}`}
                </button>

                {/* Divider */}
                <div className="mb-4 border-t border-white/[0.06]" />

                {/* Features */}
                <ul className="space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check size={15} className={cn("mt-0.5 shrink-0", isHighlighted ? "text-violet-400" : "text-fuchsia-400/70")} />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.badge && (
                  <p className="mt-4 rounded-lg border border-violet-300/20 bg-violet-300/[0.08] px-3 py-2 text-xs font-black uppercase tracking-wide text-violet-200">
                    {plan.badge}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trustpilot-style footer */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-3">
          <div className="text-center">
            <p className="text-xs font-bold text-zinc-500">Rated Excellent</p>
            <p className="text-lg font-black text-white">4.8 / 5</p>
          </div>
          <div className="h-8 w-px bg-white/[0.08]" />
          <div className="flex gap-1 text-yellow-400">
            {"★★★★★".split("").map((s, i) => <span key={i} className="text-xl">{s}</span>)}
          </div>
          <div className="h-8 w-px bg-white/[0.08]" />
          <p className="text-xs text-zinc-500">Billed discreetly</p>
        </div>
        <p className="text-xs text-zinc-600">Cancel anytime. No questions asked.</p>
      </div>
    </div>
  );
}
