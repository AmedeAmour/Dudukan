-- Recommended fixes for review.
-- Do not run blindly. Read DATABASE_AUDIT.md first.
-- Sections marked DANGEROUS or OPTIONAL require explicit validation.

-- ---------------------------------------------------------------------
-- P0/P1: updated_at helper.
-- Safe to create or replace, but triggers should be reviewed table by table.
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Example triggers. Uncomment only for tables that exist and have updated_at.
-- create trigger set_user_data_updated_at
-- before update on public.user_data
-- for each row execute function public.set_updated_at();
--
-- create trigger set_profiles_updated_at
-- before update on public.profiles
-- for each row execute function public.set_updated_at();
--
-- create trigger set_premium_purchases_updated_at
-- before update on public.premium_purchases
-- for each row execute function public.set_updated_at();
--
-- create trigger set_app_settings_updated_at
-- before update on public.app_settings
-- for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- P0: expected RLS patterns for user-owned tables.
-- Uncomment and adapt only after confirming exact schemas.
-- ---------------------------------------------------------------------

-- alter table public.user_data enable row level security;
-- create policy "user_data_select_own" on public.user_data
-- for select to authenticated
-- using (id = auth.uid());
-- create policy "user_data_insert_own" on public.user_data
-- for insert to authenticated
-- with check (id = auth.uid());
-- create policy "user_data_update_own" on public.user_data
-- for update to authenticated
-- using (id = auth.uid())
-- with check (id = auth.uid());
-- create policy "user_data_delete_own" on public.user_data
-- for delete to authenticated
-- using (id = auth.uid());

-- alter table public.profiles enable row level security;
-- create policy "profiles_select_own" on public.profiles
-- for select to authenticated
-- using (id = auth.uid());
-- create policy "profiles_insert_own" on public.profiles
-- for insert to authenticated
-- with check (id = auth.uid());
-- create policy "profiles_update_own" on public.profiles
-- for update to authenticated
-- using (id = auth.uid())
-- with check (id = auth.uid());

-- alter table public.projects enable row level security;
-- create policy "projects_select_own" on public.projects
-- for select to authenticated
-- using (user_id = auth.uid());
-- create policy "projects_insert_own" on public.projects
-- for insert to authenticated
-- with check (user_id = auth.uid());
-- create policy "projects_update_own" on public.projects
-- for update to authenticated
-- using (user_id = auth.uid())
-- with check (user_id = auth.uid());
-- create policy "projects_delete_own" on public.projects
-- for delete to authenticated
-- using (user_id = auth.uid());

-- alter table public.milestones enable row level security;
-- create policy "milestones_select_own" on public.milestones
-- for select to authenticated
-- using (user_id = auth.uid());
-- create policy "milestones_insert_own" on public.milestones
-- for insert to authenticated
-- with check (
--   user_id = auth.uid()
--   and exists (
--     select 1 from public.projects p
--     where p.id = project_id and p.user_id = auth.uid()
--   )
-- );
-- create policy "milestones_update_own" on public.milestones
-- for update to authenticated
-- using (user_id = auth.uid())
-- with check (
--   user_id = auth.uid()
--   and exists (
--     select 1 from public.projects p
--     where p.id = project_id and p.user_id = auth.uid()
--   )
-- );
-- create policy "milestones_delete_own" on public.milestones
-- for delete to authenticated
-- using (user_id = auth.uid());

-- alter table public.premium_transactions enable row level security;
-- create policy "premium_transactions_select_own" on public.premium_transactions
-- for select to authenticated
-- using (user_id = auth.uid());
-- create policy "premium_transactions_insert_own" on public.premium_transactions
-- for insert to authenticated
-- with check (user_id = auth.uid());
-- create policy "premium_transactions_delete_own" on public.premium_transactions
-- for delete to authenticated
-- using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- P1: constraints and indexes to review.
-- Use IF NOT EXISTS where supported; validate existing dirty data first.
-- ---------------------------------------------------------------------

-- create index if not exists projects_user_created_at_idx
-- on public.projects (user_id, created_at desc);
--
-- create index if not exists milestones_project_created_at_idx
-- on public.milestones (project_id, created_at);
--
-- create index if not exists premium_transactions_user_created_at_idx
-- on public.premium_transactions (user_id, created_at desc);
--
-- create index if not exists premium_transactions_project_idx
-- on public.premium_transactions (project_id);

-- ---------------------------------------------------------------------
-- OPTIONAL/DANGEROUS: remove probable duplicate index.
-- Confirm first with 01_inventory.sql.
-- ---------------------------------------------------------------------

-- drop index if exists public.premium_purchases_provider_transaction_idx;

-- ---------------------------------------------------------------------
-- OPTIONAL: RLS policy cleanup confirmed by remote inventory.
-- Review carefully before running. Keep one clear owner policy per table.
-- ---------------------------------------------------------------------

-- debts has two ALL owner policies:
--   "Dettes personnelles" and "debts_own"
-- drop policy if exists "Dettes personnelles" on public.debts;

-- milestones has one project-parent policy and one direct user_id policy.
-- Keep both only if inserts/updates require both access paths.
-- drop policy if exists "milestones_own" on public.milestones;

-- profiles has overlapping owner policies.
-- If "profiles_own" is kept, the separate SELECT/UPDATE policies are redundant.
-- drop policy if exists "Users can view own profile" on public.profiles;
-- drop policy if exists "Users can update own profile" on public.profiles;
-- drop policy if exists "Profils personnels" on public.profiles;

-- projects has two ALL owner policies:
--   "Users can manage own projects" and "projects_own"
-- drop policy if exists "Users can manage own projects" on public.projects;

-- transactions has three owner policies.
-- drop policy if exists "Transactions personnelles" on public.transactions;
-- drop policy if exists "Users can manage own transactions" on public.transactions;

-- ---------------------------------------------------------------------
-- Storage avatars policy template.
-- Requires client code change to upload into auth.uid() folder first.
-- ---------------------------------------------------------------------

-- insert into storage.buckets (id, name, public)
-- values ('avatars', 'avatars', true)
-- on conflict (id) do nothing;
--
-- create policy "avatars_public_read" on storage.objects
-- for select
-- using (bucket_id = 'avatars');
--
-- create policy "avatars_insert_own_folder" on storage.objects
-- for insert to authenticated
-- with check (
--   bucket_id = 'avatars'
--   and storage.foldername(name)[1] = auth.uid()::text
-- );
--
-- create policy "avatars_update_own_folder" on storage.objects
-- for update to authenticated
-- using (
--   bucket_id = 'avatars'
--   and storage.foldername(name)[1] = auth.uid()::text
-- )
-- with check (
--   bucket_id = 'avatars'
--   and storage.foldername(name)[1] = auth.uid()::text
-- );
--
-- create policy "avatars_delete_own_folder" on storage.objects
-- for delete to authenticated
-- using (
--   bucket_id = 'avatars'
--   and storage.foldername(name)[1] = auth.uid()::text
-- );
