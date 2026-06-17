import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

const root = process.cwd();
const dbUrlPath = 'C:\\tmp\\dudukan-db-url.txt';
const outputPath = path.join(root, 'supabase', 'audit', 'remote_data_preflight.json');

if (!fs.existsSync(dbUrlPath)) {
  throw new Error(`Missing database URL file: ${dbUrlPath}`);
}

const connectionString = fs.readFileSync(dbUrlPath, 'utf8').trim();

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  application_name: 'dudukan-data-preflight',
});

const publicTables = [
  'admin_audit_logs',
  'admin_users',
  'app_settings',
  'debts',
  'milestones',
  'premium_purchases',
  'premium_transactions',
  'profiles',
  'project_contributions',
  'projects',
  'transactions',
  'user_data',
];

const checks = {
  row_counts: async () => {
    const rows = [];
    for (const table of publicTables) {
      const result = await client.query(`select count(*)::int as count from public.${table}`);
      rows.push({ table, count: result.rows[0].count });
    }
    return rows;
  },
  storage_bucket_counts: async () => {
    const result = await client.query(`
      select
        b.id,
        b.name,
        b.public,
        count(o.id)::int as object_count
      from storage.buckets b
      left join storage.objects o on o.bucket_id = b.id
      group by b.id, b.name, b.public
      order by b.name
    `);
    return result.rows;
  },
  orphan_milestones: async () => {
    const result = await client.query(`
      select count(*)::int as count
      from public.milestones m
      left join public.projects p on p.id = m.project_id
      where p.id is null
    `);
    return result.rows[0];
  },
  orphan_project_contributions: async () => {
    const result = await client.query(`
      select count(*)::int as count
      from public.project_contributions c
      left join public.projects p on p.id = c.project_id
      where p.id is null
    `);
    return result.rows[0];
  },
  premium_transactions_project_refs: async () => {
    const result = await client.query(`
      select
        count(*) filter (where t.project_id is not null)::int as with_project_id,
        count(*) filter (where t.project_id is not null and p.id is null)::int as orphan_project_id,
        count(*) filter (where t.step_id is not null)::int as with_step_id,
        count(*) filter (where t.step_id is not null and m.id is null)::int as orphan_step_id
      from public.premium_transactions t
      left join public.projects p on p.id = t.project_id
      left join public.milestones m on m.id = t.step_id
    `);
    return result.rows[0];
  },
  user_data_shape: async () => {
    const result = await client.query(`
      select
        count(*)::int as rows,
        count(*) filter (where data ? 'expenses')::int as with_expenses,
        count(*) filter (where data ? 'debts')::int as with_debts,
        count(*) filter (where data ? 'savings')::int as with_savings,
        count(*) filter (where data ? 'categories')::int as with_categories,
        count(*) filter (where jsonb_typeof(data->'expenses') = 'array')::int as expenses_array,
        count(*) filter (where jsonb_typeof(data->'debts') = 'array')::int as debts_array
      from public.user_data
    `);
    return result.rows[0];
  },
  duplicate_policy_groups: async () => {
    const result = await client.query(`
      select
        schemaname,
        tablename,
        cmd,
        qual,
        count(*)::int as policy_count,
        array_agg(policyname order by policyname) as policies
      from pg_policies
      where schemaname = 'public'
      group by schemaname, tablename, cmd, qual
      having count(*) > 1
      order by tablename, cmd
    `);
    return result.rows;
  },
};

try {
  await client.connect();
  const report = {
    generated_at: new Date().toISOString(),
    project_ref: 'tyslautcpyzoeebpjihy',
    mode: 'read_only_preflight',
    checks: {},
  };

  for (const [name, run] of Object.entries(checks)) {
    report.checks[name] = await run();
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
  console.log(JSON.stringify(report.checks.row_counts, null, 2));
} finally {
  await client.end().catch(() => {});
}
