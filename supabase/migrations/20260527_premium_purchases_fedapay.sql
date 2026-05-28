create table if not exists public.premium_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'fedapay',
  provider_transaction_id text unique,
  provider_reference text,
  amount numeric not null default 9900,
  currency text not null default 'XOF',
  status text not null default 'pending',
  plan_code text not null default 'lifetime_9900_xof',
  checkout_url text,
  raw_event jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.premium_purchases add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.premium_purchases add column if not exists provider text not null default 'fedapay';
alter table public.premium_purchases add column if not exists provider_transaction_id text unique;
alter table public.premium_purchases add column if not exists provider_reference text;
alter table public.premium_purchases add column if not exists amount numeric not null default 9900;
alter table public.premium_purchases add column if not exists currency text not null default 'XOF';
alter table public.premium_purchases add column if not exists status text not null default 'pending';
alter table public.premium_purchases add column if not exists plan_code text not null default 'lifetime_9900_xof';
alter table public.premium_purchases add column if not exists checkout_url text;
alter table public.premium_purchases add column if not exists raw_event jsonb;
alter table public.premium_purchases add column if not exists approved_at timestamptz;
alter table public.premium_purchases add column if not exists created_at timestamptz not null default now();
alter table public.premium_purchases add column if not exists updated_at timestamptz not null default now();

alter table public.premium_purchases enable row level security;

drop policy if exists "premium_purchases_select_own" on public.premium_purchases;
create policy "premium_purchases_select_own"
on public.premium_purchases
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "premium_purchases_insert_own_pending" on public.premium_purchases;
create policy "premium_purchases_insert_own_pending"
on public.premium_purchases
for insert
to authenticated
with check (
  auth.uid() = user_id
  and provider = 'fedapay'
  and amount = 9900
  and currency = 'XOF'
  and status = 'pending'
  and plan_code = 'lifetime_9900_xof'
);

create index if not exists premium_purchases_user_status_idx
on public.premium_purchases (user_id, status);

create index if not exists premium_purchases_provider_transaction_idx
on public.premium_purchases (provider_transaction_id);

create or replace function public.has_premium_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_user_id and exists (
    select 1
    from public.premium_purchases
    where user_id = target_user_id
      and provider = 'fedapay'
      and status = 'approved'
      and plan_code = 'lifetime_9900_xof'
  );
$$;

grant execute on function public.has_premium_access(uuid) to authenticated;
