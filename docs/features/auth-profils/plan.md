# Plan — auth-profils

> Rédigé par : planner (opus) · Validé par l'utilisateur : ☑ (2026-10-29, avec corrections A–C intégrées en révision 2)
> Spec : [spec.md](spec.md) · Tests d'abord : **oui** · Pas d'`options.md` (aucune décision de cadrage à respecter)
> Révision 2 (2026-10-29) : corrections de l'utilisateur A, B et C intégrées, et réponses aux questions 1 à 5 (voir la fin du document).

## Résumé de l'approche
- **Front** : `useAuth` passe en état partagé (`useState`), avec un statut explicite (`idle | loading | ready | error`). Une seule lecture du profil est en cours à la fois (promesse partagée, gardée sur le `nuxtApp`). Un plugin client unique suit l'id de l'utilisateur et recharge le profil ou le vide. Les composants ne déclenchent plus de chargement eux-mêmes.
- **BDD** : nouvelle colonne `profiles.profile_completed_at`. Si elle est vide, le profil est incomplet. Le trigger `handle_new_user` crée le profil en « En attente ». Un trigger empêche tout compte hors bureau (admin, secretary) de changer `status` ou `profile_completed_at`.
- **Serveur** : un utilitaire commun `completeProfile` complète la ligne créée par le trigger, sans écraser une valeur existante par du vide.
  - `register.post.ts` l'appelle avec le rôle parent. Sans session, il exige l'UUID renvoyé par `signUp`, l'email correspondant, un compte jamais connecté et créé il y a moins d'une heure.
  - La nouvelle route `profile/complete.post.ts` (comptes OAuth, session obligatoire) l'appelle aussi. Elle donne le rôle parent seulement si des enfants sont déclarés.
  - Le 409 n'est renvoyé que si le profil est déjà complété.
- **Complétion** : tout profil incomplet est renvoyé vers `/completer-profil` depuis toute page qui demande d'être connecté. Cette page reprend les champs de `register.vue`, extraits en composants partagés.

## Contrats (figés ici pour que T0 écrive ses tests avant le code)

### `useAuth()`
En plus de ce qu'il renvoie déjà :
- `authStatus` : `Ref<'idle'|'loading'|'ready'|'error'>`. `idle` signifie « rôles inconnus », ce qui est distinct de `ready` avec `roles = []`.
- `isProfileComplete` : `ComputedRef<boolean>`, vrai si `profile.profile_completed_at` est renseigné.
- `ensureProfile()` : `Promise<void>`. Ne relit pas si l'état est `ready` pour l'id courant. Si une lecture est déjà en cours pour cet id, renvoie la même promesse.
- `fetchProfile()` : force une relecture, mais se rattache à la lecture en cours s'il y en a une pour le même id.

Comportement :
- Clés `useState` : `auth:profile`, `auth:roles`, `auth:status`, `auth:loadedFor` (id pour lequel l'état est `ready`).
- `isAdmin`, `isStaff`, etc. restent faux tant que `authStatus !== 'ready'`.
- En cas d'erreur (`error`) : le profil et les rôles sont vidés et `loadedFor` vaut `null`. Une nouvelle lecture a lieu au prochain appel ou au prochain changement d'utilisateur.
- `logout()` vide l'état partagé.
- `loginWithEmail()` charge le profil avec l'id renvoyé par `signInWithPassword`.

### `POST /api/register`
- Corps : `{ userId, parent, children }`. `userId` est l'UUID renvoyé par `supabase.auth.signUp` : `register.vue` l'envoie déjà (`register.vue:858`) et doit continuer après l'extraction de T6.
- Réponses :
  - 200 `{ success: true }`.
  - 400 si `userId` manque, si l'email manque ou s'il manque un champ obligatoire.
  - 403 si une session existe et que son id diffère de `userId`.
  - 403 si `getUserById(userId)` ne renvoie pas un compte dont l'email est égal à `parent.email` (comparaison insensible à la casse). Ce cas couvre l'UUID d'un autre compte.
  - 403 sans session si le compte a déjà servi (`last_sign_in_at` renseigné) ou s'il a été créé il y a plus d'une heure.
  - 409 « Cette adresse email est déjà inscrite. » si `profile_completed_at` est renseigné.
- Sans session, l'email seul ne suffit jamais : l'UUID **et** l'email doivent désigner le même compte.

### `POST /api/profile/complete`
- Session obligatoire, sinon 401.
- Corps : `{ parent (sans email), children }`. L'id et l'email viennent toujours de la session, jamais du corps.
- 400 et 409 comme `/api/register`.
- Rôle `parent` seulement si `children.length > 0`. Sinon aucun rôle (C2).

### Page `/completer-profil`
- Demande d'être connecté.
- Envoie le formulaire à `/api/profile/complete`.
- Après envoi, affiche « en attente de validation par le bureau ».

### Middleware `auth.global.ts`
- Une seule liste de pages qui demandent d'être connecté : `/admin`, `/profil`, `/mes-inscriptions`, `/completer-profil`.
- Un utilisateur connecté dont l'état est `ready` et le profil incomplet est renvoyé vers `/completer-profil` depuis **toutes** ces pages, sauf `/completer-profil` elle-même.
- Les pages publiques restent accessibles : `/`, `/login`, `/register`, `/callback`, pages Storyblok.
- La déconnexion (`logout()` puis `/login`) n'est jamais bloquée.
- Un profil complété qui ouvre `/completer-profil` est renvoyé vers `/profil`.
- Pas de seconde liste de pages bloquées.

### `create-member`
- Écrit toujours `status` = statut choisi par l'admin. Si l'admin n'en choisit aucun : **`'Actif'`**. C'est le comportement actuel, cohérent avec la valeur par défaut du formulaire (`dashboard.vue:376`) : le bureau valide de fait (C4).
- Écrit aussi `profile_completed_at = now()`.

### Champs obligatoires
Côté serveur comme côté client :
- parent : `first_name`, `last_name`, `birth_date`, `gender` ;
- enfant : `first_name`, `last_name`, `birth_date`.

## Tâches

### T0a — Tests Vitest rouges (critères A à D)
- **Agent** : qa
- **Fichiers** (nouveaux) :
  - `tests/composables/useAuth.shared.test.ts`
  - `tests/components/layout/Header.admin-entry.test.ts`
  - `tests/middleware/auth.global.test.ts`
  - `tests/pages/callback.test.ts`
  - `tests/pages/completer-profil.test.ts`
  - `tests/server/api/register.test.ts`
  - `tests/server/api/profile-complete.test.ts`
  - `tests/server/api/admin/create-member.test.ts`
- **Fichier modifié** (mise en place seulement, assertions inchangées) : `tests/components/admin/HelloAssoConfig.roles.test.ts`
- **Dépend de** : —
- **Détail** :
  - **Outillage** : vrai `useAuth` pour tout ce qui dépend des rôles, avec Supabase simulé (`tests/utils/supabase-mock.ts`). Pour les routes : `tests/utils/nitro.ts`, `supabase-server-stub.ts` et `fake-supabase.ts`.
  - **A1, A2, A5, A7** (`useAuth`) :
    - deux appels voient le même état ;
    - N appels simultanés à `ensureProfile()` ne lisent `profiles` qu'une fois ;
    - une erreur donne `authStatus = 'error'` et `isStaff = false`, puis une relecture réussit ;
    - un changement d'utilisateur recharge l'état, une déconnexion le vide.
  - **A3, A4** (`Header`) : l'entrée « Administration » apparaît :
    - après une connexion ;
    - après la fin d'un chargement des rôles retardé, alors que le menu est déjà ouvert.

    Elle reste masquée si l'état est `idle` ou `error`, et pour un compte qui n'est pas staff.
  - **A6** : dans `HelloAssoConfig.roles.test.ts`, seul ajout permis : une remise à zéro de l'état partagé entre les tests (`clearNuxtState` sur les clés `auth:*`).
  - **B1 à B4** (`register`) :
    - succès : la ligne créée par le trigger est complétée, statut « En attente », rôle `parent` attribué, enfants et `parent_access` créés ;
    - les valeurs déjà présentes ne sont pas écrasées par des champs vides ;
    - 409 seulement si le profil est déjà complété ;
    - 403 si la session ne correspond pas à `userId` ;
    - 400 si un champ obligatoire manque.
  - **Correction A** (`register` sans session) :
    - email correct mais sans `userId` : refus (400) ;
    - `userId` d'un autre compte (email différent) : refus (403) ;
    - `userId` et email corrects mais compte déjà connecté : refus (403) ;
    - `userId` et email corrects mais compte créé il y a plus d'une heure : refus (403) ;
    - `userId` et email corrects, compte jamais connecté et récent : 200.
  - **C1, C2** (`profile/complete`) :
    - 401 sans session ;
    - l'id vient de la session même si le corps contient un `userId` ;
    - statut « En attente » conservé, `profile_completed_at` renseigné ;
    - aucun rôle si aucun enfant n'est déclaré, rôle `parent` s'il y en a ;
    - 409 si le profil est déjà complété.
  - **C4, D1, D2** (`create-member`) :
    - le payload ne contient aucun champ vide ni `null` venant du formulaire ;
    - `licence` vide ou `'-'` n'est pas écrit ;
    - une valeur non vide remplace bien la valeur existante ;
    - le statut choisi est conservé (« Actif », « Inactif » ou « En attente ») ; sans statut, `'Actif'` est écrit ;
    - `profile_completed_at` est renseigné ;
    - `requireAdmin` est appelé.
  - **C3** (middleware et callback) :
    - profil incomplet sur `/profil`, `/mes-inscriptions`, `/admin/dashboard` ou `/admin/blocs` : redirection vers `/completer-profil` ;
    - profil incomplet sur `/completer-profil`, `/`, `/login`, `/register` ou une page Storyblok : on passe ;
    - profil complété sur `/completer-profil` : redirection vers `/profil` ;
    - non connecté sur une page qui demande d'être connecté : redirection vers `/login` ;
    - `/admin` sans rôle admin, secretary ou initiateur : redirection vers `/` ;
    - `callback.vue` avec un profil incomplet : redirection vers `/completer-profil`.
  - Tous ces tests doivent être rouges sur le code actuel, sauf ceux qui décrivent un comportement à préserver.

### T0b — Parcours e2e rouges ∥ T0a
- **Agent** : e2e
- **Fichiers** (nouveaux) : `e2e/auth-profils.spec.ts`, `e2e/support/dev-db.ts`
- **Dépend de** : —
- **Détail** :
  - **Comptes** : les 4 parcours de la spec. Comptes de test : `TEST_USERS_EMAIL` avec les suffixes `+admin` et `+adherent`, mot de passe `TEST_USERS_PASSWORD`.
  - **`dev-db.ts`** : service role lue dans `.env`. Refuse de tourner si l'URL n'est pas celle du projet `ybtnnogxukfldurozqwa`.
  - **Parcours « inscription »** :
    - Adresse jetable : `TEST_USERS_EMAIL` avec le suffixe `+e2e-<horodatage>`. **Jamais** `@example.com`.
    - Le `signUp` passe réellement par l'interface, avec un enfant.
    - Si la limite d'envoi d'emails de Supabase est atteinte (message « rate limit » affiché), le test est sauté proprement (`test.skip` avec la raison).
    - Une fois le message de succès affiché, le compte est confirmé via l'API admin (`email_confirm`, service role, dev uniquement).
    - Vérifications en base : profil « En attente », champs saisis, `profile_completed_at` renseigné, enfant et `parent_access` présents.
    - Puis connexion avec le compte jetable : `/profil` est accessible, sans redirection vers `/completer-profil`, et l'entrée « Administration » est absente.
    - Le compte (auth, profils, `parent_access`) est supprimé en fin de test, même en cas d'échec.
    - Parcours à lancer rarement (tag `@email` ou fichier lancé à la demande).
  - **Autres parcours** (doublon 409, admin, adhérent) : aucune écriture.

### T1 — Migration, seed, types
- **Agent** : api-dev
- **Fichiers** :
  - `supabase/migrations/20261029_auth_profils.sql` (nouveau)
  - `supabase/seed.sql`
  - `app/types/auth.ts`
- **Dépend de** : T0a, T0b · suivie de **T1b**
- **Détail** :
  - **Migration** : appliquer **exactement** la section « Migration / schéma BDD » ci-dessous, dans une transaction (`BEGIN` … `COMMIT`). Le fichier doit pouvoir être rejoué sans erreur ni changement de données : `IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` avant chaque `CREATE TRIGGER`, et rattrapage seulement à la création de la colonne. La migration n'est pas poussée ici : c'est T1b.
  - **Seed** : `profile_completed_at = now()` sur les 4 comptes de test (bloc b) et sur les profils fictifs (bloc c).
  - **Types** : ajouter `profile_completed_at: string | null` aux types `Profile`.

### T1b — Tests de la base sur le DEV (pour de vrai)
- **Agents** : api-dev écrit le script ; l'orchestrateur pousse la migration et lance le script.
- **Fichiers** : `scripts/check-auth-profils-db.mjs` (nouveau)
- **Dépend de** : T1 · fait partie de la **porte de qualité** (tout doit être OK avant la revue)
- **Détail** :
  - **Push sur le dev** :
    - vérifier d'abord que `supabase/.temp/project-ref` vaut `ybtnnogxukfldurozqwa` ;
    - puis `db push --linked --dry-run` : seule `20261029` est attendue ;
    - puis `db push --linked`.
  - **Idempotence** : `migration repair --linked --status reverted 20261029`, puis `db push --linked`. Le second passage réussit sans erreur et ne change aucune donnée. En particulier, le rattrapage ne marque pas comme complétés les profils créés entre les deux passages.
  - **Script, principes** :
    - Il lit `.env` lui-même, refuse de tourner hors du projet de DEV (même garde que `seed-test-users.mjs`) et n'affiche ni clé, ni mot de passe, ni jeton.
    - Il se connecte avec les **vrais comptes de test** (`TEST_USERS_EMAIL` avec les suffixes `+admin`, `+secretaire`, `+initiateur`, `+adherent` ; mot de passe `TEST_USERS_PASSWORD`) et la clé publique (anon).
  - **Script, vérifications** :
    - **Adhérent** (`+adherent`) : ne peut modifier ni le `status` ni le `profile_completed_at`, que ce soit :
      - sur son propre profil ;
      - sur celui d'un de ses enfants (`child1`, lien `parent_access` : la RLS `profiles_update_family` autorise la ligne, c'est le trigger qui doit refuser) ;
      - sur celui d'un autre adhérent sans lien (profil fictif `hugo`, refusé par la RLS).

      Il peut en revanche toujours modifier un champ libre de son propre profil (`mobile`, valeur remise ensuite) : pas de régression de `profil.vue`.
    - **Initiateur** : mêmes refus que l'adhérent sur son propre profil et sur `hugo`.
    - **Secrétaire et admin** (chacun séparément) : peuvent modifier le `status` et le `profile_completed_at` du profil fictif `hugo`. Cela prouve que la règle « bureau » du trigger couvre bien `admin` **et** `secretary`, via `is_admin_or_secretary()`, dont le corps teste `role_code IN ('admin','secretary')`. Valeurs remises ensuite via la service role.
    - **`handle_new_user`** :
      - un compte créé via l'API admin (`TEST_USERS_EMAIL` avec le suffixe `+check-<horodatage>`) a un profil `status = 'En attente'` et `profile_completed_at` vide ;
      - une mise à jour de ce profil à `'Actif'` via la service role (même chemin que `create-member`) est acceptée ;
      - le compte est ensuite supprimé.
    - **Défaut du statut** : un profil inséré via la service role sans `status` reçoit `'En attente'` ; il est supprimé ensuite.
    - **Rattrapage** : les 4 comptes de test ont `profile_completed_at` renseigné.
  - **Constat d'un refus** : erreur renvoyée **ou** 0 ligne touchée, puis relecture par la service role pour vérifier que l'état n'a pas bougé.
  - **Nettoyage** : le script remet en place ou supprime tout ce qu'il a modifié ou créé, même en cas d'échec. Il affiche un tableau OK / ÉCHEC par vérification et sort avec le code 1 s'il y a au moins un ÉCHEC.

