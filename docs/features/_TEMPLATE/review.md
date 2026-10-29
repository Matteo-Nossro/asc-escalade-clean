# Revue — <slug>

> Diff relu : `git diff <base>...` · Date : AAAA-MM-JJ · Verdict : ✅ OK | ⚠️ corrections | ⛔ bloqué

## Bloquant
<!-- Règle critique violée, bug, faille de sécurité, critère d'acceptation non rempli. Format : `fichier:ligne` — problème — correction attendue. -->
- —

## Important
- —

## Mineur
- —

## Vérifications
- ☐ `check.mjs` : 0 erreur (v-editable, defineProps, imports `'vue'`, gsap.from, refs, plugin, tirets) — avertissements couleur : N
- ☐ Critères d'acceptation de la spec remplis, rien hors plan
- ☐ Logique / SSR / cas limites
- ☐ Sécurité : aucun secret ni service role côté client, `requireAdmin` sur les routes admin
- ☐ Images : `NuxtImg provider="storyblok"` ou URL de transformation (galeries)
- ☐ GSAP : import dynamique + `prefers-reduced-motion`
- ☐ Migration BDD seulement si prévue au plan
