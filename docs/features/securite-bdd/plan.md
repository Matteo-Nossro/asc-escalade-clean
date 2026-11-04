# Plan — securite-bdd

> Rédigé par : planner (opus) · Validé par l'utilisateur : ☐
> Référence : [spec.md](spec.md). Décisions déjà prises : option A (fonction `SECURITY DEFINER` dans le schéma `private`), `search_path = ''`, `avatar_url` retiré de la vue, deux migrations (A autonome, déployable seule en prod en avance), tests d'abord.

## Résumé de l'approche
Tests d'abord : un script Node `scripts/check-securite-bdd.mjs` vérifie le dev de deux façons. Côté **API**, avec les vrais comptes de test (clé anon + JWT réels, service role pour relire). Côté **SQL**, par une connexion Postgres directe au dev (paquet `pg`, variable `SUPABASE_DEV_DB_URL`), qui sert au test Q24 et aux contrôles du catalogue. Ensuite viennent deux migrations : **A** `20261102` (annuaire) puis **B** `20261103` (search_path et droits d'EXECUTE). Elles sont poussées sur le dev l'une après l'autre, le script étant relancé après chacune. Aucun code applicatif ne change (`useGroups` lit déjà `id, full_name` seulement).

## Décisions tranchées par ce plan

### 1. Exécution du test SQL (Q24) sans secret JWT
- **Moyen** : connexion Postgres directe au dev avec le paquet `pg`. **Il est absent de `package.json` comme de `node_modules`** : T0a l'ajoute en devDependency (`npm install -D pg`). Il n'a pas besoin de `@types/pg`, puisque le script est en `.mjs`.
- **Variable** : `SUPABASE_DEV_DB_URL`, lue dans l'environnement ou à défaut dans `.env`, comme dans `check-auth-profils-db.mjs`. C'est la chaîne « Session pooler » du dashboard du dev (Connect, port 5432, utilisateur `postgres.ybtnnogxukfldurozqwa`), ou la connexion directe `db.ybtnnogxukfldurozqwa.supabase.co`, avec le mot de passe de la base de dev. **L'utilisateur l'ajoute à `.env`** avant T0a.
- **Garde-fou**, appliqué avant toute connexion : le script parse l'URL et la refuse sauf si l'hôte vaut `db.ybtnnogxukfldurozqwa.supabase.co`, ou s'il finit par `.pooler.supabase.com` avec l'utilisateur `postgres.ybtnnogxukfldurozqwa`. L'URL et le mot de passe ne sont jamais affichés. Même garde qu'aujourd'hui pour `SUPABASE_URL` et les clés.
- **Écartés** : `supabase db query --linked`, parce que le projet lié peut être la prod et que la sortie serait à parser ; le MCP, qui est en lecture seule, donc sans `UPDATE` testable.
- **Cas Q24**, chacun dans sa propre transaction terminée par `ROLLBACK` :
  - Tx1 : `SET LOCAL ROLE authenticated` et `set_config('request.jwt.claims', '{"role":"authenticated"}', true)`. On attend `auth.uid()` NULL et `auth.role()` = `authenticated`. `public.is_admin_or_secretary()` et `public.has_role('admin')` renvoient false. `select` sur `public.profiles` renvoie 0 ligne. `member_directory` renvoie exactement l'ensemble attendu des référents et moniteurs. Un `UPDATE public.profiles SET status …` sur le profil jetable touche 0 ligne (RLS).
  - Tx2 : rôle `postgres`, RLS contournée, mêmes claims sans `sub`. Un `UPDATE status` sur le profil jetable doit lever l'exception de `profiles_block_status` (« réservée au bureau »). C'est le trigger lui-même qui est testé, sans passer par la RLS.
