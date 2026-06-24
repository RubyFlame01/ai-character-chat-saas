import { env, hasCcbillEnv } from "@/lib/config";
import { ccbillPaymentProvider } from "@/lib/payments/ccbill";
import { mockPaymentProvider } from "@/lib/payments/mock";
import type { PaymentProvider } from "@/lib/payments/types";

export function getPaymentProvider(): PaymentProvider {
  switch (env.paymentProvider) {
    case "ccbill":
      if (!hasCcbillEnv()) {
        console.warn("PAYMENT_PROVIDER=ccbill but CCBill env vars are missing; falling back to mock checkout.");
        return mockPaymentProvider;
      }
      return ccbillPaymentProvider;
    case "mock":
    default:
      return mockPaymentProvider;
  }
}
