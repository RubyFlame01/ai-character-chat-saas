import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="cinematic-bg min-h-screen">
      <article className="mx-auto max-w-3xl px-4 py-16 leading-7 text-zinc-300 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-white">{title}</h1>
        <div className="mt-8 space-y-5">{children}</div>
      </article>
    </div>
  );
}
