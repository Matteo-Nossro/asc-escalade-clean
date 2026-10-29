# Spec — Outillage de tests et de contrôle

> Slug : `outillage-tests` · Créée le : 2026-10-22 · Transverse : non (outillage : ni table, ni flux d'auth, ni refonte)

## Objectif
Doter le projet d'un outillage de tests et de contrôle fiable et reproductible :
- tests unitaires et d'intégration (composables, composants, routes `server/api`) ;
- tests e2e ;
- vérification de types ;
- base de test.

C'est le socle des lots HelloAsso à venir (`docs/features/helloasso-*`).

## Critères d'acceptation
- [x] **Vitest + @nuxt/test-utils** configuré pour trois cibles : composables, composants `.vue` (montage avec `@vue/test-utils` / `mountSuspended`) et routes `server/api` (handler appelé avec un event simulé, ou `$fetch` sur le serveur de test). Un exemple minimal de chaque type existe, uniquement pour prouver que la config fonctionne.
- [x] **Playwright** :
  - [x] fichier `playwright.config.*` avec le serveur web démarré automatiquement ;
  - [x] **test de fumée vert** :
    - [x] la page d'accueil se charge (titre ou contenu clé visible) ;
    - [x] la page `/tarifs` se charge ;
    - [x] la page de connexion affiche son formulaire ;
  - [x] aucun compte réel requis.
- [x] **`nuxi typecheck`** fonctionnel (dépendances `vue-tsc` / `typescript` ajoutées si besoin). _QA : rempli via baseline (192 erreurs connues, décision utilisateur) ; `typecheck:strict` échoue comme prévu._
- [x] **Stratégie de base de test** (DB-2 : mocks centralisés `tests/utils/supabase-mock.ts` ; documentation écrite en T14) :
  - [x] Supabase local (CLI + Docker), si c'est disponible sur le poste ; _(non retenu, DB-2 choisi)_
  - [x] sinon des mocks propres et centralisés du client Supabase, réutilisables par tous les tests ;
  - [x] **choix proposé à l'utilisateur lors de la validation du plan**, puis seule l'option retenue est mise en place.
- [x] Dossier **`tests/fixtures/helloasso/`**, vide hormis un `README.md` qui explique son rôle : réponses d'API HelloAsso enregistrées (sandbox) pour les lots HelloAsso, conventions de nommage, données personnelles anonymisées.
- [x] **Scripts npm** _(QA : tous OK ; `test:coverage` réparé par l'orchestrateur : `@vitest/coverage-v8@4.1.2` ajouté, `coverage/` ignoré par git)_ : `test` (Vitest, sans watch), `test:e2e` (Playwright), `typecheck`. Les scripts existants (`test:watch`, `test:coverage`, `test:e2e:ui`, `test:e2e:report`) restent fonctionnels.
- [x] **Les trois commandes passent sur le code actuel** : `npm test`, `npm run test:e2e`, `npm run typecheck`.
- [x] Configuration de l'équipe d'agents mise à jour, pour que les agents utilisent cet outillage :
  - [x] `.claude/settings.json` autorise `npm run typecheck` et `npm run test:e2e` ;
  - [x] le profil `review` de `.claude/hooks/agent-guard.mjs` autorise `npm run typecheck` ;
  - [x] les prompts `qa` et `reviewer` ne disent plus « pas de Playwright ni de typecheck ».
- [ ] _(en attente de T14)_ Documentation : section « Tests » dans `docs/architecture.md` (ou `docs/test-plan.md`). Elle couvre les commandes, la structure de `tests/`, la stratégie de base de test et les variables d'environnement nécessaires (`.env.test`).

## Hors périmètre
- Écrire les tests des features existantes. Les tests déjà présents dans `tests/` sont conservés.
- CI (GitHub Actions), linter et formateur (ESLint, Prettier).
- Tests des lots HelloAsso.

## Contraintes / contexte
- Existant connu :
  - `vitest.config.ts` (`defineVitestConfig`, environnement `nuxt`, happy-dom) ;
  - `tests/composables/*.test.ts` et `tests/server/legacyRedirects.test.ts` ;
  - `@playwright/test` installé et scripts `test:e2e*` présents, mais **aucun `playwright.config.*`** ;
  - pas de `vue-tsc` ;
  - `.env.test` existe ;
  - `supabase/volumes/` et `docker-compose.prod.yml` : Supabase est peut-être auto-hébergé en Docker, à vérifier.
- Pages de fumée : l'accueil et `/tarifs` dépendent de Storyblok (token de l'environnement), la connexion dépend de Supabase. Le test de fumée doit fonctionner avec la configuration locale (`.env` / `.env.test`), sans écrire de données.
- **Hypothèses**, à confirmer à la validation du plan :
  - **H1 — typecheck** : si `nuxi typecheck` remonte des erreurs dans le code existant, on les corrige de façon minimale si elles sont peu nombreuses (≤ ~20 et triviales). Au-delà, l'utilisateur choisit entre corriger, passer par une baseline ou des exclusions temporaires.
  - **H2 — tests existants** : si des tests existants échouent sur le code actuel, on corrige le test quand c'est lui qui est obsolète. Si c'est un vrai bug applicatif, on le signale sans le corriger.
- Ne jamais lire les fichiers `.env*` : seulement leurs noms de variables, via `nuxt.config.ts` ou `.env.example`.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok |
