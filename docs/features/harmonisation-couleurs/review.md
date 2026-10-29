# Revue — harmonisation-couleurs

> Diff relu : `git diff HEAD` + fichiers non suivis (hors PNG) · Date : 2026-10-29 · Verdict : ⚠️ corrections (aucun bloquant ; 3 points importants à traiter ou à accepter explicitement)

## Bloquant
- —

## Important
- `.claude/skills/asc-rules/scripts/check.mjs:131-134` — **faux négatifs de la règle `couleur-hors-theme`** (le garde-fou est le livrable durable de la feature). Vérifié par exécution de la regex :
  - `(?<![\w&#/\-])` contient `\w`, donc `_` : un hex précédé d'un underscore n'est **pas** vu (`shadow-[0_0_20px_#7FD857]`, `border-[1px_solid_#fff]`). Or color-map.md règle 1 prévoit précisément ces valeurs composées à underscores. Correction : remplacer `\w` par `[A-Za-z0-9]` dans le lookbehind.
  - L'exclusion `(href|to|id)\s*=` n'a pas de borne de mot : `const solid = '#FF0000'`, `grid = "#fff"`, `valid = '#abc'` (tout identifiant finissant par `id` ou `to`) sont **ignorés**. Correction : `(?<![\w-])(href|to|id)\s*=`.
  - `%23fff` (hex encodé dans un data-URI SVG) n'est pas détecté. À ajouter si on veut fermer la porte.
  - Aujourd'hui le dépôt est propre (grep indépendant : aucun hex hors `main.css`, `categoryColors.ts`, `email-theme.ts`), donc rien n'est cassé, mais la règle laissera passer ces formes demain.
- `docs/features/harmonisation-couleurs/captures/` (méthode de non-régression) — la comparaison `captures.spec.ts:156` (`maxDelta = 35215 * 0.1²` = 352, métrique YIQ de pixelmatch) **ne détecte pas** un glissement de teinte proche : `#7FD857` → `#6bc546` donne un delta d'environ 182, donc invisible. « 22/22 sous la tolérance, ratio 0 » prouve l'absence de changement de **mise en page** et de grosses erreurs de couleur, pas l'identité des nuances. Ce qui prouve les valeurs est l'audit qa (193 couples). Les états hover/focus/active, menus, modales, onglets admin et la section événements de l'accueil ne sont pas capturés. À consigner tel quel dans le compte rendu à l'utilisateur ; pas besoin de changer le spec pour valider la feature.
- `app/storyblok/Home/ProchainsEvenements.vue:44-51` — **changement non vérifié visuellement** (aucun événement en base). Relu au code : `Tag` importé explicitement (cohérent avec `Home/Actualites.vue`, `actualites/Page.vue`…), `variant="soft"` identique aux autres pages, `class="font-bold px-3 py-1"` bien pris par `Tag` (attrs fallthrough sur le `<span>` racine, `px-3` après `px-2` dans le CSS Tailwind). Deux écarts à connaître :
  - **Contraste** : `soft` = texte de la couleur de catégorie sur fond teinté à ~8 % (`${hex}15`). Vert `#7FD857` ≈ 1,8:1, ambre `#F59E0B` ≈ 2,1:1, turquoise `#4ECDC4` ≈ 1,9:1 : sous AA. Ce n'est pas une régression de nature (les `UBadge soft` `warning`/`primary` d'avant avaient un contraste du même ordre) et c'est le même rendu que `Home/Actualites.vue` (pastilles secondaires) et `actualites/Page.vue` ; mais c'est un défaut d'accessibilité de `Tag` désormais étendu à une page de plus. Hors périmètre ici ; à noter pour le futur cadrage du design.
  - **Défaut** : une catégorie inconnue ou vide passait en `neutral` (gris) avec `UBadge`, elle passe en vert `#7FD857` (défaut du module). Cohérent avec les autres pages et avec la décision n°1, mais c'est un deuxième changement visuel (en plus du passage aux hex) à mentionner.
  - Recommandation : vérifier une fois à l'œil avec un événement de test en dev (ou une capture ciblée) avant la mise en prod.

