# Spec — Résorber la dette de typecheck

> Slug : `dette-typecheck` · Créée le : 2026-10-22 · Transverse : non (corrections de types, sans changement de comportement)
> **Tests d'abord : non** (aucun changement de comportement)
> Origine : feature `outillage-tests`, tâche T1 (mesure) et T2-B (baseline) — voir [status](../outillage-tests/status.md)

## Objectif
Ramener à zéro les 192 erreurs de `nuxi typecheck` mesurées le 2026-10-22, puis supprimer la baseline : `npm run typecheck` redevient un typecheck strict.

## Critères d'acceptation
- [ ] **Lot 1, bloks** (~41 erreurs « `blok` possiblement undefined ») : `defineProps({ blok: { type: Object, required: true } })` dans les composants Storyblok concernés. Jamais de générique TypeScript (règle asc-rules). `check.mjs` reste à zéro erreur.
- [ ] **Lot 2, types Supabase** (~54 erreurs `Database = unknown`) : `app/types/database.types.ts` est généré (`supabase gen types`, commande lancée par l'utilisateur, qui a accès à la base) et branché dans `@nuxtjs/supabase`. La procédure de régénération est documentée.
- [ ] **Lot 3, le reste** (~97 erreurs ponctuelles : props NuxtUI invalides, `NavigateToOptions`, etc.) : corrections minimales, sans changement de comportement.
- [ ] La baseline est régénérée après chaque lot (`npm run typecheck:baseline`) et le nombre d'erreurs baisse.
- [ ] **Lot 4, fichiers de `tests/`** (rattaché depuis le backlog, ex-D15) : `tests/**` (dont `tests/utils/supabase-mock.ts`, `tests/utils/nitro.ts`) est hors du tsconfig Nuxt et n'est donc pas vérifié par `npm run typecheck`. L'inclure (tsconfig dédié ou `include` étendu), mesurer les erreurs qui apparaissent et les corriger dans ce lot.
- [ ] Une fois à zéro : la baseline est supprimée, et `typecheck` redevient `nuxi typecheck`.
- [ ] `npm test` et `npm run test:e2e` restent verts.

## Parcours utilisateur (e2e)
- Aucun (le smoke existant suffit : il doit rester vert)

## Hors périmètre
- Refactoring, ou passage à `defineProps` générique.
- Nouveaux tests.

## Contraintes / contexte
- TypeScript est épinglé en `^5.9.3` : TypeScript 7 est incompatible avec `vue-tsc` 3.3 (constaté en T1).
- Les fichiers HelloAsso non commités (`server/api/webhooks/helloasso.post.ts`…) seront réécrits par les lots `helloasso-*` : ne pas les corriger ici.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun |
