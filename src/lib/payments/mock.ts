import type { PaymentProvider } from "@/lib/payments/types";

export const mockPaymentProvider: PaymentProvider = {
  name: "mock",
  async createCheckout(input) {
    const orderId = `mock_${input.planId}_${Date.now()}`;
    return {
      provider: "mock",
      orderId,
      checkoutUrl: `/api/payments/mock-complete?plan=${input.planId}&order=${orderId}`,
    };
  },
};