### T2 — Complétion de profil côté serveur (register + OAuth) ∥ T3, T4
- **Agent** : api-dev
- **Fichiers** :
  - `server/utils/completeProfile.ts` (nouveau)
  - `server/api/register.post.ts`
  - `server/api/profile/complete.post.ts` (nouveau)
- **Dépend de** : T1
- **Détail** : faire passer les tests de T0 sans les modifier.
  - **`completeProfile(client, { userId, email, parent, children, grantParentRole })`** :
    - valide les champs obligatoires ;
    - met à jour la ligne existante avec les seules valeurs non vides, ce qui conserve l'enrichissement de `on_profile_enrich` ; si la ligne n'existe pas, l'insère en « En attente » ;
    - ne touche jamais le `status` d'une ligne existante ;
    - ajoute le rôle `parent` seulement si `grantParentRole` est vrai ;
    - crée les enfants (« En attente », `profile_completed_at = now()`, `parent_access`), avec la déduplication actuelle ;
    - pose `profile_completed_at = now()` sur le parent **en dernier**, pour qu'un échec en route laisse la reprise possible.
  - **`register.post.ts`** :
    - supprimer le 409 des lignes 68 à 75 ;
    - appliquer exactement le contrat « POST /api/register » (UUID et email liés au même compte, conditions sans session, 409 si le profil est déjà complété) ;
    - appeler `completeProfile` avec `grantParentRole: true`.
  - **`profile/complete.post.ts`** :
    - `serverSupabaseUser` obligatoire ;
    - appeler `completeProfile` avec `grantParentRole: children.length > 0`.

