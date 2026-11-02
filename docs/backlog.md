# Backlog — points en attente des features

> Rassemblé le 2026-11-02 à partir des « Suites » et des mineurs non traités des `status.md` / `review.md` de `docs/features/*`. Chaque point a été revérifié dans le code à cette date ; les points déjà corrigés sont retirés (liste en fin de fichier).
> Taille : **XS** < 30 min · **S** ≤ une demi-journée · **M** une feature (`/feature`, voire `/cadrage`).
> Les lots HelloAsso 2 à 7 (`helloasso-sync-adhesions` … `helloasso-webhook`) et `dette-typecheck` sont des features à part entière, au stade spec : ils ne sont pas détaillés ici.

## Corrections rapides

| # | Point | Feature | Taille |
|---|---|---|---|
| Q1 | `server/utils/completeProfile.ts:119-128` : le rôle `parent` est accordé avant la création des enfants et la compensation ne le retire pas ; l'accorder après les enfants | auth-profils | S |
| Q2 | `server/utils/completeProfile.ts:172-178` : la compensation ignore ses propres erreurs ; au minimum les journaliser | auth-profils | XS |
| Q3 | `server/utils/completeProfile.ts:102` : sans ligne créée par le trigger, deux insertions simultanées donnent 500 (clé primaire) au lieu de 409 | auth-profils | XS |
| Q4 | `server/api/register.post.ts:60` : 403 « Identité non vérifiée » brut pour un compte non confirmé qui refait un `signUp` plus d'une heure après ; message plus clair | auth-profils | XS |
| Q5 | `app/pages/callback.vue:277` : `void redirectConnected(type)` sans `catch` ; une erreur de navigation laisse la page sur « Connexion en cours… » | auth-profils | XS |
| Q6 | `app/pages/callback.vue:225-229` : la redirection de recovery attend `ensureProfile()` dont elle n'a pas besoin ; tester `recovery` avant la lecture | auth-profils | XS |
| Q7 | `app/pages/callback.vue:259` : `code` non validé au format UUID avant `exchangeCodeForSession` (sans conséquence, Supabase refuse) | auth-profils | XS |
| Q8 | `tests/pages/callback.link-error.test.ts:100` : commentaire « ~500 ms » périmé depuis R2b-4 | auth-profils | XS |
| Q9 | `tests/middleware/auth.global.code-return.test.ts:107-117` : le compte des lectures ne détecte plus seul un `ensureProfile` parasite ; commenter la limite ou renommer le test | auth-profils | XS |
| Q10 | `app/pages/profil.vue:958` et `app/components/admin/modals/MemberModal.vue:192` : les enfants ne sont chargés / affichés que si le rôle `parent` est coché ; s'appuyer sur l'existence de liens `parent_access` | auth-profils | S |
| Q11 | `.claude/skills/asc-rules/scripts/check.mjs:129-144` : faux positifs en ERREUR sur les hex des commentaires, textes et sélecteurs ; passer le source dans `mask(src, false)` avant la recherche (prioritaire dès qu'il bloque une édition légitime) | harmonisation-couleurs | S |
| Q12 | `app/utils/categoryColors.ts:41-52` : `normalizeKey` lève une exception sur une catégorie non textuelle (objet, nombre) ; `typeof` dans `getCategoryColor`, regex des accents en `̀-ͯ` | harmonisation-couleurs | XS |
| Q13 | Aucun test ne vérifie l'alignement des valeurs dupliquées (`#7FD857`, `#0F1729`) entre `main.css`, `categoryColors.ts` et `email-theme.ts` | harmonisation-couleurs | XS |
| Q14 | `app/composables/useEvents.ts:7` ignore le mode prévisualisation (`?_storyblok`) : le bureau ne peut pas prévisualiser un événement avant publication | harmonisation-couleurs | S |
| Q15 | `app/components/admin/HelloAssoConfig.vue:211-214` : saison en cours calculée à l'heure du navigateur, la migration utilise `Europe/Paris` (écart possible le 1er septembre vers minuit) | helloasso-socle | XS |
| Q16 | `tests/utils/nitro.ts:62-77` : `setRuntimeConfig` est sans effet sous l'environnement `nuxt` ; le retirer ou le marquer déprécié (piège pour les lots HelloAsso) | outillage-tests | XS |
| Q17 | `app/components/auth/ProfileFieldsForm.vue:5-58` : indentation de la carte Identité non réalignée après l'ajout du wrapper | profil-register-desktop | XS |

## À décider avec moi

| # | Point | Feature | Taille |
|---|---|---|---|
| D1 | Statut des enfants : propager l'activation du parent (« En attente » → « Actif ») aux enfants rattachés ? Un enfant « En attente » peut-il être inscrit à un groupe ? | auth-profils | M |
| D2 | `app/middleware/auth.global.ts` : en état `error`, la règle de complétion est sautée (un profil incomplet atteint `/profil`) ; rôles lus une fois par session (un retrait d'admin ne se voit qu'au rechargement) | auth-profils | S |
| D3 | `app/composables/useAuth.ts:24-25` : `loading` et `error` partagés entre lecture du profil et actions de connexion ; aucun lecteur aujourd'hui : les séparer ou les retirer | auth-profils | XS |
| D4 | Lien d'un e-mail **renvoyé** (`auth.resend`) : jeton hors PKCE, retour en `#access_token=…` que le client PKCE n'exploite pas (noté sans correction) ; pistes : `verifyOtp` + modèle `token_hash`, ou lecture du hash dans `callback.vue` | auth-profils | M |
| D5 | `resendSignupConfirmation` : `rate_limited` n'est renvoyé que pour un compte existant non confirmé (témoin d'existence, comportement GoTrue accepté) ; à garder pour mémoire ou classer | auth-profils | XS |
| D6 | T1b : le cas « jeton `authenticated` sans `sub` » n'est pas testé par `scripts/check-auth-profils-db.mjs` (il faut le secret JWT) | auth-profils | S |
| D7 | `is_admin_or_secretary()` en `SECURITY DEFINER` sans `search_path` (`20260101_rattrapage_schema.sql:416`) ; durcissement par une nouvelle migration | auth-profils | S |
| D8 | Contraste des pastilles `Tag` en `soft` sous AA (vert ≈ 1,8:1, ambre ≈ 2,1:1, turquoise ≈ 1,9:1), étendu à `ProchainsEvenements` | harmonisation-couleurs | S |
| D9 | `check.mjs` ne couvre que `.vue` / `.ts` (pas les `.css` hors `main.css`, `.js` / `.mjs`, `public/*.svg`) ; aucun hex dans ces fichiers aujourd'hui | harmonisation-couleurs | S |
| D10 | `main.css:63` `@source inline("bg-gray-200 text-gray-700")` : couplage implicite avec les `<style>` de `Header.vue` et `posts/[slug].vue` ; tokens `--vp-*` dédiés ? | harmonisation-couleurs | S |
| D11 | Captures de non-régression aveugles aux nuances proches (`#7FD857` → `#6bc546` passe) ; survol, focus, modales, onglets admin non capturés | harmonisation-couleurs | S |
| D12 | `vitest.config.ts:23-24` : `include` limité à `tests/**` ; un test placé ailleurs ne tournerait pas, sans bruit | helloasso-socle | XS |
| D13 | En dev, le `message` d'une erreur h3 non gérée peut contenir du détail technique (masqué en prod par Nitro) ; probablement à classer sans suite | helloasso-socle | XS |
| D14 | `.claude/settings.json:10` : la règle `Bash(npm run test:e2e *)` ouvre des arguments arbitraires à Playwright, au-delà du plan | outillage-tests | XS |
| D15 | Les fichiers de `tests/` (dont `supabase-mock.ts`, `nitro.ts`) sont hors du tsconfig Nuxt : non vérifiés par `npm run typecheck` | outillage-tests | S |

