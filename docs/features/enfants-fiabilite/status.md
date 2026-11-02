# Status — enfants-fiabilite

> Phase : terminé

## Tâches
<!-- Une ligne de note max par tâche. ☐ à faire · ◐ en cours · ☑ fait · ⛔ bloqué -->
- ☑ T0 — Tests d'abord (qa) — 24 rouges / 40 nouveaux tests (Q4 : tous les 403 de register.post, y compris e-mail différent et session incohérente, = message neutre ; ce dernier test est rouge après T1 ; Q18 : 400 « compte introuvable » = même message, test ajouté, rouge), suite existante intacte (740 verts), typecheck 186 = baseline. Fichiers : tests/server/api/complete-profile.reliability.test.ts · tests/server/api/register.unconfirmed.test.ts · tests/pages/register.error-message.test.ts · tests/components/admin/MemberModal.children.test.ts · tests/pages/profil.children.test.ts (montage de profil.vue praticable)
- ☑ T1 — Serveur : rôle après enfants, journal compensation, 23505 ⇒ 409, message 403 (api-dev) — tests/server : 379 verts ; les 3 403 + le 400 « introuvable » de register.post renvoient le message neutre
- ☑ T2 — Front : message 403 affiché tel quel, enfants selon liens (ui-dev, ∥ T1) — register.vue, profil.vue, MemberModal.vue. 3 fichiers de test T0 verts (15 fichiers pages+admin, 143 tests).
- ☑ T3 — Capture profil-390 vs profil-register-desktop/captures/apres (e2e) — build refait après Q19 ; 390x3626, 0 px / 0 % d'écart (profil-1440 aussi 0 %)
- ☑ QA (qa) — critères Q1-Q4, Q10 couverts par les tests T0, aucun ajout ; scénarios AP44-AP48 dans docs/test-plan.md §15f
- ☑ Porte de qualité — npm test 764/764 · typecheck 186 = baseline (0 nouvelle) · e2e profil-390 0 % (0 px, 390×3626) — échecs consécutifs : 0/2
- ☑ Revue (reviewer) — OK, 0 bloquant, 0 important, 4 mineurs (review.md)
- ☑ Doc + graphify update (doc-writer) — architecture.md (ligne /api/register : 403 neutre, rôle après enfants), backlog.md (Q1-Q4, Q10 retirés ; Q18-Q19 ajoutés) ; schéma inchangé ; graphify update ✅

## Blocages
- —
