import { Database, Tags, Users } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wide text-fuchsia-200">Admin</p>
        <h1 className="mt-3 text-4xl font-black text-white">Content operations</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
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
