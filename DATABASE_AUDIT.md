# Audit Base de Donnees

## Synthese

La base reelle Supabase est plus large que la base versionnee dans `supabase/migrations`. L'inventaire direct Postgres (`supabase/audit/remote_inventory.json`) confirme 12 tables publiques, toutes avec RLS active. Les migrations locales ne couvrent que `premium_purchases`, `admin_audit_logs` et `app_settings`, alors que la base contient aussi `admin_users`, `debts`, `milestones`, `premium_transactions`, `profiles`, `project_contributions`, `projects`, `transactions` et `user_data`.

Risque principal: l'etat reel Supabase peut fonctionner en production, mais il n'est pas reproductible depuis le depot. C'est fragile pour les futurs developpeurs, les agents IA, les environnements preview et les restaurations.

Preflight donnees production, lecture seule du 2026-06-15:

| Objet | Volume | Observation |
| --- | ---: | --- |
| `user_data` | 21 | contient les JSON financiers gratuits |
| `profiles` | 20 | profils Premium existants |
| `projects` | 10 | projets actifs |
| `milestones` | 13 | 7 completes, 6 ouverts |
| `premium_transactions` | 11 | 7 allocations, 3 completions, 1 life_allocation |
| `premium_purchases` | 26 | source critique d'acces Plus |
| `transactions` | 8 | donnees historiques utilisateur, toutes `expense` |
| `app_settings` | 2 | `plus_plan`, `plus_offer` |
| `admin_users` | 1 | table admin reelle |
| `admin_audit_logs` | 0 | pret pour audit |
| `debts` | 0 | vide |
| `project_contributions` | 0 | vide |
| bucket `avatars` | 8 | fichiers utilisateurs |

## Priorite P0

### P0. Versionner le schema reel manquant

Objets presents en base distante mais absents des migrations locales:

- `admin_users`
- `debts`
- `user_data`
- `profiles`
- `projects`
- `milestones`
- `premium_transactions`
- `project_contributions`
- `transactions`
- bucket `avatars`
- policies RLS associees

Impact: impossible de reconstruire une base propre depuis le depot; risque de divergence production/local.

Recommandation: creer des migrations de baseline non destructives pour reproduire le schema reel, y compris RLS, indexes et Storage.

Etat: une baseline locale a ete preparee dans `supabase/migrations/20260615171016_baseline_existing_database.sql`. Elle doit etre consideree comme baseline de reproduction/preview, pas comme script a rejouer aveuglement en production.

### P0. Confirmer et durcir les policies RLS des tables deduites

Le code client lit/ecrit directement:

- `user_data`
- `profiles`
- `projects`
- `milestones`
- `premium_transactions`

L'inventaire direct confirme que les tables publiques ont RLS active et que les policies utilisateur sont majoritairement bornees a `auth.uid()`. Point a corriger: plusieurs tables ont des policies en doublon qui couvrent le meme perimetre.

### P0. Controler le bucket `avatars`

Le code upload directement depuis le client vers `avatars`. Si le bucket ou ses policies acceptent des chemins arbitraires, un utilisateur pourrait ecrire ou ecraser des fichiers hors de son espace logique.

Recommandation: imposer un prefix utilisateur, par exemple `${auth.uid()}/avatar.ext`, puis policy storage basee sur `storage.foldername(name)[1] = auth.uid()::text`.

Etat preview 2026-06-16: le test d'upload authentifie a d'abord echoue faute de policy `storage.objects`. La baseline a ete completee avec `avatars_public_read`, `avatars_insert_own`, `avatars_update_own`, `avatars_delete_own`. Ces policies acceptent temporairement le chemin actuel du code (`{userId}-{timestamp}.ext`) et le chemin recommande (`{userId}/avatar.ext`).

### P0. Ne pas ajouter de FK sur `premium_transactions` avant reconciliation

Le preflight a detecte:

- 11 `premium_transactions` avec `project_id`.
- 5 `project_id` ne pointent plus vers un projet existant.
- 1 `step_id`, egalement orphelin cote `milestones`.

Impact: l'ajout immediat de FK echouerait ou forcerait une suppression/modification de donnees historiques. Ces transactions peuvent rester utiles comme journal financier, grace a `project_name` et `step_name` denormalises.

Recommandation: ne rien supprimer. Ajouter d'abord une migration de reconciliation controlee, par exemple en mettant les references orphelines a `null` tout en conservant `project_name`, `step_name`, `metadata`, `title` et `description`. Cette correction doit etre validee avec un export/backup avant execution.

## Priorite P1

### P1. Ajouter des contraintes de coherence

Contraintes recommandees:

- Montants financiers `>= 0` pour `amount`, `target_amount`, `current_amount`, `salary`, `savings`.
- `projects.type in ('simple', 'complex', 'recurring')`.
- `projects.priority between 1 and 5`.
- `premium_purchases.status in ('pending', 'approved', 'canceled', 'declined', 'failed')`, a adapter aux statuts FedaPay reels.
- `premium_transactions.transaction_type in ('allocation', 'life_allocation', 'completion')`, ou enum/metatable si extensible.

### P1. Corriger les timestamps `updated_at`

Plusieurs tables ont ou attendent `updated_at`, mais aucune migration locale ne cree un trigger generique de mise a jour automatique.

Impact: valeurs obsoletes si le code oublie de les fournir.

Recommandation: ajouter une fonction `set_updated_at()` et triggers sur tables modifiables.

### P1. Supprimer l'index redondant sur `premium_purchases.provider_transaction_id`

La colonne a deja une contrainte unique, qui cree un index unique. L'index `premium_purchases_provider_transaction_idx` est probablement redondant.

