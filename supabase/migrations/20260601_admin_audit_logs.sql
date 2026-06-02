create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs_no_client_access" on public.admin_audit_logs;
create policy "admin_audit_logs_no_client_access"
on public.admin_audit_logs
for all
to authenticated
using (false)
with check (false);

create index if not exists admin_audit_logs_target_idx
on public.admin_audit_logs (target_user_id, created_at desc);

create index if not exists admin_audit_logs_admin_idx
on public.admin_audit_logs (admin_user_id, created_at desc);
