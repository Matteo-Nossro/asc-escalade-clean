---
name: testing
description: Patterns de test ASC Escalade — Vitest + @nuxt/test-utils (composable, composant Storyblok, route server/api, Supabase mocké, HelloAsso via fixtures) et Playwright (parcours e2e). À utiliser avant d'écrire, corriger ou faire passer un test, notamment en mode « tests d'abord ».
---

# Tests — patterns du projet

Référence générale : `docs/architecture.md` § Tests.

| Commande | Rôle |
|---|---|
| `npm test` · `npx vitest run tests/<chemin>` | Vitest (unitaires et intégration) |
| `npm run typecheck` | `nuxi typecheck` comparé à la baseline. Ne jamais lancer `typecheck:baseline` sans accord de l'utilisateur |
| `npm run test:e2e` · `E2E_SKIP_BUILD=1 npx playwright test` | Playwright (agent `e2e` uniquement) |

## Règles
1. **Aucun appel réseau réel dans Vitest**, et surtout **aucun appel à HelloAsso**. Les réponses HelloAsso viennent de `tests/fixtures/helloasso/` (voir [examples/helloasso.md](examples/helloasso.md)). Supabase, Storyblok, Resend et `@netlify/functions` sont mockés.
2. **Supabase** : utiliser les mocks centralisés de `tests/utils/supabase-mock.ts` (stratégie DB-2, pas de base locale). Ils ne détectent ni le SQL ni les RLS : ces points se vérifient en revue.
3. **`mockNuxtImport` reste dans le fichier de test**, car il est hoisté. On importe le module testé **après**, avec `await import(...)`.
4. **Un test vérifie un comportement de la spec**, pas l'implémentation : nommer le critère d'acceptation dans le `describe` ou le `it`.
5. **e2e en lecture seule.** Un parcours qui écrit en base ne tourne que si `E2E_ALLOW_WRITES=1` sur un environnement de test, sinon `test.skip` avec un message. Les identifiants de test viennent de variables d'environnement, jamais en dur.
   - **Parcours qui envoie un vrai e-mail** (`@email`, `E2E_SEND_EMAIL=1`, ex. l'inscription réelle de `e2e/auth-profils.spec.ts`) : il consomme le **quota d'envoi du projet dev** (SMTP Resend, clé dédiée au dev). Ne le lancer **que si nécessaire** : quand le flux d'inscription ou de confirmation a changé, ou pour la porte de qualité d'une feature qui le touche. Une seule fois par porte, jamais en boucle de débogage. Adresse jetable `TEST_USERS_EMAIL+e2e-<horodatage>`, jamais `@example.com`. `test.skip` avec raison si la limite d'envoi est atteinte.
6. **Affichage qui dépend des rôles ou de l'utilisateur connecté** : au moins un test utilise le **vrai** composable (`useAuth`), avec **seulement Supabase simulé** (`useSupabaseClient` / `useSupabaseUser`, réponses de `profiles` et `user_roles`). Un faux `useAuth` ne prouve pas que les rôles arrivent jusqu'au composant (bug réel : `HelloAssoConfig.vue` sans aucune action pour l'admin, tests verts). Exemple : `tests/components/admin/HelloAssoConfig.roles.test.ts`.
7. **Tests d'abord** :
   - `qa` (et `e2e` pour les parcours) écrit les tests à partir des critères d'acceptation, **avant** le code. Ils doivent échouer pour la bonne raison : fonctionnalité absente, pas une erreur de syntaxe ou d'import.
   - Les agents de dev **ne modifient pas ces tests**. Un test qui leur semble faux ⇒ stop, et signalement.
8. **Tous les tests Vitest vont dans `tests/`** (miroir de l'arborescence : `tests/components/…`, `tests/server/api/…`). `vitest.config.ts` n'inclut que `tests/**` : un test placé ailleurs (à côté du composant, dans `server/`…) ne tournerait pas, sans aucun message. Les parcours Playwright restent dans `e2e/`.
9. **Captures de référence** : quand une feature change volontairement le visuel, ses captures de référence sont renouvelées à la clôture, après validation de l'utilisateur. Jamais de mise à jour sans cette validation.

## Exemples (à ouvrir selon le besoin)
| Cible | Fichier | Modèle dans le dépôt |
|---|---|---|
| Composable | [examples/composable.md](examples/composable.md) | `tests/composables/useEventRegistrations.test.ts` |
| Composant (dont Storyblok) | [examples/storyblok-component.md](examples/storyblok-component.md) | `tests/components/Tag.test.ts` |
| Route `server/api` | [examples/server-route.md](examples/server-route.md) | `tests/server/api/revalidate.test.ts` |
| Accès Supabase | [examples/supabase.md](examples/supabase.md) | `tests/utils/supabase-mock.ts` |
| Appel HelloAsso | [examples/helloasso.md](examples/helloasso.md) | `tests/server/api/helloasso-test.test.ts` (aides : `tests/utils/helloasso-kit.ts`, `tests/utils/fake-supabase.ts` ; fixtures : `tests/fixtures/helloasso/README.md`) |
| Parcours e2e | [examples/e2e.md](examples/e2e.md) | `e2e/smoke.spec.ts` |

## Pièges connus
- Sous l'environnement `nuxt`, `useRuntimeConfig` est un auto-import : le simuler avec `mockNuxtImport('useRuntimeConfig', original => () => ({ ...original(), … }))`, en **gardant** la config d'origine.
- Route serveur : `vi.resetModules()` puis `stubNitroGlobals()` dans `beforeEach`, et `vi.unstubAllGlobals()` dans `afterEach`.
- Les e2e vont dans `e2e/`, jamais dans `tests/` (sinon Vitest les ramasse).
- `#supabase/server` est un alias Nitro que Vite ne résout pas. `vitest.config.ts` le pointe sur `tests/utils/supabase-server-stub.ts` : sans cet alias, une route `server/` qui l'importe ne se charge pas, même avec `vi.mock`. Chaque test remplace le stub par `vi.mock('#supabase/server', …)`.
- **Git Bash sous Windows** : lancer Vitest depuis `cd "D:/projet-perso/asc-escalade-clean"`, **pas** depuis `cd /d/projet-perso/…`. Avec le chemin `/d/…` (lettre de lecteur en minuscule), tous les fichiers échouent avec « failed to find the runner », sans rapport avec le code testé.
- Fixtures HelloAsso dont la racine est un tableau : elles sont rangées sous la clé `body` (`fixture('form-types.ok').body`). `fixture()` de `tests/utils/helloasso-kit.ts` retire `_source`.
