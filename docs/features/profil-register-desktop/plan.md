# Plan — profil-register-desktop (lot 2 : /register et /completer-profil)

> Rédigé par : planner (sonnet) · Validé par l'utilisateur : ☑ (2026-11-02 — two-pass completer-profil confirmé, capture via script temporaire non commité confirmée)

## Résumé de l'approche
Option A (déjà actée dans `options.md` § Décision, reprise du lot 1) : classes Tailwind uniquement, aucune logique ni donnée touchée. `app/components/auth/ProfileFieldsForm.vue` et `ChildrenForm.vue` (partagés par `register.vue` et `completer-profil.vue`) sont préparés pour un rendu en colonnes indépendantes à `lg` (T1), puis les deux pages reprennent le pattern du lot 1 — conteneur `lg:max-w-5xl`, colonnes indépendantes, barre d'actions collante `lg`-only (T2). `/register` garde ses 4 étapes ; seules l'étape 1 (cartes côte à côte) et l'étape 2 (formulaire en colonnes) sont restructurées visuellement. Les captures 1440/1024/390 des deux pages, avec comparaison 0 % exigée sur les 390 (register vs référence existante, completer-profil avant/après deux passes), ferment le lot (T3).

## Tâches

### T1 — Composants partagés : grilles desktop (préparation colonnes)
- **Agent** : ui-dev
- **Fichiers** : `app/components/auth/ProfileFieldsForm.vue`, `app/components/auth/ChildrenForm.vue`
- **Dépend de** : —
- **Détail** :
  - Pattern de référence : `docs/conventions.md` § « Mise en page desktop (pages à cartes) » (établi au lot 1 sur `/profil`).
  - `ProfileFieldsForm.vue` : les grilles à 2 champs (Prénom/Nom l. 10, Naissance/Sexe l. 19, Adresse l. 118, déjà `sm:grid-cols-2`) n'ont pas besoin de passer à 3 colonnes (pas de bénéfice, même constat qu'au lot 1 sur les grilles à 2 champs de `/profil`). L'objectif principal est de préparer les cartes **Identité** et **Adresse** pour qu'elles puissent devenir deux colonnes indépendantes au niveau des pages consommatrices (pas une `grid` alignée) : vérifier la structure racine du composant (fragment multi-racine ou wrapper unique) et ajouter si besoin des classes de largeur/positionnement minimales. **Ne pas toucher** au champ téléphone (l. 46-56) ni à sa validation (`app/utils/profileForm.ts` l. 119-121). Le slot `after-identity` (l. 61, utilisé **uniquement** par `register.vue` pour la carte Connexion) doit rester positionné juste après le bloc Identité quelle que soit la disposition retenue — ne pas casser ce point d'intégration.
  - `ChildrenForm.vue` : grilles internes (l. 31, l. 40, l. 72) en `lg:grid-cols-2`/`xl:grid-cols-3` quand c'est pertinent (≥ 3 champs sur une ligne). La carte liste d'enfants (l. 4-22) et le formulaire d'ajout (l. 25) peuvent devenir deux colonnes indépendantes à `lg` si le contenu s'y prête, en gardant l'ordre DOM (pas de `order-*`).
  - **Contrôle obligatoire après édition** (`git diff`) : aucune classe de layout/espacement/largeur ajoutée ou modifiée sans préfixe `lg:` (ou `xl:`) — une classe sans préfixe de rupture s'applique aussi en mobile (c'est exactement la fuite trouvée et corrigée au lot 1, `space-y-6` → `space-y-4` appliquée par erreur sans `lg:`). Vérifier aussi qu'aucun prop NuxtUI (`block`, `size`, etc.) n'est retiré par erreur sur un bouton au passage en largeur desktop.
  - Respecter `asc-rules` (hook `check.mjs` après édition `.vue`).

### T2 — Pages : register.vue et completer-profil.vue
- **Agent** : ui-dev
- **Fichiers** : `app/pages/register.vue`, `app/pages/completer-profil.vue`
- **Dépend de** : T1
- **Détail** :
  - Conteneur : `max-w-xl` → `lg:max-w-5xl` sur les deux pages (l. 3 de chacune), comme `/profil`.
  - `register.vue` étape 1 (l. 20-79) : cartes de choix adulte/mineur (l. 28, l. 47) côte à côte à `lg` (flex/grid `lg:gap-6 lg:items-start`), bouton Continuer (l. 78-79) inchangé en dessous.
  - `register.vue` étape 2 (l. 96-224) : `AuthProfileFieldsForm` (l. 114-198, slot `after-identity` l. 115) réparti en deux colonnes indépendantes à `lg` selon la structure préparée en T1 (ordre DOM coupé en deux blocs consécutifs, pas de `order-*`). Vérifier visuellement que la carte Connexion (slot) reste cohérente avec le bloc Identité. Boutons Retour (l. 202-208) + Submit (l. 209-222), actuellement `flex gap-3` : alignés à droite à `lg` (`lg:justify-end`), `block`/pleine largeur conservés sous `lg`.
  - `register.vue` étape 3 (l. 229-285) : carte intro (l. 242) + `AuthChildrenForm` (l. 253-259) — mise en page adaptée seulement si le contenu s'y prête naturellement (sinon simplement le conteneur élargi). Boutons Retour (l. 263-269) + Terminer (l. 270-283) : même traitement que l'étape 2.
  - `register.vue` étape 4 (l. 290-325) : aucun changement (hors périmètre, spec § Lot 2).
  - Barre d'actions collante par étape : à évaluer au cas par cas (pertinente seulement si le contenu d'une étape dépasse la hauteur d'écran à `lg`) ; si retenue, même pattern que `/profil` (`lg:sticky lg:bottom-0 lg:z-20`, fond opaque, bordure supérieure, `lg:pb-*` de compensation). Ne pas en ajouter si le contenu de l'étape tient déjà sur un écran.
  - `completer-profil.vue` : conteneur élargi (l. 3), `AuthProfileFieldsForm` (l. 39, sans slot) et cartes enfants (l. 42-50) + `AuthChildrenForm` (l. 51-57) en colonnes indépendantes à `lg`, même principe que l'étape 2/3 de `register.vue`. Bouton `btn-complete-submit` (l. 59-72), actuellement `block` seul : zone finale transformée en barre d'actions collante **comme au lot 1** (`lg:sticky lg:bottom-0`, fond opaque, bordure, `lg:pb-*` de compensation), bouton `lg:w-auto lg:justify-end`, `block` conservé sous `lg`.
  - **Contrôle obligatoire après édition** (`git diff`), même exigence qu'en T1 : aucune classe sans préfixe `lg:` hors de la rupture desktop, aucun prop NuxtUI (`block` notamment sur `btn-complete-submit` et les boutons Continuer/Retour/Submit/Terminer) retiré par erreur — régression trouvée et corrigée au lot 1, à ne pas reproduire.
  - Respecter `asc-rules` (hook `check.mjs` après édition `.vue`).

