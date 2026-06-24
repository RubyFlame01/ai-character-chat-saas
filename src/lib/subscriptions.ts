import type { SubscriptionTier } from "@/types/domain";

export type PlanEntitlements = {
  tier: SubscriptionTier;
  label: string;
  monthlyCredits: number;
  maxMemoryCharacters: number;
  canUseStandardModel: boolean;
  canUsePremiumModel: boolean;
  canChooseModel: boolean;
  canUseAdvancedMemory: boolean;
  priorityGeneration: boolean;
};

export const planEntitlements: Record<SubscriptionTier, PlanEntitlements> = {
  free: {
    tier: "free",
    label: "Free",
    monthlyCredits: 100,
    maxMemoryCharacters: 0,
    canUseStandardModel: false,
    canUsePremiumModel: false,
    canChooseModel: false,
    canUseAdvancedMemory: false,
    priorityGeneration: false,
  },
  silver: {
    tier: "silver",
    label: "Silver",
    monthlyCredits: 2500,
    maxMemoryCharacters: 3,
    canUseStandardModel: true,
    canUsePremiumModel: false,
    canChooseModel: false,
    canUseAdvancedMemory: false,
    priorityGeneration: false,
  },
  gold: {
    tier: "gold",
    label: "Gold",
    monthlyCredits: 7500,
    maxMemoryCharacters: 15,
    canUseStandardModel: true,
    canUsePremiumModel: false,
    canChooseModel: true,
    canUseAdvancedMemory: true,
    priorityGeneration: false,
  },
  platinum: {
    tier: "platinum",
    label: "Platinum",
    monthlyCredits: 18000,
    maxMemoryCharacters: 60,
    canUseStandardModel: true,
    canUsePremiumModel: true,
    canChooseModel: true,
    canUseAdvancedMemory: true,
    priorityGeneration: true,
  },
};

export function normalizeSubscriptionTier(tier?: string | null): SubscriptionTier {
  if (tier === "silver" || tier === "gold" || tier === "platinum") return tier;
  return "free";
}

export function getPlanEntitlements(tier?: string | null) {
  return planEntitlements[normalizeSubscriptionTier(tier)];
}
