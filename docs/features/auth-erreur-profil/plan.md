# Plan — auth-erreur-profil

> Rédigé par : planner (sonnet) · Validé par l'utilisateur : ☑ (2026-11-04, avec les décisions ci-dessous)

## Décisions de l'utilisateur (priment sur le reste du plan)
1. Le renvoi `/admin` → `/` est supprimé en cas d'échec de lecture ; il reste pour un rôle manquant une fois le profil chargé.
2. Après un « Réessayer » réussi, les redirections normales restent permises (profil incomplet → `/completer-profil`, `/admin` sans le rôle → `/`).
3. Le bloc d'erreur contient un lien « Se déconnecter » (`data-testid="auth-profile-logout"`), sans dépendre de l'en-tête : c'est la seule issue garantie si le réessai échoue en boucle. À tester en T0, à implémenter en T3.
4. Un test vérifie que la coquille de `/admin` rendue avant le montage ne contient aucune donnée : ni profil, ni liste, ni statistique.
5. Les tests existants modifiés en T0 sont listés dans `status.md`, chacun avec sa raison.
6. La liste des tests rouges est montrée à l'utilisateur avant T1.
7. Option A (2026-11-05) : `/admin/**` passe en `ssr: false`, comme `/profil`, et la porte bloque dès le premier rendu, sans attendre `onMounted`. Cela remplace ce que le plan dit de l'affichage après montage et de la coquille transitoire sur `/admin`. T3 inclut ce changement dans `nuxt.config.ts`. Le bloc A de `admin.error-shell.test.ts` reste comme garde-fou.
8. La porte de qualité lance aussi les e2e et le spec de captures, dont la capture du dashboard admin, pour vérifier ce changement de rendu.
9. `dashboard.vue` n'est pas modifié dans cette feature : le doublon avec `useAuth` part au backlog.
10. `/profil`, `/mes-inscriptions` et `/completer-profil` passent aussi en `ssr: false` via `routeRules` : le `ssr: false` de leur `definePageMeta` n'est pas appliqué, et la porte provoquait un décalage d'hydratation. Un test couvre l'accès direct à `/completer-profil`.
11. Le décalage de l'en-tête sur `admin-dashboard-1440` est recherché. Si la cause n'est pas simple à trouver, arrêt et capture avant/après montrée à l'utilisateur, qui décide à l'œil.
12. Captures de `docs/features/auth-erreur-profil/captures/` : à supprimer à la clôture.

