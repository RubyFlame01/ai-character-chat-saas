create or replace function public.subscription_credits_for_tier(p_tier text)
returns integer
language sql
immutable
as $$
  select case p_tier
    when 'silver' then 2500
    when 'gold' then 7500
    when 'platinum' then 18000
    else 100
  end
$$;

create or replace function public.apply_subscription_renewal(
  p_user_id uuid,
  p_subscription_tier text,
  p_period_days integer default 30,
  p_metadata jsonb default '{}'::jsonb
)
returns public.users_profile
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_credits integer;
  new_credits integer;
  renewed_profile public.users_profile;
begin
  if p_subscription_tier not in ('free', 'silver', 'gold', 'platinum') then
    raise exception 'Invalid subscription tier: %', p_subscription_tier;
  end if;

  select credits into previous_credits
  from public.users_profile
  where id = p_user_id
  for update;

  if previous_credits is null then
    raise exception 'Profile not found for user: %', p_user_id;
  end if;

  new_credits := public.subscription_credits_for_tier(p_subscription_tier);

  update public.users_profile
  set
    credits = new_credits,
    subscription_tier = p_subscription_tier,
    subscription_status = case when p_subscription_tier = 'free' then 'free' else 'active' end,
    subscription_started_at = coalesce(subscription_started_at, now()),
    subscription_renews_at = case
      when p_subscription_tier = 'free' then null
      else now() + make_interval(days => p_period_days)
    end,
    memory_enabled = p_subscription_tier in ('gold', 'platinum'),
    updated_at = now()
  where id = p_user_id
  returning * into renewed_profile;

  insert into public.credit_transactions (user_id, amount, reason, metadata)
  values (
    p_user_id,
    new_credits,
    case when p_subscription_tier = 'free' then 'free_trial_reset' else 'subscription_renewal' end,
    p_metadata || jsonb_build_object(
      'subscription_tier', p_subscription_tier,
      'previous_credits', previous_credits,
      'new_credits', new_credits,
      'unused_credits_reset', true
    )
  );

  return renewed_profile;
end;
$$;

create or replace function public.renew_due_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  profile record;
  renewed_count integer := 0;
begin
  for profile in
    select id, subscription_tier
    from public.users_profile
    where subscription_status = 'active'
      and subscription_tier in ('silver', 'gold', 'platinum')
      and subscription_renews_at is not null
      and subscription_renews_at <= now()
  loop
    perform public.apply_subscription_renewal(
      profile.id,
      profile.subscription_tier,
      30,
      jsonb_build_object('source', 'scheduled_renewal')
    );
    renewed_count := renewed_count + 1;
  end loop;

  return renewed_count;
end;
$$;
