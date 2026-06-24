-- Referral codes
alter table public.users_profile
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.users_profile(id) on delete set null,
  add column if not exists referral_count integer not null default 0;

-- Auto-generate referral code on profile insert/update if missing
create or replace function generate_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := lower(substr(md5(new.id::text || clock_timestamp()::text), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists set_referral_code on public.users_profile;
create trigger set_referral_code
  before insert on public.users_profile
  for each row execute function generate_referral_code();

-- Message reactions
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  message_id text not null,
  reaction text not null check (reaction in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique(user_id, message_id)
);

alter table public.message_reactions enable row level security;

create policy "users manage own reactions"
  on public.message_reactions
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
