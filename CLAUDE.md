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

### Images Storyblok
- Composant unique : `<NuxtImg provider="storyblok" :src="blok.image.filename" />`
- Multi-asset / galerie : URL directe `${photo.filename}/m/800x0/filters:quality(75):format(webp)`

## Couleurs du projet
| Usage | Valeur |
|---|---|
| Bleu nuit (fond, textes) | `#0F1729` |
| Vert (accent, icônes, CTA) | `#7FD857` |

## Docs détaillées — lire à la demande selon le contexte

| Fichier | Lire quand… |
|---|---|
| [docs/architecture.md](docs/architecture.md) | routing, middleware auth, composables, structure dossiers, API server, flux Storyblok |
| [docs/conventions.md](docs/conventions.md) | créer/modifier un composant, GSAP, images, composables disponibles, composants admin |
| [docs/storyblok.md](docs/storyblok.md) | ajouter/modifier un blok Storyblok, champs disponibles, technical names |
| [docs/database.md](docs/database.md) | schéma SQL Supabase, colonnes, contraintes, relations entre tables |
| [docs/test-plan.md](docs/test-plan.md) | tests, bugs connus (BUG #1 saveMember, BUG #2 toggleStatus), scénarios QA |
