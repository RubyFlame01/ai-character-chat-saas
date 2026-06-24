import { CharacterAdminTable } from "@/components/admin/character-admin-table";
import { listAdminCharacters } from "@/lib/server/characters";

export default async function AdminCharactersPage() {
  const characters = await listAdminCharacters();

  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-white">Characters</h1>
        <p className="mt-3 text-zinc-300">Toggle featured and visibility, then connect Supabase service credentials for persistence.</p>
        <div className="mt-8 overflow-x-auto">
          <CharacterAdminTable characters={characters} />
        </div>
      </section>
    </div>
  );
}
