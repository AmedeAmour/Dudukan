# Enquete - remise a zero des donnees utilisateur

Date: 2026-06-20

## Constat principal

Le probleme observe ne semble pas etre cause directement par un paiement FedaPay effectue par un utilisateur.

Le flux FedaPay actuel ecrit principalement dans:

- `premium_purchases`
- les metadonnees utilisateur Auth (`is_premium`)

Il ne modifie pas directement `public.user_data`, qui contient les donnees de la version gratuite.

## Cause racine probable

Le risque principal est dans `src/context/FinanceContext.jsx`.

Le fonctionnement actuel est:

1. Au changement ou chargement d'utilisateur, l'etat local est remis a zero.
2. L'application essaie de charger `public.user_data`.
3. Si le chargement echoue, retourne une ligne absente, ou si aucune donnee locale n'est trouvee, l'application marque quand meme `isInitialized = true`.
4. Une fois `isInitialized = true`, un effet automatique sauvegarde l'etat courant dans `user_data`.
5. Si l'etat courant est encore vide, cela peut ecraser les donnees existantes par une structure vide ou quasi vide.

Cela peut etre declenche par des rechargements, redirections, changements de mode, erreurs reseau Supabase, cle API invalide, session instable ou cache navigateur.

## Pourquoi le travail FedaPay a pu reveiller le probleme

L'integration paiement n'a pas besoin de modifier `user_data` pour declencher le symptome.

Pendant l'integration paiement, on provoque naturellement:

- des redirections externes vers FedaPay;
- des retours vers l'application;
- des changements entre mode gratuit, page paiement et mode premium;
- des redeploiements Vercel;
- des changements de variables d'environnement;
- des rechargements avec session Supabase active.

Ces evenements augmentent les chances que l'application demarre alors que les donnees cloud ne sont pas encore chargees, puis sauvegarde un etat vide.

## Observations Supabase en lecture seule

Lecture effectuee en lecture seule sur `user_data`, `profiles`, `projects`, `premium_transactions` et `premium_purchases`.

Resume:

- `user_data`: 21 lignes controlees.
- 1 ligne totalement vide avec `onboarded: false`, datee du 2026-06-02.
- Plusieurs lignes ont `onboarded: true` mais des donnees financieres a zero, ce qui ressemble visuellement a un compte vide.
- Certaines lignes `profiles` contiennent encore des montants premium ou des projets alors que `user_data` est vide ou quasi vide.
- Les lignes FedaPay recentes ne correspondent pas toutes aux lignes `user_data` vides.

Conclusion: le probleme n'est pas limite aux comptes qui ont tente un paiement.

## Indices historiques Git

Le commit `f326e23` du 2026-05-14 indiquait deja:

> fix: resolve race condition and prevent data loss on refresh

Cela confirme qu'un risque de perte de donnees au chargement avait deja existe.

Le commit `a1e9c74` du 2026-05-28 a restaure le comportement stable de l'application gratuite, mais a conserve une sauvegarde automatique qui peut ecrire apres un chargement incomplet.

Le commit `3b7381f` du 2026-06-17, lie au mobile et a FedaPay, n'a presque pas change le mecanisme de chargement/sauvegarde des donnees utilisateur gratuites.

## Risque actuel

Tant que `FinanceContext.jsx` permet de sauvegarder automatiquement apres un chargement cloud incomplet, le risque peut revenir.

Le risque est plus eleve quand:

- Supabase est lent ou inaccessible;
- la cle publique Supabase est invalide;
- plusieurs onglets sont ouverts;
- la session Supabase est verrouillee ou en transition;
- l'utilisateur revient d'une page externe;
- l'app est redeployeee ou rechargee avec cache.

## Correctif recommande avant toute reprise paiement

Priorite P0:

1. Ajouter un garde-fou cote Supabase sur `public.user_data`.
2. Refuser en base l'ecrasement d'une ligne contenant des donnees financieres par une ligne vide/quasi vide.
3. Ne jamais sauvegarder dans `user_data` si le chargement cloud a echoue.
4. Distinguer explicitement:
   - `loaded_from_cloud`
   - `loaded_from_local`
   - `new_user_confirmed`
   - `load_failed`
5. Si le chargement echoue, afficher un etat bloquant et ne pas ecrire.
6. Ne creer une ligne vide que pour un nouvel utilisateur confirme, pas pour une erreur reseau.

Le garde-fou SQL prepare est:

- `supabase/migrations/20260620_prevent_user_data_empty_overwrite.sql`

Le test SQL non destructif prepare est:

- `supabase/audit/06_test_user_data_empty_overwrite_guard.sql`

Priorite P1:

1. Ajouter une table d'historique ou un trigger d'audit avant modification de `user_data`.
2. Ajouter un script de restauration manuel a partir d'une sauvegarde ou d'un snapshot.
3. Ajouter des tests automatises pour les scenarios:
   - Supabase indisponible au chargement;
   - retour depuis FedaPay;
   - multi-onglets;
   - ligne cloud existante non vide;
   - nouvel utilisateur reel.

Priorite P2:

1. Clarifier la separation entre `user_data` gratuit et tables premium.
2. Eviter que `profiles.savings` et `user_data.data.savings` divergent sans reconciliation explicite.
3. Documenter quelle table est source de verite pour chaque valeur.

## Ce qu'il ne faut pas faire

- Ne pas relancer le paiement en production avant le correctif P0.
- Ne pas faire de migration destructive.
- Ne pas synchroniser automatiquement `profiles` vers `user_data` sans validation.
- Ne pas restaurer des donnees utilisateur sans identifier la source fiable.

## Suite proposee

1. Appliquer le garde-fou SQL uniquement sur une base preview/test.
2. Executer le test SQL non destructif sur cette base preview/test.
3. Deployer l'application uniquement en preview Vercel.
4. Tester avec un compte qui a deja des donnees.
5. Tester avec un nouveau compte.
6. Tester le retour paiement/FedaPay en preview.
7. Seulement apres validation, planifier une application controlee du garde-fou SQL en production, puis le deploiement applicatif production.
