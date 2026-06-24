create table if not exists public.character_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  summary text not null default '',
  preferences jsonb not null default '{}'::jsonb,
  relationship_stage text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, character_id)
);

alter table public.character_memories enable row level security;

create policy "Users can read own character memories"
  on public.character_memories for select
  using (auth.uid() = user_id);

create policy "Users can upsert own character memories"
  on public.character_memories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own character memories"
  on public.character_memories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
