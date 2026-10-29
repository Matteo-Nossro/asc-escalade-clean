# Status — outillage-tests

> Phase : terminé

## Tâches
<!-- Une ligne de note max par tâche. ☐ à faire · ◐ en cours · ☑ fait · ⛔ bloqué -->
- ☑ T1 — Typecheck : mesure, sans correction (qa) — 192 erreurs de type (app 160 / server 31 / nuxt.config 1), > 20 : H1 non satisfaite, question utilisateur (détail dans Blocages)
- ☑ T7 — Fixtures HelloAsso README (doc-writer) — README seul, 40 lignes max, renvoie à helloasso-api
- ☑ T10 — settings.json : npm run typecheck / test:e2e (orchestrateur) — 3 règles allow ajoutées
- ☑ T11 — agent-guard.mjs profil review : typecheck (orchestrateur) — regex TYPECHECK ancrée, testée (ok / refus args, autres profils)
- ☑ T12 — prompt qa (orchestrateur) — dossiers, mocks centralisés, e2e, typecheck
- ☑ T13 — prompt reviewer (orchestrateur) — typecheck après check.mjs, erreurs du diff = bloquant
- ☑ T4 — Vitest : config, baseline, exemple composant (qa) — baseline avant : 8 fichiers / 99 tests verts (aucun test obsolète) ; après : 9 fichiers / 104 verts ; include/exclude dans vitest.config.ts ; tests/components/Tag.test.ts (ui/Tag.vue, 5 tests)
- ☑ T2-B — Typecheck : baseline (qa) — scripts/typecheck-baseline.mjs + tests/typecheck-baseline.json (192 erreurs, 110 clés) ; npm run typecheck passe, erreur injectée => exit 1, annulée Durci après revue : exit 2 si écart « error TS » brut vs analysé ou baseline corrompue, tri et préfixe indépendants de locale/casse ; baseline inchangée.
- ⛔ T2 — Typecheck : correction app/ (ui-dev) — annulée (baseline choisie, voir T2-B)
- ⛔ T3 — Typecheck : correction server/ (api-dev) — annulée (baseline choisie, voir T2-B)
- ☑ T5 — Vitest : exemple route server/api (api-dev) — revalidate.post.ts, 4 tests ; tests/utils/nitro.ts ; useRuntimeConfig via mockNuxtImport (env nuxt) ; npm test 10 fichiers / 108 verts
- ☑ T6 — Playwright : config + smoke (qa) — playwright.config.ts + e2e/smoke.spec.ts, 3/3 verts x2 ; build+preview ~6,5-7 min à chaque lancement (serveur arrêté en fin de run, donc pas réutilisé entre deux `npm run test:e2e`) ; .env chargé, .env.test non ; correctif revue : `E2E_SKIP_BUILD=1 npx playwright test` (14 s, build existant requis), sélecteur login par data-testid
- ☐ OPTION DB-1 T8-DB1 — Supabase local : init, baseline, seed, scripts (api-dev) — si DB-1 choisi
- ☐ OPTION DB-1 T9-DB1 — Helper + test d'intégration local (qa) — si DB-1 choisi
- ✅ OPTION DB-2 T8-DB2 — Mocks Supabase centralisés (tests/utils/supabase-mock.ts) ; useAuth, useGroups, useEventRegistrations, useEnrollmentRequests adaptés ; useEvents/usePosts sans mock Supabase (inchangés) ; 104 tests passés avant/après (qa)
- ⚠️ QA (qa) — npm test 108/108, typecheck 0 nouvelle erreur, e2e 3/3 (6,9 min) ; scripts démarrent ; seul `test:coverage` KO (@vitest/coverage-v8 absent) ; critère Documentation en attente de T14
- ⚠️ Revue (reviewer) — 0 bloquant, 3 importants (rebuild e2e à chaque run, garde-fou outillage du script baseline, consigne qa sur la baseline), mineurs : voir review.md
- ☑ T14 — Doc + graphify update (doc-writer) — section « Tests » ajoutée dans architecture.md (48 lignes) ; test-plan.md non touché (qa) ; schéma inchangé

## Blocages
- **T1 — résultat de la mesure (`npm run typecheck`, exit 1)**
  - Outillage : `npm i -D typescript vue-tsc` a installé TypeScript 7.0.2, incompatible avec vue-tsc 3.3.13 (`ERR_PACKAGE_PATH_NOT_EXPORTED './lib/tsc'`). Corrigé en épinglant `typescript@^5.9.3` (devDependency) ; vue-tsc `^3.3.13`. Script `"typecheck": "nuxi typecheck"` ajouté. Aucun code applicatif modifié.
  - **Total : 192 erreurs** : `app/` 160 · `server/` 31 · `nuxt.config.ts` 1 · `tests/` 0 (hors périmètre du tsconfig Nuxt).
  - Fichiers les plus touchés : useEnrollmentRequests.ts 20, storyblok/Home/Hero.vue 17, storyblok/club/Timeline.vue 14, Home/CtaRejoindre.vue 11, useGroups.ts 11, admin/dashboard.vue 10, server webhooks/helloasso.post.ts 8, admin/sync-helloasso.post.ts 7.
  - Codes : TS2339 42, TS2322 39, TS18048 36, TS2769 25, TS2353 14, TS2345 14, TS7015 10, autres 12.
  - 5 exemples : `MembersTable.vue(46)` TS2322 `color="white"` non valide pour NuxtUI ; `useEnrollmentRequests.ts(98)` TS2339 propriété `profile` sur `never` ; `profil.vue(914)` TS2353 `query` absent de `NavigateToOptions` ; `Home/Hero.vue(11)` TS18048 `blok` possiblement `undefined` ; `server/api/webhooks/helloasso.post.ts(110)` TS2339 `profile_id` sur `never`.
  - **Nature : mixte, pour l'essentiel structurelle.** ~54 erreurs `never` viennent de `Database = unknown` (`app/types/database.types.ts` absent, warning @nuxt/supabase) : une seule cause à traiter (générer les types Supabase) ; ~41 sont des `blok` possiblement `undefined` (`defineProps({ blok: Object })` imposé par asc-rules) ; le reste (props NuxtUI, `navigateTo`, index implicites) est ponctuel mais nombreux.
  - **Conclusion H1 : non satisfaite (192 >> 20).** Résolu : baseline (T2-B ; correction de la dette dans la feature `dette-typecheck`).
- Choix de la base de test (DB-1 ou DB-2), mode du serveur Playwright, confirmation H1 (résolu : baseline) et H2 : à trancher par l'utilisateur à la validation.