### T3 — create-member n'écrase plus l'enrichissement ∥ T2, T4
- **Agent** : api-dev
- **Fichiers** : `server/api/admin/create-member.post.ts`
- **Dépend de** : T1
- **Détail** : faire passer les tests de T0 sans les modifier.
  - **Payload de l'upsert** : uniquement les valeurs non vides (`email`, `first_name`, `last_name`, `full_name`, `phone`, `mobile`, `birth_date`, `gender`). `licence_number` et `licence_type` ne sont écrits que s'ils sont renseignés et différents de `-`.
  - **Toujours écrits** : `status: status || 'Actif'` (C4) et `profile_completed_at: now`.
  - **Pourquoi `profiles_block_status` ne bloque pas** : l'écriture passe par `serverSupabaseServiceRole`, où `auth.uid()` est NULL et `auth.role()` vaut `'service_role'`. Le trigger l'exempte donc, et elle remplace bien le « En attente » posé par `handle_new_user`. T1b le vérifie.
  - **Côté client** : les changements de statut par le bureau (`dashboard.vue`, `MemberModal.vue`) passent par le JWT admin ou secrétaire. Ils sont exemptés par `is_admin_or_secretary()` et autorisés par la RLS `profiles_update_staff`.
  - `requireAdmin` et le reste de la route sont inchangés.

### T4 — useAuth partagé, plugin de synchronisation, retrait des chargements locaux ∥ T2, T3
- **Agent** : ui-dev
- **Fichiers** :
  - `app/composables/useAuth.ts`
  - `app/plugins/auth-sync.client.ts` (nouveau)
  - `app/app.vue`
  - `app/components/layout/Header.vue`
  - `app/components/admin/HelloAssoConfig.vue`
