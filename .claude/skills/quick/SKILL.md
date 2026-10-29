---
name: quick
description: Petite modification faite directement par la session principale, sans sous-agents (moins d'environ 20 lignes, un seul fichier).
argument-hint: <description de la modification>
disable-model-invocation: true
---

Modification : $ARGUMENTS

1. Localise la cible avec `graphify query "…"`, puis un `Grep` ciblé. Lis seulement les lignes utiles (`offset`/`limit`).
2. Si la modification dépasse ~20 lignes ou touche plus d'un fichier, dis-le et propose `/feature` (ou `/blok`) au lieu de continuer.
3. Fais l'édition en respectant les règles critiques de `CLAUDE.md` : enregistrement dans le plugin Storyblok, `v-editable`, `defineProps({ blok: Object })`, imports `'vue'` explicites, `gsap.from()`, refs, images, couleurs `#0F1729` / `#7FD857`.
4. Le hook `PostToolUse` lance `check.mjs` sur le fichier édité : corrige toute `[ERREUR]` qu'il remonte. Lance `npm test` seulement si la zone est couverte par `tests/`. Pas de `graphify update` pour une modification isolée : il sera fait à la prochaine fin de feature.
5. Réponds en 3 lignes max : fichier:ligne modifié, ce qui change, éventuelle action Storyblok à faire à la main.
