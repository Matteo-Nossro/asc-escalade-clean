# CLAUDE.md — ASC Escalade

Site Nuxt 4 + Storyblok pour le club d'escalade ASC Escalade (Chevigny-Saint-Sauveur).

## Stack
- **Nuxt 4.2** / Vue 3.5 — SSR activé
- **Storyblok** (`@storyblok/nuxt` v10) — CMS headless
- **NuxtUI 4.3** — composants UI (TailwindCSS 4)
- **GSAP 3** — animations
- **@nuxt/image** — images optimisées (provider Storyblok)

## Règles critiques

### Storyblok
- Tout composant Storyblok **doit** être enregistré dans `app/plugins/storyblok.ts` via `vueApp.component('nom-avec-tirets', Component)`
- Les **technical names dans Storyblok utilisent des tirets**, pas des underscores (`tarifs-hero` ✅, `tarifs_hero` ❌)
- Toujours ajouter `v-editable="blok"` sur l'élément racine du template
- `defineProps({ blok: Object })` — pas de TypeScript générique dans defineProps des composants Storyblok

### Scripts TypeScript (`lang="ts"`)
- **Toujours importer explicitement** `ref`, `computed`, `onMounted` depuis `'vue'` — les auto-imports Nuxt ne fonctionnent pas avec `lang="ts"` dans les composants Storyblok
- Utiliser `gsap.from()` plutôt que `gsap.set()` + `gsap.to()` pour les animations d'entrée (sinon les éléments restent invisibles si la timeline échoue)
- Refs dans les templates Vue : `:ref="el => { if (el) refs[i] = el }"` (pas de `as HTMLElement`)

