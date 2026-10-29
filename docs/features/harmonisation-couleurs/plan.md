# Plan — harmonisation-couleurs

> Rédigé par : planner (sonnet / opus) · Validé par l'utilisateur : ☑ (2026-10-29, avec ajustements ci-dessous)

## Résumé de l'approche
Trois sources uniques : (1) `@theme static` de `main.css` pour la charte et les couleurs « de composant » (tokens `--color-vp-*` exposés en classes `bg-vp-green`, `text-vp-dark`…, alimentés par les `--vp-*` existants qui restent valides) ; (2) `app/utils/categoryColors.ts` pour les catégories de posts, les difficultés et les constantes de `Tag.vue` ; (3) `server/utils/email-theme.ts` pour les e-mails HTML. Remplacement mécanique hex → classe/token piloté par une table `color-map.md` produite en T1, par lots de fichiers disjoints exécutés en parallèle. `check.mjs` passe en ERREUR en dernier, quand le projet est à zéro avertissement.

## Ajustements de l'utilisateur à la validation (2026-10-29) — prévalent sur le reste du plan
1. Module catégories en hex : validé.
2. **Gris / couleurs de la palette Tailwind** : PAS de token à valeur exacte. Tout hex qui correspond à une couleur de la palette Tailwind (au plus proche, malgré l'écart oklch) passe à la classe ou variable Tailwind (`text-gray-500`, `var(--color-gray-500)`…). Seules les couleurs **absentes** de la palette Tailwind deviennent des tokens `--color-vp-*`. T1 établit `color-map.md`, et **l'orchestrateur la montre à l'utilisateur avant de lancer T3-T9**.
3. **T0 ajoutée** : captures Playwright de référence avant toute modification ; T10 refait les mêmes captures et compare automatiquement (tolérance faible). Chaque page au-dessus de la tolérance est montrée à l'utilisateur (attendu : seulement les blocs de catégories, ProchainsEvenements compris).
4. Les captures de T0 sont **conservées** : point de départ du futur cadrage du design ordinateur.

## Décisions de conception (justifiées)
- **Module catégories en HEX, pas en `var(--color-cat-*)`** : `Tag.vue` calcule à partir de la valeur hex (`getContrastColor` parse `#RRGGBB` ; variantes `soft`/`subtle`/`outline` font `${bg}15` et `${bg}40` = suffixe alpha hex), et `Tag.test.ts` fige `background-color: #7FD857`, `color: #000000`, `color: #FFFFFF`. Une valeur `var()` casserait contraste, transparences et tests. Réécrire `Tag.vue` avec `color-mix` + tokens de contraste = changement de rendu et de tests, hors périmètre. Donc `app/utils/categoryColors.ts` est un **second fichier de thème** déclaré dans `check.mjs` (comme `email-theme.ts`). `Tag.vue` ne contient plus de hex : il importe `DEFAULT_TAG_COLOR`, `TAG_TEXT_DARK` (`#000000`), `TAG_TEXT_LIGHT` (`#FFFFFF`) du module. Valeurs inchangées, `Tag.test.ts` non modifié.
- **Contenu du module** : table des catégories (décision utilisateur n°1), `getCategoryColor(category)`, `getDifficultyColor(difficulty)` (tables de `[slug].vue` L401-411, valeurs inchangées), constantes de `Tag`. Normalisation de la clé : `trim` + minuscules + suppression des accents (NFD) ; un nom inconnu retombe sur `DEFAULT_TAG_COLOR` (`#7FD857`). Les noms de catégories venant d'options Storyblok à libellé exact, la normalisation ne change aucun rendu actuel. Import explicite `~/utils/categoryColors` (pas d'auto-import dans les bloks `lang="ts"`).
- **Tokens de charte** : on garde `--vp-*` comme source des valeurs (les ~29 `var(--vp-…)` existants restent intacts) et on ajoute dans le même `@theme static` des alias `--color-vp-green: var(--vp-green)` etc., ce qui génère `bg-vp-green`, `text-vp-dark`, `border-vp-green/50`, `from-vp-dark`… (le modificateur d'opacité `/80` fonctionne avec `var()` dans Tailwind 4). `--vp-green-hover` corrigé en `#6bc546`. Ajout de `--vp-green-check: #5ab43a` (+ alias `--color-vp-green-check`). `.prose` et le bloc `--color-green-*` restent dans `main.css` tels quels.
- **Gris et neutres (décision n°4, ajustée)** : les hex/`[#…]` qui correspondent à une couleur de la palette Tailwind (vérifiée contre `node_modules/tailwindcss/theme.css`, conversion oklch → sRGB, écart toléré) sont remplacés par la classe ou la variable de palette (`text-gray-500`, `var(--color-gray-500)`). Seuls les hex absents de la palette deviennent des tokens `--color-vp-<rôle>`. `color-map.md` indique pour chaque hex l'écart sRGB max avec la couleur de palette retenue.
- **Exclusions de la règle ERREUR (check.mjs)** : fichiers de thème `app/assets/css/main.css` (de toute façon non scanné), `app/utils/categoryColors.ts`, `server/utils/email-theme.ts` ; dossiers `tests/` et `e2e/` (fixtures et assertions de valeurs). Aucun hex dans `nuxt.config.ts`, `app.config.ts`, `app.vue` (vérifié). `rgba(…)` n'est pas du hex et n'est pas concerné par la règle.

## Tâches
<!-- Tests d'abord : non. Pas d'e2e. Pas de migration. -->

### T0 — Captures de référence (avant)
- **Agent** : e2e
- **Fichiers** : `e2e/visual/captures.spec.ts` (nouveau, réutilisé en T10), captures dans `docs/features/harmonisation-couleurs/captures/avant/` (conservées et commitées), helper de comparaison
- **Dépend de** : — (avant toute modification de code)
- **Détail** : pages : accueil, actualités, un post, club, tarifs, sorties, contact, inscription (register), login, profil adhérent (connecté, compte de test adhérent), dashboard admin (connecté, compte de test admin). Deux largeurs : 1440 px et 390 px, page entière. Stabiliser le rendu : animations GSAP/CSS neutralisées (`reducedMotion: 'reduce'` + désactivation des transitions), attente du chargement des images et polices, masquage des zones dynamiques non liées aux couleurs (dates relatives, carrousels automatiques) si nécessaire, même post Storyblok figé par slug. Aucune écriture en base. Fichiers nommés `<page>-<largeur>.png`. Le spec doit pouvoir être relancé en T10 vers `captures/apres/` et comparer avec une tolérance faible (ex. pixelmatch threshold 0.1, ratio de pixels différents ≤ 0,1 %), en produisant une image de diff par page en écart.

### T1 — Tokens de charte, module catégories, Tag.vue, table de correspondance
- **Agent** : ui-dev
- **Fichiers** : `app/assets/css/main.css`, `app/utils/categoryColors.ts` (nouveau), `app/components/ui/Tag.vue`, `docs/features/harmonisation-couleurs/color-map.md` (nouveau)
- **Dépend de** : —
- **Détail** : (a) `main.css` : corriger `--vp-green-hover`, ajouter `--vp-green-check`, ajouter les alias `--color-vp-*` pour tous les `--vp-*`, plus les tokens des couleurs restantes (voir inventaire ci-dessous). (b) Créer le module (contenu ci-dessus). (c) `Tag.vue` : remplacer ses 3 hex par les constantes du module, sans autre changement. (d) **Recompter** avec `Grep` tous les hex de `app/` (classes `[#…]`, `<style>`, `style=""`, JS/TS, insensible à la casse) et écrire `color-map.md` : une ligne par hex distinct (casse normalisée) → remplacement (classe ou `var()`), nombre d'usages, preuve d'identité de valeur (palette exacte ou token), et les règles de réécriture par contexte : `PREFIXE-[#hex]` → `PREFIXE-vp-xxx` (y compris `/NN`, `hover:`, `from-/via-/to-`, `border-`, `ring-`, `fill-`, `stroke-`) ; `<style>` et `style=""` → `var(--vp-…)` ; `shadow-[…#hex…]` ou valeurs composées → `var(--vp-…)` dans la valeur arbitraire (underscores conservés) ; hex dans une table JS de classes (`useSectionFond.ts`) → mêmes classes. Tout hex sans équivalent exact devient un token `--color-vp-<rôle>` (jamais d'arrondi vers la palette). Si plus de ~10 hex « longue traîne » apparaissent, le signaler dans `status.md` Blocages.
- **Note** : T1 est le goulot ; les lots T3 à T9 ne démarrent qu'une fois `color-map.md` et `main.css` livrés **et `color-map.md` montrée à l'utilisateur**.

### T2 — Thème des e-mails serveur
- **Agent** : api-dev
- **Fichiers** : `server/utils/email-theme.ts` (nouveau), `server/api/admin/send-email.post.ts`, `server/api/contact.post.ts`
- **Dépend de** : — (∥ T1)
- **Détail** : regrouper les ~21 hex des gabarits HTML dans un objet exporté (noms par rôle : fond, texte, accent approbation/refus, bordure…) et interpoler `${EMAIL_COLORS.x}` dans les gabarits. Le HTML produit doit rester **octet pour octet identique** (mêmes valeurs, même casse) : api-dev le vérifie en comparant la sortie avant/après sur un cas d'approbation, un de refus et un message contact (script jetable hors dépôt, aucun envoi réel). Import relatif explicite.

### T3 — Consommateurs des catégories (Storyblok)
- **Agent** : storyblok-dev
- **Fichiers** : `app/storyblok/actualites/Page.vue`, `app/storyblok/Home/Actualites.vue`, `app/storyblok/Home/ProchainsEvenements.vue`, `app/storyblok/sorties/ListeSorties.vue`, `app/storyblok/sorties/Page.vue`
- **Dépend de** : T1
- **Détail** : supprimer chaque table locale `getCategoryColor` et importer celle du module ; remplacer les autres hex de ces fichiers selon `color-map.md`. `ProchainsEvenements.vue` bascule des noms NuxtUI vers les hex du module (seul changement visuel accepté). Conserver `v-editable` et les imports Vue explicites.

### T4 — Page article, composables de fond, layout
- **Agent** : ui-dev
- **Fichiers** : `app/pages/posts/[slug].vue`, `app/composables/useSectionFond.ts`, `app/composables/useInscriptionsFond.ts`, `app/components/layout/Header.vue`, `app/components/layout/Footer.vue`, `app/components/GroupsAccordion.vue`
- **Dépend de** : T1 (∥ T3, T5 à T9)
- **Détail** : `[slug].vue` importe `getCategoryColor` et `getDifficultyColor` du module (suppression des deux tables locales, fallback gris `#6B7280` inclus dans le module). Composables : `text-[#0F1729]` → `text-vp-dark`, `bg-[#7FD857]/10` → `bg-vp-green/10`, etc. Reste : table de correspondance.

### T5 — Pages auth/profil/admin et composants auth/admin
- **Agent** : ui-dev
- **Fichiers** : `app/pages/register.vue`, `app/pages/profil.vue`, `app/pages/login.vue`, `app/pages/completer-profil.vue`, `app/pages/callback.vue`, `app/pages/mes-inscriptions.vue`, `app/pages/admin/dashboard.vue`, `app/pages/admin/blocs.vue`, `app/components/auth/ProfileFieldsForm.vue`, `app/components/auth/ChildrenForm.vue`, `app/components/admin/PendingRequests.vue`, `app/components/admin/HelloAssoConfig.vue`, `app/components/admin/GroupsList.vue`, `app/components/admin/MembersTable.vue`, `app/components/admin/modals/MemberModal.vue`, `app/components/admin/modals/GroupModal.vue`, `app/components/admin/modals/GroupMembersModal.vue`
- **Dépend de** : T1 (∥)
- **Détail** : `text-[#5ab43a]` (`register.vue` L163, `profil.vue` L80) → `text-vp-green-check`. Le reste selon la table.

### T6 — Bloks inscriptions et ui
- **Agent** : storyblok-dev
- **Fichiers** : `app/storyblok/inscriptions/*.vue` (Hero, CartesInfo, Sante, Niveaux, Permanences, Documents, Aides, Cta, Cotisations, Parcours), `app/storyblok/ui/*.vue` (TextWithTitle, TextWithImage, TabsSection, BeforeAfter, Galerie, Accordions, ActionBouton, Bouton, Carrousel)
- **Dépend de** : T1 (∥)
- **Détail** : remplacement mécanique selon `color-map.md`. Ne toucher à rien d'autre (pas de refonte, pas de gsap).

### T7 — Bloks `blocs/`
- **Agent** : storyblok-dev
- **Fichiers** : `app/storyblok/blocs/*.vue` (BlocDocuments, BlocCarteAcces, BlocAlerte, BlocCta, BlocEncadre, BlocFaq, BlocGrilleCartes, BlocHero, BlocPopup, BlocInfosCles, BlocProgramme, BlocTableau, `_AgendaLigne`, `_BlocBouton`, `_Carte`, `_DocLien`)
- **Dépend de** : T1 (∥)
- **Détail** : idem T6.

### T8 — Bloks club, Home (hero/CTA) et actualites/Header
- **Agent** : storyblok-dev
- **Fichiers** : `app/storyblok/club/*.vue` (Equipe, HeroClub, Initiateurs, Galerie, Timeline, Histoire, Partenaires, Statistiques), `app/storyblok/Home/Hero.vue`, `app/storyblok/Home/CtaRejoindre.vue`, `app/storyblok/actualites/Header.vue`
- **Dépend de** : T1 (∥)
- **Détail** : idem T6. `Timeline.vue` : `style="background: #FAFAF9"`, `#F0F0EE`, `color: #ccc` → `var(--…)` via tokens de la table ; les `rgba(127,216,87,0.2)` ne sont pas du hex, ne pas les toucher.

### T9 — Bloks tarifs, contact, sorties (hors consommateurs catégories)
- **Agent** : storyblok-dev
- **Fichiers** : `app/storyblok/tarifs/*.vue` (BonASavoir, TarifsPage, Planning, Header, GrilleTarifs), `app/storyblok/contact/*.vue` (ContactPage, Infos, Form, Header), `app/storyblok/sorties/Concept.vue`, `app/storyblok/sorties/Header.vue`
- **Dépend de** : T1 (∥)
- **Détail** : idem T6. `Planning.vue` : ne pas altérer la règle d'âge par saison, seulement les couleurs.

### T10 — Audit de non-régression et tests du module
- **Agent** : qa
- **Fichiers** : `tests/utils/categoryColors.test.ts` (nouveau), `docs/features/harmonisation-couleurs/captures/apres/` + diffs (e2e) ; script jetable d'audit dans le dossier scratchpad (non commité)
- **Dépend de** : T2 à T9
- **Détail** : (0) **e2e** (en parallèle de qa) : relancer `e2e/visual/captures.spec.ts` vers `captures/apres/`, comparer avec `captures/avant/`, lister chaque page × largeur au-dessus de la tolérance avec son image de diff ; l'orchestrateur les montre à l'utilisateur. (a) test Vitest du module : chaque catégorie de la décision n°1, normalisation accents/casse, défaut, difficultés. (b) Audit mécanique : pour chaque ligne de `git diff app/`, vérifier que chaque couple (ancien hex → nouvelle classe/var) figure dans `color-map.md` et que la valeur résolue est identique ; `Grep` insensible à la casse de tout hex résiduel dans `app/` et `server/` hors fichiers de thème et `tests/` : doit être vide ; `node .claude/skills/asc-rules/scripts/check.mjs app server` : 0 AVERT couleur. (c) `npm run build` une fois, puis vérifier que les classes générées (`.bg-vp-green`, `.text-vp-dark`, `.text-vp-green-check`, `.hover\:bg-vp-green-hover`…) existent dans le CSS compilé. Rapport ≤ 15 lignes.

### T11 — check.mjs : hex hors thème en ERREUR, sort de colors.json
- **Agent** : orchestrateur (une fonction, ~15 lignes ; + suppression d'un fichier)
- **Fichiers** : `.claude/skills/asc-rules/scripts/check.mjs`, `.claude/skills/asc-rules/colors.json` (supprimé)
- **Dépend de** : T10 (zéro avertissement couleur sur tout le projet)
- **Détail** : supprimer le chargement de `colors.json` et `ALLOWED` ; `checkColors` : ignorer les fichiers `app/utils/categoryColors.ts`, `server/utils/email-theme.ts` et tout chemin sous `tests/` ou `e2e/` ; sinon tout hex (hors exceptions `href|to|id`) → `ERREUR` règle `couleur-hors-theme`, message pointant `app/assets/css/main.css`. Vérifier `node .claude/skills/asc-rules/scripts/check.mjs app server tests` = rien, et qu'un hex ajouté à la main dans un `.vue` donne bien une ERREUR (puis le retirer).

### T12 — Documentation
- **Agent** : doc-writer
- **Fichiers** : `.claude/skills/asc-rules/SKILL.md` (L25), `docs/conventions.md` (L136-146 et suivants : classes `text-vp-dark`…, module catégories, tokens), `CLAUDE.md` (tableau « Couleurs du projet » L35-41 : ajouter les classes/tokens, hover `#6bc546`), `docs/architecture.md` ou `docs/conventions.md` (mention de `server/utils/email-theme.ts`)
- **Dépend de** : T11
- **Détail** : remplacer toute référence à `colors.json` par « fichiers de thème : `main.css`, `categoryColors.ts`, `email-theme.ts` » ; règle renommée en ERREUR ; documenter comment ajouter une catégorie (une ligne dans le module). Puis `graphify update .` (une seule fois).

## Ordre d'exécution
T0 → T1 ∥ T2 → validation de `color-map.md` par l'utilisateur → (T3 ∥ T4 ∥ T5 ∥ T6 ∥ T7 ∥ T8 ∥ T9 : fichiers disjoints) → T10 → T11 → porte de qualité (`npm test`, `npm run typecheck`, `check.mjs`) → revue (reviewer) → T12.
Vérification visuelle : captures Playwright avant (T0) / après (T10) comparées automatiquement ; l'audit T10 prouve en plus la correspondance des valeurs.

## Migration / schéma BDD
Aucune.

## Risques / questions ouvertes
- **Palette Tailwind 4 = oklch** : tranché par l'utilisateur, classe de palette retenue malgré l'écart (1-2 unités sRGB) ; la tolérance de comparaison des captures doit l'absorber.
- **Captures** : le contenu Storyblok peut changer entre T0 et T10 (publication) → enchaîner rapidement ; un écart de contenu ne doit pas être confondu avec un écart de couleur.
- **Module catégories en hex et non en tokens** (cf. décision de conception) : `categoryColors.ts` devient un second fichier de thème. À valider ; l'alternative (tokens `--color-cat-*` + réécriture de `Tag.vue` avec `color-mix` et tokens de contraste) change le rendu des variantes `soft`/`subtle` et oblige à modifier `Tag.test.ts`.
- **Longue traîne de hex** (ex. `#FAFAF9`, `#F0F0EE`, `#ccc`, rouges/verts d'alerte) : chacun devient un token `--color-vp-*` ; le nombre exact sort de T1 (recomptage). Cela alourdit `main.css` mais garantit l'identité.
- **Normalisation des noms de catégories** (casse/accents) : légère tolérance nouvelle ; aucun effet sur les libellés Storyblok actuels.
- **`rgba(127,216,87,…)` et couleurs hors hex** (ex. `outline` de `Timeline.vue`) : hors règle check.mjs, laissées telles quelles.
- **Hook `post-edit-check`** : pendant T3-T9 les avertissements couleur continuent d'apparaître sur les fichiers non encore traités ; normal.
