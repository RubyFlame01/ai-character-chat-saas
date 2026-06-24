alter table public.characters
  add column if not exists age integer not null default 21 check (age >= 18),
  add column if not exists backstory text not null default '',
  add column if not exists relationship text not null default '',
  add column if not exists scenario text not null default '',
  add column if not exists occupation text not null default '',
  add column if not exists image_prompt_key text not null default '',
  add column if not exists localizations jsonb not null default '{}'::jsonb;