### Supabase (base de données)
- Projet de dev : `ybtnnogxukfldurozqwa`, le **seul** sur lequel Claude travaille ; la prod n'est **jamais** touchée par Claude (`db push`/`db reset` bloqués ailleurs par `.claude/hooks/agent-guard.mjs`).
- Une migration déjà appliquée sur un projet n'est **jamais réécrite** : on crée une nouvelle migration.
- Le MCP Supabase pointe sur le projet dev, en **lecture seule** ; les changements de schéma passent **uniquement** par `supabase/migrations/`.
- **Droits explicites** : « Automatically expose new tables » est désactivé (dev et prod), plus rien n'est accordé automatiquement à `anon`, `authenticated` ni `service_role`. Toute nouvelle table, vue, séquence ou fonction exposée porte ses `REVOKE ALL` puis `GRANT` explicites **dans sa migration**, au strict nécessaire (service role compris). Détails : skill `supabase-db`.
- **Fonctions de rôle dans `private`** (schéma non exposé par l'API) : dans toute policy, fonction ou migration, écrire `private.has_role(...)` et `private.is_admin_or_secretary()`, jamais `public.` ni sans schéma (à partir de la migration `securite-bdd` B).
- Mise en prod (historique de migrations de la prod, ordre des opérations HelloAsso) : [docs/mise-en-prod.md](docs/mise-en-prod.md).

### Déploiement
- `master` → **production** (Netlify, publication automatique). `dev` → serveur perso (test), via `.github/workflows/deploy.yml`. `sauvegarde-dev` → sauvegarde uniquement, aucun déploiement.
- **La mise en ligne réelle est la fusion de `dev` dans `master`**, dernière étape de la livraison groupée, après les migrations et les réglages manuels. Un push sur `dev` ne change pas le site public, mais le serveur perso doit être branché sur le Supabase de dev : à vérifier avant de pousser ([docs/mise-en-prod.md](docs/mise-en-prod.md) § 0).
- **Règles temporaires, jusqu'à la livraison groupée** : pas de « Trigger deploy » dans Netlify, pas de push sur `dev` ([docs/mise-en-prod.md](docs/mise-en-prod.md) § 0).

### Images Storyblok
- Composant unique : `<NuxtImg provider="storyblok" :src="blok.image.filename" />`
- Multi-asset / galerie : URL directe `${photo.filename}/m/800x0/filters:quality(75):format(webp)`

## Couleurs du projet
| Usage | Valeur | Token / classe |
|---|---|---|
| Bleu nuit (fond, textes) | `#0F1729` | `vp-dark` (`text-vp-dark`) |
| Vert (accent, icônes, CTA) | `#7FD857` | `vp-green` (`bg-vp-green`) |
| Vert survol (hover) | `#6bc546` | `vp-green-hover` (`hover:bg-vp-green-hover`) |
| Bleu nuit variante | `#1a2740` | `vp-dark-hover` (`bg-vp-dark-hover`) |
| Catégories de posts | `app/utils/categoryColors.ts` (une ligne par catégorie) | — |

## Docs détaillées — lire à la demande selon le contexte

| Fichier | Lire quand… |
|---|---|
| [docs/architecture.md](docs/architecture.md) | routing, middleware auth, composables, structure dossiers, API server, flux Storyblok |
| [docs/conventions.md](docs/conventions.md) | créer/modifier un composant, GSAP, images, composables disponibles, composants admin |
| [docs/storyblok.md](docs/storyblok.md) | ajouter/modifier un blok Storyblok, champs disponibles, technical names |
| [docs/database.md](docs/database.md) | schéma SQL Supabase, colonnes, contraintes, relations entre tables |
| [docs/test-plan.md](docs/test-plan.md) | tests, bugs connus (BUG #1 saveMember, BUG #2 toggleStatus), scénarios QA |

## Orchestration (sous-agents `.claude/agents/`)
La session principale **délègue, lit des comptes rendus (≤ 15 lignes) et décide** ; elle ne parcourt pas le code. Le relais se fait par fichiers dans `docs/features/<slug>/` (`spec` · `plan` · `status` · `review`, template `_TEMPLATE/`).

| Tâche | Agent (modèle) |
|---|---|
| Où est X / qui dépend de Y | `explorer` (haiku) |
| Écrire `plan.md` | `planner` (sonnet ; `model: "opus"` si feature transverse : flux auth, table, refonte) |
| Bloks Storyblok, pages `[...slug]` | `storyblok-dev` (sonnet) |
| Composants non Storyblok, NuxtUI, GSAP, admin, composables front | `ui-dev` (sonnet) |
| `server/api`, auth, Supabase | `api-dev` (sonnet) |
| Tests Vitest / `docs/test-plan.md` · parcours Playwright (`e2e/`) | `qa` (sonnet) · `e2e` (sonnet, seul autorisé à lancer Playwright) |
| Relecture du diff → `review.md` | `reviewer` (sonnet) |
| Mise à jour `docs/` + `graphify update .` | `doc-writer` (haiku) |

- **Ne pas déléguer** : moins de ~20 lignes dans un seul fichier → faire directement (`/quick`).
- **Cycle** : spec → `explorer` → `planner` → **validation de l'utilisateur** → [**tests d'abord** si spec « oui » (argent, auth, données adhérents) : `qa`/`e2e` écrivent des tests rouges que les devs ne modifient pas] → implémentation (∥ si fichiers disjoints) → `qa` → **porte de qualité** (`npm test` + `typecheck` + `e2e` si parcours ; 2 échecs de suite ⇒ demander) → `reviewer` → `doc-writer`.
- `graphify update .` **une seule fois par feature**, à la fin (doc-writer), jamais après chaque édition.
- Skills de flux : `/cadrage <idée>` (options + décision → `spec.md`, sans code ; opus seulement pour les options) · `/feature <desc|slug>` · `/resume <slug>` · `/asc-review [slug]` · `/quick <desc>` · `/blok <nom>`.
- Skills de référence (chargées à la demande) : `asc-rules` (+ `check.mjs`, aussi lancé par un hook après chaque édition `.vue`/`.ts`) · `gsap-patterns` · `storyblok-images` · `supabase-db` · `testing` (aucun appel réel à HelloAsso dans les tests : fixtures).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