Action: confirme par l'inventaire direct. Supprimer uniquement apres validation.

### P1. Nettoyer les policies RLS dupliquees

Policies redondantes confirmees par l'inventaire:

- `debts`: `Dettes personnelles` et `debts_own`.
- `profiles`: `Profils personnels` et `profiles_own` couvrent le meme `ALL`.
- `projects`: `Users can manage own projects` et `projects_own`.
- `transactions`: trois policies couvrent l'acces proprietaire.

Policies a examiner manuellement, pas forcement redondantes:

- `milestones`: une policy via projet parent et `milestones_own` peuvent avoir des roles differents selon les operations.
- `profiles`: les policies SELECT/UPDATE se superposent partiellement avec `profiles_own`.

Impact: pas forcement dangereux, mais augmente la confusion et le risque de modifier une policy sans voir qu'une autre accorde encore l'acces.

### P1. Eviter les relations orphelines

`premium_transactions.project_id` et `step_id` semblent logiques mais aucune FK n'est versionnee.

Recommandation:

- FK nullable `premium_transactions.project_id -> projects(id) on delete set null`.
- FK nullable `premium_transactions.step_id -> milestones(id) on delete set null`.
- FK `milestones.project_id -> projects(id) on delete cascade`.

L'inventaire confirme deja les FK principales `milestones.project_id -> projects(id)` et `project_contributions.project_id -> projects(id)` en cascade. Les FK `premium_transactions.project_id` et `step_id` restent absentes.

Preflight: ces deux FK ne sont pas ajoutables immediatement parce que des references orphelines existent.

## Priorite P2

### P2. Clarifier le modele `user_data` vs tables Premium

Il existe deux representations de l'epargne:

- `user_data.data.savings` pour la version gratuite.
- `profiles.savings` pour la version Premium.

Le code contient deja des endpoints de reparation/synchronisation, signe d'une divergence connue.

Recommandation: documenter la source de verite. Idealement:

- `user_data.data.savings` reste la source gratuite.
- `profiles.savings` devient un miroir/cache Premium derive, ou bien disparait au profit d'une source unique.

### P2. Normaliser les donnees gratuites

`user_data.data` stocke `expenses`, `debts`, `extraIncome`, `categories` en JSON. C'est simple, mais limite:

- requetes analytiques difficiles;
- contraintes impossibles sur les elements internes;
- indexation fine impossible;
- migrations de forme JSON plus risquees.

Recommandation: garder le JSON si l'objectif est MVP/offline-first. Sinon migrer progressivement vers `expenses`, `debts`, `income`, `categories` relationnelles.

### P2. Nommage mixte

Nommage observe:

- SQL: snake_case.
- JSON gratuit: camelCase (`nextMonthSalary`, `periodStart`, `lastActivity`).
- Premium: melange `step_id` en DB et `stepId` dans UI.

Ce n'est pas bloquant, mais il faut maintenir une convention documentee.

## Objets inutilises ou obsoletes

Depuis le code et l'inventaire reel:

- Tables utilisees: `user_data`, `profiles`, `projects`, `milestones`, `premium_transactions`, `premium_purchases`, `app_settings`, `admin_audit_logs`.
- Tables presentes mais sans usage direct observe dans le code local: `admin_users`, `debts`, `transactions`, `project_contributions`.
- RPC utilisee: `has_premium_access`.
- Bucket utilise: `avatars`.
- Aucune vue n'est appelee depuis le code.
- Aucun trigger n'est reference explicitement.

Attention: "sans usage direct observe" ne veut pas dire "a supprimer". `transactions` contient 8 lignes. `admin_users` contient 1 ligne. Ces objets doivent etre conserves tant qu'une analyse produit n'a pas confirme leur obsolescence.

## Risques de securite

- Donnees financieres sensibles: RLS stricte obligatoire sur toutes les tables utilisateur.
- `app_settings` est lisible publiquement. C'est acceptable pour une offre commerciale, mais ne jamais y stocker de secret.
- La fonction `has_premium_access` est `security definer`. Elle limite bien par `auth.uid() = target_user_id`, mais doit rester avec `search_path` fixe.
- Les endpoints admin se basent sur email/metadonnees. C'est pratique, mais les droits admin devraient idealement etre centralises dans `app_metadata` ou une table `admin_users` protegee.
- Webhook FedaPay accepte la signature optionnelle: si aucun secret webhook n'est configure, la verification est bypass. En production, `FEDAPAY_WEBHOOK_SECRET` doit etre obligatoire.

## Index recommandes

A confirmer avec l'inventaire reel:

- `user_data(id)` PK.
- `projects(user_id, created_at desc)`.
- `projects(user_id, is_recurring)`.
- `milestones(project_id, created_at)`.
- `milestones(user_id)`.
- `premium_transactions(user_id, created_at desc)`.
- `premium_transactions(project_id)`.
- `premium_purchases(user_id, status)` deja present.

## Recommandations d'execution

1. Garder la production intacte et conserver les exports `remote_inventory.json` / `remote_data_preflight.json`.
2. Rejouer la baseline uniquement sur un environnement vide/preview.
3. Valider les flux utilisateurs critiques.
4. Reconciler `premium_transactions` orphelines sans supprimer l'historique.
5. Decider le statut de `transactions`, `debts`, `project_contributions` apres validation produit.
6. Versionner le bucket `avatars` et durcir les policies storage apres adaptation du chemin d'upload.
7. Lancer les corrections recommandees depuis `supabase/audit/02_recommended_fixes.sql` uniquement apres revue.
