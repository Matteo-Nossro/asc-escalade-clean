# Status — profil-register-desktop (lot 1 : /profil seul)

> Phase : terminé

## Tâches
<!-- Une ligne de note max par tâche. ☐ à faire · ◐ en cours · ☑ fait · ⛔ bloqué -->
- ☑ T1 — 2 colonnes indépendantes (cartes 1-4 / 5-7, pas de grille alignée) + barre collante sticky lg uniquement sur /profil (ui-dev) — `app/pages/profil.vue`
- ☑ T2 — Captures 1440/1024 OK (validation manuelle) ; 390 passe la comparaison (ratio 0 %, 0 px de diff, 390×3626 = réf.) après correctifs `space-y-6 lg:space-y-4` + restauration `block`/`lg:w-auto` sur le bouton (ui-dev) — `docs/features/profil-register-desktop/captures/apres/`
- ☑ QA (qa) — aucun test Vitest dédié à `app/pages/profil.vue` dans la suite (confirmé) ; suite complète passe sans régression
- ☑ Porte de qualité — npm test : 719/719 passés (50 fichiers) · typecheck : 186 erreurs = baseline, 0 nouvelle · échecs consécutifs : 0/2 — manuel RS02 (`/profil` 375px) couvert par la capture 390 de T2 (0% d'écart), aucun autre scénario de `docs/test-plan.md` concerné (BUG #1/#2 hors périmètre de ce lot)
- ☑ Revue (reviewer) — ✅ OK, aucun bloquant ; 1 mineur (fond plat `lg:bg-gray-100` de la barre collante vs dégradé de page, non bloquant) — voir `review.md`
- ☑ Doc + graphify update (doc-writer) — `docs/conventions.md` (§ Mise en page desktop), `docs/features.md` (§ Profil) ; schéma BDD inchangé

## Blocages
- —
