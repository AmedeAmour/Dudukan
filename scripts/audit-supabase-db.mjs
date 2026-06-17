import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

const root = process.cwd();
const dbUrlPath = 'C:\\tmp\\dudukan-db-url.txt';
const outputPath = path.join(root, 'supabase', 'audit', 'remote_inventory.json');

if (!fs.existsSync(dbUrlPath)) {
  throw new Error(`Missing database URL file: ${dbUrlPath}`);
}

const connectionString = fs.readFileSync(dbUrlPath, 'utf8').trim();
if (!connectionString.startsWith('postgresql://')) {
  throw new Error('Database URL must start with postgresql://');
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  application_name: 'dudukan-db-audit',
});

const queries = {
  objects: `
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
    order by schema_name, object_type, object_name
  `,
  columns: `
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
    order by table_schema, table_name, ordinal_position
  `,
  constraints: `
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
    order by tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position
  `,
  indexes: `
    select
      schemaname,
      tablename,
      indexname,
      indexdef
    from pg_indexes
    where schemaname in ('public', 'storage')
    order by schemaname, tablename, indexname
  `,
  policies: `
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
    order by schemaname, tablename, policyname
  `,
  functions: `
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
    order by function_name, arguments
  `,
  triggers: `
    select
      event_object_schema,
      event_object_table,
      trigger_name,
      action_timing,
      event_manipulation,
      action_statement
    from information_schema.triggers
    where event_object_schema in ('public', 'storage')
    order by event_object_schema, event_object_table, trigger_name, event_manipulation
  `,
  views: `
    select
      schemaname,
      viewname,
      definition
    from pg_views
    where schemaname in ('public', 'storage')
    order by schemaname, viewname
  `,
  storage_buckets: `
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
    order by name
  `,
  tables_without_rls: `
    select
      n.nspname as schema_name,
      c.relname as table_name,
      c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'storage')
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
    order by schema_name, table_name
  `,
};

try {
  await client.connect();
  const inventory = {
    generated_at: new Date().toISOString(),
    project_ref: 'tyslautcpyzoeebpjihy',
    source: 'direct_postgres_catalog_queries',
    results: {},
  };

  for (const [name, sql] of Object.entries(queries)) {
    const result = await client.query(sql);
    inventory.results[name] = result.rows;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
  for (const [name, rows] of Object.entries(inventory.results)) {
    console.log(`${name}: ${rows.length}`);
  }
} finally {
  await client.end().catch(() => {});
}