## Mineur
- `.claude/skills/asc-rules/scripts/check.mjs:129-135` — faux positifs en ERREUR (qui bloquent le hook post-édition) : `checkColors` scanne le source brut, commentaires compris. Un commentaire `// ancien #ff0000`, une référence `#123`/`#2025` dans un texte ou un commentaire, `querySelector('#add')`, un sélecteur CSS `#bad {}` ou `:to="'#cafe'"` (deux guillemets avant `#`) sont signalés. Contournement actuel : reformuler. Amélioration : passer le source dans `mask(src, false)` avant la recherche (les chaînes des classes restent visibles, les commentaires disparaissent).
- `.claude/skills/asc-rules/scripts/check.mjs` — la règle ne couvre que `.vue`/`.ts` ; les `.css` autres que `main.css`, `.js/.mjs`, `public/*.svg`, `nuxt.config`-like en `.mjs` ne sont pas vus. Vérification manuelle faite : aucun hex dans ces fichiers aujourd'hui. À documenter dans SKILL.md (T12).
- `app/utils/categoryColors.ts:42` — `normalizeKey` appelle `.normalize()` sur la valeur : une catégorie non-chaîne (objet/nombre venant d'un champ Storyblok mal typé) lèverait une exception en SSR là où l'ancien `colors[category]` renvoyait `undefined` sans erreur. Contourner avec `String(value)` ou un `typeof` dans `getCategoryColor`. La plage d'accents est écrite avec des caractères combinants littéraux dans la regex : `/[̀-ͯ]/g` serait plus lisible et robuste à un copier-coller.
- Aucune catégorie de la décision n°1 ne manque : les 13 noms sont dans `CATEGORY_COLORS` avec les bonnes valeurs, `Vie du club` = `Club`, défaut `#7FD857`, tests `tests/utils/categoryColors.test.ts` couvrent les 13, casse, accents, espaces, null/undefined. Les valeurs des anciennes tables locales (`[slug].vue` : défaut `#7FD857` catégorie, `#6B7280` difficulté) sont reprises à l'identique. La normalisation est un sur-ensemble de l'ancien accès exact : pas de régression.
- Duplication de valeurs entre les trois fichiers de thème (`#7FD857`, `#0F1729` dans `main.css`, `categoryColors.ts`, `email-theme.ts`) : rien ne vérifie qu'ils restent alignés. Un test Vitest comparant `DEFAULT_TAG_COLOR`/`EMAIL_COLORS.green` à `--vp-green` de `main.css` fermerait le point (optionnel).
- `app/assets/css/main.css:62-64` — `@source inline("bg-gray-200 text-gray-700")` sert uniquement à forcer l'émission de `--color-gray-200`/`--color-gray-700` lus dans `layout/Header.vue` et `posts/[slug].vue` ; il génère aussi deux utilitaires inutilisés et crée un couplage implicite (si le `<style>` change, la variable peut disparaître sans erreur). Acceptable et commenté ; une alternative serait des tokens `--vp-*` dédiés. Les alias `--color-vp-*` dans `@theme static`, le correctif `--vp-green-hover: #6bc546` et `--vp-green-check` sont cohérents avec le plan (CSS compilé contrôlé par l'e2e).
- Écarts de valeur acceptés par l'utilisateur et conformes à color-map.md, pour mémoire : `#F0FDF4` → `#EFFDF5` (Header.vue, item actif), `#374151` → `#364153` (`[slug].vue`, `.prose`), `#6B7280`/gray-500 laissé en hex pour `Tag`.
- `{}` à la racine du dépôt (fichier vide non suivi, créé le 2026-10-29 19:53) — artefact d'une commande shell, hors plan : à supprimer avant le commit.
- `docs/features/harmonisation-couleurs/captures/` pèse 36 Mo de PNG ; conservation voulue (ajustement n°4), mais à commiter en connaissance de cause (poids du dépôt).
- Références devenues fausses en attendant T12 : `.claude/skills/asc-rules/SKILL.md:25` (règle `couleur-hors-charte`, AVERT, `colors.json`) et `docs/conventions.md:146` (liste blanche `colors.json`). Prévu en T12.

