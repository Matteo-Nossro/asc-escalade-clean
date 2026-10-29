# Plan — outillage-tests

> Rédigé par : planner (sonnet) · Validé par l'utilisateur : ☑ (2026-10-22)
> **Choix de l'utilisateur** : **DB-2 mocks centralisés** (DB-1 non exécutée) · Playwright en **build + preview HTTP** · **H1 et H2 confirmées**.

## Résumé de l'approche
Outillage pur, aucun code applicatif nouveau. Trois chantiers indépendants :
1. **Typecheck** : mesurer d'abord (T1), corriger ensuite seulement si l'hypothèse H1 le permet (T2/T3).
2. **Tests** : Vitest couvre trois cibles (composable existant, composant, route `server/api`). Playwright tourne sur un **build de production servi en HTTP** (pas sur `nuxt dev`, qui passe en HTTPS via `mkcert`, ce qui peut déclencher des invites système sous Windows). Smoke test sans compte.
3. **Base de test** : deux options alternatives, **une seule exécutée** après choix de l'utilisateur (DB-1 Supabase local ou DB-2 mocks centralisés).

Constats qui pèsent sur le plan :
- `supabase/migrations/` ne contient que 4 migrations incrémentales (pas de schéma de base) : DB-1 exige un **schéma de référence** à fournir par l'utilisateur (dump), voir « Migration / schéma BDD ».
- Vitest ramasse par défaut tout `*.spec.ts` : les tests Playwright iront dans `e2e/` et seront **exclus** de Vitest (ainsi que `.claude/worktrees/**`).
- Scripts `test`, `test:e2e*` déjà présents : seul `typecheck` est à ajouter. `.gitignore` couvre déjà `playwright-report/` et `test-results/`.
- Pas de preset Nitro dans `nuxt.config.ts` : `.output/server/index.mjs` existe après `nuxt build`. `isDev` vaut `NODE_ENV === 'development'` : Vitest (NODE_ENV=test) et build/preview restent en HTTP.

## Tâches

### Vague 1 (parallélisable : fichiers disjoints)

### T1 — Typecheck : mesure (sans correction)
- **Agent** : qa
- **Fichiers** : `package.json` (devDeps `typescript`, `vue-tsc`, script `"typecheck": "nuxi typecheck"`), `package-lock.json`
- **Dépend de** : —
- **Détail** : installer les deux devDeps, ajouter le script, lancer `npm run typecheck`. Ne rien corriger. Écrire dans `status.md` (blocages) : nombre total d'erreurs, répartition `app/` / `server/` / `tests/` / autres, 5 exemples représentatifs, et si elles sont « triviales » (types manquants, import) ou structurelles. Si `nuxi typecheck` échoue pour une raison d'outillage (pas des erreurs de type), le signaler. Applique H1 : ≤ ~20 erreurs triviales → T2/T3 ; sinon **stop, question à l'utilisateur**.

### T7 — Dossier fixtures HelloAsso
- **Agent** : doc-writer
- **Fichiers** : `tests/fixtures/helloasso/README.md`
- **Dépend de** : —
- **Détail** : README seul (le dossier reste vide sinon). Rôle : réponses d'API HelloAsso enregistrées depuis la sandbox pour les lots HelloAsso ; conventions de nommage (`<ressource>.<cas>.json`, ex. `payment.authorized.json`) ; anonymisation obligatoire (noms, emails, adresses, IBAN remplacés par des valeurs fictives) ; jamais de jeton ni de secret ; comment enregistrer une réponse (sandbox uniquement). Parallélisable avec toute autre tâche.

### T10 — Autorisations des agents (settings)
- **Agent** : orchestrateur
- **Fichiers** : `.claude/settings.json`
- **Dépend de** : —
- **Détail** : ajouter `Bash(npm run typecheck)` et `Bash(npm run test:e2e)` à `permissions.allow` (≤ 3 lignes).

### T11 — Profil `review` : autoriser le typecheck
- **Agent** : orchestrateur
- **Fichiers** : `.claude/hooks/agent-guard.mjs`
- **Dépend de** : —
- **Détail** : ajouter une regex `TYPECHECK` (`npm run typecheck` seul, ancrée début/fin, sans arguments) et l'insérer dans `PROFILES.review.only`. Mettre à jour le commentaire du profil.

### T12 — Prompt `qa`
- **Agent** : orchestrateur
- **Fichiers** : `.claude/agents/qa.md`
- **Dépend de** : —
- **Détail** : remplacer la ligne « Playwright… Ne lance pas d'e2e » par : `npm run test:e2e` (smoke dans `e2e/`, serveur démarré automatiquement), `npm run typecheck`. Ajouter les dossiers `tests/components`, `tests/utils` et la stratégie de base de test retenue. Mettre à jour la `description` (mentionne seulement Vitest).

