-- Baseline non destructive de la base Dudukan existante.
-- Objectif: versionner le schema reel observe en production sans supprimer ni vider de donnees.
-- A appliquer sur une base vide/preview. Sur une base existante, relire et adapter avant execution:
-- les CREATE POLICY / CREATE TRIGGER echouent si les objets existent deja, volontairement,
-- afin d'eviter de remplacer silencieusement des permissions ou triggers de production.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Core user/admin/config tables
-- ---------------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  description text
);

-- ---------------------------------------------------------------------
-- Free/offline-first finance tables
-- ---------------------------------------------------------------------

create table if not exists public.user_data (
  id uuid primary key references auth.users(id),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null,
  category text not null,
  note text,
  type text not null,
  date timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creditor text not null,
  total_amount bigint not null,
  paid_amount bigint default 0,
  due_date timestamptz
);

-- ---------------------------------------------------------------------
-- Premium/project tables
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  salary bigint default 0,
  accumulated_savings bigint default 0,
  current_month text,
  categories jsonb,
  updated_at timestamptz default timezone('utc'::text, now()),
  savings numeric default 0
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default '🎯'::text,
  description text,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline date,
  status text default 'active'::text,
  monthly_allocation numeric default 0,
  feasibility_score text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_recurring boolean default false,
  frequency text,
  is_complex boolean default false,
  type text default 'simple'::text,
  priority integer default 3
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  target_date date,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.project_contributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  note text,
  date timestamptz default now()
);

create table if not exists public.premium_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  transaction_type text not null,
  title text,
  description text,
  amount numeric,
  project_id uuid,
  project_name text,
  step_id uuid,
  step_name text,
  related_allocation_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.premium_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'fedapay'::text,
  provider_transaction_id text unique,
  provider_reference text,
  amount numeric not null default 9900,
  currency text not null default 'XOF'::text,
  status text not null default 'pending'::text,
  plan_code text not null default 'lifetime_9900_xof'::text,
  raw_event jsonb,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  checkout_url text
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index if not exists admin_audit_logs_admin_idx
on public.admin_audit_logs (admin_user_id, created_at desc);

create index if not exists admin_audit_logs_target_idx
on public.admin_audit_logs (target_user_id, created_at desc);

create index if not exists idx_debts_user
on public.debts (user_id);

create index if not exists idx_transactions_user_date
on public.transactions (user_id, date desc);

create index if not exists idx_projects_user
on public.projects (user_id, status);

create index if not exists idx_milestones_project
on public.milestones (project_id);

create index if not exists idx_contributions_project
on public.project_contributions (project_id, date desc);

create index if not exists premium_purchases_user_status_idx
on public.premium_purchases (user_id, status);

-- Present in production but redundant with premium_purchases_provider_transaction_id_key.
-- Kept in baseline for exact reproducibility; remove later through a reviewed cleanup migration.
create index if not exists premium_purchases_provider_transaction_idx
on public.premium_purchases (provider_transaction_id);

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

create trigger projects_updated_at
before update on public.projects
for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------
-- RPC / SQL functions
-- ---------------------------------------------------------------------

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
      and provider in ('fedapay', 'admin')
      and status = 'approved'
      and plan_code = 'lifetime_9900_xof'
  );
$$;

grant execute on function public.has_premium_access(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null
      and cmd.schema_name in ('public')
      and cmd.schema_name not in ('pg_catalog', 'information_schema')
      and cmd.schema_name not like 'pg_toast%'
      and cmd.schema_name not like 'pg_temp%'
    then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.app_settings enable row level security;
alter table public.user_data enable row level security;
alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.project_contributions enable row level security;
alter table public.premium_transactions enable row level security;
alter table public.premium_purchases enable row level security;

create policy "admin_users_self_select"
on public.admin_users for select to authenticated
using (auth.uid() = id);

create policy "admin_audit_logs_no_client_access"
on public.admin_audit_logs for all to authenticated
using (false)
with check (false);

create policy "app_settings_read_all"
on public.app_settings for select
using (true);

create policy "app_settings_admin_only"
on public.app_settings for all to authenticated
using (exists (select 1 from public.admin_users where admin_users.id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.id = auth.uid()));

create policy "Users can only access their own data"
on public.user_data for all to authenticated
using (auth.uid() = id);

create policy "transactions_own"
on public.transactions for all to authenticated
using (auth.uid() = user_id);

create policy "debts_own"
on public.debts for all to authenticated
using (auth.uid() = user_id);

create policy "profiles_own"
on public.profiles for all to authenticated
using (auth.uid() = id);

create policy "projects_own"
on public.projects for all to authenticated
using (auth.uid() = user_id);

create policy "milestones_own"
on public.milestones for all to authenticated
using (auth.uid() = user_id);

create policy "contributions_own"
on public.project_contributions for all to authenticated
using (auth.uid() = user_id);

create policy "Users access own transactions"
on public.premium_transactions for all to authenticated
using (auth.uid() = user_id);

create policy "premium_purchases_select_own"
on public.premium_purchases
for select
to authenticated
using (auth.uid() = user_id);

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

-- ---------------------------------------------------------------------
-- Storage baseline
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (
    name like auth.uid()::text || '-%'
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    name like auth.uid()::text || '-%'
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'avatars'
  and (
    name like auth.uid()::text || '-%'
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (
    name like auth.uid()::text || '-%'
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- ---------------------------------------------------------------------
-- Seed public settings
-- ---------------------------------------------------------------------

insert into public.app_settings (key, value, description)
values (
  'plus_plan',
  '{
    "code": "lifetime_9900_xof",
    "amount": 9900,
    "currency": "XOF",
    "originalAmount": 59900,
    "productName": "Dudukan Plus",
    "badge": "Dudukan Plus a vie",
    "headline": "Passez au niveau superieur",
    "subtitle": "Planification intelligente, projets complexes et suivi guide pour garder le cap.",
    "offerLabel": "Offre de lancement",
    "normalPriceLabel": "Prix normal",
    "savingsLabel": "Vous economisez",
    "paymentNote": "Paiement unique a vie. Aucun abonnement mensuel."
  }'::jsonb,
  'Configuration publique de l''offre Dudukan Plus.'
)
on conflict (key) do nothing;