- **Rouges pour la bonne raison** : le script affiche chaque contrôle en OK ou ÉCHEC, regroupés en trois sections (`[A]`, `[B]`, `[non-régression]`), et sort en 1 au moindre ÉCHEC. Le relevé attendu avant migration, que T0a consigne dans `status.md` :
  - **ÉCHEC `[A]`** : l'anonyme et l'adhérent lisent des profils hors référents et moniteurs ; `select=avatar_url` répond ; POST, PATCH et DELETE sur la vue réussissent ; `is_updatable` et `is_insertable_into` valent YES ; `anon` et `authenticated` ont INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES et TRIGGER ; le schéma `private` est absent.
  - **ÉCHEC `[B]`** : `proconfig` est vide sur 6 des 7 fonctions ; `handle_new_user()`, `enrich_profile_from_temps_user()`, `is_admin_or_secretary()` et `has_role(text)` sont exécutables par `anon` ou `PUBLIC`.
  - **OK `[non-régression]`** : lectures du staff (`profiles`, `user_roles`, `helloasso_forms`), lectures de l'adhérent (soi et famille), trigger `handle_new_user` (compte jetable, puis profil créé), Q24 Tx2.
  - Tout autre motif d'échec (connexion, variable manquante, garde) est une erreur de test, à corriger dans T0a.
- **Sécurité des écritures avant migration** : sur le dev, aujourd'hui, les écritures sur la vue **réussissent**. Le script ne vise donc que des lignes jetables. PATCH et DELETE portent sur le profil d'un compte jetable `+secu-` créé par l'API admin, et le POST sur un id marqué. Le nettoyage se fait dans un `finally` par la service role : suppression du compte et du profil jetables. Un contrôle final vérifie qu'il ne reste aucun `+secu-`, et les restes éventuels sont purgés au démarrage. Aucun e-mail n'est envoyé.

### 2. Noms des migrations et place dans l'historique de la prod
- **A** : `supabase/migrations/20261102_member_directory_securite.sql`. **B** : `supabase/migrations/20261103_fonctions_search_path.sql`. Les deux sont postérieures à `20261030`, et aucune migration existante n'est modifiée.
- **A ne dépend que d'objets déjà présents en prod** : `profiles`, `groups`, `group_instructors` (migrations 20260101 et 20260411) et les rôles Supabase. Elle ne touche aucune fonction de `public`.
- **B réécrit `handle_new_user`** avec le corps de `20261029` (statut « En attente »). Elle doit donc passer en prod **après** `20261029`, ce que garantit sa date. Elle part avec le lot du § 4 de `mise-en-prod.md`.
- **Procédure prod de A**, rédigée par T5, exécutée par l'utilisateur :
  1. § 2 fait au préalable : l'historique contient alors les 5 versions de base. Si ce n'est pas le cas, faire le § 2 d'abord.
  2. Sauvegarde (§ 2.1).
  3. État avant : droits relevés sur la vue (`anon` aucun, `authenticated` SELECT).
  4. Exécution du fichier A dans le SQL Editor de la prod. Le fichier est transactionnel et idempotent.
  5. `npx supabase migration repair --linked --status applied 20261102`.
  6. Contrôles : colonnes, droits, `is_updatable = NO`, lecture anonyme limitée aux référents et moniteurs, page publique avec les noms.
  7. Retour sur le dev.
- **Conséquence pour la suite** : `20261025`, `20261029` et `20261030` sont plus anciennes que `20261102`, déjà inscrite. Les `db push` des § 3 et § 4 devront donc passer `--include-all`. Le `--dry-run` doit proposer **exactement** les migrations attendues (dont `20261103`, jamais `20261102`). T5 met à jour les § 3 et § 4 en conséquence.

### 3. Agents, et application sur le dev
- **Hook vérifié** (`.claude/hooks/agent-guard.mjs`) : `supabase db push/reset` n'est accepté que si `supabase/.temp/project-ref` vaut `ybtnnogxukfldurozqwa`, et refusé avec `--db-url`, `--project-ref` ou un `supabase link` dans la même commande. Le hook ne bloque donc pas un push sur le dev lié.
- **L'application est quand même confiée à la session principale (orchestrateur)**, pas à `api-dev`, pour que chaque push reste un point de contrôle. La commande est `npx supabase db push --linked --dry-run`, puis `npx supabase db push --linked`.
- **Si le CLI demande le mot de passe de la base** (invite interactive), **l'utilisateur** lance la commande lui-même.
- **Rejeu d'idempotence de A** : l'utilisateur colle le fichier A une seconde fois dans le SQL Editor **du dev**, et cela doit passer sans erreur.

### 4. Corps des 7 fonctions : références non qualifiées
Les corps ont été relus dans `20260101` (l. 345-423), `20261029` (l. 56-78), `20260426` (l. 102-122) et `20260520` (l. 113-127).

