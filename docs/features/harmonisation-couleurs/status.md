# Status — harmonisation-couleurs

> Phase : terminé

## Tâches
<!-- Une ligne de note max par tâche. ☐ à faire · ◐ en cours · ☑ fait · ⛔ bloqué -->
- ☑ T0 — Captures Playwright de référence avant, 1440/390 px (e2e) — 22 PNG dans captures/avant/, stables (rerun ≤ 14 px) ; /sorties capturée en brouillon (non publiée)
- ☑ T1 — Tokens main.css, categoryColors.ts, Tag.vue, color-map.md (ui-dev) — 26 valeurs hex ; color-map.md validée (A, C, D = défauts) ; theme.css illisible (permissions), palette recalculée
- ☑ T2 — Thème e-mails serveur (api-dev) · email-theme.ts créé (10 couleurs par rôle), HTML identique octet pour octet sur 5 cas (script jetable), typecheck 0 nouvelle erreur
- ☑ T3 — Consommateurs catégories Storyblok (storyblok-dev) · après T1 — 5 fichiers, tables locales supprimées ; ProchainsEvenements : UBadge (noms NuxtUI) → Tag + getCategoryColor ; Home/Actualites gagne 6 catégories
- ☑ T4 — posts/[slug], composables fond, layout, GroupsAccordion (ui-dev) · ∥ — 6 fichiers, ~71 remplacements, tables locales supprimées de [slug].vue, check.mjs vide
- ☑ T5 — Pages auth/profil/admin + composants auth/admin (ui-dev) · ∥ — 17 fichiers, 169 remplacements, text-vp-green-check, check.mjs vide
- ☑ T6 — Bloks inscriptions + ui (storyblok-dev) · ∥ — 19 fichiers, 103 remplacements de classes, 0 hex hors table, check.mjs vide
- ☑ T7 — Bloks blocs (storyblok-dev) · ∥ — 16 fichiers, 64 remplacements de classes, 0 hex hors table, check.mjs vide
- ☑ T8 — Bloks club, Home Hero/Cta, actualites/Header (storyblok-dev) · ∥ — 11 fichiers, ~100 remplacements, SVG en classes (dont summit2Ref, animé par GSAP : à vérifier), Timeline tokens, check.mjs vide
- ☑ T9 — Bloks tarifs, contact, sorties Concept/Header (storyblok-dev) · ∥ — 11 fichiers, 80 lignes, SVG en classes stroke-/fill-, check.mjs vide
- ☑ T10 — Captures après + comparaison (e2e) ∥ audit non-régression + test du module (qa) — e2e : 22/22 captures sous tolérance (ratio 0), CSS compilé complet ; qa : 32 tests verts, 193 couples conformes, 0 hex résiduel, GSAP non concerné. ProchainsEvenements non visible (aucun événement)
- ☑ T11 — check.mjs ERREUR + suppression colors.json (orchestrateur) — couleur-hors-theme en ERREUR (exclus : categoryColors.ts, email-theme.ts, tests/, e2e/) ; check.mjs app server tests e2e = vide ; hex injecté → ERREUR exit 1
- ☑ QA (qa) — fait en T10 (categoryColors.test.ts)
- ☑ Porte de qualité — npm test · typecheck · check.mjs — VERT : 716 tests, typecheck 186 (baseline 191, 0 nouvelle), check.mjs vide — échecs consécutifs : 0/2
- ☑ Revue (reviewer) — ⚠️ 0 bloquant, 3 importants (check.mjs faux négatifs `_#hex` et `solid = '#…'` ; seuil captures aveugle aux nuances proches ; ProchainsEvenements non vérifié visuellement), 9 mineurs : voir review.md · Suites (orchestrateur) : important n°1 corrigé dans check.mjs (`_#hex`, borne de mot sur href|to|id, %23hex en data-URI ; 4 cas KO détectés, 6 cas OK passent, projet vide) ; n°2 et n°3 remontés à l’utilisateur ; fichier vide `{}` à la racine supprimé ; normalizeKey : null/undefined/vide déjà gérés
- ☑ T12 — Doc + graphify update (doc-writer) — SKILL asc-rules, conventions, CLAUDE.md, architecture ; test-plan non touché (qa) ; graphify update ✅ ; captures : mention test à faire par qa · test-plan.md §12a (captures) ajouté par l’orchestrateur

## Blocages
- —