## Résumé de l'approche
- **Réessai unique dans le middleware** : après `ensureProfile()`, si `authStatus` vaut `error`, un seul `fetchProfile()` relit le profil (2 lectures au total par navigation). `useAuth` ne change pas de logique de lecture : `load()` partage déjà la lecture en cours pour le même id, donc `auth-sync.client.ts` et le middleware ne produisent jamais deux lectures concurrentes.
- **Blocage affiché par un composant « porte » qui enveloppe `<NuxtPage />` dans `app.vue`** : sur une page protégée, si `authStatus === 'error'`, il affiche à la place de la page un message et un bouton « Réessayer ». Aucune redirection, l'URL ne change pas, la page n'est pas montée (donc aucun contenu dépendant du profil). Le bouton appelle `fetchProfile()` ; en cas de succès la page apparaît, sauf si la règle habituelle impose une redirection (profil incomplet, `/admin` sans rôle) : une seule redirection, jamais vers `/login`.
- **La liste des pages protégées et la décision de redirection passent dans un util partagé** (`app/utils/authPages.ts`), utilisé par le middleware, la porte et le bouton « Réessayer ». Une seule source de vérité.
- **Q26** : `loading` et `error` de `useAuth` n'ont aucun lecteur (déstructurations dans `login`, `completer-profil`, `callback`, `Header`, `HelloAssoConfig`, middleware, plugin : aucune ne les lit ; `login.vue` a ses propres `loading`/`error` locaux). Ils sont retirés, donc pas de séparation à faire. Le `Grep` est rejoué dans T2.
- **SSR / client** : le middleware retourne déjà tôt côté serveur, l'état est `idle` au rendu serveur, la porte laisse donc passer le slot. Côté client, l'état d'erreur est posé avant l'hydratation. `/profil`, `/mes-inscriptions` et `/completer-profil` sont `ssr: false` (pas de décalage), mais `/admin/*` est rendu côté serveur : la porte n'affiche l'erreur qu'après `onMounted` pour éviter tout décalage d'hydratation (coût : en cas d'erreur sur `/admin`, un instant de coquille de page sans donnée de profil avant le message).

### Décisions sur l'existant
- **Le comportement actuel contredit la spec** : `app/middleware/auth.global.ts:47-51` renvoie `/admin` vers `/` quand l'état n'est pas `ready`, y compris en `error`. La spec impose « aucune redirection sur échec de lecture ». Le renvoi vers `/` ne subsiste que pour `idle`/`loading` (session disparue pendant la lecture : échec fermé) et pour un rôle manquant en `ready`. En `error`, le middleware laisse passer et la porte bloque.
- **Test existant à changer** : `tests/middleware/auth.global.error-state.test.ts` documente le « comportement ACTUEL » (`/admin/dashboard` → `/`, une seule lecture). Il est réécrit en T0 : `/admin` ne redirige plus en erreur, 2 lectures du profil après échec persistant. Les cas `/profil`, `/mes-inscriptions`, `/completer-profil` (pas de redirection) restent valables. T0 relit aussi les autres `tests/middleware/auth.global*.test.ts` et `tests/composables/useAuth*.test.ts` et ne modifie que ceux qui figent l'ancien comportement (échec = 1 lecture, ou `/admin` → `/` en erreur, ou lecture de `loading`/`error`), en indiquant lesquels et pourquoi dans `status.md`.
- Les faux `useAuth` de `HelloAssoConfig.test.ts` et `HelloAssoConfig.errors.test.ts` ne sont pas touchés (hors périmètre ; ils ne lisent pas `loading`/`error`, à vérifier par `Grep` en T2).

## Contrat entre T0 et T1/T3 (pour que les tests rouges soient écrits avant le code)
- `app/utils/authPages.ts` (auto-import Nuxt) exporte : `AUTH_PAGES`, `COMPLETE_PROFILE_PATH`, `isAuthPage(path)`, `authRedirectFor(path, { status, isProfileComplete, canManage })` renvoyant `string | null` (chemin de redirection ou rien). Règles : `error` ne redirige jamais ; `ready` + profil incomplet → `/completer-profil` (sauf sur cette page) ; `ready` + complet sur `/completer-profil` → `/profil` ; `/admin` : `ready` sans rôle de gestion, ou ni `ready` ni `error` → `/`.
- `app/components/auth/PageGate.vue` (nom `AuthPageGate`) : slot par défaut = la page. Bloque (slot non rendu) quand l'utilisateur est connecté, la route courante `isAuthPage`, et `authStatus === 'error'`, après montage. Bloc d'erreur : `data-testid="auth-profile-error"`, texte contenant « Réessayer » sur le bouton. Le bouton appelle `fetchProfile()` ; ni `navigateTo('/login')` ni redirection sur échec.

## Tâches

### T0 — Tests rouges avec le vrai `useAuth` (aucun e2e)
- **Agent** : qa
- **Fichiers** : réécrire `tests/middleware/auth.global.error-state.test.ts` ; créer `tests/middleware/auth.global.retry.test.ts`, `tests/composables/useAuth.actions-error.test.ts`, `tests/components/auth/PageGate.test.ts`, `tests/utils/authPages.test.ts` ; ajuster seulement les tests existants qui figent l'ancien comportement (voir « Décisions »). Appuis : `tests/utils/supabase-mock.ts`, `tests/utils/auth-fake.ts` (`db.fail`, `db.count('profiles')`, `hold()`).
- **Dépend de** : —
- **Détail** : un test par critère de la spec, Supabase seul simulé. Middleware : échec puis succès → navigation sans message et sans redirection (2 lectures) ; échec persistant → exactement 2 lectures `profiles`, aucune redirection (y compris `/admin`) ; visiteur sans session → `/login` inchangé ; page publique jamais touchée ; profil déjà `ready` → pas de relecture à la navigation suivante. Porte : bloc d'erreur et slot absent après 2 échecs ; « Réessayer » réussi → slot affiché, même URL ; « Réessayer » en échec → message reste ; profil incomplet après réessai → une seule redirection vers `/completer-profil`. Actions : échec de `loginWithEmail`/`signUp`/`updateProfile` → `authStatus` inchangé, porte non bloquée ; `loading`/`error` absents de la valeur de retour de `useAuth`. Les tests sont rouges avant T1-T3 ; les devs ne les modifient pas.

### T1 — Util partagé + middleware (réessai unique, plus de renvoi en `error`)
- **Agent** : api-dev
- **Fichiers** : créer `app/utils/authPages.ts` ; modifier `app/middleware/auth.global.ts`
- **Dépend de** : T0
- **Détail** : faire passer les tests de T0 sans les modifier. Déplacer la liste des pages, `matches`, `MANAGEMENT_ROLES` dans l'util et y mettre `authRedirectFor`. Dans le middleware : après `ensureProfile()`, si `authStatus === 'error'`, un seul `fetchProfile(uid)` ; puis `navigateTo(authRedirectFor(...))` si non nul (au plus une redirection). Garder intacts les retours précoces serveur, PKCE et `error_code`. Parallélisable avec T2 (fichiers disjoints).

### T2 — Q26 : retrait de `loading` et `error` de `useAuth`
- **Agent** : api-dev
- **Fichiers** : `app/composables/useAuth.ts` (aucun autre fichier attendu)
- **Dépend de** : T0
- **Détail** : rejouer `Grep` sur `loading`/`error` issus de `useAuth` dans `app/` et `tests/`. Sans lecteur : supprimer les deux `useState`, leurs écritures dans `resetAuth`, `load`, `updateProfile`, `loginWithEmail`, `loginWithOAuth`, `signUp` (les actions gardent leur `throw`), et l'export. Si un lecteur apparaît : ne pas improviser, s'arrêter et le signaler. `authStatus` reste le seul état de lecture du profil. Parallélisable avec T1.

### T3 — Porte d'erreur et branchement dans `app.vue`
- **Agent** : ui-dev
- **Fichiers** : créer `app/components/auth/PageGate.vue` ; modifier `app/app.vue` (`<NuxtPage />` enveloppé par `<AuthPageGate>`)
- **Dépend de** : T1 (util), T0
- **Détail** : faire passer les tests de T0 sans les modifier. NuxtUI (`UAlert` + `UButton`), couleurs du projet, message en français clair, bouton « Réessayer » désactivé pendant la lecture (état local, pas celui de `useAuth`). Au succès, appliquer `authRedirectFor` (une seule redirection possible). Respecter `asc-rules` (imports `vue` explicites en `lang="ts"`). Pas d'animation GSAP.

### T4 — Docs et backlog
- **Agent** : doc-writer
- **Fichiers** : `docs/backlog.md` (retirer Q25 et Q26), `docs/architecture.md` (§ middleware d'auth lignes ~29-31 et ~197), `docs/conventions.md` (~164, `useAuth` sans `loading`/`error`, porte `AuthPageGate`)
- **Dépend de** : QA, revue
- **Détail** : décrire le réessai unique, le blocage sans redirection et l'util `authPages`. `graphify update .` une seule fois, à la fin.

Ordre : T0 → (T1 ∥ T2) → T3 (après T1 ; peut chevaucher T2) → QA → porte de qualité → revue → T4.

## Migration / schéma BDD
Aucune.

## Risques / questions ouvertes
- **Test existant modifié** : `auth.global.error-state.test.ts` change de contrat (`/admin` ne renvoie plus vers `/` en erreur). Le blocage repose alors uniquement sur la porte côté client ; la sécurité réelle reste au serveur (`requireAdmin`), comme prévu dans le hors-périmètre.
- **`/admin/*` rendu côté serveur** : message affiché après montage seulement (voir approche). Alternative non retenue : passer les pages admin en `ssr: false`, hors périmètre.
- Message exact de l'erreur : texte laissé à ui-dev, à valider à la revue.
- Les mocks `useAuth` de `HelloAssoConfig*.test.ts` restent des faux (précédent hors périmètre).