- **Dépend de** : T1 (types)
- **Détail** : faire passer les tests de T0 sans les modifier, en suivant le contrat de `useAuth`.
  - **Plugin client** : un `watch` sur l'id utilisateur (`id ?? sub`, `immediate`). Si l'id devient vide : remise à zéro de l'état ; si un nouvel id apparaît : `ensureProfile()`.
  - **`useAuth()`** : appelle aussi `ensureProfile()` côté client quand l'état est `idle` et qu'un utilisateur est présent, pour couvrir un composant monté seul. La promesse partagée évite les doubles lectures.
  - **Retraits** :
    - le `watch` de `app.vue` et son `console.log` ;
    - le `onMounted(fetchProfile)` de `Header.vue` ;
    - le contournement de `HelloAssoConfig.vue` (lignes 201 à 203 et l'appel ligne 370), en gardant `loadForms()`.
  - **Règles `asc-rules`** : imports explicites depuis `'vue'` dans les fichiers `lang="ts"`.

### T5 — Middleware et callback : renvoi vers la complétion ∥ T6
- **Agent** : ui-dev
- **Fichiers** : `app/middleware/auth.global.ts`, `app/pages/callback.vue`
- **Dépend de** : T4
- **Détail** : faire passer les tests de T0 sans les modifier.
  - **Middleware** : appliquer le contrat « Middleware `auth.global.ts` ». Une seule liste de pages qui demandent d'être connecté (avec `/completer-profil` ajoutée). Sur ces pages, `await ensureProfile()`, puis la règle « profil incomplet → `/completer-profil` », sauf sur `/completer-profil` elle-même. Les pages publiques ne sont pas touchées.
  - **Contrôle `/admin`** : sur les rôles partagés (`admin`, `secretary` ou `initiateur`), avec le comportement actuel (erreur ou aucun de ces rôles → `/`).
  - **`callback.vue`** : `ensureProfile()`, puis le cas `recovery` (inchangé), puis, si le profil est incomplet, `/completer-profil` ; sinon `/admin/dashboard` comme aujourd'hui.

### T6 — Page de complétion et champs partagés avec l'inscription ∥ T5
- **Agent** : ui-dev
- **Fichiers** :
  - `app/utils/profileForm.ts` (nouveau)
  - `app/components/auth/ProfileFieldsForm.vue` (nouveau)
  - `app/components/auth/ChildrenForm.vue` (nouveau)
  - `app/pages/register.vue`
  - `app/pages/completer-profil.vue` (nouveau)
- **Dépend de** : T4 (et le contrat de T2)
- **Détail** :
  - **Extraction depuis `register.vue`, sans changer son comportement visible** (le parcours e2e « inscription » sert de filet) :
    - les validations vont dans `profileForm.ts` : `validate` sans email ni mot de passe, `validateChild`, `isAdultBirthDate` ;
    - les champs du parent, avec l'autocomplétion d'adresse, vont dans `ProfileFieldsForm.vue` ;
    - l'étape enfants va dans `ChildrenForm.vue`.
  - **`register.vue`** continue d'envoyer `userId` (l'UUID renvoyé par `signUp`) à `/api/register`.
  - **`completer-profil.vue`** :
    - pré-remplit le formulaire depuis `profile` (enrichissement FFME éventuel) ;
    - envoie à `/api/profile/complete` ;
    - affiche le message « en attente de validation par le bureau » ;
    - propose un lien de déconnexion ;
    - après un envoi réussi, appelle `fetchProfile()`.

### T7 — QA : compléments et plan de test
- **Agent** : qa
- **Fichiers** : `docs/test-plan.md`, plus des tests **ajoutés** si un cas manque (les tests de T0 ne sont pas modifiés)
- **Dépend de** : T2, T3, T4, T5, T6
- **Détail** :
  - Lancer toute la suite Vitest.
  - Vérifier que `useAuth.test.ts`, `HelloAssoConfig.test.ts` et `HelloAssoConfig.errors.test.ts` restent verts.
  - Ajouter au plan de test :
    - les scénarios OAuth manuels, Google et Microsoft : complétion, « En attente », rôle `parent` seulement avec des enfants ;
    - le lancement de T1b et celui, rare, du parcours e2e qui envoie un email.