## Vérifications
- ☑ `check.mjs` : 0 erreur, 0 avertissement sur `app server tests e2e` (relancé) ; `colors.json` supprimé, plus aucune lecture dans le script.
- ☑ Critères d'acceptation de la spec remplis (catégories en module unique, tokens `@theme`, hover corrigé, `#5ab43a` → `text-vp-green-check`, règle en ERREUR, tests/typecheck verts d'après la porte de qualité) ; fichiers touchés tous prévus au plan (91 fichiers + `categoryColors.ts`, `email-theme.ts`, `e2e/visual/captures.spec.ts`, `tests/utils/categoryColors.test.ts`).
- ☑ Logique / SSR / cas limites : pas d'accès `window`/`document` ajouté ; catégories vides/inconnues → défaut ; point mineur sur non-chaînes ci-dessus.
- ☑ SVG attributs → classes : aucune balise avec deux attributs `class` (balayage scripté de tous les `.vue`), aucun `currentColor` ni `fill`/`stroke` parent en conflit relevé, les `fill="none"`/`stroke-width`/`opacity` conservés, les seules règles globales `svg {}` des `<style scoped>` portent `will-change`/`color` ; GSAP n'anime que `strokeDashoffset`, `r`, `opacity` (pas de `fill`/`stroke`), y compris `summit2Ref`. Une classe utilitaire l'emporte de toute façon sur un attribut de présentation, ce qui est le sens voulu.
- ☑ E-mails (`server/utils/email-theme.ts`, `send-email.post.ts`, `contact.post.ts`) : substitution mécanique 1:1, import relatif explicite, HTML identique selon api-dev ; aucune nouvelle entrée utilisateur, échappements existants (`safeAdminNote`, `safeUserName`) intacts.
- ☑ Sécurité : aucun secret/service role ajouté côté client. `e2e/visual/captures.spec.ts` : lecture seule (aucun appel d'écriture Supabase), opt-in via `CAPTURES_OUT`, refuse d'écraser les captures « avant » sans `CAPTURES_OVERWRITE=1`, refuse même dossier source/cible ; les deux seules interactions avec Supabase DEV sont les connexions des comptes de test (`dev-db.ts` garde le ref DEV).
- ☑ Images : non concerné. GSAP : non concerné (aucune animation modifiée, seules les classes SVG changent). Migration BDD : aucune, conforme au plan.
- ☐ Tests d'abord : « non » dans la spec, sans objet. `Tag.test.ts` non modifié.

## Suites (décision utilisateur, 2026-10-29)
Traités avant le commit :
- Important n°1 (faux négatifs `couleur-hors-theme`) : corrigé dans `check.mjs` (`_#hex`, borne de mot sur `href|to|id`, `%23hex` en data-URI).
- Important n°3 : dans ProchainsEvenements, une catégorie inconnue ou vide s'affiche en gris neutre (`getCategoryColor(category, NEUTRAL_TAG_COLOR)`), test `tests/components/storyblok/ProchainsEvenements.test.ts` (rouge sans la correction). Contrôle visuel des badges à faire par l'utilisateur avec un événement de test en brouillon.
- Mineurs `{}` à la racine (supprimé), références `colors.json` dans SKILL.md et conventions.md (T12), captures de 36 Mo (non commitées : `.gitignore`, gardées en local).
- Référence du typecheck abaissée de 191 à 186.

Reportés (non traités dans cette feature) :
1. `check.mjs` : faux positifs en ERREUR sur les hex des commentaires, textes et sélecteurs (`// #ff0000`, `#2025`, `querySelector('#add')`, `:to="'#cafe'"`). **Devient prioritaire dès qu'il bloque une modification légitime** : correction prévue en passant le source dans `mask(src, false)` avant la recherche.
2. `check.mjs` ne couvre que `.vue`/`.ts` (pas les `.css` hors `main.css`, `.js/.mjs`, `public/*.svg`) ; aucun hex dans ces fichiers aujourd'hui.
3. `normalizeKey` lève une exception sur une catégorie non textuelle (null, undefined et vide sont gérés) ; regex des accents à écrire en `̀-ͯ`.
4. Aucun test ne vérifie l'alignement des valeurs dupliquées entre `main.css`, `categoryColors.ts` et `email-theme.ts`.
5. `@source inline("bg-gray-200 text-gray-700")` : couplage implicite avec les `<style>` de `layout/Header.vue` et `posts/[slug].vue`.
6. Pour mémoire, écarts de valeur acceptés : `#F0FDF4` → `#EFFDF5`, `#374151` → `#364153`, `#6B7280` laissé en hex pour `Tag`.
7. Comparaison de captures aveugle aux nuances proches ; états survol, focus, modales et onglets admin non capturés.
8. `app/composables/useEvents.ts` ignore le mode prévisualisation (`?_storyblok`), contrairement aux pages (`[...slug].vue`) et aux posts (`posts/[slug].vue`) : il ne lit que `STORYBLOK_VERSION`. Le bureau ne peut donc pas prévisualiser un événement dans l'éditeur visuel de Storyblok avant de le publier.
