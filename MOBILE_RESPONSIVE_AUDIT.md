# Audit responsive mobile - Dudukan

Date: 2026-06-16  
Scope: version gratuite mobile, avant page de paiement et version premium.

## Objectif

Comparer le rendu de l'application sur deux tailles mobiles afin d'identifier les corrections nécessaires sans casser l'expérience existante:

- Grand mobile: `414 x 896`
- Petit mobile: `320 x 568`

L'audit se concentre sur les écrans gratuits principaux:

- Accueil
- Budget
- Dépenses
- Épargne
- Dettes
- Réglages: à auditer ensuite plus finement, car l'écran est plus long et contient des sections expansibles.

## Résumé exécutif

L'application reste fonctionnelle sur `320px`: aucune largeur de page supérieure au viewport n'a été détectée pendant la vérification des écrans principaux. C'est une base saine.

Le problème principal n'est donc pas un débordement horizontal général, mais une compression visuelle: les cartes deviennent étroites, les montants longs prennent beaucoup de place, les rangées à deux colonnes restent parfois trop ambitieuses, et certains boutons icônes manquent de libellés accessibles.

La priorité est de créer une vraie couche responsive pour les petits écrans `<= 360px`, puis d'appliquer cette couche écran par écran.

## Comparaison par écran

### Accueil

Grand mobile `414 x 896`:

- Les cartes principales sont lisibles.
- Les deux petites cartes "Moyenne / jour" et "Prévision fin de mois" tiennent côte à côte.
- La navigation basse reste confortable.

Petit mobile `320 x 568`:

- Les deux petites cartes passent à environ `138px` de largeur chacune.
- Les montants restent visibles avec les données de test, mais les montants plus longs de production peuvent rapidement rendre les cartes denses.
- La carte "Conseils intelligents" devient haute, ce qui repousse vite le contenu suivant.

Actions recommandées:

- Sur `<= 360px`, envisager de passer certaines grilles `1fr 1fr` en une seule colonne quand les montants sont longs.
- Réduire légèrement les tailles de titres et montants via des classes dédiées, pas via des styles inline dispersés.
- Ajouter `overflow-wrap: anywhere` et `font-variant-numeric: tabular-nums` aux montants importants.

### Budget

Grand mobile `414 x 896`:

- Les catégories sont lisibles.
- La structure carte par carte est claire.
- Les montants de test restent bien contenus.

Petit mobile `320 x 568`:

- Chaque carte catégorie passe à environ `288px`.
- La ligne basse "Utilisé" / "restants" devient serrée.
- Avec des montants de production très longs, comme ceux visibles sur la version en ligne, le risque de retour à la ligne maladroit est élevé.
- Le bouton "Ajouter" dans l'en-tête partage peu d'espace avec le titre.

Actions recommandées:

- Recomposer la carte Budget sur `<= 360px`:
  - ligne 1: icône + nom + actions;
  - ligne 2: budget;
  - ligne 3: progression;
  - ligne 4: utilisé / restant en colonnes empilées si nécessaire.
- Limiter le badge pourcentage à une largeur stable.
- Prévoir un format compact pour les gros montants ou autoriser un retour à la ligne propre.
- Transformer le bouton "Ajouter" en bouton icône + `aria-label` sur très petit écran.

### Dépenses

Grand mobile `414 x 896`:

- Le formulaire tient bien.
- Les deux boutons "Dépense" / "Revenu" restent confortables.

Petit mobile `320 x 568`:

- Le formulaire reste utilisable.
- La hauteur disponible est réduite, surtout avec le clavier mobile réel.
- Le bouton de validation peut se retrouver proche de la navigation basse après ouverture du clavier.

Actions recommandées:

- Garder ce flux simple, mais ajouter une marge basse dynamique au formulaire.
- S'assurer que les champs et boutons conservent au moins `44px` de hauteur tactile.
- Prévoir un comportement scroll propre quand le clavier est ouvert sur mobile réel.

### Épargne

Grand mobile `414 x 896`:

- Le total, l'objectif conseillé et l'historique sont lisibles.
- Les deux boutons d'action du header sont visibles.

Petit mobile `320 x 568`:

- Les deux boutons du header restent utilisables mais sont proches.
- Les libellés ne sont pas visibles pour les boutons `+` et `-`.
- Les lignes d'historique peuvent devenir hautes avec de longues notes ou de gros montants.

Actions recommandées:

- Ajouter des `aria-label` aux boutons dépôt/retrait.
- Sur `<= 360px`, permettre à l'historique de mettre le montant sur une ligne séparée.
- Réduire l'icône décorative de la carte total si elle gêne les montants longs.

### Dettes

Grand mobile `414 x 896`:

- La liste des dettes est lisible.
- Le champ de paiement et le bouton "Payer" tiennent côte à côte.

Petit mobile `320 x 568`:

- Les cartes tiennent sans débordement horizontal.
- Les contrôles de remboursement sont compressés.
- La combinaison champ montant + bouton "Payer" + bouton "Tout régler" peut devenir inconfortable avec des textes plus longs ou une devise plus large.

Actions recommandées:

