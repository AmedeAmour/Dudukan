# Validation Preview Supabase

Date: 2026-06-15

## Projet De Test

- Nom: `Dudukan Preview Audit`
- Ref: `taupjykeipmpmhbdwwgn`
- Organisation: `kuknepmlpulzxavnbvbb`
- Region: `eu-central-1`
- Statut creation: `ACTIVE_HEALTHY`

Ce projet est separe du projet production `tyslautcpyzoeebpjihy`.

## Actions Executees

1. Creation du projet preview via Supabase CLI.
2. Generation locale d'un mot de passe DB preview dans `C:\tmp\dudukan-preview-db-password.txt`.
3. Creation locale de la connection string preview dans `C:\tmp\dudukan-preview-db-url.txt`.
4. Application de la baseline `supabase/migrations/20260615171016_baseline_existing_database.sql` sur la base preview.
5. Application du delta de fonctions pour aligner la preview avec l'inventaire production.

Aucune action n'a ete executee sur la production.

## Verification Finale

Resultat de verification lecture seule:

| Controle | Resultat |
| --- | ---: |
| Tables publiques | 12 |
| Tables publiques avec RLS active | 12 |
| Fonctions publiques | 4 |
| Bucket `avatars` | 1 |

Fonctions publiques presentes:

- `handle_new_user()`
- `has_premium_access(uuid)`
- `rls_auto_enable()`
- `update_updated_at()`

## Test Client RLS

Un utilisateur de test a ete cree sur la preview via l'API admin du projet preview, puis reconnecte avec la cle publique client. Les operations suivantes ont ete executees avec une session utilisateur normale:

| Flux | Resultat |
| --- | --- |
| Connexion utilisateur test | OK |
| Upsert `user_data` | OK |
| Upsert `profiles` | OK |
| Insert `projects` | OK |
| Insert `milestones` | OK |
| Insert `premium_transactions` | OK |
| Lecture `projects` avec `milestones(*)` | OK |

Ce test confirme que la baseline preview permet les principaux flux Supabase/RLS utilises par le code client.

## Tests UI Preview

Tests effectues sur `http://127.0.0.1:5174`, connecte a la preview `taupjykeipmpmhbdwwgn`.

| Flux UI | Resultat |
| --- | --- |
| Connexion avec compte preview | OK |
| Chargement tableau de bord gratuit | OK |
| Ajout depense | OK |
| Rechargement et persistance de la depense | OK |
| Ajout dette | OK |
| Ajout epargne | OK |
| Passage en Dudukan Plus | OK |
| Creation projet simple | OK |
| Allocation automatique de l'epargne | OK |
| Creation projet complexe | OK |
| Creation/affichage jalon complexe | OK |
| Upload Storage `avatars` avec utilisateur authentifie | OK apres ajout policies storage |

Verification finale base preview:

| Objet | Resultat |
| --- | ---: |
| `user_data` du compte test | 1 |
| `profiles` du compte test | 1 |
| `projects` du compte test | 2 |
| `milestones` du compte test | 1 |
| `premium_transactions` du compte test | 1 |
| `premium_purchases` du compte test | 1 |
| objets `avatars` du compte test | 2 |

Policies Storage ajoutees et validees:

- `avatars_public_read`
- `avatars_insert_own`
- `avatars_update_own`
- `avatars_delete_own`

Ces policies acceptent le format de chemin actuel du code (`{userId}-{timestamp}.ext`) et le format recommande par dossier utilisateur (`{userId}/avatar.ext`).

## Point A Surveiller

Le dashboard Premium charge correctement, mais le navigateur a signale un log non bloquant:

- `Auto-profile insertion failed: Object`

Le profil existe et les flux Premium fonctionnent. Ce log vient probablement d'une tentative defensive de creation de profil alors qu'une ligne existe deja ou d'un cas d'erreur mal affiche. A nettoyer dans une phase ulterieure pour reduire le bruit console.

## Ecart Connu

La preview valide la structure et les permissions de base, mais ne contient pas les donnees utilisateurs production. Elle sert a tester les migrations, pas a simuler les volumes reels.

Les prochaines validations doivent porter sur les flux applicatifs:

- inscription UI complete;
- sauvegarde et chargement UI `user_data`;
- creation profil Premium via UI;
- creation projets et jalons via UI;
- journalisation `premium_transactions` via UI;
- acces Dudukan Plus;
- upload avatar;
- endpoints admin.