### Porte de qualité (orchestrateur)
- Lancer `npm test`, `typecheck` (baseline `scripts/typecheck-baseline.mjs`), **T1b** (`node scripts/check-auth-profils-db.mjs` : tout OK) et e2e (`npx playwright test e2e/auth-profils.spec.ts`, par l'agent e2e).
- Si le parcours qui envoie un email est sauté à cause de la limite d'envoi, ce n'est pas un échec : le noter dans le status.
- Après deux échecs de suite, on demande à l'utilisateur.

### Revue (reviewer)
Points d'attention :
- `register.post.ts` sans session : l'UUID et l'email désignent le même compte, jamais connecté, créé il y a moins d'une heure ;
- la service role n'est utilisée qu'après la vérification d'identité ;
- aucune valeur existante n'est écrasée par du vide ;
- `profiles_block_status` n'a pas d'effet sur `on_profile_enrich` ni sur le seed ;
- le middleware n'a pas de liste de pages en double.

### T8 — Documentation
- **Agent** : doc-writer
- **Fichiers** :
  - `docs/database.md` : nouvelle colonne, nouveau défaut, triggers ;
  - `docs/architecture.md` : `useAuth` partagé, plugin, règle de complétion du middleware, `/completer-profil`, `/api/profile/complete` ;
  - `docs/mise-en-prod.md` : la migration passe **avant** le code, sinon tous les comptes sont renvoyés vers la complétion ;
  - `.claude/skills/supabase-db/tables/profiles.md`.
- **Dépend de** : Revue
- **Détail** : `graphify update .` une seule fois, en fin de feature.

## Ordre d'exécution
T0a ∥ T0b → tests rouges constatés → T1 → T1b (push + script) → (T2 ∥ T3 ∥ T4) → (T5 ∥ T6) → T7 → porte de qualité (dont T1b) → revue → T8

## Migration / schéma BDD
Nouveau fichier `supabase/migrations/20261029_auth_profils.sql`, poussé **sur le seul projet dev** en T1b. `20260101_rattrapage_schema.sql` n'est pas modifié. Contenu, en une transaction, rejouable :

1. **Colonne et rattrapage, dans un même bloc `DO`.** Si la colonne `profiles.profile_completed_at` n'existe pas encore (vérification dans `information_schema.columns`) :
   - créer la colonne (`timestamptz NULL`) ;
   - marquer **tous** les profils existants comme complétés (`profile_completed_at = created_at`), enfants compris ;
   - autour de cet UPDATE, désactiver puis réactiver le trigger `on_profiles_updated`, pour ne pas modifier `updated_at`.

   Si la colonne existe déjà, ne rien faire. Un rejeu ne marque donc jamais comme complétés des profils créés depuis.
2. **Défaut du statut** : `ALTER COLUMN status SET DEFAULT 'En attente'`, en protection supplémentaire de C1. Toutes les insertions de l'application (`register`, `add-child`, `create-member`, `seed`) posent déjà le statut elles-mêmes.
3. **`handle_new_user`** (`CREATE OR REPLACE`) :
   - insère `(id, email, full_name, status = 'En attente')`, avec `profile_completed_at` vide ;
   - la branche `ON CONFLICT DO UPDATE` reste inchangée : elle ne touche ni `status` ni `profile_completed_at` ;
   - la fonction reste `SECURITY DEFINER` et prend `SET search_path = public` ;
   - le trigger `on_auth_user_created` n'est pas recréé.
4. **`profiles_block_status_change()`** et trigger `profiles_block_status` (BEFORE UPDATE sur `profiles`, `DROP TRIGGER IF EXISTS` puis `CREATE TRIGGER`) : la fonction refuse tout changement de `status` ou de `profile_completed_at`, sauf dans l'un de ces cas :
   - `auth.uid()` est NULL (postgres, seed, triggers internes comme `on_profile_enrich`, service role) ;
   - `auth.role() = 'service_role'` ;
   - `is_admin_or_secretary()` est vrai. La fonction existante teste `role_code IN ('admin','secretary')`, donc la règle « bureau » couvre **admin et secretary**, ni `initiateur` ni `parent`.

   Ce trigger couvre aussi les profils des enfants, que la policy `profiles_update_family` laisse modifier par le parent. Il comble le trou de `profiles_update_own`, qui permet aujourd'hui à un adhérent de se passer lui-même en « Actif ». Le message d'erreur est explicite.
5. **`on_profile_enrich` et `enrich_profile_from_temps_user`** : inchangés. Ils tournent après l'INSERT du trigger, sans JWT, et ne touchent ni `status` ni `profile_completed_at`.

Tables et objets touchés :
- table `profiles` : nouvelle colonne `profile_completed_at`, défaut de `status` ;
- fonction `handle_new_user` ;
- nouvelle fonction `profiles_block_status_change()` et nouveau trigger `profiles_block_status`.

Aucune policy RLS n'est modifiée.

## Risques / questions ouvertes
- **Sécurité de `/api/register` sans session** : il faut à la fois l'UUID renvoyé par `signUp` (que seul l'appelant de `signUp` reçoit), le même email, un compte jamais connecté et créé il y a moins d'une heure. Risque résiduel jugé faible. Le reviewer doit le vérifier.
- **Réglage « Confirm email » du projet dev** : inconnu. Les deux cas sont couverts : avec session, on contrôle l'identité de la session ; sans session, on applique les conditions ci-dessus.
- **e2e qui envoie un email** : limite d'envoi de Supabase, d'où un saut propre si elle est atteinte. Parcours à lancer rarement.
- **Refactor de `register.vue`** : risque de régression visuelle, limité par le parcours e2e « inscription ».
- **`HelloAssoConfig.roles.test.ts`** : T0 y ajoute une remise à zéro de l'état partagé (mise en place seulement).
- **Hors périmètre, à noter** : `profil.vue:936-942` et `dashboard.vue:162` lisent encore `user_roles` directement. Ce n'est pas bloquant ; à migrer plus tard vers `useAuth`.

## Décisions de l'utilisateur (2026-10-29, toutes tranchées)
1. Rôle `parent` pour un compte OAuth qui déclare des enfants : **oui**. Un compte OAuth sans enfant n'a aucun rôle.
2. Profils existants : **tous** marqués complétés.
3. Trigger `profiles_block_status` : **oui**.
4. Tout profil incomplet est renvoyé vers `/completer-profil` depuis **toute** page qui demande d'être connecté, sauf `/completer-profil` et la déconnexion. Les pages publiques restent accessibles. Pas de liste de pages bloquées.
5. Email réel dans l'e2e : **accepté**, à lancer rarement, sauté proprement si la limite d'envoi est atteinte. Adresse `TEST_USERS_EMAIL` avec le suffixe `+e2e-<horodatage>` (jamais `@example.com`), confirmation par l'API admin sur le dev, puis suppression du compte.
- Corrections A, B et C : intégrées (contrat de `/api/register`, statut de `create-member` avec `'Actif'` par défaut, tâche T1b).

## R2 — Retour des liens d'e-mail (validé par l'utilisateur le 2026-10-29, tests d'abord)
Constat des tests manuels : le premier clic sur le lien de confirmation confirme bien le compte, mais `signUp` ne passe pas d'`emailRedirectTo`. On revient donc sur la Site URL (`/`) sans aucun message, et un nouveau clic renvoie `/?error=access_denied&error_code=otp_expired&error_description=…`, que l'appli ignore.

