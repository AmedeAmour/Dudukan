# Documentation Base de Donnees

Audit realise depuis les migrations Supabase locales, le code applicatif React/API, le SQL Editor Supabase et une connexion Postgres directe au projet distant `tyslautcpyzoeebpjihy`. Le catalogue reel a ete interroge en lecture seule le 2026-06-15 et exporte dans `supabase/audit/remote_inventory.json`.

## Architecture generale

Dudukan utilise Supabase pour trois domaines:

- Authentification: `auth.users`, consommee via `supabase.auth`.
- Donnees gratuites: `public.user_data` synchronise l'etat financier local.
- Donnees Plus/Premium: tables relationnelles `profiles`, `projects`, `milestones`, `premium_transactions`, `project_contributions`, plus `premium_purchases` pour l'achat Dudukan Plus.
- Donnees financieres normalisees: `debts` et `transactions` existent aussi en base.
- Administration: API serverless avec service role, tables `app_settings` et `admin_audit_logs`.
- Administration DB: `admin_users` existe en base et complete le controle d'acces admin.
- Storage: tables Supabase Storage presentes (`storage.buckets`, `storage.objects`, etc.) et bucket applicatif `avatars` utilise par le code.

## Etat des donnees production

Lecture seule effectuee le 2026-06-15:

| Objet | Volume | Role operationnel |
| --- | ---: | --- |
| `user_data` | 21 lignes | source gratuite actuelle |
| `profiles` | 20 lignes | profils Premium |
| `projects` | 10 lignes | projets Premium actifs |
| `milestones` | 13 lignes | jalons de projets complexes |
| `premium_transactions` | 11 lignes | journal Premium |
| `premium_purchases` | 26 lignes | acces Dudukan Plus |
| `transactions` | 8 lignes | historique transactionnel gratuit/legacy |
| `app_settings` | 2 lignes | `plus_plan`, `plus_offer` |
| `admin_users` | 1 ligne | administrateur DB |
| `admin_audit_logs` | 0 ligne | audit admin futur |
| `debts` | 0 ligne | table normalisee vide |
| `project_contributions` | 0 ligne | table de contributions vide |
| `avatars` | 8 objets | avatars utilisateurs |

Integrite observee:

- `milestones` ne contient pas de relation projet orpheline.
- `project_contributions` ne contient pas de relation projet orpheline.
- `premium_transactions` contient des references historiques vers projets/jalons absents: ces lignes doivent etre conservees et reconciliees avant ajout de FK.
- `user_data.data` contient les cles JSON critiques (`expenses`, `debts`, `savings`, `categories`) sur toutes les lignes observees.

## Tables versionnees par migrations

### `public.premium_purchases`

Role: journal des achats Dudukan Plus via FedaPay.

Colonnes:

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | FK vers `auth.users(id)`, cascade delete |
| `provider` | `text` | defaut `fedapay` |
| `provider_transaction_id` | `text` | unique |
| `provider_reference` | `text` | reference fournisseur |
| `amount` | `numeric` | defaut `9900` |
| `currency` | `text` | defaut `XOF` |
| `status` | `text` | defaut `pending` |
| `plan_code` | `text` | defaut `lifetime_9900_xof` |
| `checkout_url` | `text` | URL de paiement |
| `raw_event` | `jsonb` | payload FedaPay |
| `approved_at` | `timestamptz` | date validation |
| `created_at` | `timestamptz` | defaut `now()` |
| `updated_at` | `timestamptz` | defaut `now()` |

Contraintes et index:

- PK `id`.
- Unique sur `provider_transaction_id`.
- FK `user_id -> auth.users(id) on delete cascade`.
- Index `(user_id, status)`.
- Index `(provider_transaction_id)`, probablement redondant avec l'unique constraint.

RLS:

- RLS active.
- `premium_purchases_select_own`: un utilisateur authentifie lit ses achats.
- `premium_purchases_insert_own_pending`: un utilisateur authentifie peut inserer uniquement son achat FedaPay pending au prix/plan attendu.
- Pas de policy client pour update/delete. Les confirmations sont faites via service role dans `api/fedapay/webhook.js`.

Fonction liee:

- `public.has_premium_access(target_user_id uuid)` retourne `true` si `auth.uid() = target_user_id` et achat approuve FedaPay trouve.
- `security definer`, `stable`, `search_path = public`.
- Execute accorde a `authenticated`.

Usages code:

- `src/App.jsx`: RPC `has_premium_access`.
- `api/fedapay/create-checkout.js`: verifie achat approuve et upsert achat pending.
- `api/fedapay/webhook.js`: upsert achat et active metadata premium.
- `api/admin/grant-plus.js`: cree un achat approuve manuel.
- `api/admin/diagnose.js`: diagnostic admin.

### `public.admin_audit_logs`

Role: journal des actions admin.

Colonnes:

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `admin_user_id` | `uuid` | FK `auth.users`, `on delete set null` |
| `admin_email` | `text` | email denormalise |
| `target_user_id` | `uuid` | FK `auth.users`, `on delete set null` |
| `action` | `text` | action admin |
| `details` | `jsonb` | defaut `{}` |
| `created_at` | `timestamptz` | defaut `now()` |

Index:

- `(target_user_id, created_at desc)`.
- `(admin_user_id, created_at desc)`.

RLS:

- RLS active.
- `admin_audit_logs_no_client_access`: bloque tout acces client authentifie.
- Les insertions sont faites via service role dans `api/_utils/adminAuth.js`.

### `public.app_settings`

Role: configuration applicative publique, actuellement offre Dudukan Plus.

Colonnes:

| Colonne | Type | Notes |
| --- | --- | --- |
| `key` | `text` | PK |
| `value` | `jsonb` | configuration |
| `description` | `text` | description humaine |
| `updated_by` | `uuid` | FK `auth.users(id)` |
| `updated_at` | `timestamptz` | defaut `now()` |
| `created_at` | `timestamptz` | defaut `now()` |

RLS:

- RLS active.
- `app_settings_read_all`: lecture publique.
- Pas de policy client d'ecriture. Les updates passent par API admin service role.

Donnee initiale:

- `plus_plan`: plan a vie `lifetime_9900_xof`, montant `9900`, devise `XOF`.

Usages code:

- `src/screens/Payment.jsx`: lecture publique du plan.
- `api/_utils/plusPlan.js`: lecture serveur avec fallback.
- `api/admin/app-settings.js`: lecture/update admin.

## Tables presentes en base mais absentes des migrations locales

L'inventaire direct confirme que les tables suivantes existent dans `public` et ont RLS active:

- `admin_audit_logs`
- `admin_users`
- `app_settings`
- `debts`
- `milestones`
- `premium_purchases`
- `premium_transactions`
- `profiles`
- `project_contributions`
- `projects`
- `transactions`
- `user_data`

Les tables `admin_users`, `debts`, `milestones`, `premium_transactions`, `profiles`, `project_contributions`, `projects`, `transactions` et `user_data` sont presentes dans la base distante mais ne sont pas versionnees dans `supabase/migrations`.

### `public.user_data`

Role: stockage JSON des donnees gratuites et synchronisation locale/cloud. Confirme en base, RLS active.

Schema attendu:

| Colonne | Type probable | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, FK vers `auth.users(id)` |
| `data` | `jsonb` | etat financier complet, defaut `{}` |
| `updated_at` | `timestamptz` | defaut `timezone('utc', now())` |

Contenu JSON attendu: `salary`, `nextMonthSalary`, `extraIncome`, `expenses`, `debts`, `categories`, `onboarded`, `periodStart`, `currency`, `savings`, `lastActivity`, `notificationSchedule`, `lastNotifiedDate`.

Usages: `src/context/FinanceContext.jsx`, `api/admin/diagnose.js`, `api/admin/sync-savings.js`, `api/admin/repair-savings-category.js`.

