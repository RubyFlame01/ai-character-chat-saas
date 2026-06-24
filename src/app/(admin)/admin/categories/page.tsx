import { demoCategories, demoTags } from "@/lib/data";

export default function AdminCategoriesPage() {
  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-white">Categories and tags</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[.045] p-6">
            <h2 className="text-xl font-black text-white">Categories</h2>
            <div className="mt-4 space-y-3">
              {demoCategories.map((category) => (
                <div key={category.id} className="rounded-lg bg-zinc-950 p-4">
                  <p className="font-bold text-white">{category.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[.045] p-6">
            <h2 className="text-xl font-black text-white">Tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {demoTags.map((tag) => (
                <span key={tag} className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-200">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
