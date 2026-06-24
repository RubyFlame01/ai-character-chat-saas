alter table public.users_profile
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'silver', 'gold', 'platinum')),
  add column if not exists subscription_status text not null default 'free'
    check (subscription_status in ('free', 'active', 'past_due', 'cancelled')),
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_renews_at timestamptz,
  add column if not exists memory_enabled boolean not null default false;

alter table public.payment_orders
  add column if not exists plan_id text,
  add column if not exists subscription_tier text
    check (subscription_tier in ('free', 'silver', 'gold', 'platinum'));

create index if not exists users_profile_subscription_idx
  on public.users_profile (subscription_tier, subscription_status);