### T13 — Prompt `reviewer`
- **Agent** : orchestrateur
- **Fichiers** : `.claude/agents/reviewer.md`
- **Dépend de** : T11
- **Détail** : ajouter à l'étape 1 « Vérification automatique » : lancer `npm run typecheck` après `check.mjs`, les nouvelles erreurs de type dans le diff sont des bloquants. Aucune mention restante « pas de typecheck ».

### Vague 2 (après T1 ; T4 et T2 ∥ T3 sont disjoints)

### T4 — Vitest : config, baseline, exemple composant
- **Agent** : qa
- **Fichiers** : `vitest.config.ts`, `tests/components/<Composant>.test.ts` (nouveau)
- **Dépend de** : T1 (node_modules stable)
- **Détail** :
  1. Lancer `npm test` **avant toute modification** et noter le résultat (applique H2 : test obsolète → corriger le test ; vrai bug applicatif → signaler sans corriger).
  2. Dans `vitest.config.ts` : `include` explicite (`tests/**/*.test.ts`) et `exclude` de `e2e/**`, `node_modules/**`, `.claude/worktrees/**`, `.output/**`.
  3. Un test de composant minimal avec `mountSuspended` (`@nuxt/test-utils/runtime`) sur un composant simple, non Storyblok, sans GSAP ni appel réseau (choix de qa, vérifié par Grep). L'exemple composable existe déjà (`tests/composables/useBreakpoints.test.ts`) : ne rien ajouter.

