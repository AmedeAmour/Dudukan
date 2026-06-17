# Audit responsive mobile - Paiement et Dudukan Plus

Date: 2026-06-16  
Scope: page de paiement et version payante Dudukan Plus.

## Objectif

Appliquer la même méthode que pour la version gratuite:

- comparer un grand mobile `414 x 896`;
- comparer un petit mobile `320 x 568`;
- identifier les risques d'affichage;
- prioriser les corrections sans toucher aux données utilisateurs.

Important: le compte de test actuellement connecté possède déjà l'accès Dudukan Plus. La page de paiement est donc automatiquement contournée par l'application. L'audit Paiement ci-dessous est basé sur le composant `Payment.jsx` et ses règles CSS responsive déjà présentes. L'audit Dudukan Plus, lui, a été vérifié dans le navigateur sur les deux tailles.

## Synthèse exécutive

La version Plus est globalement plus avancée côté responsive que la version gratuite. Elle contient déjà une couche CSS dédiée dans `src/premium/PremiumStyles.css`, avec des breakpoints `480px`, `420px`, `390px` et `360px`.

Sur `320px`, aucun débordement horizontal global n'a été détecté sur les écrans Premium vérifiés. Le vrai sujet est la densité: certaines cartes deviennent très hautes, en particulier le tableau de bord Plus, les projets, le coach, la dernière allocation et le profil.

La page de paiement semble mieux préparée que plusieurs écrans gratuits grâce aux classes `payment-*` déjà présentes dans `src/index.css`. Elle doit néanmoins être testée avec un compte non premium pour confirmer le rendu réel.

## Page de paiement

Fichier principal: `src/screens/Payment.jsx`  
Styles responsive principaux: `src/index.css`

### Structure observée dans le code

La page contient:

- bouton retour;
- hero Dudukan Plus;
- carte de prix;
- grille de fonctionnalités;
- bloc aperçu local optionnel;
- carte checkout;
- moyens de paiement;
- bouton de continuation vers paiement sécurisé;
- état processing;
- état success.

### Grand mobile `414 x 896`

Attendu:

- Le hero, la carte de prix et les fonctionnalités en grille `2 colonnes` devraient tenir correctement.
- Le prix principal et l'ancien prix ont assez d'espace.
- Les badges de confiance en bas peuvent rester en deux colonnes.

Risque:

- Si le titre d'offre ou le prix configuré dans `app_settings.plus_plan` devient trop long, le hero et la carte prix peuvent prendre beaucoup de hauteur.

### Petit mobile `320 x 568`

Attendu:

- Le CSS contient déjà des protections:
  - `.payment-main-price` avec taille responsive;
  - `.payment-offer-row` en colonne sous `380px`;
  - `.payment-feature-grid` compact;
  - `.payment-trust-grid` en une colonne sous `380px`;
  - bouton checkout pleine largeur.

Risques:

- La page est longue: sur `320 x 568`, l'utilisateur devra beaucoup scroller avant le bouton de paiement.
- La grille des fonctionnalités peut devenir trop dense.
- Le bouton `Continuer le paiement - montant` peut être très long si le montant/devise change.
- Les textes de réassurance sont nombreux avant l'action principale.

### Recommandations Paiement

Priorité 1:

- Tester avec un compte non premium pour valider le rendu réel dans le navigateur.
- Garder le bouton de paiement visible plus tôt sur petit écran, soit en réduisant les blocs avant checkout, soit en remontant la carte checkout.
- Ajouter une règle spécifique `max-width: 360px` pour raccourcir le texte du bouton:
  - desktop/mobile normal: `Continuer le paiement - 10 000 XOF`;
  - très petit mobile: `Continuer - 10 000 XOF`.

Priorité 2:

- Sur `<= 360px`, passer les fonctionnalités en une colonne si les descriptions sont longues.
- Vérifier le rendu des états `processing` et `success`, surtout les grands titres.
- Prévoir un test visuel avec les trois états:
  - sélection;
  - processing;
  - success.

Priorité 3:

