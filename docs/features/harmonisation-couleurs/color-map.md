# color-map — harmonisation-couleurs

> Produit par T1 (ui-dev). **Validée par l'utilisateur le 2026-10-29** : cas A → tokens `vp` conservés ; cas C → tokens `vp-placeholder` / `vp-quote-mark` ; cas D → `green-50` accepté. Règle 5 (SVG) modifiée par l'orchestrateur : classes `fill-`/`stroke-` plutôt que `var()` en attribut.
> Inventaire fait sur `app/` : **711 occurrences hors `main.css`**, **27 hex littéraux = 26 valeurs distinctes** (`#000` et `#000000` sont la même valeur ; casse normalisée). `main.css` (fichier de thème, 36 occurrences de définitions) n'est pas compté.

## 1. Comment lire cette table

- **Seuil « correspond à la palette Tailwind »** : écart sRGB maximal **≤ 3 unités par canal** (R, G, B sur 0-255) entre le hex du code et la couleur de palette convertie de oklch en sRGB (arrondie). L'écart indiqué est ce maximum.
- **Palette** = couleurs de Tailwind 4.1 (`gray`, `slate`, `zinc`, `neutral`, `stone`, `white`, `black`) + la surcharge `--color-green-*` du projet (`main.css`).
- **Réserve de méthode** : `node_modules/tailwindcss/theme.css` est refusé par les permissions de l'agent. Les valeurs oklch de la palette sont celles de la doc Tailwind 4.1, converties par script jetable (`oklch → sRGB`, clamp). Les teintes résultantes retrouvées (gray-500 `#6a7282`, slate-900 `#0f172b`, gray-900 `#101828`…) sont celles que publie Tailwind 4. **Vérification possible côté utilisateur** : ouvrir `node_modules/tailwindcss/theme.css` et comparer les lignes `--color-gray-100/200/500/700`, `--color-stone-50`, `--color-slate-50/800/900`, `--color-gray-900`.
- Nom des classes : un token `--color-vp-xxx` donne `bg-vp-xxx`, `text-vp-xxx`, `border-vp-xxx`, `from-vp-xxx`, `fill-vp-xxx`… avec modificateur d'opacité (`/10`) ; la variable brute est `var(--vp-xxx)`.

## 2. Table hex → remplacement

### 2.1 Couleurs de la charte → tokens `vp` existants (valeur identique, écart 0)

| Hex | Remplacement | Usages | Fichiers principaux | Écart |
|---|---|---|---|---|
| `#7FD857` | classe `…-vp-green` · CSS/SVG `var(--vp-green)` · (tables JS et `color=` de Tag → section 2.4) | 347 (≈ 284 classes, 43 attributs SVG, 4 CSS, 16 JS/Tag) | `pages/profil.vue`, `pages/register.vue`, `tarifs/GrilleTarifs.vue`, `posts/[slug].vue`, `layout/Footer.vue` (classes) ; `contact/Header.vue` (15 SVG), `actualites/Header.vue`, `Home/Hero.vue`, `tarifs/Header.vue`, `club/HeroClub.vue` (SVG) — 75 fichiers | 0 (token) · hors palette (plus proche : stone-400 à 68) |
| `#0F1729` | classe `…-vp-dark` · CSS/SVG `var(--vp-dark)` | 253 (239 classes, 9 CSS, 5 SVG) | `callback.vue`, `inscriptions/InscriptionsCartesInfo.vue`, `GroupsAccordion.vue`, `Home/Actualites.vue`, `Home/ProchainsEvenements.vue` — 80 fichiers | 0 (token) · **voir cas limite A** (gray-900 à 1, slate-900 à 2) |
| `#6bc546` | classe `hover:…-vp-green-hover` · CSS `var(--vp-green-hover)` | 42 (36 `hover:bg-`, 5 `hover:text-`, 1 CSS) | `login.vue`, `profil.vue`, `register.vue`, `callback.vue`, `completer-profil.vue` — 22 fichiers | 0 (token ; `--vp-green-hover` corrigé de `#6bc745` en `#6bc546`) · hors palette |
| `#1a2740` | classe `hover:bg-vp-dark-hover` · CSS `var(--vp-dark-hover)` | 9 (8 `hover:bg-`, 1 CSS) | `layout/Header.vue`, `blocs/BlocCarteAcces.vue`, `BlocGrilleCartes.vue`, `_AgendaLigne.vue`, `_BlocBouton.vue`, `inscriptions/*` — 9 fichiers | 0 (token) · **voir cas limite A** (slate-800 à 3) |
| `#F5F7FA` | classe `bg-vp-gray` · CSS `var(--vp-gray)` | 2 (`Home/Actualites.vue` L91 classe, `layout/Header.vue` L465 CSS) | 2 fichiers | 0 (token) · **voir cas limite A** (slate-50 à 3) |

