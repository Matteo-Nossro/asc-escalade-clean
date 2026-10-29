# Plan — helloasso-socle

> Rédigé par : planner (opus) · Validé par l'utilisateur : ☑ (2026-10-25, avec 6 ajustements)
> Cadrage : [../helloasso-sync/options.md](../helloasso-sync/options.md) § Décision, option B, **lot 1/7** (socle seulement : rien des lots 2 à 7)
> Tests d'abord : **oui** · Parcours e2e : **aucun**
> **Lot bloqué à P0** tant que l'utilisateur n'a pas créé l'association de test sandbox.

## Résumé de l'approche
Un module serveur unique, `server/utils/helloasso.ts`, porte la configuration, le jeton et tous les appels HTTP à HelloAsso. Le jeton est stocké dans une table sans accès client. Son renouvellement passe par un verrou Postgres (RPC atomique) et fait au plus un appel d'auth. La configuration passe par `runtimeConfig.helloasso`, côté serveur uniquement. Le schéma est complété par une **nouvelle migration idempotente**, `supabase/migrations/20261025_helloasso_socle.sql` : `season` et `event_id` sur `helloasso_forms`, table du jeton, table des passages de synchronisation. `20260520_helloasso.sql`, déjà appliquée en prod et en dev, **n'est pas modifiée**.

Une route « Tester la connexion » est affichée dans `HelloAssoConfig.vue`. Elle vérifie le jeton, le slug, `AccessPublicData` **et** `AccessTransactions`. La synchronisation existante passe par le client, sans changer sa logique de rapprochement (refondue au lot 2). Les routes HelloAsso appliquent une répartition des rôles : actions réservées à l'admin, lecture pour admin et secrétaire, rien pour l'initiateur.