### T3 — Captures et comparaison (register, completer-profil)
- **Agent** : e2e
- **Fichiers (lecture)** : `e2e/visual/captures.spec.ts` (inchangé — `register` déjà présent dans `SHOTS` l. 56, sans rôle), `e2e/support/dev-db.ts` (`testAccount` déjà générique, aucune modification nécessaire)
- **Fichiers (écriture, générés)** : `docs/features/profil-register-desktop/captures/apres/register-1440.png`, `register-1024.png`, `register-390.png`, `rapport-comparaison.json` (mis à jour) ; `docs/features/profil-register-desktop/captures/avant/completer-profil-390.png` (référence établie dans ce lot) ; `docs/features/profil-register-desktop/captures/apres/completer-profil-1440.png`, `completer-profil-1024.png`, `completer-profil-390.png`
- **Dépend de** : T2 pour toutes les captures « après » — **sauf** la capture `completer-profil-390` « avant », qui doit être prise sur l'état de `completer-profil.vue` **antérieur** à T2 (voir ordonnancement ci-dessous)
- **Détail** :
  - `register` : reprendre exactement la méthode du lot 1 (`profil-1024`/`profil-1440`/`profil-390`) : `CAPTURES_BASE=docs/features/profil-register-desktop/captures CAPTURES_OUT=apres CAPTURES_ONLY=register`, 1440 sans comparaison, 1024 via une capture Playwright ad hoc hors du fichier commité (comme au lot 1, puisque `WIDTHS` ne contient que 1440/390), 390 avec `CAPTURES_COMPARE=docs/features/harmonisation-couleurs/captures/avant` (référence `register-390.png` déjà existante) — tolérance par défaut, **0 % d'écart exigé**.
  - `completer-profil` : absent de `SHOTS` et le compte `+incomplete` n'est pas un rôle connu (`Role = 'adherent' | 'admin'`). Ne **pas** modifier le fichier de test commité pour ce besoin ponctuel (même choix qu'au lot 1 pour le viewport 1024) : écrire un script Playwright **temporaire, non commité** (scratchpad ou fichier non suivi), réutilisant le pattern `sessionFor`/`settle`/`comparePngs` de `captures.spec.ts`, connecté avec `testAccount('incomplete')` (fonction déjà générique). Déroulé **two-pass obligatoire** :
    1. Capturer `completer-profil-390` sur l'état **avant modification** de `completer-profil.vue` par T2 (référence manquante à établir dans ce lot). Si T2 a déjà été appliqué au moment de cette tâche, utiliser `git show HEAD~N:app/pages/completer-profil.vue` ou un stash temporaire pour reconstituer fidèlement l'état « avant » — à documenter sans ambiguïté dans le compte rendu.
    2. Capturer `completer-profil` à 1440/1024/390 sur l'état **après** T2.
    3. Comparer uniquement les deux captures 390 (avant/après) — **0 % d'écart exigé**, même tolérance que les autres captures du lot.
  - Fournir à l'utilisateur les captures 1440/1024 des deux pages pour validation manuelle, et les deux résultats de comparaison 390 (register vs référence existante, completer-profil avant vs après).
  - En cas d'écart > 0 % sur l'une des deux comparaisons 390 : ne pas élargir la tolérance, remonter à T2 (ui-dev).

## Migration / schéma BDD
Aucune.

## Risques / questions ouvertes
- Ordonnancement two-pass de `completer-profil-390` : la capture « avant » doit être prise sur un état non modifié de `completer-profil.vue`. À séquencer en pratique : lancer cette capture précise en tout début de T3 (avant que T2 ne soit appliqué/mergé), sinon reconstituer l'état via `git show`/stash — à clarifier si T2 et T3 ne peuvent pas être strictement ordonnés ainsi dans l'exécution réelle.
- Découpage en deux colonnes indépendantes de `ProfileFieldsForm.vue` (Identité/Connexion vs Adresse) : la faisabilité dépend de sa structure racine actuelle (fragment multi-racine ou wrapper unique) — à vérifier par ui-dev en lisant le fichier avant de choisir l'approche en T1 ; peut nécessiter un wrapper ajouté côté page plutôt que dans le composant.
- Barre d'actions collante par étape sur `register.vue` : laissée à l'appréciation de ui-dev (pertinente seulement si le contenu dépasse la hauteur visible à `lg`) — à valider visuellement par l'utilisateur sur les captures 1440/1024.
- Compte `+incomplete` : doit rester « profil non complété » pendant tout le lot (uniquement des `GET`, aucun submit involontaire pendant les captures).