| Fonction | SECURITY DEFINER | `search_path` actuel | Références non qualifiées à corriger |
|---|---|---|---|
| `is_admin_or_secretary()` | oui | aucun | aucune (`public.user_roles`, `auth.uid()`) |
| `has_role(text)` | oui | aucun | aucune |
| `enrich_profile_from_temps_user()` | oui | aucun | aucune (`public.profiles`, `public.temps_user`) |
| `handle_new_user()` | oui | `public` | aucune (`public.profiles`) ; garder le corps de **20261029** (`status = 'En attente'`) |
| `handle_updated_at()` | non | aucun | aucune (`now()` seul) |
| `registrations_block_user_status_change()` | non | aucun | **`is_admin_or_secretary()`** à remplacer par `public.is_admin_or_secretary()` |
| `profiles_block_payment_change()` | non | aucun | **`is_admin_or_secretary()`** à remplacer par `public.is_admin_or_secretary()` (`auth.role()` est déjà qualifié) |

- Les fonctions intégrées (`now`, `COALESCE`, `LOWER`, `TRIM`, `CONCAT`, `CAST`, l'opérateur `->>`) et la comparaison d'un enum avec un littéral se résolvent par `pg_catalog`, qui est toujours implicite. Aucun autre changement n'est nécessaire.
- Les triggers ne sont pas recréés : `CREATE OR REPLACE FUNCTION` les conserve.

## Tâches

### T0a — Script de vérification et test du composable, rouges d'abord
- **Agent** : qa
- **Fichiers** : `scripts/check-securite-bdd.mjs` (nouveau) · `package.json` et `package-lock.json` (`pg` en devDependency) · `tests/composables/useGroups.test.ts`
- **Dépend de** : `SUPABASE_DEV_DB_URL` ajoutée à `.env` par l'utilisateur
- **Détail** :
  - Le script suit le modèle de `scripts/check-auth-profils-db.mjs` : en-tête documenté, garde du dev sur l'URL, les clés et la chaîne Postgres, comptes de test réels, compte jetable `+secu-`, remise en état et contrôle final.
  - Il couvre toutes les puces « Tests » de la spec, plus Q24 (voir la décision 1). L'ensemble attendu des référents et moniteurs est calculé par la service role (`groups.referent_id` ∪ `group_instructors.user_id`).
  - Les contrôles de catalogue passent par `pg` : `proconfig` de toute fonction `prosecdef` de `public` et `private`, lue dynamiquement ; `information_schema.views` ; `has_table_privilege` et `has_function_privilege` pour `anon`, `authenticated` et `PUBLIC` (via `aclexplode`) ; `USAGE` sur `private`.
  - `useGroups.test.ts` vérifie que `member_directory` est lue avec `'id, full_name'` exactement.
  - Lancer le script une fois et consigner dans `status.md` le relevé ÉCHEC/OK par section. Il doit correspondre au relevé attendu de la décision 1.

### T0b — Parcours e2e de non-régression (∥ T0a)
- **Agent** : e2e
- **Fichiers** : `e2e/securite-bdd.spec.ts` (nouveau) · `e2e/support/dev-db.ts` (aide en lecture : noms attendus)
- **Dépend de** : —
- **Détail** :
  - Un visiteur anonyme ouvre la page publique qui contient le blok `liste-groupe-accordeon` (sans doute `/tarifs`, à confirmer par l'agent). Il déplie un groupe, et le référent ou les moniteurs attendus s'affichent. Les noms attendus sont lus par la service role du dev.
  - Le test est vert avant comme après les migrations : c'est un garde-fou, pas un test rouge.
  - Aucune requête autre que GET ne part vers `member_directory`.

### T1 — Migration A : `member_directory`
- **Agent** : api-dev
- **Fichiers** : `supabase/migrations/20261102_member_directory_securite.sql`
- **Dépend de** : T0a, T0b
- **Détail** :
  - Contenu décrit dans « Migration / schéma BDD », partie A.
  - Faire passer les contrôles `[A]` de T0 sans modifier les tests ; les contrôles `[B]` restent rouges.
  - Avant d'écrire, vérifier par le MCP (lecture seule) le type de `profiles.full_name` et l'absence de dépendants sur la vue.

### T1b — Application de A sur le dev
- **Agent** : orchestrateur (ou l'utilisateur si le CLI demande le mot de passe)
- **Fichiers** : aucun
- **Dépend de** : T1
- **Détail** :
  - `npx supabase db push --linked --dry-run` doit lister **seulement** `20261102`. Lancer ensuite `npx supabase db push --linked`.
  - Rejeu de A dans le SQL Editor du dev par l'utilisateur (idempotence).
  - `node scripts/check-securite-bdd.mjs` : `[A]` et `[non-régression]` OK, `[B]` en ÉCHEC.

### T2 — Migration B : `search_path` et droits d'EXECUTE
- **Agent** : api-dev
- **Fichiers** : `supabase/migrations/20261103_fonctions_search_path.sql`
- **Dépend de** : T1b (A poussée, sinon le dry-run de T1b listerait B)
- **Détail** :
  - Contenu décrit dans « Migration / schéma BDD », partie B.
  - Relire avant d'écrire la liste des fonctions `prosecdef` de `public` par le MCP. Toute fonction apparue depuis le 2026-11-02 est ajoutée.
  - Faire passer les contrôles `[B]` de T0 sans les modifier.

### T2b — Application de B sur le dev et advisors
- **Agent** : orchestrateur (ou l'utilisateur)
- **Fichiers** : aucun
- **Dépend de** : T2
- **Détail** :
  - Dry-run (seulement `20261103`), puis push.
  - Relancer le script : tout doit être OK.
  - Advisors de sécurité via le MCP (`get_advisors`) : aucune ERROR, plus de `function_search_path_mutable` ni de `anon_security_definer_function_executable`. Voir le risque 1 sur `authenticated_…`.

### T3 — QA
- **Agent** : qa
- **Fichiers** : `docs/test-plan.md`
- **Dépend de** : T2b
- **Détail** : scénarios « sécurité BDD » (script, Q24, e2e) ajoutés au plan de test ; `npm test` relancé.

### T4 — Porte de qualité
- **Agent** : orchestrateur, avec e2e pour Playwright
- **Fichiers** : aucun
- **Dépend de** : T3
- **Détail** : `npm test`, `npm run typecheck`, `e2e/securite-bdd.spec.ts` et smoke. Après 2 échecs de suite, demander à l'utilisateur. Puis revue (`reviewer` vers `review.md`).

### T5 — Documentation
- **Agent** : doc-writer
- **Fichiers** : `docs/mise-en-prod.md` · `docs/database.md` · `.claude/skills/supabase-db/SKILL.md` · `docs/backlog.md`
- **Dépend de** : revue
- **Détail** :
  - `mise-en-prod.md` : nouvelle section « Correctif de sécurité anticipé (migration A) » selon la procédure de la décision 2, avec l'état avant et après et les vérifications. Mettre aussi à jour les § 3 et § 4 : `--include-all`, liste attendue au dry-run, B livrée avec le § 4.
  - `database.md` et la skill : `member_directory` (colonnes `id, full_name`, lecteur `useGroups`, droits, fonction `private.member_directory_rows`) ; règle « `search_path = ''` et noms qualifiés pour toute fonction `SECURITY DEFINER`, fonctions de trigger sans `EXECUTE` pour anon et authenticated ».
  - `backlog.md` : D16, Q23, Q24 et D17 marqués faits.
  - `graphify update .` une seule fois.

## Migration / schéma BDD

### A — `supabase/migrations/20261102_member_directory_securite.sql` (autonome, transactionnelle, idempotente)
- `CREATE SCHEMA IF NOT EXISTS private`. `REVOKE ALL ON SCHEMA private FROM PUBLIC`, puis `GRANT USAGE ON SCHEMA private TO anon, authenticated`.
- `CREATE OR REPLACE FUNCTION private.member_directory_rows() RETURNS TABLE (id uuid, full_name <type de profiles.full_name>)`, avec `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''`.
  - Elle renvoie `p.id, p.full_name` de `public.profiles p` lorsque `EXISTS` (`public.groups g`, `g.referent_id = p.id`) ou `EXISTS` (`public.group_instructors gi`, `gi.user_id = p.id`). Tous les noms sont qualifiés.
  - `REVOKE ALL ON FUNCTION … FROM PUBLIC, anon, authenticated`, puis `GRANT EXECUTE … TO anon, authenticated`.
- `DROP VIEW IF EXISTS public.member_directory` sans `CASCADE`. `CREATE OR REPLACE` ne peut pas retirer `avatar_url`, et l'absence de `CASCADE` fait échouer la migration s'il existe un dépendant.
- `CREATE VIEW public.member_directory WITH (security_invoker = true) AS SELECT id, full_name FROM private.member_directory_rows()`. Une vue sur une fonction n'est pas modifiable.
- Droits de la vue, **après** sa création, à cause des privilèges par défaut de Supabase (ALL sur toute nouvelle table de `public`) :
  - `REVOKE ALL … FROM PUBLIC, anon, authenticated` ;
  - `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER … FROM anon, authenticated` (explicite, comme le demande la spec) ;
  - `GRANT SELECT … TO anon, authenticated`.
- `COMMENT ON VIEW` mis à jour : référents et moniteurs seulement, plus d'avatar.
- Aucune autre table, policy ou fonction de `public` n'est touchée.

### B — `supabase/migrations/20261103_fonctions_search_path.sql` (transactionnelle, idempotente, après 20261029)
- `CREATE OR REPLACE` des 7 fonctions du tableau de la décision 4. Chacune prend `SET search_path = ''`, garde le même corps, le même langage, la même volatilité et le même `SECURITY DEFINER`. Les deux appels `is_admin_or_secretary()` sont qualifiés. Pour `handle_new_user`, c'est le corps de 20261029 qui sert.
- `REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.enrich_profile_from_temps_user() FROM PUBLIC, anon, authenticated`. Le droit de `service_role` reste inchangé.
- `REVOKE EXECUTE ON FUNCTION public.is_admin_or_secretary(), public.has_role(text) FROM PUBLIC, anon`, puis `GRANT EXECUTE … TO authenticated, service_role`. `service_role` est nécessaire : `registrations_block_user_status_change` appelle `is_admin_or_secretary()` sans exemption pour `service_role`.
- Bloc `DO` final de contrôle : `RAISE EXCEPTION` si une fonction `prosecdef` de `public` ou `private` n'a pas de `search_path` dans `proconfig`. Toute fonction oubliée fait ainsi échouer la migration.
- Aucune table, colonne, policy ni trigger n'est modifié.

## Risques / questions ouvertes
1. **À trancher par l'utilisateur** : la spec garde `EXECUTE` à `authenticated` sur `is_admin_or_secretary()` et `has_role(text)`, qui sont `SECURITY DEFINER` dans `public`. Le WARN `authenticated_security_definer_function_executable` **restera donc pour ces deux fonctions**, alors que la spec demande « plus aucun » WARN de ce type. Deux choix :
   - (a) accepter ces 2 WARN et les documenter : c'est la proposition par défaut, la fuite se limite à « suis-je admin » pour soi-même ;
   - (b) les déplacer dans `private` et réécrire les 30 policies, ce qui sort du périmètre « passe 1 ».
2. **`service_role` et la vue** : la spec réserve `EXECUTE` sur `private.member_directory_rows()` à anon et authenticated. Une lecture de `member_directory` par la service role échouerait donc. Aucun lecteur aujourd'hui. Faut-il ajouter `service_role` ?
3. **Prod, procédure A** : elle exige le § 2 fait au préalable, puis `--include-all` pour tous les push suivants. L'alternative est de ne pas inscrire A (exécution manuelle seule ; A rejouée plus tard par `db push`, sans effet car idempotente). Elle est plus simple mais contraire à la spec (« l'inscrire dans l'historique »). À confirmer.
4. **Schéma `private` exposé** : vérifier dans le dashboard du dev et de la prod (API, Exposed schemas) que `private` n'y figure pas. Sinon la fonction devient appelable en RPC.
5. **`SUPABASE_DEV_DB_URL`** : c'est un nouveau secret, que l'utilisateur fournit (mot de passe de la base de dev). Sans lui, T0a ne peut pas tourner.
6. **Hors spec, à décider** : `profiles_block_status_change()` et `helloasso_acquire_token_lock()` restent en `search_path = public`. Elles ne sont pas `SECURITY DEFINER` et ne sont pas signalées. Faut-il les passer aussi à `''` dans B, par cohérence ?
7. **Graphify** non lancé pendant la planification : le planner n'a pas de Bash. Les références ont été vérifiées par lecture ciblée des migrations.
