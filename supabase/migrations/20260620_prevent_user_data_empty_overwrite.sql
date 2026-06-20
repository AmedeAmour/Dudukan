-- Prevent accidental loss of free-app financial data.
--
-- This guard blocks updates that would replace an existing user_data row with
-- financial content by an empty/quasi-empty payload. It protects production even
-- if an old frontend bundle, a PWA cache, a payment redirect, or a stale tab
-- tries to sync an empty state.
--
-- Intentional destructive maintenance can bypass this inside a controlled
-- transaction with:
--   set local app.allow_user_data_empty_overwrite = 'on';

create or replace function public.user_data_number_value(payload jsonb, field_name text)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when payload ? field_name
      and jsonb_typeof(payload -> field_name) in ('number', 'string')
      and (payload ->> field_name) ~ '^-?[0-9]+(\.[0-9]+)?$'
    then (payload ->> field_name)::numeric
    else 0
  end;
$$;

create or replace function public.user_data_array_length(payload jsonb, field_name text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when jsonb_typeof(payload -> field_name) = 'array'
    then jsonb_array_length(payload -> field_name)
    else 0
  end;
$$;

create or replace function public.user_data_has_financial_content(payload jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    public.user_data_number_value(coalesce(payload, '{}'::jsonb), 'salary') > 0
    or public.user_data_number_value(coalesce(payload, '{}'::jsonb), 'nextMonthSalary') > 0
    or public.user_data_number_value(coalesce(payload, '{}'::jsonb), 'savings') > 0
    or public.user_data_array_length(coalesce(payload, '{}'::jsonb), 'extraIncome') > 0
    or public.user_data_array_length(coalesce(payload, '{}'::jsonb), 'expenses') > 0
    or public.user_data_array_length(coalesce(payload, '{}'::jsonb), 'debts') > 0;
$$;

create or replace function public.prevent_user_data_empty_overwrite()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.allow_user_data_empty_overwrite', true) = 'on' then
    return new;
  end if;

  if public.user_data_has_financial_content(old.data)
     and not public.user_data_has_financial_content(new.data) then
    raise exception
      'Refusing to overwrite non-empty user_data with empty financial data for user %. Restore intentionally or set app.allow_user_data_empty_overwrite=on in a controlled transaction.',
      old.id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_user_data_empty_overwrite on public.user_data;
create trigger prevent_user_data_empty_overwrite
before update of data on public.user_data
for each row
execute function public.prevent_user_data_empty_overwrite();
