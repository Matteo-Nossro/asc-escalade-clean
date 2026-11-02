# Options — profil-register-desktop

> Cadrage du 2026-10-29 · Rédigé par : planner (opus, mode options) · Aucun plan d'implémentation ici.

## Besoin
Adapter `/profil`, `/register` et `/completer-profil` aux écrans d'ordinateur. Aujourd'hui, ces pages sont la version mobile centrée dans un conteneur `max-w-xl` d'environ 576 px. Sur un écran de 1440 px, il reste environ 860 px vides, les cartes sont empilées et la page défile beaucoup.
Réponses de l'utilisateur :
- Priorité : confort, sans échéance.
- Utilisateurs sur grand écran : surtout le bureau et l'admin, qui saisissent ou corrigent des informations pour les adhérents.
- Contraintes : NuxtUI, tokens de la charte (`vp-dark`, `vp-green`, etc.), accessibilité (contrastes, clavier).
- Le **champ téléphone et sa validation ne changent pas**.
- Le mobile doit rester identique.

## Existant réutilisable / impacté
- `app/pages/profil.vue` : wrapper `max-w-xl` (l. 3). Champs **propres à la page** (elle n'utilise pas `ProfileFieldsForm`). Elle contient 7 cartes empilées : mot de passe (l. 24), famille et enfants (l. 107), en-tête avatar et rôles (l. 206), infos perso (l. 250), adresse (l. 333), photo (l. 423), infos club en lecture seule (l. 447). Le bouton Enregistrer et les messages viennent en fin de page (l. 486-510).
- `app/pages/register.vue` : wrapper `max-w-xl`. Le parcours est **déjà en 4 étapes** (`currentStep` : 1 type adulte/mineur, 2 formulaire, 3 enfant, 4 confirmation). L'étape 2 utilise `AuthProfileFieldsForm` et y insère la carte « Connexion » par le slot `after-identity`.
- `app/pages/completer-profil.vue` : wrapper `max-w-xl`. Utilise `AuthProfileFieldsForm` et `AuthChildrenForm`, puis `POST /api/profile/complete`.
- `app/components/auth/ProfileFieldsForm.vue` : cartes Identité (l. 4) et Adresse (l. 64), grilles internes `sm:grid-cols-2`, téléphone l. 46-52 (**ne pas toucher**).
- `app/components/auth/ChildrenForm.vue` : carte `rounded-3xl p-8`, grilles internes `sm:grid-cols-2`.
- `app/composables/useStoryblokConfig.ts` : lit `global/site-config` dans Storyblok (utile seulement pour l'option C).
- Correction de l'existant : `ProfileFieldsForm` et `ChildrenForm` ne sont utilisés **que** par `register.vue` et `completer-profil.vue`. `admin/MemberModal` ne les importe pas, donc il n'est pas impacté.
- Tests : `tests/pages/completer-profil.test.ts` et les parcours `e2e/auth-profils.spec.ts` et `e2e/email-link.spec.ts`. `e2e/visual/captures.spec.ts` prend des captures par largeur d'écran (sans assertion visuelle) et peut servir à la vérification.

## Option A — Grille élargie (responsive pur)
- **Principe** : on garde la structure des pages et on change seulement les classes Tailwind au-delà de `lg`. Le conteneur passe de `max-w-xl` à environ `lg:max-w-5xl`. Les cartes sont rangées en grille 2 colonnes (par exemple Identité | Connexion/Adresse, Infos perso | Adresse, Photo | Infos club). Les champs internes passent à 3 colonnes en `xl` quand c'est pertinent. Les boutons d'action prennent une largeur automatique et sont alignés à droite. `/register` garde ses étapes et seule l'étape 2 passe en 2 colonnes. Les cartes de choix de l'étape 1 sont côte à côte.
- **Réutilisé** : tous les composants et toute la logique · **Créé** : rien.
- **Storyblok** : rien.
- **Supabase** : aucun changement.
- **API** : aucune.
- **Complexité** : S · ~5 fichiers (3 pages + `ProfileFieldsForm` + `ChildrenForm`).
- **Risques** :
  - Cartes de hauteurs inégales, donc des trous dans la grille (à traiter avec un `items-start` ou des regroupements).
  - L'ordre de tabulation doit suivre l'ordre DOM : pas d'`order-*` CSS.
  - La lecture en Z sur 2 colonnes peut dérouter dans un formulaire.
- **Difficile à changer ensuite** : rien, ce ne sont que des classes.
- **Évolutivité** : rapide et réversible. N'apporte pas de repère de navigation si `/profil` s'allonge encore.

## Option B — Coquille commune « sommaire latéral + barre d'actions collante »
- **Principe** : un composant de mise en page partagé est utilisé par les 3 pages. À gauche (`lg`), une colonne collante liste les sections. Elle sert à naviguer par ancres, indique la section visible et signale les sections en erreur ou incomplètes. À droite, le formulaire reste dans une colonne lisible d'environ 720 px, avec ses champs en 2 colonnes. Une barre collante en bas garde Enregistrer ou Suivant toujours visible. Sur `/register`, la colonne de gauche devient un indicateur d'étapes vertical (type, compte, enfants, confirmation).
- **Réutilisé** : les cartes et la logique existantes · **Créé** : 1 composant de mise en page (`app/components/auth/`) et 1 composable front qui suit la section visible (IntersectionObserver).
- **Storyblok** : rien.
- **Supabase** : aucun changement.
- **API** : aucune.
- **Complexité** : M · ~7-8 fichiers (3 pages, 2 formulaires partagés, coquille, composable, test du composable).
- **Risques** :
  - La colonne collante doit tenir compte de la hauteur du header du site.
  - Au clic sur une ancre, il faut déplacer le focus (a11y : `nav` avec `aria-label` et `aria-current`).
  - La remontée « erreur par section » oblige les pages à exposer leurs erreurs par groupe.
  - Sur mobile, la coquille doit disparaître proprement.
- **Difficile à changer ensuite** : le découpage en sections nommées devient un contrat entre la coquille et les pages.
- **Évolutivité** : convient si `/profil` grossit (documents, certificats, paiements) et se réutilise pour d'autres longs formulaires. En revanche, la page reste longue : on navigue mieux, mais on ne voit pas tout à la fois.

## Option C — Deux volets « contexte | saisie », panneau d'accompagnement éditable dans Storyblok
- **Principe** : on sépare ce qui est **contexte** de ce qui est **saisi**.
  - `/profil` : à gauche, une fiche collante (avatar, nom, rôles, licence, infos club en lecture seule, sélecteur moi/enfants, lien mot de passe). À droite, seulement les cartes éditables (infos perso, adresse, photo).
  - `/register` et `/completer-profil` : à gauche, un panneau d'accompagnement avec le rappel du choix adulte/mineur, les enfants déjà ajoutés, les pièces à prévoir et un contact du bureau. Ses textes viennent de Storyblok. À droite, le formulaire.
- **Réutilisé** : les formulaires partagés et `useStoryblokConfig` · **Créé** : 1 composant fiche de profil (extrait de `profil.vue`), 1 composant panneau d'accompagnement, et de nouveaux champs dans `site-config`.
- **Storyblok** : le bureau peut modifier les textes du panneau (aide à l'inscription, pièces à fournir, contact), par exemple avec 2 ou 3 champs rich-text dans `global/site-config` à créer à la main.
- **Supabase** : aucun changement.
- **API** : aucune.
- **Complexité** : M/L · ~9 fichiers (3 pages, 2 nouveaux composants, `useStoryblokConfig`, `docs/storyblok.md`, tests) plus la saisie des champs dans Storyblok.
- **Risques** :
  - Gros remaniement de `profil.vue`, qui compte plus de 950 lignes, avec la logique famille et `isEditingChild` ainsi que la requête `parent_access` (l. 948) : risque de régression sur le changement de profil enfant.
  - Dépendance à Storyblok sur des pages d'authentification (comportement si le contenu manque, SSR).
- **Difficile à changer ensuite** : le découpage contexte/saisie de `profil.vue` et le contenu Storyblok dont le bureau dépendra.
- **Évolutivité** : c'est la meilleure base pour un vrai « espace adhérent » (fiche, statut, documents) et pour une aide éditoriale. Elle demande l'effort le plus important pour un gain de confort.

## Comparatif
| Critère | A | B | C |
|---|---|---|---|
| Complexité (S/M/L) · fichiers | S · ~5 | M · ~7-8 | M/L · ~9 + Storyblok |
| Éditable par le bureau (Storyblok) | non | non | oui (textes d'aide) |
| Changement Supabase | aucun | aucun | aucun |
| Nouvelles routes API | aucune | aucune | aucune |
| Risque principal | trous dans la grille, ordre de lecture | header collant, a11y des ancres, contrat de sections | régression de la logique famille de `profil.vue` |
| Évolutivité | limitée, mais réversible | bonne pour des formulaires plus longs | base d'un espace adhérent |

## Recommandation
**Option A**, avec un emprunt facultatif à B : la barre d'actions collante. C'est un besoin de confort sans échéance, et A le traite avec le moins de risque, en ne touchant que des classes : ni logique ni téléphone ne changent. Pour le bureau, qui corrige des fiches, voir toutes les cartes sur un ou deux écrans compte plus qu'un sommaire (B) ou un panneau d'aide (C). On pourra ajouter B ou C plus tard sans défaire A.
Points à surveiller : ordre de tabulation égal à l'ordre DOM, `vp-green` réservé aux fonds et icônes (contraste insuffisant en texte sur blanc), mobile inchangé à vérifier avec `e2e/visual/captures.spec.ts`.

## Questions ouvertes
- `/profil` ne modifie que **son propre** compte et celui de ses enfants. Le bureau qui corrige la fiche d'un **autre** adhérent passe par l'admin (`MemberModal`), qui n'est pas dans ce périmètre. Faut-il l'inclure ?
- Quelle largeur cible sur desktop : environ 1024 px (`max-w-5xl`) ou environ 1152 px (`max-w-6xl`) ? À partir de quel point de rupture : `lg` (1024) ou `xl` (1280) ?
- `/completer-profil` n'a pas encore été vu sur desktop. Il faut une capture avec un compte au profil incomplet.
- `/register` est déjà en étapes. Faut-il garder exactement ce découpage en 4 étapes ?

## Décision
- **Option retenue** : A (grille élargie), avec la barre d'actions collante empruntée à B.
- **Ajustements** : largeur cible `max-w-5xl`, rupture à `lg` (1024 px). `/register` garde son découpage en 4 étapes tel quel. `/profil` est implémenté et validé seul avant d'étendre à `/register` et `/completer-profil` (voir `spec.md`).
- **Raisons** : besoin de confort sans échéance ; A offre le meilleur rapport confort/risque (classes Tailwind uniquement, ni logique ni téléphone touchés) ; le bureau, qui corrige des fiches, profite surtout de voir toutes les cartes sur un ou deux écrans plutôt que d'un sommaire ou d'un panneau d'aide.
- **Options écartées** :
  - B (sommaire latéral + barre collante complète) — la coquille de layout partagée et le composable de suivi de section apportent plus de risque (header collant, a11y des ancres, contrat de sections) pour un gain marginal vu que A + barre d'actions seule couvre déjà le besoin exprimé. Seule la barre d'actions collante est reprise.
  - C (deux volets contexte/saisie, panneau Storyblok) — remaniement trop lourd de `profil.vue` (950+ lignes, logique famille) pour un besoin de confort sans échéance ; écarté pour ce lot, reste une évolution possible plus tard.
- **MemberModal (admin)** : hors périmètre de cette feature — noté dans `spec.md` § Hors périmètre / Suites.
- **Date** : 2026-10-29