- Ajouter des noms accessibles si certains boutons icônes ou états dynamiques ne sont pas suffisamment nommés.
- Ajouter un retour visuel si la redirection FedaPay échoue.

## Dudukan Plus - audit réel navigateur

Écrans vérifiés:

- Tableau de bord Plus
- Projets
- Plan de financement
- Formulaire d'ajout de projet
- Profil
- Navigation basse Premium

Tailles testées:

- `414 x 896`
- `320 x 568`

Résultat général:

- Aucun débordement horizontal global détecté.
- Largeur page à `320px`: `320px`.
- Cartes principales à `320px`: environ `280px` de large.
- Navigation basse Premium: environ `78px` de hauteur.

## Comparaison par écran Premium

### Tableau de bord Plus

Grand mobile `414 x 896`:

- Les cartes sont lisibles.
- La progression globale, l'effort conseillé et les transactions tiennent correctement.
- Certaines cartes sont déjà hautes, notamment le coach et la dernière allocation.

Petit mobile `320 x 568`:

- Pas de débordement horizontal.
- La carte "Coach Dudukan Plus" devient très haute.
- La carte "Effort conseillé ce mois" augmente fortement en hauteur.
- La carte "Suivi de la dernière répartition" est longue et occupe presque tout un écran.

Actions recommandées:

- Rendre les blocs longs repliables par défaut sur `<= 360px`.
- Limiter la hauteur initiale du coach avec un bouton "Voir plus".
- Compacter "Point du jour" et "Score du plan" pour éviter un premier écran trop chargé.

### Projets

Grand mobile `414 x 896`:

- Les cartes projet restent lisibles.
- Les informations cible, reste à financer, délai et tendance sont présentes.

Petit mobile `320 x 568`:

- Pas de débordement horizontal.
- Les cartes projet deviennent très hautes.
- La carte de faisabilité globale prend beaucoup plus de hauteur.
- Les projets complexes avec jalons peuvent devenir difficiles à scanner.

Actions recommandées:

- Introduire un mode carte compacte sur `<= 360px`.
- Afficher seulement les métriques essentielles dans la liste:
  - progression;
  - cible;
  - reste à financer;
  - délai.
- Déplacer les détails secondaires dans la page détail projet.

### Ajouter un projet

Grand mobile `414 x 896`:

- Le formulaire devrait être confortable.
- Les modes Simple / Complexe / Récurrent sont visibles.

Petit mobile `320 x 568`:

- Pas de débordement horizontal détecté.
- Le formulaire reste utilisable.
- La topbar affiche encore le titre du dernier onglet actif, ce qui peut créer une incohérence: le contenu dit "Planifier un Projet", mais la topbar peut encore afficher "Plan de Financement".

Actions recommandées:

- Quand `isAddingProject` est actif, la topbar devrait afficher `Planifier un projet`.
- Vérifier la hauteur du formulaire avec le clavier mobile réel.
- Empiler proprement les sélecteurs de type de projet sur `<= 360px` si besoin.

### Plan de financement

Grand mobile `414 x 896`:

- La structure est claire.
- La répartition visuelle, le conseil et l'historique sont lisibles.

Petit mobile `320 x 568`:

- Pas de débordement horizontal.
- Les cartes mesurées restent dans `280px`.
- La carte "Répartition proposée" devient longue.
- Les montants et pourcentages restent lisibles avec les données actuelles.

Actions recommandées:

- Garder la carte "Épargne réelle totale" très concise.
- Sur `<= 360px`, empiler les lignes projet/montant/progression.
- Rendre l'historique récent compact, avec détails secondaires accessibles au tap.

### Profil Premium

Grand mobile `414 x 896`:

- Les sections sont lisibles.
- Le résumé financier tient correctement.

Petit mobile `320 x 568`:

- Pas de débordement horizontal.
- Le résumé financier devient haut.
- Les préférences d'accompagnement et paramètres intelligents deviennent denses.
- La zone de danger reste visible mais prend beaucoup de place.

Actions recommandées:

- Transformer les sections longues en accordéons.
- Mettre la zone de danger en section fermée par défaut.
- Réduire les textes d'explication visibles sur `<= 360px`.

