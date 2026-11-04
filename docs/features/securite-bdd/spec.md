# Spec — Sécurité BDD, passe 1 (annuaire, search_path, fonctions exposées)

> Slug : `securite-bdd` · Créée le : 2026-11-02 · Transverse : oui (droits SQL, RLS, migration) ⇒ planner en opus
> **Tests d'abord : oui** (données des adhérents, authentification)
> Origine : [backlog](../../backlog.md) D16, Q23 (ex-D7), Q24 (ex-D6), D17 ; advisors Supabase du dev au 2026-11-02.

## Objectif
Fermer les failles signalées par les advisors de sécurité Supabase. En tête, `public.member_directory` : vue en `security_invoker = false`, modifiable (vue simple sur `profiles`), possédée par `postgres` (`BYPASSRLS`), avec tous les droits pour `anon` et `authenticated` sur le dev. Un visiteur anonyme pouvait y lire le nom de tous les adhérents (enfants compris), et y écrire (UPDATE `full_name` / `avatar_url`, DELETE d'un profil avec cascade, INSERT). Ensuite : `search_path` fixé sur toutes les fonctions `SECURITY DEFINER`, fonctions de trigger retirées de l'API, et test du cas « jeton `authenticated` sans `sub` ».

## Critères d'acceptation

### Migration A — `member_directory` (D16), autonome et déployable en prod en avance
- [ ] Une migration **dédiée** (aucune dépendance aux migrations B ni aux migrations HelloAsso / auth-profils non encore passées en prod), idempotente, rejouable sans erreur sur la prod dans son état actuel (anon sans droit, authenticated en SELECT seul, correctif manuel du 2026-11-02).
- [ ] Option A retenue : fonction `SECURITY DEFINER` dans un schéma **non exposé** par l'API (`private`), `SET search_path = ''`, noms qualifiés, `STABLE`, qui renvoie `id, full_name` des **seuls** référents (`groups.referent_id`) et moniteurs (`group_instructors.user_id`).
- [ ] `public.member_directory` recréée en `WITH (security_invoker = true)` au-dessus de cette fonction, colonnes `id, full_name` (**`avatar_url` retiré**) ; plus modifiable (`is_updatable = NO`, `is_insertable_into = NO`).
- [ ] Droits : `REVOKE ALL` sur la vue à `PUBLIC`, `anon`, `authenticated`, puis `GRANT SELECT` seul à `anon` et `authenticated` ; `USAGE` sur `private` et `EXECUTE` sur la fonction pour `anon` / `authenticated` uniquement (rien à `PUBLIC`). Retrait **explicite** de INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER à `anon` et `authenticated`.
- [ ] `useGroups.fetchGroups` (`app/composables/useGroups.ts:66-70`) fonctionne sans changement pour les trois publics : visiteur anonyme (`GroupsAccordion`, blok public `tarifs/ListeGroupeAccordeon`), adhérent (`/mes-inscriptions`), staff (`/admin/dashboard`). Aucune lecture de `avatar_url` à retirer côté code (vérifier par `Grep`).

### Migration B — `search_path` et fonctions exposées (Q23, D17)
- [ ] `SET search_path = ''` sur **toutes** les fonctions `SECURITY DEFINER` de `public` (dev au 2026-11-02 : `is_admin_or_secretary()`, `has_role(text)`, `enrich_profile_from_temps_user()`, `handle_new_user()`), corps réécrits avec des noms qualifiés (`public.`, `auth.`), sans changement de comportement. Plus les 3 fonctions signalées par `function_search_path_mutable` : `handle_updated_at`, `registrations_block_user_status_change`, `profiles_block_payment_change`. La liste est relue dans `pg_proc` au moment de la migration (toute fonction ajoutée depuis est incluse).
- [ ] `REVOKE EXECUTE` à `PUBLIC`, `anon`, `authenticated` sur `handle_new_user()` et `enrich_profile_from_temps_user()` ; les triggers `on_auth_user_created` et `on_profile_enrich` fonctionnent toujours.
- [ ] `is_admin_or_secretary()` et `has_role(text)` : `EXECUTE` retiré à `anon` et `PUBLIC`, **gardé** pour `authenticated` (30 policies `TO authenticated` les appellent).
- [ ] Une migration déjà appliquée n'est jamais réécrite : nouvelles migrations datées après `20261030`.

### Tests (écrits d'abord, rouges avant les migrations)
- [ ] Script de vérification sur le **dev** (dans l'esprit de `scripts/check-auth-profils-db.mjs` : refus si l'URL n'est pas celle du dev, comptes de test réels, remise en état, aucun e-mail) qui vérifie :
  - anonyme : lit `member_directory` limitée à `id, full_name` des référents / moniteurs, et **rien d'autre** (aucun autre profil, pas de `avatar_url`) ; POST / PATCH / DELETE sur la vue refusés, `profiles` inchangé (relu par la service role) ;
  - adhérent : même lecture que l'anonyme sur la vue, écritures refusées ; ses lectures habituelles (`profiles` soi et famille) inchangées ;
  - staff (admin, secrétaire) : les policies qui appellent `is_admin_or_secretary` / `has_role` fonctionnent toujours (lecture `profiles`, `user_roles`, `helloasso_forms`…) avec les comptes de test ;
  - `rpc/handle_new_user` et `rpc/enrich_profile_from_temps_user` refusés à `anon` et `authenticated` ; création d'un compte jetable par l'API admin → profil créé (trigger `handle_new_user` intact) ;
  - toutes les fonctions `SECURITY DEFINER` du schéma `public` (et `private`) ont un `search_path` fixé (`proconfig`) ;
  - droits de la vue : `anon` / `authenticated` sans INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ; vue non modifiable.
- [ ] Q24 : le cas « jeton `authenticated` sans `sub` » est testé **en SQL**, dans une transaction (`set local role authenticated`, `set_config('request.jwt.claims', '{"role":"authenticated"}', true)`) terminée par `rollback`, sans secret JWT. Le planner précise le moyen d'exécution (connexion Postgres directe au dev, ou autre) et la variable d'environnement nécessaire.
- [ ] Après application sur le dev : advisors de sécurité relancés → **aucune ERROR**, plus aucun WARN `function_search_path_mutable`, `anon_security_definer_function_executable`, `authenticated_security_definer_function_executable` (WARN restant attendu : `auth_leaked_password_protection`, réglage manuel ; INFO `rls_enabled_no_policy` accepté).
- [ ] `npm test` et `npm run typecheck` verts ; e2e smoke vert (la page tarifs affiche les noms des moniteurs).

### Migration C — trigger de `registrations` (décision du 2026-11-04)
- [ ] Nouvelle migration : `registrations_block_user_status_change` commence par les mêmes exemptions que `profiles_block_status_change` (`auth.role() IS NULL`, puis `'service_role'`), avant d'appeler `private.is_admin_or_secretary()`. Une écriture de `registrations` par la service role réussit ; l'interdiction reste entière pour un adhérent.

### Migration D — GRANT explicites HelloAsso (Q29, décision du 2026-11-04)
- [ ] Nouvelle migration, après B et C : `REVOKE ALL` puis `GRANT` au strict nécessaire sur `helloasso_tokens` et `helloasso_sync_runs`, rôle par rôle. `service_role` : uniquement ce que `server/` utilise. `authenticated` : `SELECT` seul sur `helloasso_sync_runs`, rien sur `helloasso_tokens`. `anon` : rien.
- [ ] Prouvé dans les conditions de la prod : les droits attendus sont obtenus même si la table n'en avait aucun au départ (« Automatically expose new tables » désactivé), par une répétition dans une transaction annulée sur le dev. Le verrou `helloasso_acquire_token_lock` fonctionne sous `service_role`.
- [ ] Bloquant : la livraison de `20261025` en prod inclut cette migration (même `db push`).

### Garde-fou `agent-guard.mjs` (décision du 2026-11-04)
- [ ] Pour Bash et PowerShell, `supabase db push|reset|query` et `supabase migration repair` ne sont autorisés **que sur le ref du dev**. `--remote=<ref>` avec un autre ref, une URL ou un nom de branche : refus explicite. `--remote` seul ou `--linked` : refus si le projet lié n'est pas le dev. `--db-url`, `--project-ref`, `--workdir` : refus. Les options placées avant la sous-commande ne contournent pas le contrôle.
- [ ] Testé par Vitest (`tests/`) : autorisations sur le dev, refus pour tout autre projet.

### Documentation
- [ ] `docs/mise-en-prod.md` : procédure « correctif de sécurité anticipé » (appliquer la migration A seule en prod, avant les autres migrations en attente, et l'inscrire dans l'historique de migrations de la prod sans casser l'ordre décrit en § 2) ; état de la prod avant et après ; vérifications à faire ensuite.
- [ ] `docs/database.md` et la skill `supabase-db` : `member_directory` décrite (colonnes, lecteurs, droits), règle « `search_path = ''` et noms qualifiés pour toute fonction `SECURITY DEFINER` ; fonctions de trigger sans `EXECUTE` pour `anon` / `authenticated` ».

## Parcours utilisateur (e2e)
- Visiteur anonyme → page publique avec le blok `liste-groupe-accordeon` → les noms du référent et des moniteurs s'affichent (lecture seule, aucune écriture).

## Hors périmètre
- Suppression des tables `User` et `temps_user` (D19, constat seulement).
- Réglage de la protection contre les mots de passe compromis (D18, manuel).
- Toute action sur la prod par Claude : la migration A y est appliquée par l'utilisateur, selon la procédure.

## Contraintes / contexte
- Prod, 2026-11-02 (constat de l'utilisateur) : avant intervention, `anon` et `authenticated` avaient tous les droits sur la vue ; correctif manuel au SQL Editor → `anon` aucun droit, `authenticated` SELECT seul. La vue y reste en `security_invoker = false` : tout adhérent connecté lit encore le nom de tous les profils jusqu'à la migration A.
- Dev : vue `is_updatable = YES`, `is_insertable_into = YES` ; propriétaire `postgres` (`BYPASSRLS`) ; FK vers `profiles` en `ON DELETE CASCADE` (`user_roles`, `parent_access`, `group_members`, `registrations`, `profile_payments`, `notification_logs`, `group_instructors`).
- Lecteur unique de la vue : `useGroups.fetchGroups`. Policies et fonctions : voir [backlog](../../backlog.md) D17, [docs/database.md](../../database.md), skill `supabase-db`.
- MCP Supabase en lecture seule sur le dev ; migrations uniquement par `supabase/migrations/` ; prod jamais touchée par Claude.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun |
