-- User-created characters (AI girlfriend/boyfriend builder).
-- created_by null = official catalog character; set = a user's private creation.
alter table public.characters
  add column if not exists created_by uuid references public.users_profile(id) on delete cascade,
  add column if not exists portrait_status text not null default 'ready'
    check (portrait_status in ('pending', 'ready', 'failed'));

create index if not exists characters_created_by_idx on public.characters (created_by);
