# Revue — auth-profils

> Diff relu : `git diff HEAD` + fichiers non suivis de status.md · Date : 2026-10-29 · Verdict : ✅ OK après la boucle R1 (0 bloquant, 0 important ; voir « Revue R1 » en bas). Verdict de la première revue : ⚠️ corrections (0 bloquant, 1 important)

## Bloquant
- —

## Important
- [TRAITÉ R1-a] `server/api/register.post.ts:69` (api-dev) — `grantParentRole: true` en dur, alors que `server/api/profile/complete.post.ts:26` ne donne `parent` qu'avec des enfants. Un compte Google/Microsoft connecté peut appeler `/api/register` avec son propre id et son propre e-mail (la session correspond, `last_sign_in_at` et l'ancienneté sont ignorés) : il obtient `parent` sans enfant, ce qui contourne C2. Pas d'escalade de privilège (n'importe qui obtient `parent` en s'inscrivant par e-mail), et c'est le comportement du HEAD, d'où « important » et non bloquant. Correction : décider d'une règle unique. Soit `register` garde `parent` toujours (inscription publique) et on refuse l'appel avec session dont le compte est OAuth, soit les deux routes appliquent « `parent` seulement avec enfants ». À trancher avec l'utilisateur (spec C2 vs comportement d'avant).

## Mineur
- [TRAITÉ R1-e] `server/utils/completeProfile.ts:72-80` et `:123-131` (api-dev) — 409 et déduplication des enfants non atomiques (lecture puis écriture). Risque réel faible : sans session il faut l'UUID de `signUp` et le même e-mail, donc seul le propriétaire du compte peut agir. Seul effet d'un double envoi concurrent (deux requêtes parallèles) : enfants en double, ou deux compléments successifs identiques. Aucun profil d'autrui n'est atteignable. Correction possible : « réserver » d'abord avec `update … is('profile_completed_at', null)` (ou une transaction RPC), ou verrouiller le bouton (déjà `submitting` côté UI).
- Même fichier, `:164-168` — le parent est marqué complété en dernier (voulu) ; en cas d'échec après la création des enfants, la reprise ne les recrée pas (garde `parent_access`) mais un enfant inséré sans son `parent_access` resterait orphelin. Cas rare, sans effet de sécurité.
- `server/api/register.post.ts:56-62` (api-dev) — un utilisateur qui a perdu la première tentative (échec réseau) et qui refait un `signUp` plus d'une heure après (compte non confirmé) reçoit un 403 « Identité non vérifiée » affiché tel quel. Il retombe sur `/completer-profil` après confirmation et connexion, donc pas bloquant. Un message plus clair serait mieux.
- [TRAITÉ R1-d] `supabase/migrations/20261029_auth_profils.sql:88` (api-dev) — l'exemption `auth.uid() IS NULL AND auth.role() IS DISTINCT FROM 'anon'` laisserait passer un jeton de rôle `authenticated` sans `sub`. Supabase Auth n'en émet pas, et T1b (34 OK) valide les refus. Durcissement possible : `auth.role() IS NULL`. À noter : `is_admin_or_secretary()` (SECURITY DEFINER sans `search_path`) existait déjà, hors périmètre.
- [TRAITÉ R1-c] `app/composables/useAuth.ts:132` (ui-dev) — `uid as string` est un cast, pas une garde : `if (!user.value)` ne garantit pas que `uid` existe (id ni sub). `.eq('id', undefined)` ne fait aucun dégât (RLS + uuid invalide), mais mieux vaut `if (!uid) throw`.
- `app/composables/useAuth.ts:22` (ui-dev) — `loading` et `error` sont maintenant partagés ; la lecture du profil en arrière-plan et les actions de connexion les mélangent. Aucun composant ne les lit aujourd'hui (grep), donc sans effet visible.
- `app/middleware/auth.global.ts:30-35` (ui-dev) — en état `error` (lecture du profil en échec), la règle « profil incomplet → complétion » est sautée : un profil incomplet atteint `/profil`. Comportement documenté par `auth.global.error-state.test.ts`, pas de boucle. Côté `/admin` c'est fermé (retour `/`). Autre effet : les rôles sont lus une fois par session ; retirer un rôle admin ne se voit côté client qu'au rechargement (les routes `server/api/admin/*` restent protégées par `requireAdmin`).
- [TRAITÉ R1-b] `app/pages/callback.vue:30` (ui-dev) — un compte complété non-staff est envoyé vers `/admin/dashboard`, puis le middleware le renvoie vers `/`. Comportement identique au HEAD (callback.vue et `login.vue:271` le faisaient déjà), mais devenu la norme pour les comptes Google/Microsoft. Souhaitable : `/profil` pour un non-staff (hors périmètre, à décider).
- `scripts/typecheck-baseline.mjs:39-43` (orchestrateur) — la normalisation ne trie que les unions de littéraux (`"a"`, `undefined`, `null`) dans la clé ; elle est appliquée aux deux côtés (baseline relue et sorties) et les compteurs sont additionnés. Elle ne masque pas de vraie nouvelle erreur (même fichier, même code, même message, seul l'ordre des membres est neutralisé). Résultat relancé : 186 erreurs, 0 nouvelle.
- Couleurs (check.mjs, 4 avertissements) : `Header.vue:465,466,469` et `register.vue:163`. Déjà dans le HEAD, non introduites par la feature.
- Tests d'abord : `HelloAssoConfig.roles.test.ts` est le seul fichier de test suivi modifié (+4 lignes de `clearNuxtState`, mise en place seulement, assertions inchangées). Les autres tests sont non suivis (aucun commit) : l'absence d'affaiblissement par les agents de dev n'est pas vérifiable par `git log` ; la relecture du diff ne montre rien de suspect, et `npm test` passe 531/531.

## Réponses aux points d'attention
1. **Identité `register`** : correcte. Sans session, l'UUID est vérifié par `getUserById` (service role), l'e-mail doit égaler celui du compte (insensible à la casse), `last_sign_in_at` vide et âge ≤ 1 h. L'UUID d'un autre compte donne 403, l'e-mail seul donne 400. Rejeu : le second appel reçoit 409 (`profile_completed_at`). Le service role n'agit qu'après ces contrôles. La validation 400 passe avant : sans fuite.
2. **`profile/complete`** : id et e-mail viennent de la session seule ; `userId` et `parent.email` du corps sont ignorés ; le statut n'est jamais touché.
3. **Migration** : rejouable (colonne créée une fois, rattrapage dans le même bloc ; `CREATE OR REPLACE`, `DROP TRIGGER IF EXISTS`). `handle_new_user` en `SECURITY DEFINER` avec `search_path = public`, objets qualifiés. Aucune politique INSERT sur `profiles` pour les utilisateurs authentifiés (pas de contournement par insertion), DELETE réservé au bureau, et le trigger BEFORE UPDATE couvre aussi `INSERT … ON CONFLICT DO UPDATE`. Je ne vois aucune faille par laquelle un adhérent passerait en « Actif ».
4. **`useAuth`** : état en `useState` et promesse sur `nuxtApp._authLoad` : par requête SSR, donc sans fuite. Aucune lecture n'a lieu côté serveur (`import.meta.client`). Rôles vidés hors `ready`. Remarques mineures ci-dessus.
5. **Middleware / callback** : pas de boucle (incomplet → `/completer-profil`, complet → `/profil`, état `error` → on passe). Le callback garde le comportement du HEAD.
6. **`create-member`** : n'écrit que des valeurs non vides, `status || 'Actif'`, date `profile_completed_at` d'origine conservée. `requireAdmin` inchangé. OK.
7. **`parent` toujours** : voir « Important ».
8. **Baseline typecheck** : voir « Mineur ».
9. **Règles du projet** : `check.mjs` 0 erreur. Imports `'vue'` explicites, aucun `gsap`, `window` ni `document` dans les nouveaux composants, `ssr: false` comme `register.vue`.

## Vérifications
- ☑ `check.mjs` : 0 erreur (v-editable, defineProps, imports `'vue'`, gsap.from, refs, plugin, tirets) — avertissements couleur : 4 (déjà dans le HEAD)
- ☑ Critères d'acceptation de la spec remplis (A1-A7, B1-B5, C1-C6, D, E1), rien hors plan, sauf la nuance C2 ci-dessus
- ☑ Logique / SSR / cas limites
- ☑ Sécurité : aucun secret ni service role côté client, `requireAdmin` sur `create-member`, `/api/profile/complete` exige une session
- ☑ Images : non concerné · GSAP : non concerné
- ☑ Migration BDD prévue au plan (`20261029_auth_profils.sql`), aucune migration existante réécrite
- ☑ `npm run typecheck` : 0 nouvelle erreur (186 vs baseline 191)

## Revue R1 (2026-10-29) — corrections R1-a à R1-e
Verdict : ✅ OK. 0 bloquant, 0 important, 3 mineurs. Relu : `completeProfile.ts`, `register.post.ts`, `profile/complete.post.ts`, `callback.vue`, `useAuth.ts` (updateProfile), `20261030_profiles_block_status_role.sql`, `check-auth-profils-db.mjs`, tests R1. Portes : npm test 549/549, typecheck 0 nouvelle, T1b 35 OK, e2e 8/8.

- **R1-a** traité : `register` et `profile/complete` appellent `completeProfile` sans `grantParentRole` ; le rôle `parent` n'est donné que si `children.length > 0`, dans une seule fonction. Règle unique, plus d'incohérence.
- **R1-b** traité : `callback.vue` envoie vers `/admin/dashboard` seulement admin, secretary ou initiateur (même liste que le middleware), sinon `/profil`. En état `error`, les rôles sont vides, donc `/profil`.
- **R1-c** traité : `updateProfile` rejette `Non authentifié` si `uid` est vide, avant tout appel Supabase.
- **R1-d** traité : la migration `20261030` est nouvelle (20261029 non réécrite), rejouable, exemption `auth.role() IS NULL` (postgres, seed, GoTrue, `on_profile_enrich`) ; `service_role` et bureau (admin, secretary) inchangés. Un jeton PostgREST (`anon`, ou `authenticated` sans `sub`) n'est plus exempté. Le cas « jeton sans `sub` » n'est pas testé dans T1b (il faudrait le secret JWT) ; le script teste l'auto-activation d'un adhérent authentifié.
- **R1-e** traité : la réservation `update(...).eq('id').is('profile_completed_at', null).select('id')` est atomique (PostgREST relit le prédicat après le verrou de ligne ; 0 ligne donne 409). Elle est faite par la service role mais ne contourne aucune règle : elle n'écrit que la liste blanche de champs nettoyés (jamais `status`), `profile_completed_at` pour le parent exempté par le trigger, et l'identité est vérifiée avant par `register` / `profile/complete`. Fenêtre « profil complété avant les enfants » : de quelques millisecondes ; les requêtes concurrentes reçoivent 409, et un navigateur qui relirait le profil à cet instant verrait au pire un profil complété sans enfants, sans conséquence de sécurité.

### Mineurs restants (R1)
- `server/utils/completeProfile.ts:112-119` (api-dev) — le rôle `parent` est inséré avant les enfants et la compensation ne le retire pas (écart signalé par api-dev, fixé dans `complete-profile.atomic.test.ts`). Si les enfants échouent puis que l'utilisateur renvoie sans enfant, il garde `parent` sans enfant (R1-a contourné dans ce cas rare). Correction simple : accorder le rôle après la création des enfants, ou le supprimer dans la compensation s'il vient d'être créé.
- `server/utils/completeProfile.ts:164-170` (api-dev) — la compensation ignore ses propres erreurs (`await` sans contrôle). Si la libération de la réservation échoue, le profil reste « complété » avec des données partielles et l'utilisateur reçoit 409 à la reprise. Très improbable ; à journaliser au minimum.
- `server/utils/completeProfile.ts:99-102` (api-dev) — si la ligne n'existait pas (trigger absent), deux requêtes simultanées font toutes deux l'`insert` : la seconde reçoit une erreur 500 (clé primaire) au lieu de 409. Hors flux normal (le trigger crée la ligne), sans écriture parasite.

## Revue R2 (2026-10-29) — retour des liens d'e-mail (R2-a à R2-g)
Verdict : ✅ OK. 0 bloquant, 0 important, 5 mineurs. Relu : `useAuth.ts` (`signUp`, `resendSignupConfirmation`), `register.vue` (`emailRedirectTo`), `callback.vue`, `login.vue`, `auth.global.ts`, et les tests R2. check.mjs : 0 erreur (4 avertissements de couleur, tous hors R2 : `Header.vue`, `register.vue:163`). Les 5 fichiers de test R2 : 69/69 verts relancés ici ; gate de l'orchestrateur 618/618, typecheck 0 nouvelle erreur, e2e 4/4.

### Points examinés
- **Injection / `v-html`** : aucun `v-html`. `error_description` n'est jamais lu ni affiché ; seuls `error`, `error_code` et `type` sont lus, et seulement pour choisir la vue. Les textes sont statiques. Rien à injecter.
- **Redirection ouverte** : `auth.global.ts:14-16` redirige vers un chemin figé (`/callback`) ; seuls `query` et `hash` sont recopiés, rien n'est interprété comme destination. `emailRedirectTo` est construit avec `window.location.origin` (pas avec une valeur de l'URL) ; Supabase le confronte en plus à sa liste d'URLs autorisées.
- **Boucle** : exclue par `to.path !== '/callback'`. `/callback` ne redirige jamais vers une autre page lorsque `error`/`error_code` est présent (`callback.vue:182-186`). `error_code` reste dans l'URL de `/callback` (query et hash conservés) ; le bouton « Se connecter » (`to="/login"`) ne les reporte pas.
- **SSR** : le middleware sort tôt côté serveur (`import.meta.server`) ; `callback.vue` lit le hash uniquement dans `onMounted` (`window` derrière `import.meta.client`, `route.hash` d'abord). `signupRedirectUrl()` n'est appelé que dans des actions client. Rendu initial identique serveur/client (vue « loading »).
- **Énumération de comptes** : `resendSignupConfirmation` ne renvoie que `sent | rate_limited | error`, avec des messages génériques identiques que le compte existe ou non ; ne lève jamais.
- **Flux existant** : recovery (`type=recovery` → `/profil?resetPassword=true`), profil incomplet → `/completer-profil`, bureau → `/admin/dashboard`, sinon `/profil`, sans type ni session → `/login` : inchangés et couverts par `callback.test.ts`. R2-g : couvert d'emblée par `login.resend.test.ts`.

### Bloquant
Aucun.

### Important
Aucun.

### Mineur
- `app/pages/login.vue:290-298` — `handleResend` ne valide pas l'e-mail (le champ peut avoir été vidé ou modifié après l'erreur) : `resend('')` donne un `'error'` générique. Réutiliser la validation de `callback.vue:162-169` (non exigé par R2-f).
- `app/composables/useAuth.ts:208-222` — côté Supabase, `rate_limited` n'est renvoyé que pour un compte existant et non confirmé (la limite par adresse est testée seulement dans ce cas) : un témoin d'existence minime, de l'ordre d'une minute. Inhérent à GoTrue, accepté ; à ne pas aggraver en détaillant les messages.
- `app/pages/callback.vue:182,201` — `callback` est aussi la cible de `loginWithOAuth` (`useAuth.ts:175`) : un `?error=access_denied` d'un fournisseur OAuth affichera « Ce lien n'est plus valide » avec le formulaire de renvoi. Libellé un peu décalé pour ce cas ; de même, un lien de réinitialisation retombé sur `/` perd `type=recovery` et montrera le formulaire de renvoi (R2-c ne peut pas le deviner).
- `app/pages/callback.vue:188-203` — la vue « Adresse e-mail confirmée » est décidée après les 500 ms existantes : si la session arrive plus tard (réseau lent), l'utilisateur voit « connectez-vous » alors qu'il est déjà connecté (le garde `guest` de `/login` le renverra). Comportement hérité, sans conséquence de sécurité.
- `app/composables/useAuth.ts:10` et `app/pages/register.vue:458` — l'URL `${origin}/callback?type=signup` est écrite à deux endroits (le plan le demandait pour `register.vue`). Risque de dérive ; l'exposer par le composable à terme. Cosmétique : `=()` sans espace à la ligne 10.

### Rappels hors code
- Ajouter `/callback` (dev et prod) aux URLs de redirection autorisées Supabase avant déploiement (`docs/mise-en-prod.md` § 5) : sinon Supabase retombe sur la Site URL et le retour n'est pas corrigé.
- Tests R2 : fichiers non suivis, donc non comparables par `git diff` ; aucune trace d'affaiblissement dans les assertions relues (e2e : bouton de renvoi seulement vérifié visible, jamais cliqué).

## Revue R2b (2026-10-29) — mineurs 1, 3, 4, 5 de la revue R2
Verdict : ✅ OK. 0 bloquant, 0 important, 3 mineurs. check.mjs : 0 erreur, 4 avertissements de couleur, tous hors R2b (`Header.vue:465-469`, `register.vue:163`). Relu : `authRedirect.ts`, `useAuth.ts` (`signUp`, `resendSignupConfirmation`), `register.vue`, `login.vue` (`handleResend`), `callback.vue`, et les 6 fichiers de test R2b. Gate de l'orchestrateur (655/655, typecheck 0 nouvelle erreur, e2e 11 passés) non relancée ici.

### Contrats
- **R2b-1** : rempli. `login.vue:290-308` valide (vide, puis format) avant tout appel, efface l'erreur précédente et réutilise `fieldErrors.email`. Le texte est celui que `handleLogin` emploie déjà (« L'email est requis », `login.vue:295`, `316`) ; le plan cite « L'adresse email est requise », le test accepte les deux (regex).
- **R2b-3** : rempli. `callback.vue:244-248` : `otp_expired` donne `link-error`, toute autre erreur donne `auth-error` (`callback.vue:91-116`, « n'a pas abouti », `btn-callback-login`, aucun formulaire de renvoi), sans redirection. `error_description` n'est jamais lu.
- **R2b-4** : rempli. L'attente de 500 ms a disparu ; `callback.vue:250-274` : utilisateur présent redirigé tout de suite ; sinon `watch(user)` plus délai de 3 s ; erreur dans l'URL sans attente.
- **R2b-5** : rempli. Une seule occurrence du littéral (`authRedirect.ts:4`), importée par `useAuth.ts:192,212` et `register.vue:459`. Espacement `=()` corrigé.

### Points demandés
- **Course watch/timer** : pas de double navigation. `settled` est posé de façon synchrone avant tout `await` dans les deux branches, et `cleanup()` arrête le `watch` et le timer ; le timer vérifie `settled || disposed` à son déclenchement. Le `watch` est enregistré avant tout `await` de `onMounted`, donc sans fenêtre perdue entre la lecture de `user.value` et l'abonnement.
- **Après démontage** : `onBeforeUnmount` pose `disposed` et nettoie ; `redirectConnected` revérifie `disposed` après `await ensureProfile()` (`callback.vue:228`). Aucune navigation possible après démontage, sauf un `navigateTo` déjà lancé.
- **Recovery prioritaire** : `callback.vue:229-230` passe avant le test de profil incomplet, le rôle et le repli ; couvert par `session-wait` (présent au montage et session tardive). Sans session à 3 s, `recovery` va à `/login` (comportement hérité, voulu par le contrat).
- **SSR** : tout se passe dans `onMounted` ; `window.location.hash` est derrière `import.meta.client` (`callback.vue:180`) ; `signupConfirmationRedirect()` n'est appelé que dans des actions client (`signUp`, `resendSignupConfirmation`, `submitWithChildren`). L'argument par défaut n'est évalué que si `origin` manque.
- **`error_description`** : jamais affiché ni lu (`readLinkParams` ne retourne que `error`, `errorCode`, `type`). Pas de `v-html`.
- **Messages neutres** : `auth-error` est générique (pas de détail du fournisseur) ; les messages de renvoi sont inchangés.
- **Adaptation des tests callback par qa** : justifiée. `callback.link-error.test.ts` : le cas `error` seul passe de `callback-link-error` à `callback-auth-error` (imposé par R2b-3) ; le timeout de `mountAndWaitFor` passe de 2500 à 4500 ms (le plafond d'attente est maintenant 3 s ; les assertions « aucune redirection » restent). `callback.test.ts` : commentaire seul (le timeout de 4000 ms y était déjà). Fichiers non suivis, donc non comparables par `git diff` ; aucun assouplissement d'assertion constaté. Les tests R2b (faux timers, session tardive à 1500 ms, démontage, absence de `callback-email-confirmed`) couvrent bien la course.

### Bloquant
Aucun.

### Important
Aucun.

### Mineur
- `app/pages/callback.vue:262` — `void redirectConnected(type)` : une erreur levée par `navigateTo` serait une promesse rejetée non gérée, sans repli (la page resterait sur « Connexion en cours… »). `ensureProfile` ne lève jamais (`useAuth.ts:81-87`), donc risque très faible.
- `app/pages/callback.vue:227` — la redirection de recovery attend d'abord `ensureProfile()` (lecture réseau) alors qu'elle n'en dépend pas ; une lecture lente retarde `/profil?resetPassword=true`. Possible : tester `type === 'recovery'` avant la lecture.
- `tests/pages/callback.link-error.test.ts:96,111` et la ligne `await wait(900) // la page agit ~500 ms…` — commentaire périmé (plus d'attente de 500 ms) ; sans conséquence.

## Revue R2c (2026-10-29) — retour `?code=` hors `/callback` (R2c-1, R2c-2)
Verdict : ✅ OK. 0 bloquant, 0 important, 2 mineurs. check.mjs : 0 erreur, 4 avertissements de couleur, tous hors R2c (`Header.vue:465-469`, `register.vue:163`). Relu : `auth.global.ts`, `callback.vue`, `tests/middleware/auth.global.code-return.test.ts`, `tests/pages/callback.code-exchange.test.ts`, `addCodeExchange` (`tests/utils/auth-fake.ts`), `e2e/email-link.spec.ts` (2 nouveaux tests). Gate de l'orchestrateur (689/689, typecheck 0 nouvelle erreur, e2e 13 passés) non relancée ici.

### Contrats
- **R2c-1** : rempli. `auth.global.ts:15-18` passe avant `if (import.meta.server) return` (ligne 20) et avant tout contrôle d'authentification ou de complétion. Query et hash conservés.
- **R2c-2** : rempli. `callback.vue:253-264` : erreur d'URL d'abord (retour à la ligne 248), puis `getSession`, puis au plus un `exchangeCodeForSession`, erreur ou exception avalée, puis l'attente de R2b-4 inchangée.

### Points demandés
- **Redirection ouverte** : impossible. La cible est le littéral `/callback` ; seuls `query` et `hash` de la route courante sont repris, jamais une URL fournie.
- **Regex UUID** : ancrée (`^…$`), insensible à la casse. `abc`, suffixe, préfixe, UUID tronqué ou vide ne sont pas touchés (testés). Un `code` en tableau (`?code=a&code=b`) : seul le premier est testé, la query entière est conservée ; sans effet de sécurité.
- **Pas de boucle** : `to.path !== '/callback'` exclut la cible ; `callback.vue` ne renvoie que vers `/login`, `/profil`, `/completer-profil`, `/admin/dashboard`, sans `code`.
- **Double échange** : le client Supabase fait son échange automatique à l'initialisation ; `getSession()` attend cette initialisation, donc l'échange manuel n'a lieu que si aucune session n'existe ensuite (`!data?.session && !user.value`, `callback.vue:259`). Si l'échange automatique a échoué, le vérificateur est déjà consommé : le second appel échoue sans effet et son erreur est ignorée. Au plus un appel manuel, testé (une fois, même après 3 s).
- **Démontage** : `if (disposed) return` juste après le bloc d'échange (ligne 263) ; ensuite `redirectConnected`, le `watch` et le timer gardent déjà `disposed`/`settled` (revue R2b).
- **Erreur d'URL prioritaire** : le retour (ligne 248) précède tout appel Supabase ; testé (`otp_expired` et autre `error_code`, aucun échange).
- **SSR** : la règle ne touche ni `window` ni `document` (`to.query`, `to.hash`) ; `navigateTo` renvoie une redirection serveur. Le hash n'existe pas côté serveur, mais le flux PKCE n'utilise que la query. Non testable en Vitest (`import.meta.server` figé à false) ; l'ordre dans le code est correct, et l'e2e `/?code=<UUID>` (chargement complet, donc SSR) passe par `/callback` puis `/login`.
- **OAuth normal** : `/callback?code=` sans erreur ni `type` : session déjà posée par le client, donc `getSession` la renvoie et aucun échange manuel ; flux connecté inchangé (testé : `getSession` renvoie une session, `exchangeCodeForSession` jamais appelé ; utilisateur déjà présent au montage : pas d'appel du tout).
- **Test « sans lecture du profil » corrigé par qa** : l'intention tient. L'assertion déterminante est la destination (`/callback` et non `/completer-profil` pour un profil incomplet connecté), inchangée. Le compte de lectures est désormais mesuré après la fin des lectures du plugin `auth-sync`, ce qui est légitime. Limite : comme `ensureProfile` ne relit pas quand le profil est déjà chargé (`useAuth.ts:105`), ce compte seul ne détecterait plus un appel parasite du middleware ; c'est la destination qui protège l'ordre.
- **e2e** : 2 tests en lecture seule, UUID aléatoire, aucun e-mail. Le premier vérifie le passage par `/callback`, l'arrivée sur `/login` en moins de 5 s et l'absence de `callback-link-error`. Le second (`?code=abc`) reste sur `/` sans navigation vers `/callback`. Aucune assertion assouplie.

### Bloquant
Aucun.

### Important
Aucun.

### Mineur
- `tests/middleware/auth.global.code-return.test.ts:107-117` — le test « sans lecture du profil » ne détecte plus à lui seul un `ensureProfile` parasite (voir ci-dessus) ; l'assertion de destination reste suffisante pour l'ordre des règles. Renommer le test ou commenter la limite serait plus honnête.
- `app/pages/callback.vue:242,259` — le `code` n'est pas validé au format UUID avant `exchangeCodeForSession` (le middleware le fait pour le renvoi, pas la page). Sans conséquence : le code part vers Supabase qui le refuse, et l'erreur est ignorée.
