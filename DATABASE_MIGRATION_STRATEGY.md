# Strategie Migration Base De Donnees

## Objectif

Stabiliser la base Dudukan sans perte de donnees pour les utilisateurs existants. La base est en production, donc toute action doit etre reversible, testee et non destructive par defaut.

## Regles De Securite

- Ne jamais supprimer une table, colonne, policy ou index en production sans sauvegarde et validation.
- Ne jamais renommer une colonne utilisee par le code sans phase de compatibilite.
- Ne jamais migrer les donnees JSON vers des tables relationnelles en une seule etape irreversible.
- Toujours preferer `create if not exists`, `add column if not exists`, index concurrents si possible, et scripts idempotents.
- Faire un inventaire ou backup avant chaque changement structurel.

## Etat Actuel

Tables publiques confirmees en base:

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

Toutes les tables publiques ont RLS active. Le bucket `avatars` existe et est public.

Comptage donnees reel, releve en lecture seule le 2026-06-15:

| Table / bucket | Lignes / objets | Decision immediate |
| --- | ---: | --- |
| `user_data` | 21 | conserver comme source gratuite actuelle |
| `profiles` | 20 | conserver comme source Premium |
| `projects` | 10 | conserver |
| `milestones` | 13 | conserver |
| `premium_transactions` | 11 | conserver; nettoyer les references orphelines avant FK |
| `premium_purchases` | 26 | conserver; source d'acces Plus |
| `transactions` | 8 | conserver comme donnees historiques utilisateur |
| `app_settings` | 2 | conserver; `plus_plan` et `plus_offer` |
| `admin_users` | 1 | conserver; clarifier source admin officielle |
| `admin_audit_logs` | 0 | conserver pour audit futur |
| `debts` | 0 | conserver pour normalisation future, ne pas supprimer maintenant |
| `project_contributions` | 0 | conserver pour normalisation future, ne pas supprimer maintenant |
| bucket `avatars` | 8 | conserver |

Controle d'integrite:

- Aucun `milestones.project_id` orphelin.
- Aucun `project_contributions.project_id` orphelin.
- `premium_transactions`: 11 lignes avec `project_id`, dont 5 references projet orphelines.
- `premium_transactions`: 1 ligne avec `step_id`, dont 1 reference jalon orpheline.
- `user_data.data` contient bien `expenses`, `debts`, `savings` et `categories` sur les 21 lignes.

Conclusion: la production contient deja des donnees utilisateur dans plusieurs modeles. La bonne approche est une reconciliation progressive, pas un nettoyage destructif.

## Sources De Verite A Court Terme

Court terme, on conserve les sources de verite actuelles pour ne pas casser les utilisateurs:

- Donnees gratuites: `user_data.data`.
- Premium/projets: `profiles`, `projects`, `milestones`, `premium_transactions`.
- Paiement Plus: `premium_purchases`.
- Configuration publique/admin: `app_settings`, `admin_audit_logs`, `admin_users`.

Tables a conserver mais a reconcilier:

- `debts`
- `transactions`
- `project_contributions`

Ces tables semblent destinees a une normalisation ou a des versions anterieures/futures. `transactions` contient deja 8 lignes, donc elle doit etre traitee comme historique utilisateur. `debts` et `project_contributions` sont vides, mais doivent rester tant qu'une decision produit/code n'a pas confirme leur abandon.

## Phases Recommandees

### Phase 1: Baseline Sans Risque

But: rendre le schema reproductible depuis le repo.

Actions:

- Ajouter la migration `20260615171016_baseline_existing_database.sql`.
- Ne pas l'executer automatiquement sur production.
- L'utiliser comme baseline pour nouvel environnement ou revue.
- Conserver `supabase/audit/remote_inventory.json` comme preuve d'etat.
- Valider la baseline sur le projet preview `taupjykeipmpmhbdwwgn`.

Critere de succes:

- Un nouveau projet Supabase peut recreer les tables, indexes, fonctions, triggers, RLS et bucket attendus.

Etat 2026-06-15: succes sur `Dudukan Preview Audit`. Voir `DATABASE_PREVIEW_VALIDATION.md`.

### Phase 2: Tests De Non Regression

Tester les flux suivants:

- Inscription/connexion.
- Chargement et sauvegarde `user_data`.
- Ajout depense/epargne/dette gratuite.
- Achat Dudukan Plus et `has_premium_access`.
- Creation de profil Premium.
- Creation de projet simple, recurrent, complexe.
- Creation/modification de jalons.
- Allocation projet et journal `premium_transactions`.
- Upload avatar dans `avatars`.
- Actions admin: diagnostic, grant Plus, sync savings, repair savings category, settings.

### Phase 3: Reconciliation Des Tables Normalisees

Analyser les donnees reelles:

- `debts`: actuellement vide; decider si elle devient la future table normalisee des dettes.
- `transactions`: contient 8 depenses historiques (`expense`) par categories; verifier si elles viennent d'une ancienne version applicative ou d'un test reel.
- `project_contributions`: actuellement vide; decider si elle remplace une partie de `premium_transactions` ou reste abandonnee.
- `admin_users`: doit-elle devenir la source officielle des admins?
- `premium_transactions`: reparer ou neutraliser les references orphelines avant d'ajouter des FK.

Decisions possibles:

- Garder et integrer au code.
- Garder comme archive technique.
- Migrer progressivement depuis `user_data`.
- Supprimer seulement dans une phase ulterieure avec backup et validation.

### Phase 4: Compatibilite Code/Base

Si on migre vers des tables relationnelles:

1. Ajouter lecture double: table normalisee d'abord, fallback JSON.
2. Ajouter ecriture double temporaire si necessaire.
3. Backfill JSON vers tables relationnelles avec script idempotent.
4. Comparer les totaux par utilisateur.
5. Basculer l'UI vers les tables relationnelles.
6. Garder `user_data` en archive/fallback pendant plusieurs releases.

### Phase 5: Nettoyage Controle

Seulement apres tests:

- Supprimer l'index redondant `premium_purchases_provider_transaction_idx`.
- Fusionner les policies RLS dupliquees.
- Ajouter FK manquantes sur `premium_transactions.project_id` et `step_id` seulement apres resolution des 5 references projet orphelines et de la reference jalon orpheline.
- Ajouter contraintes CHECK sur montants/statuts si aucune donnee existante ne les viole.

## Sauvegardes Avant Changement

Avant chaque migration destructive ou cleanup:

- Exporter `remote_inventory.json`.
- Exporter les tables critiques: `user_data`, `profiles`, `projects`, `milestones`, `premium_transactions`, `premium_purchases`.
- Verifier qu'un rollback applicatif est possible.
- Garder le script SQL de rollback quand c'est applicable.

## Recommandation Immediate

Ne pas executer de cleanup maintenant.

La prochaine action saine est:

1. Garder la production intacte.
2. Versionner et relire la baseline comme documentation executable du schema reel.
3. Creer un environnement Supabase de test/preview.
4. Rejouer la baseline sur une base vide.
5. Tester les flux critiques.
6. Ensuite seulement, appliquer des corrections idempotentes et non destructives en production, une par une, avec backup.
