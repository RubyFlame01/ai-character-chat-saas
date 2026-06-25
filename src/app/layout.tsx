import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { AgeGate } from "@/components/layout/age-gate";
import { LayoutShell } from "@/components/layout/layout-shell";
import { AuthModalShell } from "@/components/auth/auth-modal-shell";
import { AGE_GATE_COOKIE } from "@/lib/age-gate";
import { getCurrentUser } from "@/lib/server/auth";
import { siteConfig } from "@/lib/config";
import { alternates, getDictionary, getDirection, getLocale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - 18+ AI Sex Chat`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} - 18+ AI Sex Chat`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - 18+ AI Sex Chat`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  alternates: {
    languages: alternates("/"),
  },
  other: {
    rating: "RTA-5042-1996-1400-1577-RTA",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const direction = getDirection(locale);
  const dictionary = getDictionary(locale);
  const ageVerified = (await cookies()).get(AGE_GATE_COOKIE)?.value === "1";
  const user = await getCurrentUser();

  const sidebarUser = user
    ? { id: user.id, displayName: user.displayName, credits: user.credits, isAdmin: user.isAdmin }
    : null;

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-zinc-50">
        {!ageVerified && <AgeGate {...dictionary.ageGate} />}
        <AuthModalShell />
        <LayoutShell user={sidebarUser}>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/[0.06] px-8 py-5 text-xs text-zinc-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>18+ · RTA-labeled adult content platform</span>
              <nav className="flex gap-4">
                <a href="/privacy" className="hover:text-zinc-400">Privacy</a>
                <a href="/terms" className="hover:text-zinc-400">Terms</a>
                <a href="/content-policy" className="hover:text-zinc-400">Content Policy</a>
                <a href="/refund-policy" className="hover:text-zinc-400">Refunds</a>
              </nav>
            </div>
          </footer>
        </LayoutShell>
      </body>
    </html>
  );
}
