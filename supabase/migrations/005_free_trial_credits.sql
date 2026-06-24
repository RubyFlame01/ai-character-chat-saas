alter table public.users_profile
  alter column credits set default 100;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, email, display_name, credits, subscription_tier, subscription_status)
  values (new.id, new.email, split_part(new.email, '@', 1), 100, 'free', 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;
