# Backlog — points en attente des features

> Rassemblé le 2026-11-02 à partir des « Suites » et des mineurs non traités des `status.md` / `review.md` de `docs/features/*`. Chaque point a été revérifié dans le code à cette date ; les points déjà corrigés sont retirés (liste en fin de fichier).
> Taille : **XS** < 30 min · **S** ≤ une demi-journée · **M** une feature (`/feature`, voire `/cadrage`).
> Les lots HelloAsso 2 à 7 (`helloasso-sync-adhesions` … `helloasso-webhook`) et `dette-typecheck` sont des features à part entière, au stade spec : ils ne sont pas détaillés ici.

## Corrections rapides

| # | Point | Feature | Taille |
|---|---|---|---|
| Q29 | **BLOQUANT avant toute mise en prod HelloAsso** (audit des GRANT du 2026-11-03, après désactivation de « Automatically expose new tables »). `20261025_helloasso_socle.sql` s'appuie sur les privilèges par défaut, qui ne sont plus accordés en prod : poussée telle quelle, `service_role` n'aurait ni lecture ni écriture sur `helloasso_tokens` et `helloasso_sync_runs` (jeton et sync HelloAsso cassés), et `authenticated` n'aurait pas le SELECT sur `helloasso_sync_runs` que ses policies prévoient. Correctif : nouvelle migration (jamais réécrire `20261025`, appliquée sur le dev) avec `GRANT SELECT, INSERT, UPDATE, DELETE` à `service_role` sur les deux tables et `GRANT SELECT` à `authenticated` sur `helloasso_sync_runs`, à pousser dans le même `db push` que `20261025`. Le dev n'est pas touché (droits déjà posés avant la désactivation). Autres constats sans action immédiate : `20260520_helloasso.sql` (`helloasso_forms`, `profile_payments`) n'a aucun GRANT, ce qui est sans effet tant qu'elle n'est pas rejouée (déjà présente en prod) ; `20260101_rattrapage_schema.sql:56-69` réactive les privilèges par défaut (`GRANT ALL` à `anon` / `authenticated`) sur tout projet où elle serait **exécutée** (projet neuf) ; les droits actuels des tables historiques (`ALL` à `anon` sur `profiles`, etc., protégés par la seule RLS) sont à réduire au strict nécessaire dans une passe dédiée | helloasso-socle | S |
| Q23 | **PRIORITAIRE** (ex-D7). Nouvelle migration qui fixe `search_path` sur **toutes** les fonctions `SECURITY DEFINER` de `public`. État du dev au 2026-11-02 (`pg_proc`) : `is_admin_or_secretary()`, `has_role(_role text)`, `enrich_profile_from_temps_user()` sans `search_path` ; `handle_new_user()` en `search_path=public` (à aligner sur la valeur retenue). Valeur à trancher au plan : `''` (noms qualifiés `public.` dans les corps) ou `public, pg_temp`. À ajouter si la passe le permet : les 3 fonctions non `SECURITY DEFINER` signalées par l'advisor `function_search_path_mutable` (`handle_updated_at`, `registrations_block_user_status_change`, `profiles_block_payment_change`). Tests d'abord, dans la même passe que Q24 | auth-profils | S |
| Q24 | (ex-D6) T1b : tester le cas « jeton `authenticated` sans `sub` » directement en SQL dans `scripts/check-auth-profils-db.mjs` : transaction avec `set local role authenticated` et `set_config('request.jwt.claims', '{"role":"authenticated"}', true)`, puis `rollback` ; pas de secret JWT | auth-profils | S |
| Q25 | (ex-D2) `app/middleware/auth.global.ts` : en état `error`, bloquer (ou réessayer la lecture du profil) au lieu de laisser un profil incomplet atteindre `/profil`. La lecture unique des rôles par session est acceptée : le serveur revérifie chaque action | auth-profils | S |
| Q26 | (ex-D3) `app/composables/useAuth.ts:24-25` : retirer `loading` et `error` s'ils n'ont toujours aucun lecteur (à revérifier par `Grep` au moment de la passe) | auth-profils | XS |
| Q27 | (ex-D8) Contraste des pastilles `Tag` en `soft` d'au moins **4,5:1** (WCAG AA) : texte plus foncé dans la teinte de la catégorie (aujourd'hui vert ≈ 1,8:1, ambre ≈ 2,1:1, turquoise ≈ 1,9:1), y compris dans `ProchainsEvenements` | harmonisation-couleurs | S |
| Q28 | (ex-D14) `.claude/settings.json:10` : restreindre `Bash(npm run test:e2e *)` aux usages prévus par le plan (règles explicites par cible plutôt qu'un joker) | outillage-tests | XS |
| Q20 | Une seule règle de version Storyblok partout : helper partagé (`?_storyblok` → `draft`, sinon `STORYBLOK_VERSION \|\| 'published'`) utilisé par `useEvents`, `usePosts`, `app/pages/[...slug].vue`, `app/pages/posts/[slug].vue` et les bloks de liste (`Home/Actualites.vue`, `actualites/Page.vue`, `sorties/Page.vue`). Aujourd'hui, les pages ignorent `STORYBLOK_VERSION` et les bloks de liste ignorent `?_storyblok`. Objectif : dans l'éditeur visuel, toutes les listes montrent les brouillons | suite Q14 | S |
| Q21 | `.claude/skills/asc-rules/scripts/check.mjs`, regroupé avec ex-D9 : (a) étendre la vérification aux `.css` (hors `main.css`), `.js` et `.mjs`, pas aux `.svg` ; (b) ne plus signaler les sélecteurs CSS dont l'identifiant ressemble à un hex (`#add`, `#bad`, `#face`…), devenu nécessaire avec l'extension aux `.css` | harmonisation-couleurs | S |
| Q22 | Règle de saison éclatée : `app/utils/season.ts` (`currentSeasonStart` en `Europe/Paris`, `seasonLabel`), `server/utils/helloasso-season.ts` (`isValidSeason`), migration `20261025_helloasso_socle.sql` (coupure au 1er septembre en `Europe/Paris`), et une 3e copie dans `app/components/GroupsAccordion.vue:226` (`getMonth() >= 8`, heure du navigateur). Cohérentes au 2026-11-02 (même coupure, même format `AAAA-AAAA+1` ; `seasonLabel` produit toujours une valeur acceptée par `isValidSeason`), sauf le fuseau de `GroupsAccordion.vue`. Proposition : un seul module `shared/utils/season.ts` (Nuxt 4, importable côté app et server) avec `currentSeasonStart`, `seasonLabel`, `isValidSeason`, utilisé par `HelloAssoConfig.vue`, `GroupsAccordion.vue` et les routes `helloasso-forms` ; supprimer les deux fichiers actuels et déplacer le test dans `tests/utils/season.test.ts` (+ cas `isValidSeason`) | suite Q15 | S |

## À décider avec moi

| # | Point | Feature | Taille |
|---|---|---|---|
| D1 | Statut des enfants : propager l'activation du parent (« En attente » → « Actif ») aux enfants rattachés ? Un enfant « En attente » peut-il être inscrit à un groupe ? **En attente de l'avis du bureau.** Proposition par défaut : case « Valider aussi les enfants rattachés », cochée par défaut, à la validation du parent ; pas d'inscription en groupe pour un enfant non validé | auth-profils | M |
| D16 | **Décidé : passe 1, en tête** (avec Q23, Q24, D17). Advisor **ERROR** `security_definer_view` : `public.member_directory` (`id, full_name, avatar_url` de **tous** les `profiles`, `security_invoker=false`, `SELECT` à `anon` et `authenticated`) contourne la RLS de `profiles` : aujourd'hui, un visiteur anonyme peut lister le nom de chaque adhérent, enfants compris. Seul lecteur : `useGroups.fetchGroups` (`app/composables/useGroups.ts:66-70`, `id, full_name` du référent et des moniteurs), appelé par `GroupsAccordion` (blok public `tarifs/ListeGroupeAccordeon`, donc `anon`), `/mes-inscriptions` (adhérent) et `/admin/dashboard` (staff). Passer en `security_invoker = true` seul ferait perdre les noms à `anon` et aux adhérents (ils ne lisent dans `profiles` que leur ligne et celles de leur famille) : la manière de garder ces noms visibles reste à choisir (voir la passe 1) | auth-profils | S |
| D17 | **Décidé : même migration que Q23.** Retirer `EXECUTE` à `anon` / `authenticated` (et `PUBLIC`) sur les fonctions de trigger `handle_new_user` (trigger `on_auth_user_created`) et `enrich_profile_from_temps_user` (trigger `on_profile_enrich`). `is_admin_or_secretary` et `has_role` restent exécutables par `authenticated`, car 30 policies les appellent (`profiles`, `user_roles`, `roles`, `groups`, `group_*`, `events`, `registrations`, `parent_access`, `profile_payments`, `helloasso_*`, `notification_logs`), toutes en `TO authenticated`. Aucune policy pour `anon`, donc leur `EXECUTE` à `anon` peut être retiré. Le test vérifie que les policies fonctionnent toujours avec les comptes de test | auth-profils | XS |

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
- Décisions du 2026-11-02 sur les « À décider » : D2, D3, D6, D7, D8, D14 passés en corrections (Q25, Q26, Q24, Q23, Q27, Q28), D9 regroupé dans Q21 ; D15 rattaché à la spec `dette-typecheck` (lot 4). Acceptés :
  - D4 (lien d'un e-mail renvoyé hors PKCE) : l'adresse est bien confirmée côté Supabase avant la redirection ; seule la connexion automatique échoue, l'utilisateur se connecte ensuite normalement.
  - D5 (`rate_limited` révèle un compte non confirmé) : comportement natif de GoTrue ; l'information est la même que celle déjà donnée par l'inscription.
  - D10 (`@source inline` de `main.css`) : couplage gardé, expliqué par un commentaire dans `main.css` (pourquoi la ligne existe, quels fichiers en dépendent).
  - D11 (captures aveugles aux nuances proches) : les captures visent la mise en page ; les valeurs de couleur sont couvertes par le test de cohérence (Q13) et `check.mjs`.
  - D12 (`include` Vitest limité à `tests/**`) : règle « tous les tests vont dans `tests/` » ajoutée à la skill `testing` (règle 8).
  - D13 (détail technique dans une erreur h3 en dev) : Nitro le masque en prod ; en dev, ce détail aide au débogage.
- D18 (protection contre les mots de passe compromis désactivée) : réglage manuel du dashboard, noté dans `docs/mise-en-prod.md` § 5 (dev et prod), à activer par l'utilisateur si l'offre le permet.
- D19 (advisor `rls_enabled_no_policy`) : `helloasso_tokens` accepté (accès service role uniquement, voulu). Constat du 2026-11-02 sur `User` et `temps_user`, sans changement : aucune référence dans `app/`, `server/`, `scripts/`, `tests/`, `e2e/` ; 0 ligne chacune sur le dev. `User` n'est utilisée nulle part, même en base. `temps_user` est encore lue par le trigger `on_profile_enrich` (fonction `enrich_profile_from_temps_user`, après chaque insertion dans `profiles`) : la supprimer imposerait de retirer aussi ce trigger.
- enfants-fiabilite : Q1 à Q4 (rôle `parent` accordé après les enfants, compensation journalisée, 23505 ⇒ 409, message 403 neutre) et Q10 (enfants affichés selon les liens `parent_access`) ; puis Q18 (400 « Compte utilisateur introuvable » aligné sur le message neutre) et Q19 (bloc `{}` anonyme retiré de `profil.vue`).
- Petites dettes : Q15 (saison de `HelloAssoConfig.vue` calculée en `Europe/Paris` via `app/utils/season.ts`, testée autour du 1er septembre), Q16 (`setRuntimeConfig` retiré de `tests/utils/nitro.ts`), Q17 (indentation de la carte Identité de `ProfileFieldsForm.vue`).
- harmonisation-couleurs : Q11 (`check.mjs` ignore les hex des commentaires et des textes du template), Q12 (`normalizeKey` sans exception sur une catégorie non textuelle, regex des accents en `̀-ͯ`), Q13 (test de cohérence des couleurs `main.css` / `categoryColors.ts` / `email-theme.ts`).
- auth-profils (`callback.vue`) : Q5 (`catch` sur la redirection, repli sur `callback-auth-error`), Q6 (recovery sans `ensureProfile`), Q7 (code validé au format UUID avant l'échange), Q8 (commentaire « ~500 ms » corrigé), Q9 (limite du compte des lectures commentée).
- « Design ordinateur » de `/profil`, `/register`, `/completer-profil` : fait par profil-register-desktop (lots 1 et 2).
- 4 avertissements couleur de `check.mjs` (`Header.vue`, `register.vue`) : `check.mjs` est vide sur ces fichiers depuis harmonisation-couleurs.
- Barre collante de `/profil` en `lg:bg-gray-100` sur fond en dégradé : captures 1440 validées par l'utilisateur le 2026-11-02.
- helloasso-socle : contournement `fetchProfile()` et partage des rôles (auth-profils), C1 à C4, `isValidSeason` extraite, 500 à message générique.
- auth-profils : R1-a à R1-e, mineurs R2 n° 1, 3, 4, 5 (R2b), enfant orphelin (R1-e), doc AP01.
- outillage-tests : mineurs du script de baseline et sélecteur du smoke (corrigés), `@vitest/coverage-v8` ajouté.
- Pour mémoire, sans action : écarts de valeur acceptés (`#F0FDF4` → `#EFFDF5`, `#374151` → `#364153`, `#6B7280` en hex pour `Tag`).