### T2-B — Typecheck : baseline (remplace T2 et T3, décision de l'utilisateur du 2026-10-22)
- **Agent** : qa (celui de T1)
- **Fichiers** : `scripts/typecheck-baseline.mjs` (nouveau), `tests/typecheck-baseline.json` (généré), `package.json` (scripts)
- **Dépend de** : T1 · **∥ T4** (fichiers disjoints)
- **Détail** : T1 a mesuré 192 erreurs (> seuil H1). L'utilisateur choisit la **baseline** ; la correction se fera dans la feature `dette-typecheck`.
  - Le script lance `nuxi typecheck` (vue-tsc), puis normalise chaque erreur en clé `fichier + code TS + message`, **sans numéro de ligne** (pour qu'un simple décalage de lignes ne crée pas de fausse « nouvelle erreur »). Il compte les occurrences par clé.
  - **Exit 1 seulement s'il y a une erreur nouvelle** (clé absente, ou occurrences en hausse). Il affiche aussi le nombre d'erreurs corrigées depuis la baseline.
  - Scripts npm :
    - `typecheck` : vérification contre la baseline ;
    - `typecheck:strict` : `nuxi typecheck` brut ;
    - `typecheck:baseline` : régénère la baseline (usage volontaire, documenté).
  - Node pur, sans dépendance ; la baseline est versionnée.
  - Test du mécanisme : `npm run typecheck` passe sur le code actuel, et une erreur introduite temporairement le fait échouer (à annuler ensuite).

### ~~T2 / T3~~ — Corrections du typecheck : **annulées**, reportées à la feature `dette-typecheck`

### T2 — Typecheck : correction côté `app/` (CONDITIONNELLE, H1) — ANNULÉE
- **Agent** : ui-dev
- **Fichiers** : ceux listés par T1 sous `app/` (exacts connus après T1)
- **Dépend de** : T1 + validation de H1 (≤ ~20 erreurs triviales)
- **Détail** : corrections minimales de types uniquement (jamais de changement de comportement). Respecter asc-rules (imports `'vue'`, pas de TS générique dans `defineProps` des composants Storyblok). Parallélisable avec T3 et T4.

### T3 — Typecheck : correction côté `server/` (CONDITIONNELLE, H1) — ANNULÉE
- **Agent** : api-dev
- **Fichiers** : ceux listés par T1 sous `server/` (exacts connus après T1)
- **Dépend de** : T1 + validation de H1
- **Détail** : idem T2, côté serveur. Ne pas toucher aux fichiers HelloAsso non suivis si une autre feature les modifie : signaler plutôt. Parallélisable avec T2 et T4.

### Vague 3 (après T4 ; T5 ∥ T6 ∥ T8-DB2 : fichiers disjoints)

### T5 — Vitest : exemple de route `server/api`
- **Agent** : api-dev
- **Fichiers** : `tests/utils/nitro.ts` (stubs des auto-imports Nitro : `defineEventHandler`, `createError`, `readBody`, etc. + fabrique d'event simulé), `tests/server/api/<route>.test.ts`
- **Dépend de** : T4
- **Détail** : tester en appelant le handler avec un event simulé (pas de `$fetch`, pas de build). Choisir une route simple parmi `server/api/revalidate.post.ts` / `contact.post.ts` (Grep pour vérifier ses dépendances), pas de route HelloAsso. Mocker `serverSupabaseClient` et les envois d'email ; aucune requête réseau réelle. Le test prouve la config, il ne couvre pas la route.

### T6 — Playwright : config et test de fumée
- **Agent** : qa
- **Fichiers** : `playwright.config.ts`, `e2e/smoke.spec.ts`
- **Dépend de** : T4 (exclusion `e2e/` de Vitest)
- **Prérequis poste** : `npx playwright install chromium` (téléchargement ~150 Mo, non installé à ce jour).
- **Détail** :
  - `testDir: e2e`, un seul projet `chromium`, `workers: 1`, `baseURL` HTTP sur port fixe (3100), `reuseExistingServer` hors CI.
  - `webServer` : build de production puis `nuxt preview --port 3100` (charge `.env`) ; timeout large (≥ 5 min pour le build). **Ne pas utiliser `nuxt dev`** (HTTPS + mkcert).
  - Smoke : `/` (titre ou `h1` visible), `/tarifs` (contenu visible), `/login` (champs `data-testid="input-login-email"` et `input-login-password`, bouton `type="submit"`). Lecture seule, aucun compte, aucune écriture.
  - Vérifier si `.env.test` est chargé (c12 charge `.env.<NODE_ENV>` ; sinon charger explicitement). Ne pas lire `.env*` : se fier aux noms de variables dans `nuxt.config.ts`.
  - Le build fige les variables `process.env` lues par `nuxt.config.ts` : le signaler si le preview ne les retrouve pas.

### OPTION DB-1 — Supabase local (CLI + Docker) — **une seule des deux options sera exécutée**

**Prérequis poste** : Docker Desktop **démarré et sain** (le démon plante aujourd'hui, `docker info` en panic, à réparer d'abord) ; CLI Supabase via `npx supabase` (téléchargement) ou devDependency ; ~4 Go de RAM libres ; ports 54321-54324 libres ; **dump du schéma de prod** fourni par l'utilisateur (`supabase db dump --schema public` ou `pg_dump --schema-only`) car `supabase/migrations/` n'a pas le schéma de base.

#### T8-DB1 — Initialisation Supabase local
- **Agent** : api-dev
- **Fichiers** : `supabase/config.toml` (via `supabase init`), `supabase/migrations/00000000000000_baseline.sql` (schéma de base issu du dump utilisateur), `supabase/seed.sql` (données fictives minimales : 1 admin, 1 groupe, 1 membre), `package.json` (scripts `db:start`, `db:stop`, `db:reset`), `.env.test.example` (noms seulement, sans valeur)
- **Dépend de** : T4, dump fourni, Docker opérationnel
- **Détail** : vérifier que les 4 migrations existantes (`20260409…` à `20260520…`) se rejouent sans erreur au-dessus de la baseline ; sinon, signaler. Ne modifie ni `.env` ni `.env.test` : l'utilisateur y reporte les URL et clés locales affichées par `supabase start`.

#### T9-DB1 — Helper et test d'intégration local
- **Agent** : qa
- **Fichiers** : `tests/utils/supabase-local.ts` (client service role pointé sur l'instance locale, reset des tables de test), `tests/integration/supabase-local.test.ts` (exemple minimal : lecture d'un enregistrement du seed), `vitest.config.ts` (projet ou `include` séparé pour `tests/integration`, exclu de `npm test` si la base est absente)
- **Dépend de** : T8-DB1
- **Détail** : les tests d'intégration sont ignorés proprement (skip explicite avec message) si `SUPABASE_URL` ne pointe pas en local, pour que `npm test` reste vert sans Docker. Les tests existants gardent leurs mocks.

### OPTION DB-2 — Mocks Supabase centralisés — **une seule des deux options sera exécutée**

**Prérequis poste** : aucun (pas de Docker).

#### T8-DB2 — Helper de mock partagé et adaptation minimale des tests existants
- **Agent** : qa
- **Fichiers** : `tests/utils/supabase-mock.ts` (nouveau), puis adaptation minimale de `tests/composables/useAuth.test.ts`, `useEnrollmentRequests.test.ts`, `useGroups.test.ts`, `useEventRegistrations.test.ts` (et `useEvents`, `usePosts` si Grep y trouve un mock local équivalent)
- **Dépend de** : T4
- **Détail** : extraire des tests existants le motif commun (`from()` chaînable `select/eq/order/insert/update/delete/single`, résultat `{ data, error }` configurable par table, `useSupabaseUser` factice) en une fabrique, utilisable via `vi.hoisted` et `mockNuxtImport` (la macro doit rester dans le fichier de test). On remplace seulement la plomberie du mock : **aucune assertion modifiée, aucun test réécrit**. Si un test a un mock trop spécifique, le laisser tel quel et le noter. `npm test` doit rester identique au baseline de T4.

### Fin de feature

### T14 — Documentation et graphe
- **Agent** : doc-writer
- **Fichiers** : `docs/architecture.md` (nouvelle section « Tests »), `docs/test-plan.md` (renvoi d'une ligne vers cette section)
- **Dépend de** : T1…T9 (selon option), T10-T13
- **Détail** : commandes (`npm test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`, `typecheck`), structure de `tests/` (`composables`, `components`, `server`, `utils`, `fixtures/helloasso`, `e2e/` à la racine), stratégie de base de test **retenue seulement**, noms des variables d'environnement de `.env.test` (SUPABASE_URL, SUPABASE_KEY, SUPABASE_SECRET_KEY, STORYBLOK_TOKEN, STORYBLOK_REGION, STORYBLOK_VERSION, STORYBLOK_WEBHOOK_SECRET, RESEND_API_KEY, NUXT_PUBLIC_SITE_URL), mode du serveur Playwright, prérequis `playwright install chromium`. Puis `graphify update .` une seule fois.

### QA finale
- **Agent** : qa
- **Fichiers** : aucun fichier de code (compte rendu dans `status.md`)
- **Dépend de** : toutes les tâches de code (T1…T6, option DB)
- **Détail** : exécuter sur le code final `npm test`, `npm run test:e2e`, `npm run typecheck` ; les trois doivent passer. Vérifier que `test:watch`, `test:coverage`, `test:e2e:ui` et `test:e2e:report` démarrent. Le reviewer passe ensuite, puis T14.

## Ordre d'exécution
`Vague 1 : T1 ∥ T7 ∥ T10 ∥ T11 ∥ T12` → `T13` → `Vague 2 : T4 ∥ (T2 ∥ T3 si H1)` → `Vague 3 : T5 ∥ T6 ∥ (T8-DB2 | T8-DB1 → T9-DB1)` → QA finale → Revue → T14.

## Migration / schéma BDD
Aucune modification du schéma applicatif ni de la production.
**Exception, uniquement si l'option DB-1 est retenue** : création de `supabase/migrations/00000000000000_baseline.sql` (schéma de base servant à rejouer les migrations sur une instance locale), à partir d'un dump fourni par l'utilisateur. Ce fichier ne doit jamais être appliqué à la production. Cette mention autorise api-dev à créer ce seul fichier (T8-DB1). Avec l'option DB-2 : aucune.

## Risques / questions ouvertes
- **Choix de la base de test** (à trancher) : DB-1 (fidèle, mais Docker aujourd'hui cassé, dump de schéma à fournir, effort plus lourd) ou DB-2 (immédiat, sans prérequis, mais ne détecte pas les erreurs SQL/RLS). Ma recommandation : DB-2 maintenant, DB-1 plus tard si les lots HelloAsso exigent de tester les RLS ou les migrations.
- **Serveur Playwright** (à trancher) : build + preview HTTP (recommandé : fiable, pas de `mkcert`, mais premier lancement long, ~2-4 min) ou `nuxt dev` HTTPS (plus rapide à lancer, mais `mkcert` peut demander d'installer une autorité de certification sur le poste).
- **H1 typecheck** : à confirmer. Si T1 compte plus de ~20 erreurs, trois voies : corriger tout, baseline, ou exclusions temporaires. Dans ce cas, `npm run typecheck` ne passerait pas avant décision.
- **H2 tests existants** : à confirmer. Test obsolète corrigé ; vrai bug applicatif signalé sans correction (le critère « `npm test` passe » serait alors bloqué par ce bug).
- **Dépendance réseau du smoke test** : `/` et `/tarifs` appellent l'API Storyblok avec le token local ; hors ligne ou token invalide, le test échoue. Les stories « accueil » et « tarifs » doivent exister dans la version configurée (`STORYBLOK_VERSION`).
- **Variables d'environnement au build/preview** : si `.env.test` n'est pas chargé automatiquement ou si le build fige des valeurs, T6 devra le résoudre ; l'utilisateur pourra devoir compléter `.env.test` (non lu par les agents).
- **Poste** : `npx playwright install chromium` à exécuter (téléchargement). Pour DB-1 : réparer Docker et fournir le dump.
- Le profil `review` n'autorise que `npm run typecheck` (pas `npm test` ni e2e) : volontaire.
