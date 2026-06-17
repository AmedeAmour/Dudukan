# Dudukan

Dudukan est une application React/Vite de gestion financière personnelle avec une version gratuite et un mode Premium orienté projets de vie.

## Stack

- React + Vite
- Supabase Auth, Database et Storage
- Vercel pour l'hébergement et les fonctions serverless
- FedaPay pour le paiement Premium

## Commandes

```bash
npm install
npm run dev
npm run build
npm run lint
```

Pour tester les fonctions API localement, notamment le paiement FedaPay, utiliser :

```bash
npm run dev:api
```

Si le port par defaut est deja pris :

```bash
$env:DEV_PORT=5176; npm.cmd run dev:api
```

Sous Windows/PowerShell, si `npm` est bloqué par la politique d'exécution, utiliser :

```bash
npm.cmd run build
npm.cmd run lint
```

## Variables d'environnement frontend

Créer un fichier `.env` local :

```bash
URL_SUPABASE_VITE=
VITE_SUPABASE_ANON_KEY=
```

Ces variables sont publiques côté navigateur. Ne jamais y mettre de clé `service_role` ou de clé secrète FedaPay.

## Variables d'environnement Vercel

À configurer dans Vercel, côté projet :

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FEDAPAY_SECRET_KEY=
FEDAPAY_SANDBOX_SECRET_KEY=
FEDAPAY_LIVE_SECRET_KEY=
FEDAPAY_ENVIRONMENT=sandbox
FEDAPAY_WEBHOOK_SECRET=
FEDAPAY_SANDBOX_WEBHOOK_SECRET=
FEDAPAY_LIVE_WEBHOOK_SECRET=
APP_URL=
FEDAPAY_RETURN_URL=
```

Notes :

- En production, le webhook FedaPay doit avoir un secret configure. Sans secret, `/api/fedapay/webhook` refuse la confirmation.

- `SUPABASE_SERVICE_ROLE_KEY` reste uniquement côté API Vercel.
- `FEDAPAY_SECRET_KEY` reste uniquement côté API Vercel.
- `FEDAPAY_ENVIRONMENT` vaut `sandbox` au départ, puis `live` au lancement.
- `FEDAPAY_RETURN_URL` est l'adresse où FedaPay ramène l'utilisateur après le paiement.
- `FEDAPAY_WEBHOOK_SECRET` vient du webhook créé dans le dashboard FedaPay.

Pour le déploiement actuel :

```bash
APP_URL=https://dudukan.vercel.app
FEDAPAY_RETURN_URL=https://dudukan.vercel.app/?payment=success
```

## Paiement Premium

Le plan initial est :

- Accès à vie
- Prix : `9 900 XOF`
- Provider : FedaPay
- Plan code : `lifetime_9900_xof`
- App code : `dudukan`
- Référence marchande : préfixe `DUDUKAN-`

Le même compte FedaPay peut servir à une autre application. Dudukan marque ses transactions avec `app_code=dudukan`, `product_name=Dudukan Plus` et une référence `DUDUKAN-...`. Le webhook Dudukan ignore les paiements qui ne portent pas ces marqueurs.

Le frontend ne doit jamais activer le Premium directement. Le flux correct est :

1. L'utilisateur clique sur le paiement Premium.
2. `/api/fedapay/create-checkout` crée une transaction FedaPay.
3. L'utilisateur paie sur la page FedaPay.
4. FedaPay ramène l'utilisateur sur `FEDAPAY_RETURN_URL`.
5. FedaPay appelle aussi `/api/fedapay/webhook` via le webhook configuré dans son dashboard.
6. Le webhook valide l'événement et marque l'achat `approved`.
7. L'app lit l'accès Premium depuis `premium_purchases`.

Dans le dashboard FedaPay, l'URL webhook à configurer est :

```text
https://dudukan.vercel.app/api/fedapay/webhook
```

## Migration Supabase

La migration à appliquer est :

```text
supabase/migrations/20260527_premium_purchases_fedapay.sql
```

Elle ajoute ou complète la table `premium_purchases`, active RLS et crée la fonction `has_premium_access`.

## Sécurité

- Ne pas partager les mots de passe, clés FedaPay, webhook secret ou `SUPABASE_SERVICE_ROLE_KEY`.
- L'accès Premium doit dépendre d'un paiement approuvé côté base, pas d'un simple état local.
- Les utilisateurs existants restent préservés : l'ancien `user_metadata.is_premium` sert seulement de fallback temporaire.
