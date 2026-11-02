# Status — profil-register-desktop

> Phase : terminé (lot 2 clos)

## Lot 1 — /profil seul (terminé, validé utilisateur le 2026-11-02)
- ☑ T1 — 2 colonnes indépendantes (cartes 1-4 / 5-7, pas de grille alignée) + barre collante sticky lg uniquement sur /profil (ui-dev) — `app/pages/profil.vue`
- ☑ T2 — Captures 1440/1024 OK (validation manuelle) ; 390 passe la comparaison (ratio 0 %, 0 px de diff, 390×3626 = réf.) après correctifs `space-y-6 lg:space-y-4` + restauration `block`/`lg:w-auto` sur le bouton (ui-dev) — `docs/features/profil-register-desktop/captures/apres/`
- ☑ QA (qa) — aucun test Vitest dédié à `app/pages/profil.vue` dans la suite (confirmé) ; suite complète passe sans régression
- ☑ Porte de qualité — npm test : 719/719 passés (50 fichiers) · typecheck : 186 erreurs = baseline, 0 nouvelle — manuel RS02 (`/profil` 375px) couvert par la capture 390 de T2 (0% d'écart)
- ☑ Revue (reviewer) — ✅ OK, aucun bloquant ; 1 mineur (fond plat `lg:bg-gray-100` de la barre collante vs dégradé de page) — voir `review.md`
- ☑ Doc + graphify update (doc-writer) — `docs/conventions.md` (§ Mise en page desktop), `docs/features.md` (§ Profil)
- Commit : `723c118`

## Lot 2 — /register et /completer-profil (plan rédigé, en attente de validation)
<!-- Une ligne de note max par tâche. ☐ à faire · ◐ en cours · ☑ fait · ⛔ bloqué -->
- ☑ Spec — `spec.md` mis à jour (lot 2 ajouté, pas de nouveau cadrage, décision déjà actée dans `options.md`)
- ☑ Exploration (explorer) — compte rendu intégré au `plan.md`
- ☑ Plan — `plan.md` rédigé (3 tâches : T1 composants partagés, T2 pages, T3 captures/comparaison)
- ☐ T0 — Tests d'abord — non applicable (« Tests d'abord : non »)
- ☑ T1 — Grilles desktop des composants partagés `ProfileFieldsForm.vue`/`ChildrenForm.vue` (ui-dev) — split interne 2 colonnes (Identité+slot / Adresse ; liste enfants / formulaire ajout), grilles 2 champs inchangées (pas de 3e colonne pertinente)
- ☑ T2 — Mise en page desktop `register.vue`/`completer-profil.vue` (ui-dev, dépend de T1) — étape 1 : cartes adulte/mineur côte à côte `lg:flex lg:gap-6`; conteneurs `lg:max-w-5xl` (split interne via T1) ; boutons Retour/Submit `lg:justify-end` + `lg:w-auto` (block conservé) ; completer-profil : barre submit `lg:sticky lg:bottom-0` comme /profil
- ☑ T3 — Captures et comparaison register/completer-profil (e2e) — register-390 vs référence `harmonisation-couleurs` : 0 % (0 px, 390×2038) ; completer-profil-390 avant/après : 0 % (0 px, 390×3760) ; captures 1440/1024 des deux pages fournies pour validation manuelle ; script temporaire supprimé
- ☑ QA (qa) — suite complète : aucun test Vitest dédié à `register.vue`/`completer-profil.vue`/`ProfileFieldsForm.vue`/`ChildrenForm.vue` (confirmé, affichage pur) ; `git diff` des 4 fichiers vérifié : uniquement des classes Tailwind préfixées `lg:` (aucune fuite mobile), aucun prop NuxtUI retiré, `data-testid`/placeholders/`getByRole` utilisés par `e2e/auth-profils.spec.ts` inchangés
- ☑ Porte de qualité — npm test : 719/719 passés (50 fichiers) · typecheck : 186 erreurs = baseline, 0 nouvelle · e2e (captures/comparaison 0 %) déjà fait en T3
- ☑ Revue (reviewer) — ✅ OK, aucun bloquant, aucun important ; 1 mineur (indentation non réalignée dans `ProfileFieldsForm.vue` l. 5-58, cosmétique) — voir `review.md`
- ☑ Doc + graphify update (doc-writer) — `docs/conventions.md` (§ Mise en page desktop : split interne aux composants partagés), `docs/features.md` (§ 2 Authentification, flux d'inscription) ; graphify update ✅

## Blocages
- —

## Notes
- (e2e) Capture de référence « avant » `completer-profil-390.png` obtenue après recréation du compte `TEST_USERS_EMAIL+incomplete` (`scripts/seed-test-users.mjs`) : `/completer-profil` affiche le vrai formulaire (pas de redirection vers `/profil`). Fichier dans `docs/features/profil-register-desktop/captures/avant/` (gitignored, comme le reste de `captures/`).
