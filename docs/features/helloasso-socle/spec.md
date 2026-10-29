# Spec — Socle HelloAsso (client, jeton, configuration, schéma)

> Slug : `helloasso-socle` · Créée le : 2026-10-22 · Transverse : **oui** (nouvelles tables, secrets) ⇒ planner en opus
> **Tests d'abord : oui** (argent / données des adhérents)
> Cadrage : [helloasso-sync/options.md](../helloasso-sync/options.md) § Décision (option B) · **Lot 1/7** · Dépend de : —

## Objectif
Poser les fondations communes à tous les lots HelloAsso :
- un client HelloAsso serveur unique ;
- une gestion fiable du jeton OAuth ;
- une configuration propre production / sandbox ;
- le schéma HelloAsso complété par une nouvelle migration.

Seule fonctionnalité visible : un test de connexion dans l'admin.

## Critères d'acceptation
- [ ] Un **seul module serveur** (`server/utils/…`) porte tous les appels à l'API HelloAsso. Aucune route n'appelle directement l'API ou l'endpoint OAuth.
- [ ] Jeton :
  - [ ] obtenu en `client_credentials` ;
  - [ ] `access_token` mis en cache **en base**, partagé entre instances serverless ;
  - [ ] renouvelé avant expiration, par un seul chemin (verrou) : la rotation du `refresh_token` ne doit jamais révoquer le jeton en cours ;
  - [ ] jamais plus d'un appel d'auth par renouvellement.
- [ ] Erreurs : un `401` déclenche une seule ré-authentification puis une erreur claire ; un `429` ne provoque aucune boucle et remonte une erreur exploitable.
- [ ] Configuration via `runtimeConfig` **serveur uniquement** : client id et secret, slug de l'organisation, URL de l'API, environnement `sandbox` | `production`. Rien dans `runtimeConfig.public`, plus de `process.env` direct dans le code HelloAsso.
- [ ] **Nouvelle migration** (ex. `2026MMJJ_helloasso_socle.sql`, après `20260520`). `20260520_helloasso.sql` n'est **jamais modifiée** : ses objets existent de fait en prod (vérifié contre `prod_schema.sql` le 2026-10-24) et elle est appliquée sur le dev (2026-10-25). La migration doit passer sur une base qui contient déjà des lignes `helloasso_forms` (prod) : colonne ajoutée nullable → remplissage → `NOT NULL` le cas échéant.
  - [ ] `helloasso_forms` porte `season` et un `event_id` nullable ;
  - [ ] nouvelle table du jeton, sans aucun accès client (RLS) ;
  - [ ] nouvelle table des passages de synchronisation : début, fin, compteurs, erreur ;
  - [ ] `profile_payments` reste en l'état, elle sera refondue au lot 2.
- [ ] Route admin « Tester la connexion » (`requireAdmin`) affichée dans `HelloAssoConfig.vue` : environnement, organisation, OK ou message d'erreur.
- [ ] Les routes HelloAsso existantes (`sync-helloasso.post.ts`, `helloasso-forms*`) passent par le nouveau client.
- [ ] Tests Vitest du client, avec `fetch` mocké : cache, renouvellement, `401`, `429`.
- [ ] Procédure sandbox documentée : création du compte de test, clés, URL, bascule d'environnement.

## Parcours utilisateur (e2e)
- Aucun (espace admin + appels HelloAsso : couvert par Vitest et fixtures)

## Hors périmètre
- Synchronisation des adhésions (lot 2).
- File à rapprocher (lot 3).
- Cron (lot 4).
- Sorties (lot 5).
- Checkout (lot 6).
- Webhook (lot 7).

## Contraintes / contexte
- Skill `helloasso-api` : `auth.md` et `limits-sandbox.md`. Endpoint d'auth limité (10 appels/10 s, 20/10 min, 50/h). L'URL du token en sandbox (`/oauth2` ou `/oauth2/token`) est **à vérifier** en premier.
- Skill `supabase-db` : secrets et service role côté serveur uniquement ; `requireAdmin` sur toute route admin.
- Code existant non commité, à reprendre : `server/api/admin/sync-helloasso.post.ts` redemande le token à chaque appel ; le webhook lit `process.env`.
- Décision de cadrage à respecter : HelloAsso est la source de vérité pour l'état des paiements ; aucune fonctionnalité de remboursement par l'API.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok |
