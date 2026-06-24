import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy" };

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pt-4 text-xl font-bold text-white">{children}</h2>
);

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="text-xs text-zinc-500">Last updated: June 12, 2026</p>

      <SectionTitle>1. What We Collect</SectionTitle>
      <p>
        To operate {siteConfig.name} we store: account data (email, display name), subscription and
        credit balances, payment order records (order IDs and status only — card details are handled
        exclusively by our payment processor and never reach our servers), and your conversations
        with AI characters, which are needed to provide chat history and character memory.
      </p>

      <SectionTitle>2. How Conversations Are Processed</SectionTitle>
      <p>
        Messages are processed server-side and forwarded to third-party AI model providers (such as
        OpenRouter and the model vendors available through it) solely to generate replies. We send
        only the conversation content and character instructions — not your email or identity. AI
        providers may process data under their own policies; we select providers that do not use API
        traffic for advertising.
      </p>

      <SectionTitle>3. Sensitive Nature of the Data</SectionTitle>
      <p>
        We understand that adult chat history is sensitive. We do not sell your data, do not share
        conversations with advertisers, and restrict internal access to what is needed for support
        and abuse prevention. Billing statements use a discreet descriptor where the payment
        processor supports it.
      </p>

      <SectionTitle>4. Cookies</SectionTitle>
      <p>
        We use strictly necessary cookies only: authentication (session), language preference, and
        age-verification confirmation. We do not use third-party advertising or tracking cookies.
      </p>

      <SectionTitle>5. Your Rights (GDPR / KVKK / CCPA)</SectionTitle>
      <p>
        Depending on your jurisdiction you have the right to access, correct, export, or delete your
        personal data, and to object to or restrict processing. Deleting your account removes your
        profile and conversations from production systems; backups expire on a rolling schedule.
        To exercise these rights, contact us at the address below.
      </p>

      <SectionTitle>6. Retention and Security</SectionTitle>
      <p>
        Data is retained while your account is active and deleted or anonymized after account
        deletion, except where law requires longer retention (e.g. payment records). Data is stored
        with our infrastructure providers (Supabase) using encryption in transit and at rest, with
        row-level security separating user data.
      </p>

      <SectionTitle>7. Contact</SectionTitle>
      <p>
        Privacy requests: privacy@
        {new URL(siteConfig.url).hostname.replace(/^www\./, "")}
      </p>
    </LegalPage>
  );
}