RLS attendue: chaque utilisateur ne doit lire/ecrire/supprimer que `id = auth.uid()`.

### `public.profiles`

Role: profil financier Premium. Confirme en base, RLS active.

Schema attendu:

| Colonne | Type probable | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, FK vers `auth.users(id)` cascade |
| `full_name` | `text` | nom affiche |
| `salary` | `int8` | salaire premium |
| `accumulated_savings` | `int8` | ancien/second champ d'epargne |
| `savings` | `numeric` | epargne synchronisee |
| `avatar_url` | `text` | photo utilisateur |
| `current_month` | `text` | mois courant |
| `categories` | `jsonb` | categories/profil budget |
| `updated_at` | `timestamptz` | trigger `profiles_updated_at` |

Usages: `src/premium/context/PremiumContext.jsx`, `src/premium/PremiumApp.jsx`, `src/screens/Settings.jsx`, APIs admin.

RLS attendue: l'utilisateur gere uniquement sa ligne; le service role gere admin.

### `public.projects`

Role: projets de vie Premium. Confirme en base, RLS active.

Schema attendu:

| Colonne | Type probable | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK `auth.users(id)` |
| `name` | `text` | nom projet |
| `target_amount` | `numeric` | montant cible |
| `current_amount` | `numeric` | montant alloue |
| `icon` | `text` | defaut `🎯` |
| `description` | `text` | description |
| `deadline` | `date` | null pour recurrent |
| `status` | `text` | defaut `active` |
| `monthly_allocation` | `numeric` | defaut `0` |
| `feasibility_score` | `text` | score/libelle |
| `is_complex` | `boolean` | projet avec jalons |
| `is_recurring` | `boolean` | projet recurrent |
| `type` | `text` | `simple`, `complex`, `recurring` |
| `frequency` | `text` | ex. `monthly` |
| `priority` | `integer` | priorite 1-5 |
| `created_at` | `timestamptz` | tri principal |
| `updated_at` | `timestamptz` | trigger `projects_updated_at` |

Relation: `projects.id -> milestones.project_id`.

RLS attendue: utilisateur proprietaire via `user_id = auth.uid()`.

### `public.milestones`

Role: jalons de projets complexes. Confirme en base, RLS active.

Schema attendu:

| Colonne | Type probable | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `project_id` | `uuid` | FK vers `projects(id)`, cascade delete recommande |
| `user_id` | `uuid` | FK `auth.users(id)` |
| `name` | `text` | nom jalon |
| `target_amount` | `numeric` | montant jalon |
| `target_date` | `date` | date cible |
| `is_completed` | `boolean` | defaut `false` |
| `completed_at` | `timestamptz` | date de completion |
| `created_at` | `timestamptz` | ordre des jalons |

RLS attendue: `user_id = auth.uid()` et coherence avec le projet parent.

### `public.premium_transactions`

Role: journal des allocations, validations de jalons et realisations Premium. Confirme en base, RLS active.

Schema attendu:

| Colonne | Type probable | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK `auth.users(id)` |
| `transaction_type` | `text` | `allocation`, `life_allocation`, `completion` |
| `title` | `text` | libelle |
| `description` | `text` | detail |
| `amount` | `numeric` | montant |
| `project_id` | `uuid` | FK recommandee vers `projects(id)`, nullable |
| `project_name` | `text` | denormalisation |
| `step_id` | `uuid` | FK recommandee vers `milestones(id)`, nullable |
| `step_name` | `text` | denormalisation |
| `related_allocation_id` | `uuid` | lien logique nullable |
| `metadata` | `jsonb` | detail operation |
| `created_at` | `timestamptz` | tri |

RLS attendue: utilisateur proprietaire via `user_id = auth.uid()`.

### `public.admin_users`

Role: table admin presente en base, non versionnee localement. Colonnes: `id uuid` FK `auth.users(id)` cascade, `email text unique not null`, `created_at timestamptz default now()`. Policy: `admin_users_self_select` en SELECT avec `auth.uid() = id`.

