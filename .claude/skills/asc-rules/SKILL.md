---
name: asc-rules
description: Règles critiques ASC Escalade + vérificateur automatique. À utiliser dès qu'on écrit, modifie ou relit un composant .vue, un composant Storyblok (app/storyblok/**, app/plugins/storyblok.ts) ou une animation GSAP.
allowed-tools: Bash(node .claude/skills/asc-rules/scripts/check.mjs *)
---

# Règles critiques — vérification

Lancer depuis la racine du projet :
```
node .claude/skills/asc-rules/scripts/check.mjs [fichiers|dossiers…]   # sans argument : git diff HEAD + non suivis
```
Une ligne par problème `fichier:ligne [ERREUR|AVERT] règle : détail`. Rien si conforme. Exit 1 s'il y a au moins une erreur.
Un hook `PostToolUse` le lance aussi automatiquement après chaque Edit/Write d'un `.vue` ou d'un `.ts`.

| Règle | Niveau | Correctif |
|---|---|---|
| `v-editable-racine` | ERREUR | `v-editable="blok"` sur l'élément racine du template (bloks `app/storyblok/**`) |
| `defineProps-generique` | ERREUR | `defineProps({ blok: Object })`, jamais `defineProps<…>()` |
| `import-vue-explicite` | ERREUR | composants `app/storyblok/**` en `lang="ts"` : `import { ref, computed, onMounted, watch… } from 'vue'` |
| `gsap-from` | ERREUR | entrée animée en `gsap.from()`, pas `gsap.set()` puis `.to()` sur la même cible |
| `ref-sans-as` | ERREUR | `:ref="el => { if (el) refs[i] = el }"`, pas de `as HTMLElement` |
| `enregistrement-plugin` | ERREUR | `vueApp.component('nom', lazy(() => import(…)))` dans `app/plugins/storyblok.ts` (via la skill `blok`) |
| `nom-tirets` | ERREUR | technical name en minuscules et tirets (`tarifs-hero`, jamais `tarifs_hero`) |
| `couleur-hors-theme` | ERREUR | hex interdit dans `.vue`/`.ts`, sauf `app/utils/categoryColors.ts` et `server/utils/email-theme.ts` (`main.css` non scanné ; `tests/` et `e2e/` exclus ; `%23…` en data-URI détecté) : classe `bg-vp-*`/`text-vp-*`, palette Tailwind (`text-gray-500`), `var(--vp-…)` en `<style>`, catégories via `~/utils/categoryColors` |

Non couvert par le script, à vérifier à la main :
- **Images** : `<NuxtImg provider="storyblok" :src="blok.image.filename" />` pour un asset unique ; URL `${photo.filename}/m/800x0/filters:quality(75):format(webp)` pour une galerie ou un multi-asset. Voir la skill `storyblok-images`.
- **GSAP** : import dynamique dans `onMounted` et garde `prefers-reduced-motion`. Voir la skill `gsap-patterns`.
- **Secrets** : aucune clé Supabase service ni aucun secret côté client. Voir la skill `supabase-db`.

Conventions du script :
- Les fichiers `app/storyblok/**/_Nom.vue` sont des sous-composants internes, ni enregistrés ni soumis à `v-editable`.
- Un composant hors `app/storyblok/` est traité comme blok si son `defineProps` déclare `blok`.