### 2.2 Couleurs absentes de la palette → nouveaux tokens `vp`

| Hex | Remplacement | Usages | Fichiers | Écart (plus proche de la palette) |
|---|---|---|---|---|
| `#5ab43a` | `text-vp-green-check` (token `--vp-green-check`, ajouté) | 2 | `register.vue` L163, `profil.vue` L80 (critère de mot de passe validé) | 0 (token) · hors palette (neutral-500 à 65) |
| `#F0F0EE` | `bg-vp-placeholder` (token `--vp-placeholder`, ajouté) ; si dans `style=""` : `var(--vp-placeholder)` | 2 | `club/Timeline.vue` L78 et L147 (fond quand l'étape n'a pas d'image) | 0 (token) · **voir cas limite C** (stone-100 à 6) |
| `#ccc` | `text-vp-quote-mark` (token `--vp-quote-mark`, ajouté) | 1 | `club/Timeline.vue` L205 (guillemet décoratif) | 0 (token) · **voir cas limite C** (neutral-300 à 8) |

### 2.3 Couleurs correspondant à la palette Tailwind → classe ou variable de palette

| Hex | Remplacement | Usages | Fichiers | Écart (valeur de palette) |
|---|---|---|---|---|
| `#E5E7EB` | CSS `var(--color-gray-200)` · SVG `class="fill-gray-200"` | 3 | `layout/Header.vue` L466 (CSS) ; `contact/ContactPage.vue` L7, `sorties/Page.vue` L7 (SVG) | 0 (gray-200 = `#e5e7eb`) |
| `#F3F4F6` | SVG `class="fill-gray-100"` | 2 | `contact/ContactPage.vue` L6, `sorties/Page.vue` L6 | 0 (gray-100 = `#f3f4f6`) |
| `#374151` | CSS `var(--color-gray-700)` | 1 | `posts/[slug].vue` L429 (`:deep(.prose)`) | 2 (gray-700 = `#364153`) |
| `#FAFAF9` | `bg-stone-50` (classe ; le `style="background: …"` est retiré) | 2 | `club/Timeline.vue` L10, L170 | 0 (stone-50 = `#fafaf9`) |
| `#F0FDF4` | CSS `var(--color-green-50)` | 1 | `layout/Header.vue` L469 (item actif) | 1 : **la valeur rendue devient `#EFFDF5`** (surcharge `--color-green-50` du projet dans `main.css` ; le green-50 Tailwind d'origine vaut `#f0fdf4`, écart 0) |
| `#000` | SVG `class="fill-black"` | 3 | `contact/Form.vue` L6-7, `tarifs/TarifsPage.vue` L11 | 0 (black = `#000000`) |

Disponibilité des variables : `--color-gray-200` et `--color-gray-700` sont forcées dans le CSS par un `@source inline("bg-gray-200 text-gray-700")` ajouté à `main.css` (les `<style>` de composants ne sont pas lus par Tailwind) ; `--color-green-50` est dans le `@theme static` du projet. Les classes (`fill-*`, `bg-stone-50`) n'ont pas ce souci.

### 2.4 Valeurs passées à du JS : module `app/utils/categoryColors.ts` (hex conservé, rendu inchangé)

Tag.vue parse `#RRGGBB` (contraste, suffixes alpha `15`/`40`) : ces valeurs restent des hex, dans le module.

| Hex | Remplacement | Usages | Fichiers | Écart palette |
|---|---|---|---|---|
| `#7FD857` (tables) | `getCategoryColor()` · `DEFAULT_TAG_COLOR` | 15 + `Tag.vue` | tables locales de `posts/[slug].vue`, `actualites/Page.vue`, `Home/Actualites.vue`, `sorties/ListeSorties.vue`, `sorties/Page.vue` ; `posts/[slug].vue` L115 `color="#7FD857"` → `:color="DEFAULT_TAG_COLOR"` | — |
| `#4ECDC4` Bloc · `#9333EA` Stage · `#F97316` Climb Up · `#2563EB` Cime Altitude | `getCategoryColor()` | 4 chacun | les 4 tables ci-dessus (sauf Home/Actualites, qui n'a pas ces 4) | — |
| `#EF4444` Compétition · `#F59E0B` Événement · `#3B82F6` Club · `#8B5CF6` Formation · `#10B981` Partenariat | `getCategoryColor()` (`#EF4444`, `#F59E0B`, `#10B981` aussi `getDifficultyColor()`) | 3-4 chacun | `posts/[slug].vue`, `actualites/Page.vue`, `Home/Actualites.vue` | — |
| `#7C3AED` Expert | `getDifficultyColor()` | 1 | `posts/[slug].vue` L408 | — |
| `#6B7280` | `NEUTRAL_TAG_COLOR` (exporté par le module) | 3 | `posts/[slug].vue` L402/L410 (défaut difficulté → dans le module) ; `actualites/Page.vue` L106 `color="#6B7280"` → `:color="NEUTRAL_TAG_COLOR"` (import à ajouter) | 2 (gray-500 `#6a7282`) : reste un hex, car `Tag` a besoin d'un `#RRGGBB` |
| `#000000` / `#FFFFFF` | `TAG_TEXT_DARK` / `TAG_TEXT_LIGHT` | 2 / 1 | `ui/Tag.vue` (fait par T1) | — |

Noms de catégories du module : Falaise, Sortie Falaise, Infrastructure (`#7FD857`), Bloc, Stage, Climb Up, Cime Altitude, Compétition, Événement, Club, Vie du club (`#3B82F6`), Formation, Partenariat ; défaut `#7FD857`. Clé normalisée (casse, accents, espaces). `ProchainsEvenements.vue` : n'a aucun hex, mais passe par `getCategoryColor` (T3).

## 3. Cas limites : à trancher par l'utilisateur

**A. Couleurs de la charte qui tombent dans le seuil de la palette.** Appliquée à la lettre, la règle « une couleur de palette gagne » enverrait la charte vers `gray-900` / `slate-800` / `slate-50`. Par défaut **je les ai gardées en tokens `vp`** (ce sont les couleurs nommées de CLAUDE.md, les ~29 `var(--vp-…)` existants les utilisent déjà, et leur valeur exacte est préservée).

| Hex charte | Palette la plus proche | Écart | Défaut proposé | Alternative |
|---|---|---|---|---|
| `#0F1729` (253 usages) | gray-900 `#101828` (1) · slate-900 `#0f172b` (2) | 1 | `vp-dark` (écart 0) | `gray-900` : −1 unité, perd le nom « bleu nuit » |
| `#1a2740` (9 usages) | slate-800 `#1d293d` | 3 | `vp-dark-hover` | `slate-800` |
| `#F5F7FA` (2 usages) | slate-50 `#f8fafc` | 3 | `vp-gray` | `slate-50` |

**B. `#6B7280`** (écart 2 avec gray-500) : maintenu en hex dans le module (prop `color` de `Tag`), pas de classe possible.

**C. Hex proches de la palette mais au-delà du seuil (≤ 3)** : traités comme absents (tokens) ; à changer si on préfère la palette.

| Hex | Palette la plus proche | Écart | Défaut | Alternative |
|---|---|---|---|---|
| `#F0F0EE` | stone-100 `#f5f5f4` | 6 | `vp-placeholder` | `bg-stone-100` |
| `#ccc` | neutral-300 `#d4d4d4` | 8 | `vp-quote-mark` | `text-neutral-300` |

**D. `#F0FDF4` → `green-50`** : la valeur rendue passe de `#F0FDF4` à `#EFFDF5` (surcharge du projet), écart 1, sur l'item actif du menu (Header.vue L469).

**E. Bloc `.prose` de `main.css`** (`#4b5563` gray-600 à 2, `#6b7280` gray-500 à 2, `#e5e7eb` gray-200 à 0, `#d1d5db` gray-300 à 1) : laissé tel quel (fichier de thème, plan T1). Pourrait devenir `var(--color-gray-*)`, mais change légèrement la valeur de quatre couleurs ; non fait.

## 4. Règles de réécriture par contexte (pour T3-T9)

1. **Classe Tailwind** `PREFIXE-[#hex]` → `PREFIXE-vp-xxx`, en gardant variantes et opacité :
   `bg-[#7FD857]/10` → `bg-vp-green/10` · `hover:bg-[#6bc546]` → `hover:bg-vp-green-hover` · `group-hover:text-[#7FD857]` → `group-hover:text-vp-green` · `data-[selected]:bg-[#0F1729]` → `data-[selected]:bg-vp-dark` · `focus:ring-[#7FD857]` → `focus:ring-vp-green` · `border-t-[#7FD857]` → `border-t-vp-green` · `from-[#0F1729] via-transparent to-[#0F1729]/50` → `from-vp-dark via-transparent to-vp-dark/50` · `prose-strong:text-[#0F1729]` → `prose-strong:text-vp-dark` · `decoration-[#7FD857]` → `decoration-vp-green`. Préfixes rencontrés : `bg`, `text`, `border` (+ `-t`), `ring`, `decoration`, `from`/`via`/`to`. Aucune valeur arbitraire composée (shadow, gradient en dur) n'existe : tout est de la forme `PREFIXE-[#hex]`.
2. **Tables de classes en JS/TS** (`useSectionFond.ts`, `useInscriptionsFond.ts`, `_BlocBouton.vue`, `InscriptionsCartesInfo.vue`…) : mêmes classes qu'en 1 (la chaîne reste une liste de classes).
3. **`<style>` / `<style scoped>`** : couleur de charte → `var(--vp-green)` etc. ; palette → `var(--color-gray-200)` / `var(--color-gray-700)` / `var(--color-green-50)` (seules variables de palette autorisées ici, voir 2.3).
4. **`style=""` inline** : préférer une classe (`bg-stone-50`, `bg-vp-placeholder`, `text-vp-quote-mark`, fusionnée dans l'attribut `class` existant et retirée de `style`) ; sinon `var(--vp-…)`. Ne pas toucher aux autres propriétés du `style`.
5. **Attributs SVG** `stroke="#hex"` / `fill="#hex"` : on retire l'attribut et on ajoute une classe à l'élément (créer `class=` si absent, sinon fusionner) : charte → `stroke-vp-green`, `fill-vp-green`, `stroke-vp-dark`… ; palette → `fill-gray-100`, `fill-gray-200`, `fill-black`. Attention à la spécificité : une classe l'emporte sur un attribut de présentation hérité, vérifier qu'aucun `fill`/`stroke` parent ou `currentColor` n'est en jeu. Les `opacity`, `stroke-width`, `fill="none"` ne changent pas. Contrôlé par les captures de T10.
6. **Hex passé à `Tag`** (`color="#…"`, tables locales `getCategoryColor` / `getDifficultyColor`) : importer explicitement depuis `~/utils/categoryColors` (`getCategoryColor`, `getDifficultyColor`, `DEFAULT_TAG_COLOR`, `NEUTRAL_TAG_COLOR`), supprimer les tables locales, passer en `:color="…"`.
7. **Hors règle** : `rgba(127,216,87,…)` et autres `rgb()`/`rgba()`/noms CSS ne sont pas des hex ; ne pas les toucher. `main.css`, `categoryColors.ts`, `server/utils/email-theme.ts`, `tests/`, `e2e/` ne sont pas réécrits.
