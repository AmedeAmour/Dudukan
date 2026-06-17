-- Audit inventory for Supabase/PostgreSQL.
-- Run manually in the Supabase SQL Editor. Read-only.

-- 1. Public tables and views.
select
  n.nspname as schema_name,
  c.relname as object_name,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned_table'
    when 'v' then 'view'
    when 'm' then 'materialized_view'
    when 'f' then 'foreign_table'
    else c.relkind::text
  end as object_type,
  c.relrowsecurity as rls_enabled,
  obj_description(c.oid, 'pg_class') as comment
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
order by schema_name, object_type, object_name;

-- 2. Columns.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema in ('public', 'storage')
order by table_schema, table_name, ordinal_position;

-- 3. Constraints.
select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.update_rule,
  rc.delete_rule
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_catalog = kcu.constraint_catalog
 and tc.constraint_schema = kcu.constraint_schema
 and tc.constraint_name = kcu.constraint_name
left join information_schema.constraint_column_usage ccu
  on tc.constraint_catalog = ccu.constraint_catalog
 and tc.constraint_schema = ccu.constraint_schema
 and tc.constraint_name = ccu.constraint_name
left join information_schema.referential_constraints rc
  on tc.constraint_catalog = rc.constraint_catalog
 and tc.constraint_schema = rc.constraint_schema
 and tc.constraint_name = rc.constraint_name
where tc.table_schema in ('public', 'storage')
order by tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

-- 4. Indexes.
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname in ('public', 'storage')
order by schemaname, tablename, indexname;

-- 5. RLS policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 6. Functions/RPC in public schema.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result_type,
  l.lanname as language,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
order by function_name, arguments;

-- 7. Triggers.
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema in ('public', 'storage')
order by event_object_schema, event_object_table, trigger_name, event_manipulation;

-- 8. Views definitions.
select
  schemaname,
  viewname,
  definition
from pg_views
where schemaname in ('public', 'storage')
order by schemaname, viewname;

-- 9. Storage buckets.
select
  id,
  name,
  owner,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by name;

-- 10. Supabase migration history, if available.
select *
from supabase_migrations.schema_migrations
order by version;

-- 11. Potential duplicate/redundant indexes.
with index_cols as (
  select
    ns.nspname as schema_name,
    tbl.relname as table_name,
    idx.relname as index_name,
    i.indisunique,
    i.indisprimary,
    array_agg(att.attname order by ord.ordinality) as columns
  from pg_index i
  join pg_class idx on idx.oid = i.indexrelid
  join pg_class tbl on tbl.oid = i.indrelid
  join pg_namespace ns on ns.oid = tbl.relnamespace
  join unnest(i.indkey) with ordinality as ord(attnum, ordinality) on true
  join pg_attribute att on att.attrelid = tbl.oid and att.attnum = ord.attnum
  where ns.nspname in ('public', 'storage')
  group by ns.nspname, tbl.relname, idx.relname, i.indisunique, i.indisprimary
)
select a.schema_name, a.table_name, a.index_name, b.index_name as possible_duplicate, a.columns
from index_cols a
join index_cols b
  on a.schema_name = b.schema_name
 and a.table_name = b.table_name
 and a.columns = b.columns
 and a.index_name < b.index_name
order by a.schema_name, a.table_name, a.index_name;

-- 12. Tables without RLS in public/storage.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
  and c.relkind in ('r', 'p')
  and not c.relrowsecurity
order by schema_name, table_name;
