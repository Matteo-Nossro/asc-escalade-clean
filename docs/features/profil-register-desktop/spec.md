# Spec — Adaptation desktop de /profil, /register, /completer-profil

> Slug : `profil-register-desktop` · Créée le : 2026-10-29 · Transverse : non
> **Tests d'abord : non** (affichage pur — classes Tailwind au-delà de `lg`, aucune logique, aucune donnée, aucune route API touchée).

## Objectif
Ces trois pages sont pensées mobile-first : conteneur `max-w-xl` (~576 px) centré, cartes empilées verticalement. Sur un écran d'ordinateur (1440 px), il reste ~860 px d'espace vide de chaque côté et la page défile beaucoup plus que nécessaire. Le bureau/admin, qui saisit ou corrige souvent ces informations pour les adhérents depuis un ordinateur, en profitera le plus. Objectif : élargir la mise en page sur grand écran (option A, voir `options.md` § Décision) sans rien changer sur mobile ni dans la logique.

## Lot 1 (ce lot) — /profil seul
Implémenter et valider la mise en page desktop sur `/profil` uniquement. `/register` et `/completer-profil` ne sont **pas modifiés dans ce lot** — ils seront traités dans un lot suivant, après validation de `/profil` par l'utilisateur.

## Critères d'acceptation
- [ ] `/profil` : conteneur desktop élargi à `lg:max-w-5xl` (rupture `lg`, 1024 px) au lieu de `max-w-xl`.
- [ ] Les cartes de `/profil` (mot de passe, famille/enfants, en-tête avatar/rôles, infos perso, adresse, photo, infos club) sont réorganisées en grille 2 colonnes à partir de `lg`, avec un regroupement cohérent (ex. infos perso | adresse) ; `items-start` ou équivalent pour éviter les trous dus aux hauteurs inégales.
- [ ] Les champs internes passent à 3 colonnes en `xl` quand c'est pertinent (hors champ téléphone, voir contraintes).
- [ ] Le bouton « Enregistrer » et les messages ne sont plus pleine largeur de la colonne mobile ; une barre d'actions reste visible (collante) au lieu de se perdre en bas d'une longue page.
- [ ] Ordre de tabulation clavier = ordre DOM (pas d'`order-*` CSS qui romprait la navigation clavier).
- [ ] Contrastes conformes à la charte : `vp-green` réservé aux fonds/icônes, jamais en texte sur fond blanc.
- [ ] **À 390 px, le rendu est identique à l'existant** : capture `e2e/visual/captures.spec.ts` (ou extension équivalente) à 390 px comparée aux captures de référence (`docs/features/harmonisation-couleurs/captures/avant/profil-390.png` ou plus récentes) sans écart de mise en page.
- [ ] Le champ téléphone et sa validation (`app/components/auth/ProfileFieldsForm.vue` l. 46-52, `app/utils/profileForm.ts` l. 119-121) restent inchangés — non concernés par `/profil` qui a ses propres champs, mais à ne pas casser par ricochet si des classes partagées sont touchées.
- [ ] **Validation utilisateur requise avant d'étendre** : captures à 1440 et 390 px de `/profil` modifié, présentées et validées par l'utilisateur avant tout travail sur `/register` ou `/completer-profil`.

## Parcours utilisateur (e2e)
- Captures visuelles (lecture seule, comptes de test `+adherent` et `+admin`, aucune écriture en base) : `/profil` à 1440×900 et 390×844, via `e2e/visual/captures.spec.ts` (`CAPTURES_ONLY=profil`). Comparaison obligatoire de la capture 390 px avec la référence existante (`CAPTURES_COMPARE`) : doit passer sous le seuil de tolérance (aucune régression mobile). La capture 1440 px est fournie à l'utilisateur pour validation visuelle manuelle (pas d'assertion automatique sur le contenu desktop, qui change intentionnellement).

## Hors périmètre
- `/register` et `/completer-profil` — lot suivant, après validation de `/profil`.
- Option B complète (sommaire latéral collant, composable de suivi de section) — seule la **barre d'actions collante** est reprise ; pas de navigation par ancres.
- Option C (deux volets contexte/saisie, panneau d'aide éditable dans Storyblok, nouvelle fiche profil) — écartée pour ce lot (voir `options.md` § Décision).
- **Admin `MemberModal`** (le bureau corrigeant la fiche d'un *autre* adhérent) — hors périmètre. **Suites possibles** : si le besoin de confort desktop se confirme pour le bureau, envisager une adaptation similaire de `MemberModal` dans une feature séparée.
- Tout changement de champ, de validation, de table Supabase ou de route API.

## Contraintes / contexte
- Décision d'options détaillée (option retenue A + emprunt à B, raisons, options écartées) : `docs/features/profil-register-desktop/options.md` § Décision.
- `app/pages/profil.vue` : page concernée, wrapper `max-w-xl` l. 3, 7 cartes listées ci-dessus (l. 24 à 510 environ).
- Charte de couleurs : voir `CLAUDE.md` § Couleurs du projet (tokens `vp-dark`, `vp-green`, `vp-green-hover`, `vp-dark-hover`).
- NuxtUI 4.3 / TailwindCSS 4 : classes `@theme`, pas de hex en dur (voir `check.mjs`).
- Accessibilité : contrastes AA, navigation clavier complète, pas de piège de focus sur la barre d'actions collante.
- `docs/conventions.md` à consulter pour les patterns de composants/layout existants avant d'écrire le code.

## Côté Storyblok
Aucun — option A ne touche à aucun blok Storyblok.
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | aucun changement Storyblok dans ce lot |
