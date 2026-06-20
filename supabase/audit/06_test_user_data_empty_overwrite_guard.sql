-- Non-destructive test for prevent_user_data_empty_overwrite.
-- Run only on a preview/test database after applying the migration.
-- This script intentionally raises SQLSTATE 23514 when the guard works.
-- The transaction should be rolled back after the expected error.

begin;

-- Pick an existing row that has financial content.
-- If this returns no row, create a real test account in the preview app first,
-- add a salary/expense, then rerun this script.
create temporary table tmp_guard_user on commit drop as
select id
from public.user_data
where public.user_data_has_financial_content(data)
limit 1;

do $$
begin
  if not exists (select 1 from tmp_guard_user) then
    raise exception 'No user_data row with financial content found for guard test.';
  end if;
end;
$$;

-- Expected result: this update must fail with SQLSTATE 23514.
update public.user_data
set data = jsonb_build_object(
  'salary', 0,
  'nextMonthSalary', 0,
  'savings', 0,
  'extraIncome', '[]'::jsonb,
  'expenses', '[]'::jsonb,
  'debts', '[]'::jsonb,
  'categories', coalesce(data -> 'categories', '[]'::jsonb),
  'onboarded', true
)
where id = (select id from tmp_guard_user);

rollback;
