-- Single-result Supabase/PostgreSQL inventory without supabase_migrations dependency.
-- Run manually or through the Supabase SQL Editor. Read-only.

select jsonb_pretty(
  jsonb_build_object(
    'generated_at', now(),
    'objects', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.schema_name, x.object_type, x.object_name)
      from (
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
      ) x
    ), '[]'::jsonb),
    'columns', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.table_schema, x.table_name, x.ordinal_position)
      from (
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
      ) x
    ), '[]'::jsonb),
    'constraints', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.table_schema, x.table_name, x.constraint_type, x.constraint_name, x.ordinal_position)
      from (
        select
          tc.table_schema,
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.ordinal_position,
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
      ) x
    ), '[]'::jsonb),
    'indexes', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.schemaname, x.tablename, x.indexname)
      from (
        select schemaname, tablename, indexname, indexdef
        from pg_indexes
        where schemaname in ('public', 'storage')
      ) x
    ), '[]'::jsonb),
    'policies', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.schemaname, x.tablename, x.policyname)
      from (
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
      ) x
    ), '[]'::jsonb),
    'functions', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.schema_name, x.function_name, x.arguments)
      from (
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
      ) x
    ), '[]'::jsonb),
    'triggers', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.event_object_schema, x.event_object_table, x.trigger_name, x.event_manipulation)
      from (
        select
          event_object_schema,
          event_object_table,
          trigger_name,
          action_timing,
          event_manipulation,
          action_statement
        from information_schema.triggers
        where event_object_schema in ('public', 'storage')
      ) x
    ), '[]'::jsonb),
    'views', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.schemaname, x.viewname)
      from (
        select schemaname, viewname, definition
        from pg_views
        where schemaname in ('public', 'storage')
      ) x
    ), '[]'::jsonb),
    'storage_buckets', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.name)
      from (
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
      ) x
    ), '[]'::jsonb),
    'migration_history', 'not_available: supabase_migrations.schema_migrations does not exist'::text,
    'tables_without_rls', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.schema_name, x.table_name)
      from (
        select
          n.nspname as schema_name,
          c.relname as table_name,
          c.relrowsecurity as rls_enabled
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname in ('public', 'storage')
          and c.relkind in ('r', 'p')
          and not c.relrowsecurity
      ) x
    ), '[]'::jsonb)
  )
) as database_inventory_json;
