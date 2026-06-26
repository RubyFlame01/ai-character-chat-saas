import { BarChart3, Database, LineChart, Tags, Users } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { LiveOnlineCard } from "@/components/analytics/live-online-card";

export default function AdminPage() {
  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wide text-fuchsia-200">Admin</p>
        <h1 className="mt-3 text-4xl font-black text-white">Content operations</h1>

        {/* Live stats */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <LiveOnlineCard />
          <div className="rounded-lg border border-white/10 bg-white/[.045] p-6">
            <BarChart3 className="text-fuchsia-200" />
            <h2 className="mt-5 text-xl font-black text-white">Traffic</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-300">
              Visitors, page views, top pages and countries (Vercel Web Analytics).
            </p>
            <LinkButton
              href="https://vercel.com/dashboard"
              variant="secondary"
              className="mt-5"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Vercel
            </LinkButton>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[.045] p-6">
            <LineChart className="text-fuchsia-200" />
            <h2 className="mt-5 text-xl font-black text-white">Product analytics</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-300">
              Events, funnels, retention and session replays (PostHog).
            </p>
            <LinkButton
              href="https://us.posthog.com"
              variant="secondary"
              className="mt-5"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open PostHog
            </LinkButton>
          </div>
        </div>

        {/* Content management */}
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            ["Characters", "Upload, edit, assign images, feature, hide", Database, "/admin/characters"],
            ["Categories", "Manage category taxonomy", Tags, "/admin/categories"],
            ["Users", "Review users and adjust credits", Users, "/admin/users"],
          ].map(([title, body, Icon, href]) => (
            <div key={title as string} className="rounded-lg border border-white/10 bg-white/[.045] p-6">
              <Icon className="text-fuchsia-200" />
              <h2 className="mt-5 text-xl font-black text-white">{title as string}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-300">{body as string}</p>
              <LinkButton href={href as string} variant="secondary" className="mt-5">Open</LinkButton>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
