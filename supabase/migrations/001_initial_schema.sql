create extension if not exists "pgcrypto";

create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  credits integer not null default 100 check (credits >= 0),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  gender text not null check (gender in ('female', 'male')),
  mode text not null check (mode in ('realistic', 'anime')),
  category_id uuid references public.categories(id) on delete set null,
  short_description text not null,
  personality text not null,
  greeting text not null,
  tags text[] not null default '{}',
  image_path text not null,
  featured boolean not null default false,
  visible boolean not null default true,
  mood text not null default 'romantic',
  credit_cost integer not null default 2 check (credit_cost > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  token_count integer not null default 0,
  credit_cost integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  amount integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  provider text not null,
  provider_order_id text,
  status text not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  credits integer not null check (credits > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_visible_featured_idx on public.characters (visible, featured);
create index if not exists characters_slug_idx on public.characters (slug);
create index if not exists conversations_user_idx on public.conversations (user_id, updated_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists credit_transactions_user_idx on public.credit_transactions (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_profile_updated_at on public.users_profile;
create trigger users_profile_updated_at before update on public.users_profile
for each row execute function public.set_updated_at();

drop trigger if exists characters_updated_at on public.characters;
create trigger characters_updated_at before update on public.characters
for each row execute function public.set_updated_at();

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

drop trigger if exists payment_orders_updated_at on public.payment_orders;
create trigger payment_orders_updated_at before update on public.payment_orders
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, email, display_name, credits)
  values (new.id, new.email, split_part(new.email, '@', 1), 100)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users_profile enable row level security;
alter table public.categories enable row level security;
alter table public.characters enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.payment_orders enable row level security;

create policy "Profiles are readable by owner" on public.users_profile
for select using (auth.uid() = id);

create policy "Profiles are updateable by owner" on public.users_profile
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Public categories are readable" on public.categories
for select using (true);

create policy "Visible characters are readable" on public.characters
for select using (visible = true);

create policy "Users read own conversations" on public.conversations
for select using (auth.uid() = user_id);

create policy "Users create own conversations" on public.conversations
for insert with check (auth.uid() = user_id);

create policy "Users read own messages" on public.messages
for select using (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
    and conversations.user_id = auth.uid()
  )
);

create policy "Users create messages in own conversations" on public.messages
for insert with check (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
    and conversations.user_id = auth.uid()
  )
);

create policy "Users read own credit transactions" on public.credit_transactions
for select using (auth.uid() = user_id);

create policy "Users read own payment orders" on public.payment_orders
for select using (auth.uid() = user_id);
