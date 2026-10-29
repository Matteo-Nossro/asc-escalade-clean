# Spec — Fiabiliser l'authentification et les profils

> Slug : `auth-profils` · Créée le : 2026-10-29 · Transverse : **oui** (flux d'auth : inscription, OAuth, trigger `on_auth_user_created`) ⇒ planner en opus
> **Tests d'abord : oui** (authentification et données des adhérents). Tout ce qui dépend des rôles se teste avec le **vrai `useAuth`** (Supabase simulé), jamais avec un faux `useAuth`.

## Objectif
Rendre fiables l'état d'authentification côté front et la création des profils. Aujourd'hui les rôles ne sont pas partagés entre composants (menu « Administration » qui disparaît), l'inscription publique affiche une fausse erreur 409 et laisse un profil incomplet en statut « Actif », les comptes Google/Microsoft sont « Actif » sans validation, et `create-member` écrase des données enrichies. Concerne les visiteurs qui s'inscrivent, les adhérents connectés et le bureau (admin) qui valide les comptes.

## Critères d'acceptation

### A. Rôles et profil partagés (`useAuth`)
- [ ] A1. Les rôles et le profil de `useAuth()` sont un état partagé (`useState` ou équivalent) : deux composants qui appellent `useAuth()` voient les mêmes valeurs, le chargement fait par l'un est visible par l'autre.
- [ ] A2. Les rôles et le profil sont rechargés quand l'utilisateur change (connexion, déconnexion, changement de compte) sans rechargement de page ; à la déconnexion ils sont vidés.
- [ ] A3. Après une connexion depuis `login.vue` sans rechargement, l'entrée « Administration » du menu de l'en-tête (`Header.vue`) apparaît pour un admin, sans recharger la page.
- [ ] A4. Si le menu est déplié avant la fin du chargement des rôles, l'entrée « Administration » apparaît dès que le chargement se termine (réactivité, pas de lecture unique au montage).
- [ ] A5. Un échec de lecture du profil ne laisse pas un admin silencieusement sans droits de façon définitive : nouvel essai au prochain changement d'utilisateur ou appel explicite, et l'entrée reste masquée tant que les rôles ne sont pas connus (pas d'affichage par défaut).
- [ ] A6. Le contournement `fetchProfile()` au montage de `app/components/admin/HelloAssoConfig.vue` est retiré ; `HelloAssoConfig.roles.test.ts` reste vert sans lui.
- [ ] A7. Pas de chargements en double : plusieurs composants montés en même temps ne déclenchent qu'une lecture du profil par changement d'utilisateur.

### B. Inscription publique (`/api/register`)
- [ ] B1. Une inscription publique valide (email inédit) renvoie un succès ; l'utilisateur voit le message de succès, pas d'erreur.
- [ ] B2. Le profil créé contient les champs saisis dans le formulaire et les enfants déclarés, et son statut est **« En attente »**.
- [ ] B3. Le 409 n'est renvoyé que pour un **vrai doublon** (email déjà associé à un compte existant avant cette inscription), avec un message explicite.
- [ ] B4. Le profil créé par le trigger au moment du `signUp` n'est plus confondu avec un doublon (la ligne créée par le trigger pour ce même utilisateur est complétée, pas rejetée).
- [ ] B5. Sans session, `/api/register` n'accepte de compléter un profil que si l'appel fournit **l'e-mail ET l'identifiant (UUID) du compte renvoyé par `signUp`**, que le compte n'a jamais été connecté et qu'il a été créé il y a moins d'une heure. L'e-mail seul est refusé. Avec une session, l'id de la session doit correspondre.

### C. Aucun nouveau compte « Actif » sans validation
- [ ] C1. Tout nouveau compte (inscription publique, Google, Microsoft) est créé en statut **« En attente »** ; seul le bureau (admin ou secrétaire) le passe en « Actif ».
- [ ] C2. Un nouveau compte Google/Microsoft n'a **aucun rôle**, sauf s'il déclare des enfants à la complétion : il reçoit alors `parent` (même règle que l'inscription par e-mail).
- [ ] C3. Un utilisateur connecté dont le profil est incomplet est renvoyé vers **`/completer-profil`** (mêmes champs que l'inscription publique, enfants compris) depuis **toute page qui demande d'être connecté**, sauf `/completer-profil` elle-même et la déconnexion. Les pages publiques restent accessibles. Après envoi, le profil reste « En attente » jusqu'à validation du bureau.
- [ ] C4. Un membre créé par le bureau via `create-member` a **explicitement le statut choisi par l'admin** (pas « En attente » par défaut) ; `profiles_block_status` l'autorise.
- [ ] C5. Un adhérent ne peut modifier ni son `status` ni son `profile_completed_at`, ni ceux d'un autre profil ; la secrétaire et l'admin le peuvent (trigger `profiles_block_status`).
- [ ] C6. **T1b — vérification sur le dev** (porte de qualité) : script lancé avec les vrais comptes de test, qui vérifie C5 et que `handle_new_user` crée un profil « En attente » non complété.

### D. `create-member` n'écrase plus l'enrichissement
- [ ] D1. L'upsert de `create-member` n'écrase pas une valeur déjà renseignée (notamment par `on_profile_enrich`) par une valeur vide, `null` ou absente du formulaire.
- [ ] D2. Les valeurs non vides saisies par l'admin sont bien enregistrées (y compris si elles remplacent une valeur existante).

### E. Base de données
- [ ] E1. Les changements du trigger `on_auth_user_created` (et de `on_profile_enrich` si besoin) passent par une **nouvelle migration** dans `supabase/migrations/`, appliquée au seul projet dev ; aucune migration existante n'est réécrite.

## Parcours utilisateur (e2e)
- Visiteur → `/register` (formulaire public, avec un enfant) → envoi → message de succès, aucune erreur ; en base (dev) : profil « En attente » avec les champs saisis et l'enfant. **Écrit en base** et **envoie un vrai e-mail** : adresse jetable = `TEST_USERS_EMAIL` avec suffixe `+e2e-<horodatage>`, **jamais `@example.com`** ; compte confirmé ensuite par l'API admin (service role, dev uniquement), puis supprimé à la fin. À lancer rarement ; sauté proprement (`test.skip` avec raison) si la limite d'envoi Supabase est atteinte.
- Visiteur → inscription avec l'email d'un compte de test existant → message d'erreur « déjà inscrit » (409). Pas d'écriture.
- Admin de test → `/login` → connexion sans rechargement → ouvre le menu de l'en-tête → l'entrée « Administration » est visible. Pas d'écriture.
- Adhérent de test sans rôle → `/login` → menu de l'en-tête → pas d'entrée « Administration ». Pas d'écriture.
- (OAuth Google/Microsoft : non testable en e2e sans fournisseur réel → couvert en Vitest : redirection vers la complétion, statut et rôles.)

## Hors périmètre
- La correction des comptes déjà créés en prod (statuts « Actif » à tort, profils incomplets, comptes OAuth sans rôle).
- Toute opération sur la base de prod.
- Refonte visuelle des pages login / inscription au-delà du formulaire de complétion OAuth.

## Contraintes / contexte
- Diagnostic détaillé : [docs/features/helloasso-socle/status.md](../helloasso-socle/status.md) § Suites (« Feature authentification et profils », « Contournement à retirer »). Fichiers cités : `app/composables/useAuth.ts:12` (ref locale), `Header.vue:271-278`, `app.vue`, `login.vue`, `HelloAssoConfig.vue`.
- Statuts possibles : `'Actif' | 'Inactif' | 'En attente'` (`profiles.status`, défaut actuel `'Actif'`). Rôles : `admin`, `secretary`, `parent`, `initiateur` (table `user_roles`).
- Décisions de l'utilisateur (2026-10-29) : comptes Google/Microsoft → **« En attente » + formulaire de complétion à la première connexion**, **aucun rôle** par défaut (`parent` s'ils déclarent des enfants). Tous les profils existants sont marqués complétés par la migration. Trigger `profiles_block_status` validé.
- Hypothèse : le profil est « incomplet » tant que les champs obligatoires du formulaire d'inscription ne sont pas renseignés ; le planner fixe le critère exact (colonne dédiée ou calcul) d'après le schéma.
- Hypothèse : les routes admin et `requireAdmin` ne changent pas de comportement ; seule leur alimentation côté front (rôles partagés) est corrigée.
- Tests : pas d'appel réel à Supabase en Vitest (Supabase simulé) ; e2e sur le projet dev avec les comptes de test existants (`docs/test-plan.md`).
- Supabase : projet dev `ybtnnogxukfldurozqwa` uniquement ; schéma via `supabase/migrations/` (cf. [docs/database.md](../../database.md)).

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok concerné |
