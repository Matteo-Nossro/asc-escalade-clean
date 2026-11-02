# Plan — profil-register-desktop (lot 1 : /profil seul)

> Rédigé par : planner (sonnet) · Validé par l'utilisateur : ☑ (2026-10-30, avec ajouts ci-dessous)

## Résumé de l'approche
Option A retenue dans `options.md` § Décision : classes Tailwind uniquement, aucune logique ni composant partagé touchés. `app/pages/profil.vue` passe d'un conteneur `max-w-xl` en pile verticale à `lg:max-w-5xl` avec les 7 cartes en grille 2 colonnes à `lg` (champs internes à 3 colonnes à `xl` où pertinent), et la zone « Enregistrer / messages » devient une barre d'actions collante **à partir de `lg` seulement** (mobile inchangé). Aucun sommaire latéral, aucun composable de suivi de section, aucun panneau Storyblok (écartés avec B complète et C). Validation utilisateur sur les captures 1440/390 avant d'étendre à `/register` et `/completer-profil` (lot suivant, hors de ce plan).

## Tâches

### T1 — Grille desktop + barre d'actions collante sur /profil
- **Agent** : ui-dev
- **Fichiers** : `app/pages/profil.vue`
- **Dépend de** : —
- **Détail** :
  - Conteneur : remplacer `max-w-xl` (l. 3) par `lg:max-w-5xl` (le `max-w-xl` reste la valeur par défaut sous `lg`, donc le rendu mobile 390 px ne change pas).
  - Grouper les 7 cartes dans une grille `lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start` (`items-start` pour éviter les trous dus aux hauteurs inégales). Garder l'ordre DOM actuel (mot de passe l. 24, famille/enfants l. 107, en-tête avatar/rôles l. 206, infos perso l. 250, adresse l. 333, photo l. 423, infos club l. 448) — ne pas déplacer les blocs ni utiliser de classe `order-*`. En-tête avatar/rôles en pleine largeur (`lg:col-span-2`) si cela évite un appariement incohérent avec la carte mot de passe/famille juste au-dessus ; sinon grouper par paires successives (ex. infos perso | adresse, photo | infos club). Les cartes conditionnelles (mot de passe, famille) restent conditionnelles (`v-if`) : la grille doit rester cohérente qu'elles soient présentes ou non.
  - **Alternative si la grille `grid-cols-2` laisse des trous visibles sous des cartes courtes** : passer en deux colonnes indépendantes (un conteneur par colonne, cartes empilées dans chaque colonne, par ex. avec deux `div` flex-col côte à côte via `lg:flex lg:gap-6` plutôt qu'un `grid` à lignes alignées). Condition impérative : l'ordre actuel des cartes doit se couper en **deux blocs consécutifs** (ex. cartes 1-4 dans la colonne de gauche, cartes 5-7 dans la colonne de droite) — jamais une carte de la colonne de droite ne doit précéder dans le DOM une carte de la colonne de gauche, pour que l'ordre mobile (pile unique) et l'ordre de tabulation restent inchangés. ui-dev choisit l'une des deux approches (grille alignée ou deux colonnes indépendantes) selon ce qui évite le mieux les trous, et le signale clairement dans son compte rendu pour que la version retenue soit visible sur la capture 1440.
  - Grilles internes existantes à passer en `xl:grid-cols-3` quand c'est pertinent : infos perso (l. 257, l. 304), adresse (l. 391), infos club (l. 456). Ne pas toucher au champ téléphone (absent de `profil.vue`, hors périmètre).
  - Zone finale (bouton Enregistrer l. 477-491, UAlert succès l. 494-501, UAlert erreur l. 503-509, pied de page l. 512-514) : transformer en barre d'actions collante **uniquement à partir de `lg`** (ex. `lg:sticky lg:bottom-0`). Fond **opaque** (couleur de fond de page de la charte, pas de transparence qui laisserait transparaître le contenu qui défile dessous), **bordure supérieure** pour la séparer visuellement du contenu, `z-index` suffisant. Ajouter une **marge en bas de page** (ex. `lg:pb-24` ou équivalent sur le conteneur principal) pour que la dernière carte de chaque colonne ne soit jamais masquée par la barre collante une fois en bas de page. Sous `lg`, comportement et markup identiques à l'existant (pas de `sticky`, pas de marge ajoutée, pas de changement visuel à 390 px).
  - Bouton « Enregistrer » : largeur automatique et alignée à droite à `lg` (au lieu de `block`/pleine largeur), pleine largeur conservée sous `lg`.
  - Accessibilité : ordre de tabulation = ordre DOM (aucune classe `order-*`) ; la barre collante ne doit pas créer de piège de focus ni masquer un élément focusé en dessous ; aucun texte en `vp-green` sur fond blanc (icônes/fonds uniquement, conforme CLAUDE.md § Couleurs).
  - Respecter `asc-rules` (le hook `check.mjs` tourne après l'édition) : `v-editable` n'est pas concerné ici (page non-Storyblok), mais vérifier les imports Vue explicites si du script est touché.

## Migration / schéma BDD
Aucune.

## Tâches (suite)

### T2 — Captures 1440/390 et comparaison 390 vs référence
- **Agent** : e2e
- **Fichiers (lecture)** : `e2e/visual/captures.spec.ts` (inchangé — pas d'édition de code, usage des variables d'environnement existantes, dont `CAPTURES_ONLY` déjà supporté)
- **Fichiers (écriture, générés)** : `docs/features/profil-register-desktop/captures/apres/profil-1440.png`, `docs/features/profil-register-desktop/captures/apres/profil-1024.png`, `docs/features/profil-register-desktop/captures/apres/profil-390.png`, `docs/features/profil-register-desktop/captures/apres/rapport-comparaison.json`
- **Dépend de** : T1
- **Détail** :
  - Lancer des exécutions ciblées de `e2e/visual/captures.spec.ts` par nom de test (`-g`), pour ne comparer QUE la capture 390 px à la référence (`docs/features/harmonisation-couleurs/captures/avant/profil-390.png`) et fournir les captures 1440 et 1024 px sans assertion (le contenu desktop change intentionnellement) :
    1. Capture 1440 (pas de comparaison) :
       `CAPTURES_BASE=docs/features/profil-register-desktop/captures CAPTURES_OUT=apres CAPTURES_ONLY=profil E2E_SKIP_BUILD=1 npx playwright test e2e/visual/captures.spec.ts -g "profil-1440"`
    2. Capture 1024 (pas de comparaison, juste sous la rupture `lg` pour vérifier qu'il n'y a pas de rendu intermédiaire cassé) : même commande en ajoutant temporairement 1024 aux largeurs testées si le fichier le permet via une variable, sinon une capture Playwright ad hoc hors du spec (viewport 1024×768, même page, même compte, sans toucher au fichier de test commité) — à documenter dans le compte rendu.
    3. Capture + comparaison 390 :
       `CAPTURES_BASE=docs/features/profil-register-desktop/captures CAPTURES_OUT=apres CAPTURES_COMPARE=<chemin absolu vers>/docs/features/harmonisation-couleurs/captures/avant CAPTURES_ONLY=profil E2E_SKIP_BUILD=1 npx playwright test e2e/visual/captures.spec.ts -g "profil-390"`
    (adapter la syntaxe des variables d'environnement au shell utilisé — PowerShell vs bash — sans modifier le fichier de test commité.)
  - Le test `profil-390` doit passer sous la tolérance par défaut (`CAPTURES_THRESHOLD`/`CAPTURES_MAX_RATIO`) : aucune régression mobile. Si échec, ne pas élargir la tolérance pour faire passer le test — remonter l'écart à l'utilisateur/à T1.
  - Compte de test `+adherent` (lecture seule, déjà géré par `sessionFor` dans le fichier de test).
  - Ne pas lancer `CAPTURES_COMPARE` sur la capture 1440 (comparaison non pertinente, le contenu change intentionnellement).
  - Fournir à l'utilisateur les deux PNG (1440 pour validation visuelle manuelle, 390 avec le résultat de comparaison) pour la validation requise par le critère d'acceptation avant tout travail sur `/register` ou `/completer-profil`.

## Risques / questions ouvertes
- Appariement exact des cartes dans la grille 2 colonnes (en-tête pleine largeur ou paires successives) : laissé à l'appréciation de ui-dev dans l'ordre DOM existant ; à valider visuellement par l'utilisateur sur la capture 1440.
- Aucune convention de barre d'actions collante en bas n'existe dans le projet (seulement des sommaires `sticky top-*`) : le fond, l'ombre/bordure de séparation et le `z-index` sont créés pour ce lot — à revoir si une autre page adopte le même pattern plus tard.
- Si la capture 390 ne passe pas la comparaison (régression mobile involontaire), repasser sur T1 avant toute validation utilisateur.
- Après validation utilisateur du rendu 1440, le lot suivant (`/register`, `/completer-profil`) nécessitera un nouveau plan (hors de celui-ci).