### Contrats
- **R2-a, lien de retour** : `signUp` (`register.vue` et `useAuth.signUp`) passe `options.emailRedirectTo = \`${window.location.origin}/callback?type=signup\``.
- **R2-b, `useAuth.resendSignupConfirmation(email)`** : appelle `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: <même URL que R2-a> } })` et renvoie `'sent' | 'rate_limited' | 'error'`. `'rate_limited'` correspond à un statut 429 ou à un message contenant « rate limit », « too many » ou « For security purposes » (insensible à la casse). Ne lève jamais d'exception. Ne révèle jamais si un compte existe.
- **R2-c, `callback.vue`, lien invalide** : l'erreur (`error`, `error_code`, `error_description`) se lit dans la query **et** dans le hash (`#error=…`). Si `error_code` ou `error` est présent : **aucune redirection**, et affichage de :
  - `data-testid="callback-link-error"`, avec un texte contenant « n'est plus valide » et expliquant que le lien a pu déjà servir (adresse alors confirmée), avoir expiré ou avoir été remplacé par un e-mail plus récent ;
  - un lien « Se connecter » vers `/login` (`data-testid="btn-callback-login"`) ;
  - sauf si `type=recovery` : un formulaire de renvoi, avec le champ `data-testid="input-resend-email"` et le bouton `data-testid="btn-resend-confirmation"`. Il appelle `resendSignupConfirmation`. Si le résultat est `'sent'`, il affiche `data-testid="msg-resend-sent"` : « Si une inscription non confirmée existe pour cette adresse, un nouvel e-mail vient d'être envoyé. Si votre adresse est déjà confirmée, connectez-vous. » Si le résultat est `'rate_limited'` ou `'error'`, il affiche `data-testid="msg-resend-error"`, avec « patientez » pour `'rate_limited'` et un message générique pour `'error'`.
  - si `type=recovery` : pas de formulaire de renvoi. Le lien « Se connecter » suffit, et `/login` propose « Mot de passe oublié ».
- **R2-d, `callback.vue`, confirmation réussie sans session** : si `type=signup`, sans erreur et sans utilisateur après l'attente actuelle, la page affiche `data-testid="callback-email-confirmed"` (« Adresse e-mail confirmée », connexion nécessaire, inscription en attente de validation par le bureau) avec `btn-callback-login`, au lieu de rediriger vers `/login`. Avec une session, le flux actuel ne change pas : profil incomplet vers `/completer-profil`, bureau vers `/admin/dashboard`, sinon `/profil`. Sans `type` ni erreur et sans session, la redirection vers `/login` ne change pas.
- **R2-e, liens déjà envoyés** (retour sur `/` ou toute autre page) : `auth.global.ts` renvoie vers `/callback` toute route autre que `/callback` dont la query contient `error_code`, ou dont le hash contient `error_code=` (côté client), en conservant query et hash.
- **R2-f, `/login`** : si la connexion échoue avec `email_not_confirmed` (code ou message « Email not confirmed »), le message existant s'affiche avec le bouton `data-testid="btn-login-resend"` « Renvoyer l'e-mail de confirmation ». Il utilise l'e-mail saisi et `resendSignupConfirmation`, avec les mêmes messages que R2-c (`msg-resend-sent` / `msg-resend-error`).
- **R2-g, compte sans complétion** (signUp sans appel à `/api/register`, profil créé par `handle_new_user` avec `profile_completed_at` NULL) : à sa première connexion par `/login` après confirmation, il arrive sur `/completer-profil`, avec la redirection par défaut `/admin/dashboard` comme avec une page connectée explicite. Vérifier la couverture existante et ajouter un test si elle manque.

### Tâches
- **R2-T0a (qa)** : tests Vitest rouges pour R2-a à R2-g, avec le vrai `useAuth` et seulement Supabase simulé, pour `callback.vue`, `login.vue`, `useAuth`, `register.vue` (R2-a) et `auth.global.ts`. Aucun appel réseau.
- **R2-T0b (e2e) ∥ R2-T0a** : parcours sans envoi d'e-mail, lecture seule. Ouvrir `/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired` doit afficher `callback-link-error` sur `/callback`. Même contrôle directement sur `/callback#error=…`, et vérifier que `btn-callback-login` mène à `/login`. Ne jamais cliquer sur le bouton de renvoi (il enverrait un e-mail).
- **R2-T1 (ui-dev)** : implémentation de R2-a à R2-g (`useAuth.ts`, `register.vue`, `callback.vue`, `login.vue`, `auth.global.ts`), sans modifier les tests.
- **Porte** : `npm test` + `typecheck` + e2e (`auth-profils` sans `@email`, plus `smoke`). Puis reviewer, puis doc-writer (sans `graphify update` séparé : il est fait une seule fois, en fin de feature).
- **Réglage manuel, avant tout déploiement en prod** : `/callback` dans les URLs de redirection du dev et de la prod (`docs/mise-en-prod.md` § 5).

