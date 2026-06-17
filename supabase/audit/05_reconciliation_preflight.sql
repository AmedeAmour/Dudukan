-- Reconciliation preflight for Dudukan production data.
-- Read-only by default. Do not run commented UPDATE statements without backup
-- and explicit validation.

-- ---------------------------------------------------------------------
-- Row counts for live-data awareness.
-- ---------------------------------------------------------------------

select 'admin_audit_logs' as object_name, count(*)::bigint as row_count from public.admin_audit_logs
union all select 'admin_users', count(*) from public.admin_users
union all select 'app_settings', count(*) from public.app_settings
union all select 'debts', count(*) from public.debts
union all select 'milestones', count(*) from public.milestones
union all select 'premium_purchases', count(*) from public.premium_purchases
union all select 'premium_transactions', count(*) from public.premium_transactions
union all select 'profiles', count(*) from public.profiles
union all select 'project_contributions', count(*) from public.project_contributions
union all select 'projects', count(*) from public.projects
union all select 'transactions', count(*) from public.transactions
union all select 'user_data', count(*) from public.user_data
order by object_name;

-- ---------------------------------------------------------------------
-- Orphan checks.
-- ---------------------------------------------------------------------

select
  count(*)::bigint as premium_transactions_with_missing_project
from public.premium_transactions t
left join public.projects p on p.id = t.project_id
where t.project_id is not null
  and p.id is null;

select
  count(*)::bigint as premium_transactions_with_missing_step
from public.premium_transactions t
left join public.milestones m on m.id = t.step_id
where t.step_id is not null
  and m.id is null;

select
  count(*)::bigint as milestones_with_missing_project
from public.milestones m
left join public.projects p on p.id = m.project_id
where m.project_id is not null
  and p.id is null;

select
  count(*)::bigint as project_contributions_with_missing_project
from public.project_contributions c
left join public.projects p on p.id = c.project_id
where c.project_id is not null
  and p.id is null;

-- ---------------------------------------------------------------------
-- Safe previews. These keep user ids out of the output and show only
-- technical identifiers needed for review.
-- ---------------------------------------------------------------------

select
  t.id,
  t.transaction_type,
  t.project_id,
  t.project_name,
  t.step_id,
  t.step_name,
  t.created_at
from public.premium_transactions t
left join public.projects p on p.id = t.project_id
left join public.milestones m on m.id = t.step_id
where (t.project_id is not null and p.id is null)
   or (t.step_id is not null and m.id is null)
order by t.created_at desc;

select
  type,
  category,
  count(*)::bigint as row_count,
  sum(amount)::numeric as total_amount
from public.transactions
group by type, category
order by type, category;

-- ---------------------------------------------------------------------
-- OPTIONAL correction template for orphan premium transaction references.
--
-- Rationale:
-- - Keep the premium transaction history.
-- - Keep denormalized project_name, step_name, title, description, metadata.
-- - Null only broken foreign-key-like references so real FK constraints can
--   be added later.
--
-- Review the preview query above and backup before uncommenting.
-- ---------------------------------------------------------------------

-- begin;
--
-- update public.premium_transactions t
-- set project_id = null
-- where t.project_id is not null
--   and not exists (
--     select 1
--     from public.projects p
--     where p.id = t.project_id
--   );
--
-- update public.premium_transactions t
-- set step_id = null
-- where t.step_id is not null
--   and not exists (
--     select 1
--     from public.milestones m
--     where m.id = t.step_id
--   );
--
-- rollback;
-- -- Replace rollback by commit only after validation.

-- ---------------------------------------------------------------------
-- OPTIONAL FK templates after orphan references have been resolved.
-- ---------------------------------------------------------------------

-- alter table public.premium_transactions
-- add constraint premium_transactions_project_id_fkey
-- foreign key (project_id)
-- references public.projects(id)
-- on delete set null;
--
-- alter table public.premium_transactions
-- add constraint premium_transactions_step_id_fkey
-- foreign key (step_id)
-- references public.milestones(id)
-- on delete set null;
