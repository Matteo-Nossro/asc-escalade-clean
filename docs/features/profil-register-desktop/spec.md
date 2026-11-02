# Spec — Adaptation desktop de /profil, /register, /completer-profil

> Slug : `profil-register-desktop` · Créée le : 2026-10-29 · Transverse : non
> **Tests d'abord : non** (affichage pur — classes Tailwind au-delà de `lg`, aucune logique, aucune donnée, aucune route API touchée).

## Objectif
Ces trois pages sont pensées mobile-first : conteneur `max-w-xl` (~576 px) centré, cartes empilées verticalement. Sur un écran d'ordinateur (1440 px), il reste ~860 px d'espace vide de chaque côté et la page défile beaucoup plus que nécessaire. Le bureau/admin, qui saisit ou corrige souvent ces informations pour les adhérents depuis un ordinateur, en profitera le plus. Objectif : élargir la mise en page sur grand écran (option A, voir `options.md` § Décision) sans rien changer sur mobile ni dans la logique.

## Lot 1 (terminé) — /profil seul
Implémenté et validé : voir `plan.md`, `status.md` (phase « terminé ») et `review.md` (✅ OK). Conteneur `lg:max-w-5xl`, deux colonnes indépendantes, grilles internes `xl:grid-cols-3` sur « Infos club », barre d'actions collante à partir de `lg`. Capture `profil-390` à 0 % d'écart vs référence mobile. Validé visuellement par l'utilisateur (1440, 1024, navigateur, clavier) le 2026-11-02.

### Critères d'acceptation — Lot 1 (tous remplis)
- [x] `/profil` : conteneur desktop élargi à `lg:max-w-5xl` (rupture `lg`, 1024 px) au lieu de `max-w-xl`.
- [x] Les cartes de `/profil` réorganisées en deux colonnes à partir de `lg` (colonnes indépendantes, pas de grille alignée, pour éviter les trous avec les cartes conditionnelles).
- [x] Les champs internes passent à 3 colonnes en `xl` quand c'est pertinent (uniquement « Infos club » — les grilles à 2 champs n'en bénéficient pas).
- [x] Barre d'actions collante à partir de `lg`, bouton aligné à droite.
- [x] Ordre de tabulation clavier = ordre DOM.
- [x] Contrastes conformes à la charte.
- [x] 390 px identique à l'existant : 0 % d'écart (`captures/apres/rapport-comparaison.json`).
- [x] Champ téléphone non concerné (absent de `/profil`).
- [x] Validation utilisateur obtenue avant d'étendre.