### R2b — Mineurs de la revue R2 (validés par l'utilisateur le 2026-10-29 : 1, 3, 4, 5 ; le 2 va dans les Suites)
- **R2b-1, `/login`, renvoi** : `btn-login-resend` avec un e-mail vide ou mal formé ⇒ **aucun** appel à `resendSignupConfirmation`, et affichage du message de champ habituel de `login.vue` (« L'adresse email est requise » / « Format d'email invalide »).
- **R2b-3, `callback.vue`, erreurs autres qu'un lien expiré** : l'écran `callback-link-error` (avec le formulaire de renvoi, sauf `type=recovery`) est réservé à `error_code=otp_expired`. Toute autre erreur (`error` ou `error_code` présent avec une autre valeur, par exemple un refus OAuth) affiche `data-testid="callback-auth-error"`, avec un texte contenant « n'a pas abouti » et `btn-callback-login`, **sans** formulaire de renvoi. Pas de redirection dans les deux cas, et `error_description` n'est jamais affiché.
- **R2b-4, `callback.vue`, attente de la session** : l'attente fixe de 500 ms disparaît.
  - **Utilisateur déjà présent au montage** : redirection immédiate.
  - **Sinon** : la page réagit à l'arrivée de la session, avec un délai maximal de **3 s**. Le signal est `useSupabaseUser()`, que le module met à jour sur l'événement `onAuthStateChange`. Il est observé par un `watch`, nettoyé au démontage.
  - **Session arrivée avant le délai** : flux d'un utilisateur connecté (recovery, puis `/completer-profil`, puis bureau, puis `/profil`), y compris avec `type=signup`. `callback-email-confirmed` n'est jamais affiché.
  - **Délai écoulé** : comportement actuel sans session (`callback-email-confirmed` pour `type=signup`, sinon `/login`).
  - **Erreur dans l'URL** : aucune attente, l'écran d'erreur s'affiche tout de suite.
  - **Test obligatoire** : une session qui arrive tard (après 500 ms, avant 3 s) mène à la redirection d'un utilisateur connecté.
- **R2b-5, une seule source pour l'URL de retour** : `app/utils/authRedirect.ts` exporte `signupConfirmationRedirect(origin?: string)`, qui renvoie `${origin ?? window.location.origin}/callback?type=signup`. `useAuth.ts` (`signUp`, `resendSignupConfirmation`) et `register.vue` l'importent, et aucune autre occurrence littérale de `/callback?type=signup` ne reste dans `app/`. L'espacement `=()` est corrigé.
- **Tâches** :
  1. **R2b-T0 (qa)** : tests rouges. Les tests existants de R2 ne sont modifiés que si le contrat R2b les contredit ; c'est alors à signaler, en particulier le passage de 500 ms à l'attente de la session.
  2. **R2b-T1 (ui-dev)** : implémentation.
  3. **Porte** : `npm test`, `typecheck`, e2e sans `@email`.
  4. **Revue courte** (reviewer).
  5. **Doc** : doc-writer, une seule fois pour R2 et R2b, avec `graphify update`.

### R2c — Retour `?code=` sur une autre page que `/callback` (validé par l'utilisateur le 2026-10-29, tests d'abord)
Constat du test manuel :
- Supabase a ignoré `emailRedirectTo` (`https://localhost:3000/callback?type=signup` ; le serveur de dev est en https), parce que l'URL n'était pas dans la liste autorisée (`http://…`). Il est alors retombé sur la Site URL : `http://localhost:3000/?code=<uuid>` (flux PKCE).
- Aucun échange de code n'apparaît dans les logs.
- Correction de configuration : Redirect URL `https://localhost:3000/callback**` et Site URL `https://localhost:3000` (`docs/dev/supabase-dev.md`). Le code doit aussi tenir si Supabase retombe sur la Site URL.

Contrats :
- **R2c-1, `auth.global.ts`** :
  - toute route autre que `/callback` dont la query contient `code` au format UUID (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) est renvoyée vers `/callback`, en conservant query et hash ;
  - un `code` qui n'est pas au format UUID n'est pas redirigé, car le paramètre peut servir à autre chose ;
  - la règle passe avant les contrôles d'authentification et de complétion, comme R2-e, et s'applique côté serveur comme côté client.
- **R2c-2, `callback.vue` avec `code` dans la query** :
  - une erreur dans l'URL reste prioritaire et suit R2b-3 ;
  - sans erreur et sans utilisateur au montage :
    - `await supabase.auth.getSession()`, qui laisse le client finir un éventuel échange automatique ;
    - si toujours aucune session : `supabase.auth.exchangeCodeForSession(code)`, **une seule fois** ;
    - une erreur d'échange n'est jamais affichée et ne lève pas d'exception. Causes possibles : code déjà consommé, ou vérificateur absent parce que le lien a été ouvert dans un autre navigateur ;
  - l'attente de session de R2b-4 s'applique ensuite :
    - si la session arrive, flux de l'utilisateur connecté ;
    - au bout de 3 s, `callback-email-confirmed` si `type=signup`, sinon `/login` (un `code` sans `type` ne permet pas de savoir s'il s'agit d'une inscription ou d'OAuth) ;
  - si `getSession` renvoie déjà une session, `exchangeCodeForSession` n'est pas appelé.
- **Tâches** :
  1. **R2c-T0a (qa)** : Vitest middleware et callback.
  2. **R2c-T0b (e2e), en parallèle de R2c-T0a**, lecture seule et sans e-mail : ouvrir `/?code=<UUID aléatoire>`, attendre l'arrivée sur `/callback…`, puis sur `/login` en moins de 5 s (aucun `type`, échange refusé). Ouvrir `/?code=abc` laisse sur `/`.
  3. **R2c-T1 (ui-dev)**.
  4. **Porte** (npm test, typecheck, e2e sans `@email`), puis **revue courte**, puis **doc-writer** (`architecture.md`, avec `graphify update`).