- Sur `<= 360px`, empiler le champ de paiement et le bouton "Payer".
- Garder "Tout régler" pleine largeur.
- Ajouter un libellé accessible au bouton d'ajout de dette.

### Navigation basse

Grand mobile `414 x 896`:

- Les cinq entrées sont lisibles.
- Le bouton central fonctionne visuellement.

Petit mobile `320 x 568`:

- La navigation reste dans la largeur.
- Les labels sont tronqués/protégés par CSS, ce qui évite le débordement.
- Le bouton central cache volontairement son label, donc il doit avoir un `aria-label`.

Actions recommandées:

- Ajouter `aria-label` à chaque bouton de navigation, surtout au bouton central.
- Conserver la grille actuelle, mais stabiliser les dimensions du bouton central sur les très petits écrans.
- Vérifier la zone de sécurité basse sur iPhone avec encoche via `env(safe-area-inset-bottom)`.

### Réglages

État actuel:

- L'écran n'a pas encore été validé visuellement avec la même profondeur que les cinq onglets principaux.
- Le code contient plusieurs rangées, sections expansibles, champs inline et cartes premium.

Risques probables:

- Les sections expansibles peuvent devenir trop étroites à cause des paddings internes.
- Les champs d'édition inline peuvent entrer en conflit avec les boutons de validation.
- La carte premium peut prendre trop de hauteur au-dessus des réglages essentiels.

Actions recommandées:

- Auditer Réglages séparément après les cinq écrans principaux.
- Sur `<= 360px`, empiler les formulaires inline et réduire les paddings internes des sections expansibles.

## Problèmes transversaux détectés

### 1. Styles inline trop nombreux

Beaucoup d'écrans utilisent encore des styles inline comme `padding: '24px 20px'`, `fontSize: '28px'`, `display: 'flex'` et des largeurs fixes.

Impact:

- Les corrections responsive deviennent dispersées.
- Les petits écrans nécessitent des surcharges CSS avec `!important`.

Recommandation:

- Introduire progressivement des classes réutilisables:
  - `.screen`
  - `.screen-header`
  - `.metric-card`
  - `.amount`
  - `.compact-stack`
  - `.icon-button`

### 2. Montants financiers longs

Les montants sont au coeur de l'application et peuvent devenir très longs en production.

Impact:

- Risque de cartes trop hautes ou de texte visuellement collé.
- Risque plus fort sur Budget, Accueil, Épargne et Dettes.

Recommandation:

- Créer une classe `.money-value`:
  - retour à la ligne propre;
  - chiffres tabulaires;
  - taille responsive;
  - alignement stable.

### 3. Boutons icônes sans nom accessible

Plusieurs boutons ne montrent qu'une icône: réglages, ajout, dépôt/retrait, suppression, fermeture modale.

Impact:

- Accessibilité réduite.
- Tests automatisés plus fragiles.
- Expérience moins claire pour lecteurs d'écran.

Recommandation:

- Ajouter systématiquement `aria-label`.
- Garder une taille tactile minimale `44 x 44`.

### 4. Petits écrans `<= 360px` non traités comme breakpoint principal

Le CSS contient déjà des règles `max-width: 480px` et `max-width: 380px`, mais la logique écran par écran reste incomplète.

Impact:

- À `320px`, l'application fonctionne mais manque d'aisance.
- Certains écrans sont seulement "contenus", pas encore vraiment optimisés.

Recommandation:

- Ajouter un breakpoint clair `@media (max-width: 360px)` pour les écrans gratuits.

## Priorités de correction

### Priorité 1

- Créer une base CSS mobile free:
  - classes de page;
  - classes de montant;
  - boutons icônes;
  - règles `<= 360px`.
- Corriger Budget, car c'est l'écran le plus sensible aux gros montants.
- Ajouter les `aria-label` sur la navigation basse et les boutons d'action.

### Priorité 2

- Corriger Accueil:
  - cartes de métriques;
  - gros solde;
  - score santé;
  - conseils longs.
- Corriger Dettes:
  - contrôles de remboursement;
  - empilement des actions.

### Priorité 3

- Corriger Épargne:
  - historique;
  - boutons dépôt/retrait;
  - carte total.
- Vérifier le formulaire Dépenses avec clavier mobile réel.

### Priorité 4

- Auditer et corriger Réglages.
- Ensuite seulement passer à la page de paiement.
- Puis traiter la version premium avec la même méthode.

## Plan d'exécution proposé

1. Mettre en place les classes CSS responsive communes.
2. Refactoriser légèrement `BottomNav` pour l'accessibilité et la stabilité sur `320px`.
3. Corriger l'écran Budget.
4. Tester `414 x 896` et `320 x 568`.
5. Corriger Accueil et Dettes.
6. Tester à nouveau.
7. Corriger Épargne et Dépenses.
8. Auditer Réglages.
9. Passer à la page de paiement.
10. Passer à la version premium.

## Conclusion

La version gratuite n'est pas cassée sur petit écran, mais elle n'est pas encore suffisamment confortable pour les très petits mobiles. La correction doit être progressive et non destructive: on garde l'architecture existante, on ajoute une couche responsive commune, puis on adapte les écrans les plus sensibles en priorité.
