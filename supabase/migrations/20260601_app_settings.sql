create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

alter table public.app_settings add column if not exists description text;
alter table public.app_settings add column if not exists updated_by uuid references auth.users(id);
alter table public.app_settings add column if not exists updated_at timestamptz not null default now();
alter table public.app_settings add column if not exists created_at timestamptz not null default now();

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_read_all" on public.app_settings;
create policy "app_settings_read_all"
on public.app_settings
for select
using (true);

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
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();