### Navigation basse Premium

Grand mobile `414 x 896`:

- Les quatre onglets et le bouton central sont lisibles.
- Le bouton central est bien identifié par `aria-label="Ajouter un projet"`.

Petit mobile `320 x 568`:

- Pas de débordement.
- Les labels sont tronqués proprement.
- La navigation reste autour de `78px` de hauteur.

Point à vérifier:

- Pendant la collecte automatique, le bouton central ouvre une feuille d'actions avant le formulaire. C'est correct fonctionnellement, mais il faut s'assurer visuellement que cette feuille tient bien à `320px`.

Actions recommandées:

- Ajouter un `aria-label` aux boutons d'onglets Premium, pas seulement au bouton central.
- Vérifier la feuille d'actions sur `320 x 568` avec toutes ses options.
- Conserver le FAB plus petit sous `360px`, comme le CSS le fait déjà.

## Problèmes transversaux Premium

### 1. Trop de contenu affiché directement

Dudukan Plus donne beaucoup de valeur, mais affiche parfois trop d'informations d'un coup.

Impact:

- Sur `320 x 568`, certaines cartes dépassent presque ou largement la hauteur d'un écran.
- L'utilisateur peut avoir du mal à trouver l'action principale.

Recommandation:

- Utiliser des résumés courts et des sections repliables.

### 2. Incohérence de titre dans l'ajout de projet

Quand le formulaire d'ajout est ouvert, le titre de topbar peut rester lié à l'onglet précédent.

Impact:

- Confusion possible: l'utilisateur voit "Plan de Financement" en haut et "Planifier un Projet" dans le contenu.

Recommandation:

- Modifier `getScreenTitle()` ou sa logique d'appel pour retourner `Planifier un projet` quand `isAddingProject === true`.

### 3. Cartes projet trop détaillées en liste

Les cartes de projets exposent beaucoup de détails dans la liste.

Impact:

- Bonne richesse sur grand mobile, mais scan difficile sur petit mobile.

Recommandation:

- Liste compacte + page détail riche.

### 4. Accessibilité des boutons d'onglets Premium

Le bouton central a un `aria-label`, mais les autres onglets dépendent surtout du texte visible.

Impact:

- Correct dans beaucoup de cas, mais plus robuste avec un `aria-label` explicite.

Recommandation:

- Ajouter `aria-label={item.label}` sur les boutons `.premium-nav-item`.

## Priorités de correction

### Priorité 1

- Corriger le titre topbar lors de l'ajout de projet.
- Tester la page de paiement avec un compte non premium.
- Compacter le tableau de bord Premium sur `<= 360px`.

### Priorité 2

- Compacter les cartes Projets sur petit écran.
- Compacter la carte "Suivi de la dernière répartition".
- Rendre le coach repliable.

### Priorité 3

- Améliorer le Plan de financement:
  - lignes plus empilées;
  - historique compact;
  - détails secondaires masqués.

### Priorité 4

- Transformer certaines sections Profil en accordéons.
- Ajouter les `aria-label` manquants.
- Tester les états Paiement `processing` et `success`.

## Plan d'exécution proposé

1. Corriger les petites incohérences Premium visibles sans risque:
   - topbar ajout projet;
   - `aria-label` navigation.
2. Corriger le tableau de bord Premium:
   - coach;
   - dernière allocation;
   - effort conseillé.
3. Corriger la liste Projets.
4. Corriger Plan de financement.
5. Corriger Profil.
6. Créer ou utiliser un compte non premium pour tester réellement la page Paiement.
7. Ajuster Paiement si le test réel confirme les risques.

## Conclusion

La version Plus est plus solide techniquement que la version gratuite sur mobile, mais elle est plus dense. Le travail prioritaire n'est pas de réparer des débordements, mais de rendre l'expérience plus lisible, plus courte au premier regard, et mieux hiérarchisée sur les petits écrans.

La page de paiement semble déjà bien protégée par le CSS responsive, mais elle doit encore être validée avec un compte sans accès Plus pour confirmer le rendu réel avant déploiement.
