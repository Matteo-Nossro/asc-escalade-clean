# Revue — profil-register-desktop

## Lot 1 — /profil seul

> Diff relu : `git diff -- app/pages/profil.vue` · Date : 2026-11-02 · Verdict : ✅ OK

### Bloquant
- —

### Important
- —

### Mineur
- `app/pages/profil.vue:487` — fond de la barre collante `lg:bg-gray-100` (couleur plate) alors que la page a un fond en dégradé `from-gray-50 to-gray-100` (`l. 2`) : opaque donc conforme au critère (pas de transparence laissant voir le contenu qui défile), mais peut créer une très légère ligne de démarcation visible selon la position de scroll. Pas bloquant, à surveiller sur la capture 1440 lors de la validation utilisateur.

### Vérifications
- ☑ `check.mjs` : 0 erreur, 0 avertissement.
- ☑ `npm run typecheck` : 186 erreurs = baseline, 0 nouvelle (fichier du diff inclus).
- ☑ Critères d'acceptation de la spec remplis :
  - `lg:max-w-5xl` sur le conteneur (l. 3), `max-w-xl` conservé comme valeur par défaut sous `lg`.
  - Deux colonnes indépendantes `lg:flex` (l. 24-25, 337) : cartes 1-4 à gauche, 5-7 à droite — pas de `grid` à lignes alignées, donc pas de trou possible même si des cartes conditionnelles sont absentes.
  - `xl:grid-cols-3` appliqué uniquement à la grille « Infos club » — non appliqué aux grilles 2 champs : choix cohérent avec « quand c'est pertinent ».
  - Barre d'actions collante `lg:sticky lg:bottom-0 lg:z-20`, fond opaque, bordure supérieure, `lg:pb-28` de compensation. Comportement mobile absent sous `lg`, conforme.
  - Bouton « Enregistrer » : `block` conservé + `lg:w-auto` et `lg:justify-end` — correctement restauré après le correctif signalé dans `status.md`.
  - Aucune classe `order-*` : ordre de tabulation = ordre DOM.
  - `vp-green` jamais en texte sur fond blanc.
  - Espacement mobile `space-y-6 lg:space-y-4` : capture 390 à 0 % d'écart.
  - Aucun fichier hors `app/pages/profil.vue` modifié ; aucune route API, aucune migration.
  - Champ téléphone : classes et logique inchangées.
- ☑ Logique / SSR / cas limites : aucune logique touchée, pas d'accès `window`/`document` ajouté.
- ☑ Sécurité : aucun secret, aucune route `server/api` touchée.
- N/A Images Storyblok / GSAP (page non concernée).
- ☑ Migration BDD : aucune.
- ☑ Porte de qualité : `npm test` 719/719, typecheck 0 nouvelle erreur, comparaison e2e `profil-390` à 0 % d'écart.

---

## Lot 2 — /register et /completer-profil

> Diff relu : `app/components/auth/ProfileFieldsForm.vue`, `app/components/auth/ChildrenForm.vue`, `app/pages/register.vue`, `app/pages/completer-profil.vue` · Date : 2026-11-02 · Verdict : ✅ OK

### Bloquant
- —

### Important
- —

