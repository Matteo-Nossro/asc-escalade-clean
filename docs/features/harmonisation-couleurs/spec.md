# Spec — Harmonisation des couleurs du site

> Slug : `harmonisation-couleurs` · Créée le : 2026-10-29 · Transverse : non (aucun flux d'auth, aucune table ; refacto de style sans refonte du design)
> **Tests d'abord : non** (affichage pur ; le garde-fou est check.mjs).

## Objectif
Les couleurs du site sont dispersées : plusieurs jeux de couleurs de catégories de posts, des hex et des gris Tailwind codés en dur dans les composants. On veut une source unique par usage (module unique pour les catégories, tokens `@theme` Tailwind 4 pour la charte) et un garde-fou automatique (check.mjs) qui empêche le retour des hex codés en dur.

## Critères d'acceptation
- [ ] **Catégories de posts** : les jeux existants (`colors.json`, `posts/[slug].vue`, `Home/Actualites.vue`, `actualites/Page.vue`, et tout autre trouvé) sont inventoriés avec leurs usages ; l'utilisateur choisit le jeu de référence ; un module unique est créé et tous les consommateurs l'importent (plus aucune table de couleurs de catégories ailleurs).
- [ ] **Tokens de charte** : les couleurs de la charte et leurs variantes sont déclarées dans le bloc `@theme` de `main.css`, en reprenant les variables existantes (`--vp-*`…). La valeur de `--vp-green-hover` (`#6bc745`, faute de frappe probable pour `#6bc546`) est tranchée par l'utilisateur.
- [ ] **Remplacements** : les hex, gris et couleurs Tailwind codés en dur dans les composants sont remplacés par les classes ou variables correspondantes, **à rendu identique** (même valeur calculée).
- [ ] **#5ab43a** (`register.vue`, `profil.vue`) : son usage est expliqué à l'utilisateur, qui décide (token dédié, alignement sur un token existant, ou autre) avant tout changement.
- [ ] **check.mjs** : une fois à zéro avertissement sur les couleurs, toute couleur hex codée en dur hors du fichier de thème est remontée en **ERREUR**.
- [ ] `node .claude/skills/asc-rules/check.mjs` ne renvoie rien sur tout le projet.
- [ ] Aucun changement visuel hormis l'unification des couleurs de catégories (et, le cas échéant, la correction de `--vp-green-hover` si l'utilisateur la valide).
- [ ] `npm test` et `npm run typecheck` passent.

## Parcours utilisateur (e2e)
- Aucun

## Hors périmètre
- Refonte du design, nouvelles couleurs, changement de palette.
- Couleurs saisies dans Storyblok (données CMS), sauf si elles transitent par un des jeux de catégories inventoriés.

## Contraintes / contexte
- Charte : voir tableau « Couleurs du projet » de CLAUDE.md (`#0F1729`, `#7FD857`, `#6bc546`, `#1a2740`).
- TailwindCSS 4 via NuxtUI 4.3 : tokens dans `@theme` de `app/assets/css/main.css` (à confirmer par l'explorer).
- **Décisions utilisateur (2026-10-29, après exploration)** :
  1. **Catégories** = union des tables hex (aucune ne se contredit) : Falaise / Sortie Falaise / Infrastructure `#7FD857`, Bloc `#4ECDC4`, Stage `#9333EA`, Climb Up `#F97316`, Cime Altitude `#2563EB`, Compétition `#EF4444`, Événement `#F59E0B`, Club `#3B82F6`, Formation `#8B5CF6`, Partenariat `#10B981`, Vie du club `#3B82F6` (= Club), défaut `#7FD857`. `Home/ProchainsEvenements.vue` (noms NuxtUI `warning`/`error`… passés à `Tag.vue`, qui attend du hex) bascule sur ce module : seul changement visuel accepté. `colors.json` cesse d'être une source (check.mjs lit le thème ou le module).
  2. **`--vp-green-hover`** corrigé en `#6bc546` (inutilisé aujourd'hui → aucun changement visuel) ; cible des remplacements de `#6bc546`.
  3. **`#5ab43a`** (texte d'un critère de mot de passe validé, `register.vue:163`, `profil.vue:80`) → token dédié dans `@theme` (ex. `--vp-green-check`), même valeur.
  4. **Gris** : seuls les hex et classes arbitraires `[#…]` sont remplacés (par la classe de palette Tailwind ou le token équivalent, à valeur identique) ; les classes de palette existantes (`text-gray-400`, `bg-slate-100`…) restent.
- Hypothèse (non posée) : les e-mails HTML de `server/api/admin/send-email.post.ts` et `server/api/contact.post.ts` exigent des hex inline ; leurs couleurs sont centralisées dans un module serveur unique (ex. `server/utils/email-theme.ts`), déclaré comme second fichier de thème autorisé par check.mjs.
- Hypothèse : les SVG/assets statiques et les fichiers de config (ex. `app.config.ts`, manifest, meta `theme-color`) peuvent être exclus de la règle d'erreur de check.mjs s'ils ne peuvent pas consommer une variable CSS — liste exacte à proposer par le planner.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok à créer |
