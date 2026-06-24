import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Content Policy & Complaints" };

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pt-4 text-xl font-bold text-white">{children}</h2>
);

export default function ContentPolicyPage() {
  const domain = new URL(siteConfig.url).hostname.replace(/^www\./, "");

  return (
    <LegalPage title="Content Policy & Complaints">
      <p className="text-xs text-zinc-500">Last updated: June 12, 2026</p>

      <SectionTitle>1. All Content Is Fictional and AI-Generated</SectionTitle>
      <p>
        Every character on {siteConfig.name} is entirely fictional and computer-generated. Character
        images are synthetic renders; conversations are produced by AI language models. No real
        person is depicted, recorded, or involved in any content on this platform, and no content
        depicts any real person&apos;s likeness.
      </p>

      <SectionTitle>2. 18 U.S.C. § 2257 Statement</SectionTitle>
      <p>
        Because {siteConfig.name} hosts no visual depictions of actual human beings — sexually
        explicit or otherwise — the record-keeping requirements of 18 U.S.C. § 2257 and 28 C.F.R. 75
        do not apply to the content on this site. All characters are fictional and are presented as
        adults aged 18 or older.
      </p>

      <SectionTitle>3. Prohibited Content</SectionTitle>
      <p>
        The following are strictly prohibited, both in user prompts and in generated output, and are
        enforced by automated safeguards and moderation: any sexual content involving minors or
        characters presented as or appearing to be minors; non-consensual sexual activity, including
        depictions of rape or coercion presented as desirable; sexualized violence or bestiality;
        content depicting real, identifiable people; and use of the Service to harass, defraud, or
        commit any illegal act. Attempts to elicit such content result in account termination, and
        child sexual abuse material is reported to the relevant authorities (e.g. NCMEC) as required
        by law.
      </p>

      <SectionTitle>4. Reporting Content and Complaints</SectionTitle>
      <p>
        If you believe any content on this platform violates this policy, infringes your rights, or
        depicts a real person, email <span className="text-white">abuse@{domain}</span> with a link or
        description. We acknowledge complaints within 7 days, investigate, and remove confirmed
        violating content. If you appear in content without consent, it will be removed immediately
        upon verification. Appeals against moderation decisions can be sent to the same address and
        are resolved within 7 days, and disagreements about depiction-removal are resolved by a
        neutral process consistent with card-network rules.
      </p>

      <SectionTitle>5. Age Verification</SectionTitle>
      <p>
        The Service is restricted to adults. We require age affirmation at entry, label the site
        with the RTA (Restricted To Adults) meta label so parental-control software can block it,
        and may require additional age verification where local law demands it.
      </p>
    </LegalPage>
  );
}
