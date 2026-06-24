import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Refund Policy" };

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pt-4 text-xl font-bold text-white">{children}</h2>
);

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy">
      <p className="text-xs text-zinc-500">Last updated: June 12, 2026</p>

      <SectionTitle>1. Digital Goods</SectionTitle>
      <p>
        Subscriptions on {siteConfig.name} grant credits that are consumed as you chat. Because
        credits are consumable digital content delivered immediately, statutory withdrawal rights
        may lapse once you start using them, where permitted by local consumer law.
      </p>

      <SectionTitle>2. When We Refund</SectionTitle>
      <p>
        We refund the current billing period in full if: you were charged after cancelling, you were
        charged twice for the same period, or a technical fault on our side made the Service
        substantially unusable and support could not resolve it. Partial-use refunds are assessed
        case by case based on credits consumed.
      </p>

      <SectionTitle>3. Cancellation</SectionTitle>
      <p>
        You can cancel your subscription at any time from the dashboard or via the payment
        provider&apos;s support portal. Cancellation stops future charges; you keep access and remaining
        credits until the end of the paid period.
      </p>

      <SectionTitle>4. How to Request</SectionTitle>
      <p>
        Contact support with your account email and the order ID from your receipt within 14 days of
        the charge. Refunds are issued to the original payment method by our payment processor and
        typically arrive within 5–10 business days. Please contact us before initiating a chargeback —
        chargebacks on consumed credits may lead to account suspension.
      </p>
    </LegalPage>
  );
}
