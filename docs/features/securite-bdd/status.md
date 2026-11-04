# Status — securite-bdd

> Phase : attente validation

## Tâches
<!-- Une ligne de note max par tâche. ☐ à faire · ◐ en cours · ☑ fait · ⛔ bloqué -->
- ☑ T0a — Tests d'abord : script `scripts/check-securite-bdd.mjs` + `pg` (devDependency) + `tests/composables/useGroups.test.ts` (qa) — relevé ci-dessous ; `.env` : hôte pooler à corriger (voir Blocages)
- ☑ T0b — Parcours e2e de non-régression `e2e/securite-bdd.spec.ts` (e2e) — ∥ T0a. 2026-11-03 : 1 passé (visiteur anonyme → `/tarifs` → noms du référent / des moniteurs, au moins un GET `member_directory`, aucune requête non-GET) ; smoke 3 passés après désactivation de « Automatically expose new tables ». Build `.output/` existant (`E2E_SKIP_BUILD=1`). Peu discriminant avec 1 seul référent/moniteur sur le dev (le filtrage est couvert par T0a). Aide `e2e/support/dev-directory.ts` (`dev-db.ts` existant réutilisé, non modifié). Suggestion non bloquante : `data-testid` dans `GroupsAccordion.vue`.
- ☐ T1 — Migration A `20261102_member_directory_securite.sql` (api-dev) —
- ☐ T1b — Push de A sur le dev, rejeu d'idempotence, script `[A]` OK (orchestrateur / utilisateur) —
- ☐ T2 — Migration B `20261103_fonctions_search_path.sql` (api-dev) —
- ☐ T2b — Push de B sur le dev, script tout OK, advisors (orchestrateur / utilisateur) —
- ☐ QA (qa) — T3 : `docs/test-plan.md`, npm test
- ☐ Porte de qualité — npm test · typecheck · e2e (si parcours) — échecs consécutifs : 0/2
- ☐ Revue (reviewer) —
- ☐ Doc + graphify update (doc-writer) — T5 : mise-en-prod (procédure A, --include-all), database.md, skill supabase-db, backlog

## Relevé T0a (dev, avant toute migration) — `node scripts/check-securite-bdd.mjs`
Fichiers de test créés (les agents de dev n'y touchent pas) : `scripts/check-securite-bdd.mjs`, `tests/composables/useGroups.test.ts` (3 tests ajoutés, verts : le composable lit déjà `'id, full_name'`).
- **[A] 5 OK · 21 ÉCHEC** (rouge attendu) : anonyme et adhérent lisent 19 profils dont 18 hors référents/moniteurs ; `select avatar_url` répond ; PATCH, DELETE, POST sur la vue réussissent (anonyme et adhérent) ; colonnes `id, full_name, avatar_url` ; `is_updatable` et `is_insertable_into` = YES ; `security_invoker=false` ; INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER accordés à `anon` et `authenticated` ; schéma `private` et `private.member_directory_rows()` absents ; Q24 Tx1 : `member_directory` renvoie 24 lignes dont 23 hors référents/moniteurs.
- **[B] 4 OK · 8 ÉCHEC** (rouge attendu) : les 4 fonctions SECURITY DEFINER de `public` sans `search_path = ''` ; les 3 fonctions nommées par la spec sans `search_path` ; `handle_new_user` et `enrich_profile_from_temps_user` exécutables par anon, authenticated, PUBLIC ; `is_admin_or_secretary` et `has_role` exécutables par anon et PUBLIC (RPC anon : HTTP 200).
- **[non-régression] 22 OK · 0 ÉCHEC** : lectures admin et secrétaire (`profiles`, `user_roles`, `helloasso_forms`), témoins négatifs de l'initiateur, adhérent = soi + famille, triggers `on_auth_user_created`, `on_profile_enrich`, `profiles_block_status` présents, Q24 Tx1 (uid NULL, 0 ligne `profiles` / `user_roles`, UPDATE 0 ligne) et Tx2 (le trigger refuse), compte jetable → profil créé, aucun reste `+secu-`.
- Écart avec le plan : `rpc/handle_new_user` et `rpc/enrich_profile_from_temps_user` sont **déjà refusés** (404 PGRST202 : PostgREST n'expose pas les fonctions de trigger), donc ces 4 contrôles RPC sont verts dès maintenant ; le rouge de ces deux fonctions vient du contrôle de catalogue (`has_function_privilege`). Le `search_path` est exigé à `''` (donc `handle_new_user`, aujourd'hui en `public`, échoue aussi : 4 sur 4 en SECURITY DEFINER, 3 sur 3 hors DEFINER). Aucune assertion sur le schéma ni sur `authenticated` pour `is_admin_or_secretary` / `has_role`, ni sur `service_role` pour la fonction de l'annuaire.
- `npm test` : 58 fichiers, 780 tests verts. Piège : lancer Vitest depuis un shell dont le lecteur est en minuscule (`/d/…` en Git Bash) fait échouer les 58 fichiers (« Vitest failed to find the runner ») ; utiliser `D:/…`.

## Blocages
- **`SUPABASE_DEV_DB_URL` du `.env` pointe sur le mauvais hôte pooler** (`aws-1-eu-west-3`) : le serveur répond « tenant/user not found ». Le pooler du dev lié au CLI est `aws-0-eu-west-1.pooler.supabase.com` (testé : connexion OK avec le même utilisateur et mot de passe). Le `.env` n'a pas été modifié ; l'utilisateur doit y remplacer l'hôte. Sans cela le script s'arrête sur « connexion Postgres impossible ».
- Questions ouvertes à trancher avant T2 (voir plan.md, Risques 1 à 6), en particulier le WARN `authenticated_security_definer_function_executable` qui reste sur `is_admin_or_secretary` / `has_role`.