**Périmètre tranché (incertitude de l'explorer)** : les routes `helloasso-forms*` et `helloasso-stats` n'appellent pas l'API HelloAsso, donc elles n'ont rien à « faire passer par le client ». Seules `sync-helloasso.post.ts` et la nouvelle route de test l'utilisent. `helloasso-forms*` est modifiée pour la colonne `season` et pour les rôles, `helloasso-stats` pour les rôles uniquement. Le webhook (lot 7) ne change que sur un point : il lit son secret via `runtimeConfig`, pour qu'il ne reste aucun `process.env` dans le code HelloAsso.

## Décisions (validées par l'utilisateur)
- **Refresh refusé** : le `refresh_token` est effacé en base et une erreur claire est renvoyée. Il n'y a qu'un seul appel d'auth par renouvellement ; le prochain appel repasse en `client_credentials`.
- **Jetons** : stockés en clair, protégés par RLS sans aucune policy et par `REVOKE`. Pas de Supabase Vault.
- **Saison** : format `AAAA-AAAA` confirmé, avec des années consécutives, contrôlées par CHECK en base et par la route. Le choix « saison en cours ou suivante » dans le formulaire suffit.
- **Test de connexion** : il vérifie aussi `AccessTransactions` (second appel léger). Un `403` y produit un message explicite.
- **Rôles** :

| Route | Rôles autorisés |
|---|---|
| test de connexion, lancement de sync, création et modification de formulaires | admin |
| lecture des formulaires, stats, `helloasso_sync_runs` | admin + secretary |
| toutes les routes HelloAsso | jamais initiateur |

- **P0 bloquant** : pas d'URL provisoire, pas de fixtures inventées. T0 dépend de P0. *(P0 fait le 2026-10-28.)*
- **Validation de T0 (2026-10-28)** :
  - `PATCH` avec `season: null` : 400, ligne inchangée (test ajouté) ;
  - comportements déduits par qa, validés : 404/500 → `http_error` ; erreur réseau sur l'auth → `network` ; verrou libéré même si l'auth échoue ; `webhookSecret` vide accepté ; `staging`, `prod`, `test` invalides ;
  - message AccessTransactions : la skill `helloasso-api` ne documente pas « régénérer la clé » comme solution, il est remplacé par un message neutre (voir le contrat) ;
  - **écritures sur `helloasso_forms` réservées à l'admin en base** (question n° 4 tranchée par les attendus de T1b) : la secrétaire lit, l'initiateur n'a aucun accès ;
  - nouvelle tâche **T1b** (tests de la base, pour de vrai, sur le dev), intégrée à la porte de qualité.

## Contrat figé (base des tests de T0 ; les devs le respectent tel quel)
- **Config** `runtimeConfig.helloasso` (serveur, rien dans `public`) : `clientId`, `clientSecret`, `orgSlug`, `environment` (`sandbox` | `production`, **sans valeur par défaut**), `apiUrl` et `tokenUrl` (vides = valeur par défaut de l'environnement), `webhookSecret`.
  - Valeurs par défaut, production : API `https://api.helloasso.com/v5`, token `https://api.helloasso.com/oauth2/token`.
  - Valeurs par défaut, sandbox : API `https://api.helloasso-sandbox.com/v5`, token `https://api.helloasso-sandbox.com/oauth2/token` (validée en P0 le 2026-10-28).
  - Variables d'environnement : `NUXT_HELLOASSO_*`, avec repli sur les `HELLOASSO_*` actuelles lues dans `nuxt.config.ts`.
- **Exports de `server/utils/helloasso.ts`** :
  - `resolveHelloAssoConfig(rc)` lève `config_missing` en citant les **noms** des clés manquantes, jamais leurs valeurs ; un environnement invalide est aussi un `config_missing`.
  - `createHelloAssoClient({ config, supabase, now?, sleep? })` renvoie `{ config, getAccessToken(), get(path, query?), post(path, body) }`. `path` est relatif à `apiUrl` (ex. `/organizations/<slug>/formTypes`). Les appels utilisent le `fetch` global, avec un timeout.
  - `useHelloAsso(event)` = la factory branchée sur `useRuntimeConfig(event)` et `serverSupabaseServiceRole(event)`.
  - `HelloAssoError` : `code` ∈ `config_missing | auth_failed | unauthorized | forbidden | rate_limited | lock_timeout | http_error | network`, plus `status?` et `retryAfter?`. Messages en français, sans secret ni jeton.
  - `toH3Error(err)` traduit les codes : `config_missing` → 500 ; `rate_limited` et `lock_timeout` → 503 (en-tête `Retry-After` s'il est connu) ; les autres → 502.
- **Jeton** :
  - Une ligne par `environment` dans `helloasso_tokens`. Elle est ignorée si son `client_id` est vide ou diffère de celui de la config.
  - Renouvellement si l'expiration tombe dans les 5 min. On utilise `refresh_token` s'il est encore valide, sinon `client_credentials`.
  - Pour renouveler, il faut d'abord obtenir le verrou via la RPC `helloasso_acquire_token_lock(p_environment, p_holder, p_ttl_seconds)` (booléen). L'écriture du nouveau couple de jetons, du `client_id` et des dates d'expiration, ainsi que la libération du verrou, sont conditionnées à `lock_holder = holder`.
  - Si le verrou est déjà pris, le client relit la base un nombre borné de fois (via `sleep` injectable). Sans nouveau jeton à l'issue : `lock_timeout`, et aucun appel d'auth.
  - Dans une même instance, des appels concurrents partagent un seul renouvellement (une seule promesse en cours).
- **Erreurs** :
  - `401` de l'API : on invalide le jeton utilisé, on renouvelle une fois, on rejoue une fois. Un second `401` donne `unauthorized`.
  - `401` ou `400` sur l'endpoint d'auth donne `auth_failed`. Si c'était un refresh, le `refresh_token` est effacé en base ; **aucun second appel d'auth dans le même renouvellement**.
  - `429` (API ou auth) donne `rate_limited` immédiatement, sans nouvel essai.
  - `403` donne `forbidden`, sans nouvel essai.
- **Route de test** `POST /api/admin/helloasso-test` (admin uniquement). Elle procède en 2 étapes et s'arrête à la première erreur :
  1. `publicData` : `GET /organizations/<orgSlug>/formTypes` (privilège `AccessPublicData`).
  2. `transactions` : `GET /organizations/<orgSlug>/items?pageSize=1` (rôle `OrganizationAdmin` ou `FormAdmin` + privilège `AccessTransactions`, d'après la skill `forms-memberships.md`). Seul le statut compte : aucune donnée d'item n'est renvoyée.
  - Réponse `200` en succès : `{ ok: true, environment, orgSlug, formTypes?, checks: { publicData: 'ok', transactions: 'ok' } }`.
  - Réponse `200` en échec : `{ ok: false, environment?, orgSlug?, step: 'config' | 'publicData' | 'transactions', code, message }`.
  - Un `403` à l'étape `transactions` donne `code: 'forbidden'` et un message qui contient exactement « privilège AccessTransactions manquant », suivi de l'indication neutre « vérifiez les droits du client API dans le back-office HelloAsso » (la skill ne documente pas la régénération de la clé comme solution). C'est le seul cas qui porte ce message ; un `403` à l'étape `publicData` donne `forbidden` avec un message générique.
  - Jamais de secret, de jeton ni de donnée d'adhérent dans la réponse.
- **Rôles** : `requireAdmin(event, { allowedRoles?: AdminRole[], requiredRole?: AdminRole })`.
  - `requiredRole: X` équivaut à `allowedRoles: [X]` (prioritaire si les deux sont donnés).
  - Sans option, le comportement reste celui d'aujourd'hui (admin, secretary, initiateur) : **rétrocompatible** pour les autres appelants (`members.get`, `create-member.post`, `send-email.post`…), qui ne changent pas.
  - Anonyme : 401. Rôle non autorisé : 403.
  - Affectation : `helloasso-test.post`, `sync-helloasso.post`, `helloasso-forms.post`, `helloasso-forms/[id].patch` en `requiredRole: 'admin'` ; `helloasso-forms.get`, `helloasso-stats.get` en `allowedRoles: ['admin','secretary']`. La future lecture de `helloasso_sync_runs` (lot 2) suivra la même règle que les lectures.

## Tâches

### P0 — Vérifications sandbox (préalable bloquant)
- **Agent** : orchestrateur, avec une action de l'utilisateur
- **Fichiers** : `.claude/skills/helloasso-api/auth.md`, `.claude/skills/helloasso-api/limits-sandbox.md`, `.claude/skills/helloasso-api/forms-memberships.md`
- **Dépend de** : l'association de test sandbox créée par l'utilisateur. **Sans elle, on ne continue pas** : le lot reste bloqué.
- **Détail** : relire la page officielle « Environnements production et sandbox ». L'utilisateur lance, dans l'ordre :
  - **une** requête `client_credentials` sur `https://api.helloasso-sandbox.com/oauth2/token` (`/oauth2` seulement si la première renvoie 404) ;
  - **un** refresh (`grant_type=refresh_token`) ;
  - `GET .../formTypes` ;
  - `GET .../items?pageSize=1`, pour vérifier `AccessTransactions`.

  On consigne dans la skill l'URL validée, le statut de chaque appel (dont la présence ou non d'`AccessTransactions` en sandbox) et la **structure** des réponses (clés seulement, aucune valeur). Les réponses anonymisées servent de fixtures à T0 (`"_source": "sandbox:AAAA-MM-JJ"`).

### T0 — Tests d'abord (rouges)
- **Agent** : qa
- **Fichiers** :
  - `tests/server/utils/helloasso.test.ts` ;
  - `tests/server/utils/requireAdmin.test.ts` ;
  - `tests/server/api/helloasso-test.test.ts` ;
  - `tests/server/api/sync-helloasso.test.ts` ;
  - `tests/server/api/helloasso-forms.test.ts` ;
  - `tests/server/api/helloasso-roles.test.ts` ;
  - `tests/server/helloasso-boundary.test.ts` ;
  - `tests/fixtures/helloasso/token.ok.json`, `token.refreshed.json`, `form-types.ok.json`, `items.page-size-1.json` (captures de P0) ;
  - au besoin `tests/utils/supabase-mock.ts` (ajout d'un `rpc` factice, sans casser l'existant).
- **Dépend de** : **P0** (fixtures et URL par défaut en sandbox)
- **Détail** : skill `testing`, `fetch` stubé, aucun appel réel, fixtures issues de P0 uniquement. Le corps des réponses `403` n'est pas documenté : les tests ne s'appuient que sur le statut. Cas à couvrir :
  - **Client** :
    - config manquante ou invalide (aucun `fetch`, aucun secret dans le message) et URL par défaut selon l'environnement ;
    - jeton valide en base : 0 appel d'auth et en-tête Bearer présent ;
    - pas de ligne ou ligne expirée : 1 seul `client_credentials` (form-urlencoded), jeton écrit en base, verrou libéré ;
    - refresh valide : 1 seul appel `grant_type=refresh_token`, nouveau couple écrit sous condition de `lock_holder` ;
    - 3 `get()` concurrents : 1 seul appel d'auth ;
    - verrou perdu (RPC à `false`) : 0 appel d'auth, relecture bornée, puis jeton lu ou `lock_timeout` ;
    - `client_id` vide ou différent : nouvel appel `client_credentials` ;
    - `401` puis succès : 1 seule ré-auth et 1 seul rejeu. `401`, `401` : `unauthorized`, avec 2 appels API et 1 appel d'auth au total ;
    - refresh refusé : `auth_failed`, refresh effacé, 1 seul appel d'auth ;
    - `429` sur l'API et `429` sur l'auth : `rate_limited`, un seul appel, `retryAfter` lu ;
    - `403` donne `forbidden` ; une erreur réseau donne `network` ; dans aucun de ces cas il n'y a de boucle.
  - **`requireAdmin`** :
    - sans option, admin, secretary et initiateur passent (non-régression) ;
    - `requiredRole: 'admin'` laisse passer l'admin seulement ;
    - `allowedRoles: ['admin','secretary']` refuse l'initiateur ;
    - anonyme : 401 ; rôle refusé : 403.
    - Supabase est mocké, et le résultat de `user_roles` dépend du filtre `in('role_code', …)`.
  - **Route de test** :
    - succès sur les 2 étapes : `checks.publicData` et `checks.transactions` à `ok`, avec 2 appels API dans l'ordre ;
    - échec à `publicData` : `step: 'publicData'`, et l'appel `items` n'est pas lancé ;
    - `403` sur `items` : `step: 'transactions'`, `code: 'forbidden'`, et le message contient « privilège AccessTransactions manquant » ;
    - `config_missing` : `step: 'config'` ;
    - aucune fuite de secret, de jeton ni de donnée d'item.
  - **Rôles** (`helloasso-roles.test.ts`, en matrice sur les 6 routes HelloAsso admin) :
    - anonyme : 401 partout ;
    - initiateur : 403 partout ;
    - secretary : 403 sur test, sync, POST et PATCH de formulaires ; accepté sur la lecture des formulaires et sur les stats ;
    - admin : accepté partout.
  - **Formulaires** : `season` absent, au mauvais format ou aux années non consécutives (`2026-2028`) donne 400 ; `2026-2027` est accepté ; le PATCH valide `season` de la même façon.
  - **Sync** : passe par `useHelloAsso().get` (chemin des items Membership). Le `fetch` global n'est jamais appelé.
  - **Frontière** (lecture de fichiers) : hors `server/utils/helloasso.ts`, aucun fichier de `server/` ne contient `helloasso.com`, `helloasso-sandbox.com`, `oauth2` ni `process.env.HELLOASSO`.
  - **Migration** : aucun test de T0 n'exécute de SQL. Un éventuel test statique sur le schéma doit viser `supabase/migrations/20261025_helloasso_socle.sql`, jamais `20260520_helloasso.sql`.

### T1 — Nouvelle migration du socle
- **Agent** : api-dev
- **Fichiers** : `supabase/migrations/20261025_helloasso_socle.sql` (nouveau). **`20260520_helloasso.sql` n'est pas modifiée.**
- **Dépend de** : T0 · **∥ T2, T3, T5** · suivi de **T1b**
- **Détail** : appliquer **exactement** la section « Migration / schéma BDD » ci-dessous, dans une transaction (`BEGIN` … `COMMIT`). Le script doit pouvoir être rejoué sans erreur : `IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE OR REPLACE FUNCTION`, contraintes créées dans des blocs `DO` après vérification de `pg_constraint`. Il doit aussi passer sur une base où `helloasso_forms` contient déjà des lignes (prod). Skill `supabase-db`.

### T1b — Tests de la base sur le DEV (pour de vrai)
- **Agents** : api-dev écrit le script ; l'orchestrateur pousse la migration et lance le script.
- **Fichiers** : `scripts/check-helloasso-socle-db.mjs` (nouveau)
- **Dépend de** : T1 · fait partie de la **porte de qualité** (tout doit être OK avant la revue)
- **Détail** :
  - **Push sur le dev** : vérifier d'abord que `supabase/.temp/project-ref` vaut `ybtnnogxukfldurozqwa`, puis `db push --linked --dry-run` (seule `20261025` attendue), puis `db push --linked`.
  - **Idempotence** : rejouer le fichier une seconde fois (`migration repair --linked --status reverted 20261025` puis `db push --linked`). Le second passage doit réussir sans erreur ni changement de données.
  - **Script** : il lit `.env` lui-même, refuse de tourner hors du projet de DEV (même garde que `seed-test-users.mjs`) et n'affiche ni clé, ni mot de passe, ni jeton. Il se connecte avec les **vrais comptes de test** (`TEST_USERS_EMAIL` avec les suffixes `+admin`, `+secretaire`, `+initiateur`, `+adherent`, et `TEST_USERS_PASSWORD`), avec la clé publique (anon) du projet. Il vérifie :
    - `helloasso_tokens` : ni lecture ni écriture (insert, update, delete) pour l'anonyme, l'adhérent, l'initiateur, la secrétaire et l'admin connectés ; seul le service role y accède ;
    - RPC `helloasso_acquire_token_lock` : refusée à l'anonyme et à chaque compte connecté ;
    - `helloasso_forms` : la secrétaire lit mais ne peut ni insérer, ni modifier, ni supprimer ; l'initiateur et l'adhérent ne peuvent ni lire ni écrire ; l'admin peut insérer, modifier et supprimer ;
    - `helloasso_sync_runs` : lisible par l'admin et la secrétaire, pas par l'initiateur ni l'adhérent, et non modifiable par aucun compte connecté ;
    - CHECK et contraintes : `'2026-2028'` et `'26-27'` refusés, `'2026-2027'` accepté ; doublon `(form_type, form_slug)` refusé ; `event_id` sur un formulaire `Membership` refusé.
  - Une écriture « refusée » est constatée sur l'état réel : erreur renvoyée **ou** 0 ligne touchée, vérifiée ensuite par une relecture via le service role.
  - Le script nettoie tout ce qu'il a inséré (lignes marquées par un préfixe de slug dédié, supprimées via le service role, même en cas d'échec) et affiche un tableau OK / ÉCHEC par vérification. Code de sortie 1 s'il y a au moins un ÉCHEC.

### T2 — Configuration `runtimeConfig.helloasso`
- **Agent** : orchestrateur (trivial : moins de 20 lignes, un fichier)
- **Fichiers** : `nuxt.config.ts`
- **Dépend de** : T0 · **∥ T1, T3, T5**
- **Détail** : ajouter le bloc `helloasso` au niveau serveur de `runtimeConfig`, avec les clés du contrat, alimentées par les variables `HELLOASSO_*` ou les chaînes vides. Rien dans `public`.

### T3 — Client HelloAsso serveur
- **Agent** : api-dev
- **Fichiers** : `server/utils/helloasso.ts` (nouveau)
- **Dépend de** : T0 · **∥ T1, T2, T5** (le contrat, figé, fixe la RPC et la config)
- **Détail** : implémenter le contrat. Objectif : faire passer `tests/server/utils/helloasso.test.ts` **sans modifier les tests de T0**. Écritures en base via le client service role reçu en paramètre. Les logs contiennent uniquement le code et le statut, jamais de jeton ni de secret. Skills `helloasso-api` (`auth.md`, `limits-sandbox.md`) et `supabase-db`.

### T4 — Routes serveur et rôles
- **Agent** : api-dev
- **Fichiers** :
  - `server/utils/requireAdmin.ts` (option `allowedRoles`, rétrocompatible) ;
  - `server/api/admin/helloasso-test.post.ts` (nouveau) ;
  - `server/api/admin/sync-helloasso.post.ts` ;
  - `server/api/admin/helloasso-forms.get.ts` (rôles uniquement) ;
  - `server/api/admin/helloasso-forms.post.ts` ;
  - `server/api/admin/helloasso-forms/[id].patch.ts` ;
  - `server/api/admin/helloasso-stats.get.ts` (rôles uniquement) ;
  - `server/api/webhooks/helloasso.post.ts` (lecture du secret uniquement).
- **Dépend de** : T1, T2, T3
- **Détail** : faire passer les tests de T0 **sans les modifier**.
  - **`requireAdmin`** : ajouter `allowedRoles` ; `requiredRole` et le comportement sans option restent identiques. Aucun autre appelant n'est modifié.
  - **Rôles** : appliquer l'affectation du contrat aux 6 routes HelloAsso admin.
  - **Route de test** : 2 étapes, selon le contrat.
  - **Sync** : supprimer `fetchToken` et les URL en dur, passer par `useHelloAsso(event)` et `toH3Error`. Le rapprochement et l'écriture restent identiques (lot 2).
  - **Formulaires** :
    - `season` devient obligatoire, au format `AAAA-AAAA` avec des années consécutives (400 sinon) ;
    - le PATCH accepte `active` et `season` ;
    - `event_id` n'est pas exposé (lot 5).
  - **Webhook** : seule la ligne 13 change (`useRuntimeConfig(event).helloasso.webhookSecret`).

### T5 — Interface admin `HelloAssoConfig.vue`
- **Agent** : ui-dev
- **Fichiers** : `app/components/admin/HelloAssoConfig.vue`
- **Dépend de** : T0 · **∥ T1 à T4** (le contrat de la route est figé)
- **Détail** :
  - **Bouton « Tester la connexion »** (NuxtUI, état de chargement). Le résultat affiche :
    - un badge d'environnement (sandbox mis en évidence) et le slug de l'organisation ;
    - l'état des 2 vérifications (données publiques, transactions) ;
    - en cas de `forbidden` à l'étape `transactions`, un message dédié et visible : « privilège AccessTransactions manquant » et la marche à suivre ;
    - sinon, le message d'erreur reçu.
  - **Rôles** : via `useAuth().isAdmin`, les actions admin (tester, synchroniser, ajouter, activer ou désactiver un formulaire) sont masquées pour une secrétaire, qui garde la liste en lecture seule. L'initiateur ne voit déjà pas le composant (`v-if="!isReadOnly"` dans `dashboard.vue`, fichier non modifié).
  - **Saison** : le formulaire d'ajout demande la saison (choix entre la saison en cours et la suivante, coupure au 1er septembre), et la saison s'affiche dans la liste.
  - Couleurs du projet, skill `asc-rules`.

### QA — Compléter et lancer les tests
- **Agent** : qa
- **Fichiers** : `tests/components/admin/HelloAssoConfig.test.ts` (si utile), `docs/test-plan.md`
- **Dépend de** : T4, T5
- **Détail** : test de composant couvrant :
  - le bouton de test, y compris l'affichage du cas `forbidden` ;
  - le masquage des actions admin pour une secrétaire ;
  - le champ saison.

  Mettre à jour `docs/test-plan.md`.

### Porte de qualité
- `npm test`, `typecheck` (sur la baseline `scripts/typecheck-baseline.mjs`) et **T1b** (`node scripts/check-helloasso-socle-db.mjs` : tout OK). Pas d'e2e. Deux échecs de suite : on demande à l'utilisateur.

### T6 — Documentation et procédure sandbox
- **Agent** : doc-writer
- **Fichiers** :
  - `docs/guide-exploitation.md` (§6 et §7 : procédure sandbox, rôles HelloAsso) ;
  - `docs/architecture.md` (client HelloAsso, routes, option `allowedRoles` de `requireAdmin`) ;
  - `docs/database.md` (3 tables) ;
  - `.claude/skills/supabase-db/tables/helloasso_forms.md`, `helloasso_tokens.md`, `helloasso_sync_runs.md` et l'index de `SKILL.md` ;
  - `.claude/skills/testing/examples/helloasso.md` (chemin et API réels du mock).
- **Dépend de** : la revue
- **Détail** :
  - Procédure sandbox :
    - création de l'association de test et validation par documents fictifs ;
    - récupération des clés ;
    - variables `NUXT_HELLOASSO_*` (environnement **obligatoire**) ;
    - URL et résultat d'`AccessTransactions` validés en P0 ;
    - bascule sandbox ↔ production : changer les clés, le slug et l'environnement, puis lancer « Tester la connexion ». Le jeton est rangé par environnement : aucune purge n'est nécessaire.
  - Terminer par `graphify update .` (une seule fois).

## Migration / schéma BDD
**Nouvelle migration** `supabase/migrations/20261025_helloasso_socle.sql`, idempotente, en une transaction. `20260520_helloasso.sql` est déjà appliquée en prod et en dev : elle **n'est pas modifiée**. `profiles`, `profile_payments` et le trigger `profiles_block_payment` ne sont pas touchés.

**`helloasso_forms`** (la table existe et contient 3 lignes en prod, voir le risque n° 1). Les étapes s'enchaînent dans cet ordre :
1. **Colonnes** :
   - `ADD COLUMN IF NOT EXISTS season text`, d'abord **nullable** ;
   - `ADD COLUMN IF NOT EXISTS event_id uuid NULL REFERENCES events(id) ON DELETE SET NULL`.
2. **Remplissage de `season`** : `UPDATE ... WHERE season IS NULL`. La règle explicite est la saison en cours à `created_at`, coupure au 1er septembre : un formulaire créé entre le 1er septembre Y et le 31 août Y+1 reçoit `Y-(Y+1)`. Si `created_at` est NULL, on utilise `now()`. Les 3 lignes de prod, créées le 2026-05-28, recevront `2025-2026`. Un `RAISE NOTICE` donne le nombre de lignes remplies.
3. **`ALTER COLUMN season SET NOT NULL`**.
4. **CHECK, ajoutés `NOT VALID` puis `VALIDATE CONSTRAINT`**, chacun dans un bloc `DO` qui teste son nom dans `pg_constraint` :
   - `helloasso_forms_season_format` : vérifie le format et l'enchaînement des années. Il s'écrit sous la forme `CASE WHEN season ~ '^[0-9]{4}-[0-9]{4}$' THEN split_part(season,'-',2)::int = split_part(season,'-',1)::int + 1 ELSE false END`. Le `CASE` garantit que la conversion `::int` n'est tentée qu'après le contrôle du format ; un simple `AND` ne garantit pas cet ordre d'évaluation.
   - `helloasso_forms_form_type_check` : `form_type IN ('Membership','Event')` ;
   - `helloasso_forms_event_type_check` : `event_id IS NULL OR form_type = 'Event'`.
   - Si une ligne existante viole un CHECK, le `VALIDATE` échoue et toute la transaction est annulée. Cela vaut **refus documenté** : on corrige les données à la main, puis on relance la migration.
5. **`UNIQUE (form_type, form_slug)`** : `NOT VALID` n'existe pas pour une contrainte UNIQUE. On ajoute donc d'abord un bloc `DO` de pré-vérification : s'il existe des doublons `(form_type, form_slug)`, il lève un `RAISE EXCEPTION` qui liste les couples en cause. La migration est alors refusée et annulée, sans suppression automatique. Sinon, on ajoute la contrainte `helloasso_forms_type_slug_key`, si elle n'existe pas encore.
6. **Policies** (`DROP POLICY IF EXISTS` puis `CREATE POLICY`, décision du 2026-10-28) :
   - `helloasso_forms_select_staff` reste sur `is_admin_or_secretary()` ;
   - `helloasso_forms_insert_staff`, `helloasso_forms_update_staff` et `helloasso_forms_delete_staff` sont recréées sur `has_role('admin')` (`USING` et `WITH CHECK`). Les noms sont conservés.

**`helloasso_tokens`** (nouvelle table, `CREATE TABLE IF NOT EXISTS`) :
- colonnes :
  - `environment text PRIMARY KEY CHECK (environment IN ('sandbox','production'))` ;
  - `client_id text` (nullable, renseigné à la première écriture du jeton) ;
  - `access_token text`, `access_expires_at timestamptz` ;
  - `refresh_token text`, `refresh_expires_at timestamptz` ;
  - `lock_holder uuid`, `lock_until timestamptz` ;
  - `updated_at timestamptz NOT NULL DEFAULT now()`.
- **RLS activée, aucune policy**, et `REVOKE ALL ... FROM anon, authenticated` : seul le service role y accède.

**`helloasso_sync_runs`** (nouvelle table, `CREATE TABLE IF NOT EXISTS`, alimentée à partir du lot 2) :
- colonnes :
  - `id uuid PK DEFAULT gen_random_uuid()` ;
  - `scope text NOT NULL` (ex. `memberships`) ;
  - `trigger_source text NOT NULL CHECK (trigger_source IN ('manual','cron'))` ;
  - `environment text NOT NULL CHECK (environment IN ('sandbox','production'))` ;
  - `triggered_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL` ;
  - `started_at timestamptz NOT NULL DEFAULT now()`, `finished_at timestamptz` ;
  - `status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error'))` ;
  - `counts jsonb NOT NULL DEFAULT '{}'` (compteurs propres à chaque lot) ;
  - `error text`.
- Index : `CREATE INDEX IF NOT EXISTS` sur `(scope, started_at DESC)`.
- RLS : `SELECT` pour `is_admin_or_secretary()` (`DROP POLICY IF EXISTS` puis `CREATE POLICY`), ce qui correspond à la décision « lecture admin + secretary ». Aucune policy d'écriture : les écritures passent par le service role. Le verrou « un seul passage en cours » relève du lot 4.

**Fonction `helloasso_acquire_token_lock(p_environment text, p_holder uuid, p_ttl_seconds int DEFAULT 20) RETURNS boolean`** (`CREATE OR REPLACE`) :
- un seul `INSERT (environment, lock_holder, lock_until) ... ON CONFLICT (environment) DO UPDATE ... WHERE helloasso_tokens.lock_until IS NULL OR helloasso_tokens.lock_until < now()` ;
- renvoie `true` si une ligne a été insérée ou mise à jour (verrou obtenu), `false` sinon ;
- l'heure vient de la base (`now()`), pas de l'horloge des instances ;
- `REVOKE EXECUTE ... FROM public, anon, authenticated` et `GRANT EXECUTE ... TO service_role`.

## Risques / questions ouvertes
1. **Doublon en prod : la migration T1 échouera tant qu'il existe.** `helloasso_forms` contient en prod 3 lignes `Membership`, manifestement de test : `test` (2026-05-28 14:43) et `test-rls` en double (14:46:18 et 14:46:28). Le contrôle préalable de l'étape 5 refusera la migration (couple `Membership, test-rls`).
   - **À trancher par l'utilisateur avant le déploiement de T1** : nettoyer à la main en prod (supprimer les lignes de test, ou au moins le doublon), renommer un slug, ou une autre solution.
   - Attention : `profile_payments.form_id` a une FK `ON DELETE RESTRICT`. Supprimer une ligne référencée échouera. Vérifier d'abord `profile_payments` pour ces 3 `id`.
   - Si les lignes sont gardées, elles recevront la saison `2025-2026`.
2. **Remplissage de la saison** : la règle par date de création peut se tromper pour un formulaire de la saison suivante créé avant le 1er septembre. Il faut relire les lignes après la migration et corriger au besoin dans l'admin.
3. **Hébergement** : les variables `NUXT_HELLOASSO_*` sont à créer chez l'hébergeur. L'environnement est obligatoire : s'il manque, la route de test renvoie une erreur claire au lieu d'appeler la mauvaise plateforme.
4. **RLS de `helloasso_forms`** (question) : les policies d'insertion, de modification et de suppression de 20260520 autorisent `is_admin_or_secretary()`. Une secrétaire peut donc encore écrire directement par le client Supabase, en contournant la règle « admin uniquement » appliquée aux routes. Faut-il réserver ces policies à l'admin dans la migration T1 ? Ce n'est pas prévu sans votre accord. → **Tranché le 2026-10-28 : oui**, écritures réservées à l'admin (voir l'étape 6 de la migration et T1b).
5. **Sandbox et `AccessTransactions`** : si P0 montre que la sandbox n'accorde pas ce privilège, le test de connexion y affichera « privilège AccessTransactions manquant ». Le comportement est alors à confirmer en prod. → **P0 (2026-10-28) : privilège présent en sandbox.**
