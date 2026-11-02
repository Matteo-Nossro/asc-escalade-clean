# Plan — enfants-fiabilite

> Rédigé par : planner (sonnet) · Validé par l'utilisateur : ☑ (2026-11-02)

## Résumé de l'approche
Corrections ciblées, sans migration. Côté serveur : `completeProfile.ts` accorde le rôle `parent` après les enfants, journalise la compensation et traduit `23505` en 409 ; `register.post.ts` renvoie un 403 lisible. Côté front : `register.vue` n'écrase plus ce message, `profil.vue` et `MemberModal.vue` affichent les enfants dès qu'un lien `parent_access` existe. Tests d'abord (T0), puis T1 (serveur) et T2 (front) en parallèle, puis capture `profil-390` à la porte de qualité (T3).

## Points levés par l'explorer
- **Référence `profil-390`** : `docs/features/profil-register-desktop/captures/apres/profil-390.png` (390×3626, 0 % vs la référence d'origine selon `rapport-comparaison.json`). Le lot 2 de profil-register-desktop n'a pas touché `/profil`, donc c'est aussi l'état courant. Référence d'origine équivalente : `docs/features/harmonisation-couleurs/captures/avant/profil-390.png`. Dossiers `captures/` ignorés par git mais présents en local.
- **Message 403** : le texte réel est « Identité non vérifiée » (`register.post.ts:52` e-mail différent, `:60` compte sans session trop ancien ou déjà connecté). `:52` et `:60` changent tous les deux (décision utilisateur : même message neutre pour tous les 403). Aucun bouton « renvoyer la confirmation » dans `register.vue` : le message renvoie à la boîte mail / à la page de connexion.
- **Piège Q4** : `register.vue:503` remplace tout message contenant « déjà » par « Cette adresse email est déjà utilisée ». Le message proposé en contient un (« existe déjà ») et serait écrasé. T2 restreint ce remplacement (409 uniquement, ou « déjà » hors 403).
- **Compensation / `profile_completed_at`** (incertitude 3) : levée par lecture. Le 23505 sur l'insertion du profil (l.101-104) est levé **avant** le `try` : aucune compensation, la ligne appartient à la requête concurrente. Dans le `try`, la compensation remet toujours `profile_completed_at` à null (l.178). Rien à vérifier en base.
- **Q1 et reprise** : le rôle `parent` reste accordé si `children.length > 0`, y compris quand `parent_access` existe déjà (re-soumission), mais après le bloc enfants. Il devient la dernière écriture : aucun retrait de rôle à prévoir dans la compensation.
- **Q10 admin** : `dashboard.vue:447-466` charge déjà `parent_access` sans condition de rôle ; seule la condition d'affichage de `MemberModal.vue:192` change. `useFamily.ts` et `mes-inscriptions.vue` ne dépendent pas du rôle : inchangés.

## Tâches

### T0 — Tests Vitest rouges (tests d'abord)
- **Agent** : qa
- **Fichiers** (nouveaux, à côté des tests existants, qui restent inchangés ; réutiliser la fausse base de `tests/server/api/complete-profile.atomic.test.ts`) :
  - `tests/server/api/complete-profile.reliability.test.ts` : Q1 (échec à la création d'un enfant ou de son lien ⇒ aucune ligne `user_roles` `parent` ; sans enfant ⇒ pas de rôle ; avec enfants ⇒ rôle accordé), Q2 (`console.error` espionné : une entrée par étape de compensation en échec, étape nommée, les étapes suivantes s'exécutent, erreur client inchangée = 500), Q3 (insertion profil sans ligne trigger → erreur `23505` ⇒ 409, pas de compensation)
  - `tests/server/api/register.unconfirmed.test.ts` : Q4 (compte sans session > 1 h ⇒ 403 avec le nouveau message , e-mail différent compris)
  - `tests/pages/register.error-message.test.ts` : Q4 (un 403 avec le nouveau message est affiché tel quel dans `stepError` ; un 409 affiche toujours « Cette adresse email est déjà utilisée… »)
  - `tests/components/admin/MemberModal.children.test.ts` : Q10 (section « Enfants liés » visible avec `linkedChildren` non vide et sans rôle `parent` ; visible avec le rôle seul ; absente sans rôle ni lien)
  - `tests/pages/profil.children.test.ts` (best effort) : Q10 (un utilisateur sans rôle `parent` mais avec un lien charge et affiche les enfants ; sans lien, pas de card « Profils famille »). Si le montage de `profil.vue` est impraticable, qa le note dans `status.md` et le cas est couvert par la revue et la capture.
- **Dépend de** : —
- **Détail** : tests tirés des critères d'acceptation, rouges avant T1/T2. Skill `testing`. Aucun appel réel (Supabase mocké, pas de HelloAsso). Le texte du message Q4 est fixé par qa dans les tests (décision utilisateur, message unique et neutre qui ne révèle pas l'état du compte : « Impossible de finaliser l'inscription. Si vous avez déjà un compte, connectez-vous ; sinon, recommencez l'inscription. ») ; T1 le reprend à l'identique.

### T1 — Serveur : rôle après enfants, journal de compensation, 409, message 403
- **Agent** : api-dev
- **Fichiers** : `server/utils/completeProfile.ts`, `server/api/register.post.ts`
- **Dépend de** : T0 · parallélisable avec T2 (fichiers disjoints)
- **Détail** : faire passer les tests de T0 sans les modifier.
  - `completeProfile.ts` : déplacer l'insertion du rôle `parent` après la boucle enfants (aussi après le cas « enfants déjà liés ») ; lire `error` des 3 appels de compensation et `console.error` avec l'étape (`[completeProfile] compensation <étape>`), sans interrompre la suite ni changer l'erreur levée ; sur l'insertion du profil (l.101-104), `error.code === '23505'` ⇒ `alreadyCompleted()` (409, message existant), autres codes ⇒ `fail()`.
  - `register.post.ts:60` : nouveau message 403 (compte non confirmé, trop ancien ou déjà connecté sans session). Code 403 inchangé ; `:52` (e-mail différent) reçoit le même message neutre.

### T2 — Front : message affiché tel quel, enfants selon les liens
- **Agent** : ui-dev
- **Fichiers** : `app/pages/register.vue`, `app/pages/profil.vue`, `app/components/admin/modals/MemberModal.vue`
- **Dépend de** : T0 · parallélisable avec T1
- **Détail** : faire passer les tests de T0 sans les modifier. Aucune autre modification visuelle (spec : hors périmètre).
  - `register.vue` (~l.503) : ne substituer « déjà utilisée » que pour un 409 (ou « déjà » hors 403) ; un 403 s'affiche tel quel.
  - `profil.vue` (~l.958) : charger `parent_access` sans condition sur le rôle `parent` ; l'affichage dépend déjà de `children.length > 0` (l.111), la condition `|| userRoles.includes('parent')` est conservée (le rôle sans enfant montre toujours « ajouter un enfant »).
  - `MemberModal.vue:192` : `v-if` devient « rôle `parent` coché OU `form.linkedChildren.length > 0 ` ».

### T3 — Capture `profil-390` de non-régression (porte de qualité)
- **Agent** : e2e
- **Fichiers** : aucun fichier de code (sortie dans `docs/features/enfants-fiabilite/captures/`, ignoré par git) ; lance `e2e/visual/captures.spec.ts` tel quel
- **Dépend de** : T1, T2
- **Détail** : adhérent de test (`scripts/seed-test-users.mjs`), lecture seule. Commande type (PowerShell : définir les variables d'environnement puis lancer) : `CAPTURES_BASE=docs/features/enfants-fiabilite/captures CAPTURES_OUT=apres CAPTURES_COMPARE=<chemin absolu>\docs\features\profil-register-desktop\captures\apres CAPTURES_ONLY=profil E2E_SKIP_BUILD=1 npx playwright test e2e/visual/captures.spec.ts`. Attendu : `profil-390` à 0 % (seuil 0,1 %), taille 390×3626. Si écart : vérifier d'abord que le compte de test n'a pas de lien `parent_access` sans rôle `parent` (ce serait un changement voulu de Q10, à signaler à l'utilisateur, pas un bug) ; sinon rapport à ui-dev. Rapport : `rapport-comparaison.json` dans le dossier de sortie.

Ordre : T0 → T1 ∥ T2 → QA → porte de qualité (`npm test`, `npm run typecheck` sans nouvelle erreur vs baseline 186, T3) → revue → doc.

## Migration / schéma BDD
Aucune.

## Risques / questions ouvertes
- **Q10 et la capture** : si le compte adhérent de test possède déjà un lien `parent_access` sans rôle `parent`, la section enfants apparaîtra et l'écart sera légitime. Probabilité faible ; à confirmer par l'e2e (T3), l'utilisateur tranche si c'est le cas.
- **Texte du message Q4** : proposé tel quel dans T0. Il vaut pour un compte trop ancien ; le cas « déjà connecté sans session » (`last_sign_in_at`) reçoit le même message, alors que le compte est confirmé. L'utilisateur préfère-t-il un message distinct (« Ce compte existe déjà, connectez-vous. ») pour ce cas ? Par défaut : un seul message.
- **Test de `profil.vue`** : peut être impraticable en Vitest (grosse page, aucun test existant) ; dans ce cas Q10 côté adhérent repose sur la revue et la capture, qui ne couvre pas le cas « lien sans rôle ».
- Retrait du rôle `parent` d'un compte existant sans enfant : hors périmètre (spec).

## Décisions de l'utilisateur (2026-11-02)
- Q4 : un seul message 403, neutre, pour tous les cas de `register.post.ts:60` : « Impossible de finaliser l'inscription. Si vous avez déjà un compte, connectez-vous ; sinon, recommencez l'inscription. » Il contient « déjà » : le correctif de `register.vue` ne doit substituer « déjà utilisée » que sur un 409.
- Compte adhérent de test vérifié en base (MCP) : rôle `parent` + 2 liens `parent_access` ⇒ `profil-390` doit rester à 0 % d'écart.
- Q4 (ajustement) : **tous** les 403 de `/api/register`, y compris l'e-mail différent (`:52`), renvoient ce même message neutre.
