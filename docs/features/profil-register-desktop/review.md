# Revue — profil-register-desktop (lot 1 : /profil seul)

> Diff relu : `git diff -- app/pages/profil.vue` · Date : 2026-11-02 · Verdict : ✅ OK

## Bloquant
- —

## Important
- —

## Mineur
- `app/pages/profil.vue:487` — fond de la barre collante `lg:bg-gray-100` (couleur plate) alors que la page a un fond en dégradé `from-gray-50 to-gray-100` (`l. 2`) : opaque donc conforme au critère (pas de transparence laissant voir le contenu qui défile), mais peut créer une très légère ligne de démarcation visible selon la position de scroll. Pas bloquant, à surveiller sur la capture 1440 lors de la validation utilisateur.

## Vérifications
- ☑ `check.mjs` : 0 erreur, 0 avertissement.
- ☑ `npm run typecheck` : 186 erreurs = baseline, 0 nouvelle (fichier du diff inclus).
- ☑ Critères d'acceptation de la spec remplis :
  - `lg:max-w-5xl` sur le conteneur (l. 3), `max-w-xl` conservé comme valeur par défaut sous `lg`.
  - Deux colonnes indépendantes `lg:flex` (l. 24-25, 337) : cartes 1-4 (mot de passe, famille, avatar, infos perso) à gauche, 5-7 (adresse, photo, infos club) à droite — coupure en deux blocs consécutifs dans l'ordre DOM, conforme à l'alternative prévue au plan en cas de risque de trous (pas de `grid` à lignes alignées, donc pas de trou possible même si les cartes conditionnelles mot de passe/famille/infos club sont absentes : chaque colonne empile ses propres cartes indépendamment).
  - `xl:grid-cols-3` appliqué uniquement à la grille « Infos club » (l. 463, jusqu'à 4 items conditionnels) — non appliqué aux grilles 2 champs (prénom/nom l. 261, téléphone/portable l. 308, code postal/ville l. 398) : écart signalé par ui-dev vérifié et justifié, un `grid-cols-3` sur une grille à 2 items créerait une colonne vide inutile plutôt qu'un apport visuel ; pas un oubli silencieux, choix cohérent avec « quand c'est pertinent ».
  - Barre d'actions collante `lg:sticky lg:bottom-0 lg:z-20`, fond opaque, bordure supérieure (`lg:border-t`), `lg:pb-28` ajouté au conteneur (l. 3) pour éviter que la dernière carte de chaque colonne soit masquée. Comportement mobile (`sticky`, marge) absent sous `lg`, conforme.
  - Bouton « Enregistrer » : `block` conservé (pleine largeur mobile) + `lg:w-auto` et `lg:justify-end` (largeur auto, aligné à droite à `lg`) — correctement restauré après le correctif signalé dans `status.md`.
  - Aucune classe `order-*` : ordre de tabulation = ordre DOM, les deux colonnes se succèdent intégralement dans le HTML (gauche puis droite), aucune carte de droite ne précède une carte de gauche.
  - `vp-green` : uniquement sur icônes/fonds (`text-vp-green` sur `UIcon`, `bg-vp-green` sur boutons avec `text-vp-dark`) — aucun texte `vp-green` sur fond blanc.
  - Espacement mobile : `space-y-6 lg:space-y-4` sur le wrapper bouton/messages (l. 487) — identique au comportement d'origine à mobile (space-y-6), confirmé par la capture 390 à 0 % d'écart (`captures/apres/rapport-comparaison.json`, `pixelsDifferents: 0`).
  - Aucun fichier hors `app/pages/profil.vue` modifié (`git diff --stat`) ; aucune route API, aucune migration — conforme au plan et au hors-périmètre de la spec.
  - Champ téléphone (`form.phone`/`form.mobile`, l. 309-331) : classes et logique inchangées, seule la grille parente reste `sm:grid-cols-2` (pas de `xl:grid-cols-3`), conforme.
- ☑ Logique / SSR / cas limites : aucune logique touchée (classes Tailwind uniquement) ; cartes conditionnelles absentes → pas de trou (colonnes indépendantes) ; pas d'accès `window`/`document` ajouté.
- ☑ Sécurité : aucun secret, aucune route `server/api` touchée.
- N/A Images Storyblok (page non concernée).
- N/A GSAP (aucune animation touchée).
- ☑ Migration BDD : aucune, conforme au plan.
- ☑ Porte de qualité : `npm test` 719/719 (status.md), typecheck 0 nouvelle erreur (reconfirmé ci-dessus), comparaison e2e `profil-390` à 0 % d'écart vs référence mobile.
