create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users_profile(id) on delete set null,
  user_email text,
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

-- Only admins can read support messages
create policy "admins read support_messages"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.users_profile
      where id = auth.uid() and is_admin = true
    )
  );

-- Authenticated and anonymous users can insert
create policy "anyone can send support"
  on public.support_messages for insert
  with check (true);