## Lot 2 (ce lot) — /register et /completer-profil
Même principe (option A retenue dans `options.md` § Décision, pas de nouveau cadrage nécessaire — la Décision couvrait déjà les 3 pages). `/register` **garde son découpage en 4 étapes tel quel** (décision actée lors du cadrage) : seule l'étape 2 (formulaire d'identité, qui utilise `AuthProfileFieldsForm`) est concernée par l'élargissement desktop ; les étapes 1/3/4 (choix adulte/mineur, enfant, confirmation) ne sont pas restructurées en colonnes sauf si leur contenu s'y prête naturellement (ex. cartes de choix côte à côte à l'étape 1, déjà évoqué dans `options.md`).

### Critères d'acceptation — Lot 2
- [ ] `/register` : conteneur desktop élargi (même rupture `lg:max-w-5xl`, cohérent avec `/profil`). Les 4 étapes restent inchangées dans leur séquence et leur logique (`currentStep`) ; seule la mise en page interne de chaque étape est adaptée au desktop.
- [ ] `/register` étape 2 : `AuthProfileFieldsForm` (Identité + Adresse) réorganisé en colonnes à `lg`/`xl` comme fait pour `/profil`, **sans toucher au champ téléphone** (`ProfileFieldsForm.vue` l. 46-52) ni à sa validation (`app/utils/profileForm.ts` l. 119-121).
- [ ] `/register` étape 1 (choix adulte/mineur) : cartes de choix côte à côte à partir de `lg` si cela n'existe pas déjà.
- [ ] `/completer-profil` : même traitement desktop que `/register` (utilise les mêmes composants `AuthProfileFieldsForm`/`AuthChildrenForm`). À capturer et valider avec le compte de test `+incomplete` (créé pour ce lot), qui affiche le vrai formulaire plutôt qu'une redirection.
- [ ] Ordre de tabulation clavier = ordre DOM sur les deux pages, pas de classe `order-*`.
- [ ] Contrastes conformes à la charte (`vp-green` jamais en texte sur fond blanc).
- [ ] **À 390 px, le rendu des deux pages est identique à l'existant** : captures `e2e/visual/captures.spec.ts` (`CAPTURES_ONLY=register`, puis une capture `completer-profil` équivalente avec le compte `+incomplete`) comparées aux références existantes — **0 % d'écart exigé**, même critère que pour `/profil` au lot 1 (pas de tolérance élargie en cas d'échec : retour au dev concerné).
- [ ] Captures 1024 et 1440 des deux pages fournies pour validation visuelle manuelle par l'utilisateur avant clôture du lot.
- [ ] Aucun changement de logique, de donnée, de table Supabase ou de route API (`/api/register`, `/api/profile/complete` non touchées).

## Parcours utilisateur (e2e)
- Lot 2 : captures visuelles (lecture seule, aucune écriture en base) :
  - `/register` à 1440×900, 1024×768 (sans comparaison, validation manuelle) et 390×844 (**avec comparaison obligatoire**, 0 % d'écart exigé, référence `docs/features/harmonisation-couleurs/captures/avant/register-390.png`), via `e2e/visual/captures.spec.ts` (`CAPTURES_ONLY=register`).
  - `/completer-profil` : mêmes trois largeurs, connecté avec le compte de test `+incomplete` (profil non complété, affiche le vrai formulaire). Pas de capture de référence « avant » existante pour cette page à 390 px dans `harmonisation-couleurs` (elle redirigeait alors) — la toute première capture obtenue dans ce lot à 390 px, avant toute modification desktop de `completer-profil.vue`, sert de référence pour la comparaison après modification.

## Hors périmètre
- Option B complète (sommaire latéral collant, composable de suivi de section) — seule la **barre d'actions collante** est reprise, comme au lot 1.
- Option C (deux volets contexte/saisie, panneau d'aide éditable dans Storyblok) — écartée (voir `options.md` § Décision).
- **Admin `MemberModal`** — toujours hors périmètre (suite possible, feature séparée).
- Restructuration du découpage en étapes de `/register` (nombre d'étapes, logique de navigation) — **garde ses 4 étapes telles quelles**, décision actée.
- Tout changement de champ, de validation, de table Supabase ou de route API.

## Contraintes / contexte
- Décision d'options détaillée : `docs/features/profil-register-desktop/options.md` § Décision.
- Lot 1 (référence d'implémentation pour la cohérence visuelle) : `app/pages/profil.vue`, voir `review.md`.
- `app/pages/register.vue` : wrapper `max-w-xl`, parcours en 4 étapes (`currentStep`), étape 2 utilise `AuthProfileFieldsForm` (slot `after-identity` pour la carte Connexion).
- `app/pages/completer-profil.vue` : wrapper `max-w-xl`, utilise `AuthProfileFieldsForm` et `AuthChildrenForm`, puis `POST /api/profile/complete`.
- `app/components/auth/ProfileFieldsForm.vue` : cartes Identité/Adresse, téléphone l. 46-52 (**ne pas toucher**) ; `app/components/auth/ChildrenForm.vue` : carte `rounded-3xl p-8`.
- Compte de test `+incomplete` : créé sur le projet dev (`ybtnnogxukfldurozqwa`), email confirmé, même mot de passe que `TEST_USERS_PASSWORD` — profil non complété, pour capturer le vrai écran `/completer-profil`.
- Charte de couleurs : `CLAUDE.md` § Couleurs du projet. NuxtUI 4.3 / TailwindCSS 4 : classes `@theme`, pas de hex en dur (`check.mjs`).
- Accessibilité : contrastes AA, navigation clavier complète, pas de piège de focus.
- `docs/conventions.md` § « Mise en page desktop (pages à cartes) » (ajoutée au lot 1) : pattern de référence à réutiliser (conteneur `lg:max-w-5xl`, colonnes indépendantes si cartes conditionnelles, barre d'actions collante `lg`-only).

## Côté Storyblok
Aucun — option A ne touche à aucun blok Storyblok.
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | aucun changement Storyblok dans ce lot |