Usage code direct: non observe dans le code local; les endpoints admin utilisent surtout `ADMIN_EMAILS`, `user_metadata` et `app_metadata`. Cette table doit etre consideree comme objet reel potentiellement utile mais a documenter/migrer.

### `public.debts`

Role: table de dettes normalisees presente en base, RLS active. Colonnes: `id`, `user_id`, `creditor`, `total_amount int8`, `paid_amount int8 default 0`, `due_date timestamptz`. Le code courant gere surtout les dettes dans `user_data.data.debts`, donc cette table peut etre un vestige ou une future normalisation.

### `public.transactions`

Role: table de transactions normalisees presente en base, RLS active. Colonnes: `id`, `user_id`, `amount int8`, `category`, `note`, `type`, `date default timezone('utc', now())`. Le code courant gere les transactions gratuites dans le JSON `user_data` et les transactions Premium dans `premium_transactions`.

Etat production: 8 lignes, toutes de type `expense`. Cette table ne doit pas etre supprimee sans decision produit explicite et sauvegarde.

### `public.project_contributions`

Role: contributions/probable historique d'alimentation de projets. Colonnes: `id`, `project_id`, `user_id`, `amount numeric`, `note`, `date default now()`. Confirme en base, RLS active. Aucun usage direct `.from('project_contributions')` n'a ete observe dans le code local.

Etat production: 0 ligne, aucune relation orpheline observee.

## Storage

### Bucket `avatars`

Role: photos de profil.

Usage:

- `src/screens/Settings.jsx` upload vers `avatars`.
- Le code appelle `getPublicUrl`, donc le bucket est probablement public ou attendu public.
- Le nom fichier actuel est `${user.id}-${Date.now()}.${ext}`.

Policies recommandees:

- Upload/update/delete limite au prefix de l'utilisateur.
- Lecture publique seulement si l'application accepte l'exposition des avatars.

## Vues, triggers et autres fonctions

Dans les migrations locales:

Dans la base distante:

- Aucune vue publique/storage.
- Fonctions publiques: `handle_new_user()`, `has_premium_access(uuid)`, `rls_auto_enable()`, `update_updated_at()`.
- Triggers publics: `profiles_updated_at` sur `profiles`, `projects_updated_at` sur `projects`.
- Triggers Storage internes: protection delete/update sur `storage.buckets` et `storage.objects`.

L'inventaire direct a confirme 12 tables publiques, 168 colonnes, 116 contraintes, 40 index, 26 policies, 4 fonctions, 7 triggers et 1 bucket Storage. L'historique `supabase_migrations.schema_migrations` n'existe pas dans ce projet ou n'est pas accessible sous ce nom.

## Migrations Supabase locales

Migrations presentes:

- `supabase/migrations/20260527_premium_purchases_fedapay.sql`
- `supabase/migrations/20260601_admin_audit_logs.sql`
- `supabase/migrations/20260601_app_settings.sql`

Manques majeurs:

- Aucune migration versionnee pour `admin_users`, `debts`, `user_data`, `profiles`, `projects`, `milestones`, `premium_transactions`, `project_contributions`, `transactions`.
- Aucune migration versionnee pour le bucket `avatars` et ses policies storage.
- Aucune migration pour les policies RLS de ces tables presentes en base.

Scripts d'audit/preparation:

- `supabase/audit/01_inventory.sql`: inventaire SQL manuel.
- `supabase/audit/02_recommended_fixes.sql`: corrections recommandees, commentees par defaut.
- `supabase/audit/03_inventory_single_json.sql`: export catalogue JSON.
- `supabase/audit/04_inventory_single_json_no_migrations.sql`: export catalogue sans dependance `supabase_migrations`.
- `supabase/audit/05_reconciliation_preflight.sql`: preflight de reconciliation et templates commentes pour les references orphelines.
- `scripts/audit-supabase-db.mjs`: audit catalogue direct en lecture seule.
- `scripts/preflight-supabase-data.mjs`: controle donnees direct en lecture seule.
