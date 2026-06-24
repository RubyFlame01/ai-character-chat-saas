import type { SubscriptionTier } from "@/types/domain";

export type CheckoutInput = {
  userId: string;
  planId: string;
  subscriptionTier: SubscriptionTier;
  amountCents: number;
  credits: number;
};

export type CheckoutResult = {
  provider: string;
  orderId: string;
  checkoutUrl: string;
};

export interface PaymentProvider {
  name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}