### Mineur
- Indentation non réalignée dans `ProfileFieldsForm.vue` (l. 5-58) après l'ajout du wrapper englobant Identité + slot : le contenu de la carte Identité garde son indentation d'origine au lieu d'être décalé d'un niveau. Purement cosmétique (pas de risque fonctionnel, confirmé par `check.mjs` et les captures à 0 % d'écart), mais à nettoyer à l'occasion pour la lisibilité du diff futur.

### Vérifications
- ☑ `check.mjs` : 0 erreur, 0 avertissement (exit 0, aucune sortie).
- ☑ `npm run typecheck` : 186 erreurs = baseline, 0 nouvelle sur les 4 fichiers du diff.
- ☑ Critères d'acceptation de la spec (§ Lot 2) remplis :
  - `register.vue` et `completer-profil.vue` : conteneur `max-w-xl lg:max-w-5xl`, cohérent avec `/profil`. Les 4 étapes de `register.vue` restent inchangées en séquence/logique (`currentStep` non touché) ; seule la mise en page interne change.
  - Étape 2 de `register.vue` : `AuthProfileFieldsForm` réparti en deux colonnes indépendantes (`lg:flex lg:gap-6 lg:items-start`) directement dans le composant partagé (T1) — colonne 1 = carte Identité + slot `after-identity` (carte Connexion), colonne 2 = carte Adresse. Le slot reste positionné juste après le bloc Identité comme exigé par le plan. Champ téléphone (`ProfileFieldsForm.vue` l. 47-57) et sa validation non touchés.
  - Étape 1 de `register.vue` : cartes adulte/mineur dans un wrapper `lg:flex lg:gap-6 lg:items-start`, chacune `lg:flex-1 lg:min-w-0`, ordre DOM préservé (adulte puis mineur, inchangé).
  - `completer-profil.vue` : même traitement (`AuthProfileFieldsForm` sans slot, `AuthChildrenForm`) ; zone de soumission transformée en barre collante `lg:sticky lg:bottom-0 lg:z-20`, fond opaque `lg:bg-gray-100`, bordure, `lg:pb-28` de compensation sur le conteneur (l. 3) — pattern identique au lot 1, `block` + `lg:w-auto` restaurés à l'identique sur le bouton.
  - Ordre de tabulation = ordre DOM sur les deux pages : aucune classe `order-*` trouvée (grep sur les 4 fichiers).
  - `vp-green` : aucune occurrence en texte sur fond blanc dans les lignes modifiées.
  - 390 px identique à l'existant : `status.md` T3 — `register-390` vs référence `harmonisation-couleurs` : 0 % (0 px, 390×2038) ; `completer-profil-390` avant/après (two-pass) : 0 % (0 px, 390×3760).
  - Aucun changement de logique, de donnée, de route API : `handleSubmit`/`submitRegistration`/`submitWithChildren` (register.vue) et `handleSubmit` (completer-profil.vue) non modifiés dans le diff ; `/api/register` et `/api/profile/complete` non touchées.
- ☑ Split des composants partagés (T1 dans le composant, pas dans les pages) : `ProfileFieldsForm.vue` — l'ajout d'un wrapper interne (Identité+slot / Adresse) ne casse rien pour un futur 3ᵉ usage : le composant reste autonome (le slot `after-identity` fonctionne qu'il soit rempli ou vide), aucune prop/contrat public modifié (`defineModel`, `defineProps` inchangés). `ChildrenForm.vue` — même logique ; cas limite `model.length === 0` vérifié : la carte liste (`v-if`) disparaît simplement, le flex à un seul enfant (formulaire d'ajout) ne casse pas la mise en page (`lg:flex-1` sans second élément = pleine largeur, comportement attendu).
- ☑ Absence de barre collante sur `register.vue` : choix de ui-dev jugé raisonnable et non un oubli — le contenu de chaque étape (1 : 2 cartes de choix + alerte conditionnelle + 1 bouton ; 2 : formulaire réparti en 2 colonnes, donc moins haut qu'en 1 colonne ; 3 : intro + liste/formulaire enfants en 2 colonnes) tient plus facilement sur un écran `lg`/`xl` qu'une seule colonne verticale ; le plan laissait explicitement ce choix à l'appréciation de ui-dev « si le contenu dépasse la hauteur visible », et les captures 1440/1024 (`status.md` T3) ont été fournies pour validation visuelle sans signaler de dépassement.
- ☑ Pièges du lot 1 recontrôlés : aucune classe de layout/espacement/largeur sans préfixe `lg:`/`xl:` ajoutée (grep + lecture ligne à ligne des 4 diffs — les classes `space-y-6`/`space-y-4`/`space-y-3`/`flex` non préfixées présentes sont toutes préexistantes, seulement déplacées d'un niveau de wrapper, sans changement de comportement mobile, confirmé par les captures 390 à 0 %) ; aucun prop NuxtUI (`block`) retiré — présent sur les 4 boutons `block` concernés (étape 1 Continuer, étape 2 Submit, étape 3 Terminer, `completer-profil` Submit), chacun complété par `lg:w-auto`, pattern identique au lot 1.
- ☑ Logique / SSR / cas limites : aucune logique touchée (classes Tailwind uniquement) ; pas d'accès `window`/`document` ajouté ; cas liste d'enfants vide géré (voir ci-dessus).
- ☑ Sécurité : aucun secret, aucune route `server/api` touchée, aucune entrée utilisateur concernée (diff visuel pur).
- N/A Images Storyblok / GSAP (pages non concernées).
- ☑ Migration BDD : aucune, conforme au plan (`plan.md` § Migration / schéma BDD : aucune).
- ☑ Tests / sélecteurs : `data-testid` (`btn-type-adult`, `btn-type-minor`, `btn-register-continue`, `btn-register-submit`, `btn-register-finish`, `btn-complete-submit`, etc.) inchangés dans le diff ; `tests/pages/completer-profil.test.ts` et `tests/pages/register.signup-redirect.test.ts` relancés : 2 fichiers / 5 tests passés. `e2e/auth-profils.spec.ts` non modifié (hors diff).
- ☑ Porte de qualité (recontrôlée) : `npm run typecheck` 186 erreurs = baseline, 0 nouvelle ; comparaisons e2e `register-390` et `completer-profil-390` à 0 % d'écart (`status.md` T3).
- Hors scope de cette revue (non listés dans les 4 fichiers à relire, déjà vérifiés par qa selon `status.md`) : `scripts/seed-test-users.mjs` et `docs/dev/supabase-dev.md` (création du compte de test `+incomplete`, prévue dans `plan.md` § Risques) ; `docs/features/profil-register-desktop/{spec,plan,status}.md` (mise à jour de suivi).