## Lié à un futur lot HelloAsso

| # | Point | Feature | Taille |
|---|---|---|---|
| H1 | Lot 2 : ajout de formulaire en saisie libre (n'importe quel slug accepté) ; remplacer par un choix dans `GET /v5/organizations/{slug}/forms`, à défaut valider le slug côté serveur | helloasso-socle | M |
| H2 | Lot 2 : libellé d'un formulaire non modifiable (PATCH limité à `active` / `season`) et aucune route DELETE (FK `profile_payments.form_id` en `ON DELETE RESTRICT`) | helloasso-socle | M |
| H3 | Lot 2 : `form_type` non validé par `helloasso-forms.post.ts` (seul le CHECK de la base) | helloasso-socle | XS |
| H4 | Lot 2 : `[id].patch.ts` avec un `id` non UUID → 500 (22P02) au lieu de 400 / 404 | helloasso-socle | XS |
| H5 | Lot 2 : un slug réduit à `..` n'est pas neutralisé par l'encodage de la sync (risque négligeable) | helloasso-socle | XS |
| H6 | `server/utils/helloasso.ts:138` : `Retry-After` posé sur `h3.headers` que Nitro n'applique pas ; helper commun pour les futures routes | helloasso-socle | S |
| H7 | `server/utils/helloasso.ts:240-254, 358-372` : `writeAsHolder` avale les erreurs (un refresh tourné peut être perdu) ; TTL du verrou 20 s contre timeout 15 s, marge serrée | helloasso-socle | S |
| H8 | `server/utils/helloasso.ts:316-323` : l'attente du verrou sonde 10 s même si l'autre renouvellement a échoué, puis `lock_timeout` | helloasso-socle | S |
| H9 | Lot 7 : secret du webhook dans l'URL (`?secret=`), risque de journalisation ; en-tête si HelloAsso le permet, sinon rotation régulière | helloasso-socle | S |
| H10 | Lot 7 : comparaison du secret en temps constant (`helloasso.post.ts:22`, `!==` aujourd'hui) | helloasso-socle | XS |
| H11 | Lot 7 : revérifier chaque notification auprès de l'API HelloAsso avant toute écriture | helloasso-socle | M |

## Mise en prod

| # | Point | Feature | Taille |
|---|---|---|---|
| P1 | Doublon `(Membership, test-rls)` dans `helloasso_forms` à traiter à la main avant `20261025` (vérifier d'abord `profile_payments`, FK `ON DELETE RESTRICT`) ; `docs/mise-en-prod.md` §3 | helloasso-socle | S |
| P2 | `NUXT_HELLOASSO_ENVIRONMENT=production` obligatoire ; T1b ne couvre pas le remplissage de `season` sur les lignes existantes (relecture manuelle, §3 étape 5) | helloasso-socle | XS |
| P3 | `/callback**` dans les URLs de redirection Supabase de prod **avant** de déployer auth-profils R2 (`docs/mise-en-prod.md` §5) | auth-profils | XS |
| P4 | Contrôle visuel des badges de `ProchainsEvenements` avec un événement de test en brouillon (catégorie inconnue → gris) | harmonisation-couleurs | XS |

## Retirés (corrigés ou clos depuis)
- « Design ordinateur » de `/profil`, `/register`, `/completer-profil` : fait par profil-register-desktop (lots 1 et 2).
- 4 avertissements couleur de `check.mjs` (`Header.vue`, `register.vue`) : `check.mjs` est vide sur ces fichiers depuis harmonisation-couleurs.
- Barre collante de `/profil` en `lg:bg-gray-100` sur fond en dégradé : captures 1440 validées par l'utilisateur le 2026-11-02.
- helloasso-socle : contournement `fetchProfile()` et partage des rôles (auth-profils), C1 à C4, `isValidSeason` extraite, 500 à message générique.
- auth-profils : R1-a à R1-e, mineurs R2 n° 1, 3, 4, 5 (R2b), enfant orphelin (R1-e), doc AP01.
- outillage-tests : mineurs du script de baseline et sélecteur du smoke (corrigés), `@vitest/coverage-v8` ajouté.
- Pour mémoire, sans action : écarts de valeur acceptés (`#F0FDF4` → `#EFFDF5`, `#374151` → `#364153`, `#6B7280` en hex pour `Tag`).
