# T0 — tests d'abord (rouges) · helloasso-socle

> Rédigé par : qa · 2026-10-28 · fichiers de test : voir les 7 sections ci-dessous. Aucun code de production n'a été créé ou modifié.
> **Les agents de dev ne modifient pas ces tests** : un test qui paraît faux ⇒ stop et signalement.

## Prérequis (hors périmètre de qa : `vitest.config.ts`) — ☑ ajouté par l'orchestrateur le 2026-10-28

Revérifié après l'ajout : 290 tests, 148 verts, 142 rouges (94 `ABSENT`, 48 assertions), 0 autre.

`#supabase/server` est un alias Nitro que Vite ne sait pas résoudre. Sous Vitest, toute route `server/` ou `requireAdmin.ts` qui l'importe **échoue au chargement** (« Failed to resolve import "#supabase/server" »), même avec `vi.mock('#supabase/server', …)` : l'analyse des imports précède le mock. Aucune route de `server/` n'était testable jusqu'ici (seul `revalidate.post.ts` l'est, il n'importe pas Supabase).

**À ajouter dans `vitest.config.ts`** (fichier hors `tests/`, donc non modifié par qa), au niveau racine de `defineVitestConfig` :

```ts
import { fileURLToPath } from 'node:url'
// …
resolve: {
  alias: {
    '#supabase/server': fileURLToPath(new URL('./tests/utils/supabase-server-stub.ts', import.meta.url)),
  },
},
```

`tests/utils/supabase-server-stub.ts` (créé par qa) est la cible de l'alias : chaque test le remplace par `vi.mock('#supabase/server', factory)`. Vérifié avec une config temporaire équivalente : les 108 tests existants restent verts et les classements ci-dessous sont ceux de cet état. Sans l'alias, 84 tests des 4 fichiers qui chargent une route ou `requireAdmin` échouent avec un message `INFRA: alias '#supabase/server' absent de vitest.config.ts` (le helper `loadModule` le dit explicitement).

## Conventions

- Module absent ⇒ le test échoue avec `ABSENT: <chemin>` (import dynamique à chemin variable dans `tests/utils/helloasso-kit.ts` → `loadModule`), la collecte du fichier ne plante pas.
- Module existant ⇒ l'échec est une assertion (comportement du contrat non implémenté).
- Catégories : `ABSENT <module>` · `assertion <ce qui manque>` · `vert attendu` (passe déjà : non-régression ou garde-fou).
- Aides créées : `tests/utils/helloasso-kit.ts` (loadModule, fetch routé, fixtures, sleep factice), `tests/utils/fake-supabase.ts` (Supabase en mémoire avec RPC `helloasso_acquire_token_lock` émulée), `tests/utils/supabase-server-stub.ts`. `tests/utils/supabase-mock.ts` n'est pas modifié (le faux en mémoire le remplace ici : les écritures conditionnées à `lock_holder` doivent être observées sur l'état, pas sur la forme des appels).
- Fixtures : uniquement `token.ok`, `token.refreshed`, `form-types.ok`, `items.page-size-1`. Les `401/403/429` sont simulés par le **statut seul** (corps vide) ; l'en-tête `Retry-After` du `429` est une hypothèse du plan (« retryAfter lu »), jamais observé chez HelloAsso.
- Contrôle de satisfiabilité : une implémentation de référence jetable (client, route de test, requireAdmin, sync, formulaires), écrite d'après le contrat puis supprimée, fait passer les 176 tests non basés sur la lecture de fichiers ; seuls les 6 tests de `helloasso-boundary` (lecture du dépôt) restaient rouges, comme attendu.

## Liste des tests (un par ligne : nom — raison de l'échec)

### tests/server/utils/helloasso.test.ts (64 tests)
_Client HelloAsso (`server/utils/helloasso.ts`)_

- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › sandbox sans URL explicite : URLs par défaut de la sandbox — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › production sans URL explicite : URLs par défaut de la production — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › apiUrl et tokenUrl explicites : conservées — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › conserve clientId, clientSecret et orgSlug — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › clientId manquant : config_missing qui cite la clé, sans fetch ni valeur secrète — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › clientSecret manquant : config_missing qui cite la clé, sans fetch ni valeur secrète — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › orgSlug manquant : config_missing qui cite la clé, sans fetch ni valeur secrète — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › environment manquant : config_missing qui cite la clé, sans fetch ni valeur secrète — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › plusieurs clés manquantes : toutes citées par leur nom — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › environnement sans valeur par défaut : config absente => config_missing (pas de TypeError) — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › environnement invalide « staging » : config_missing — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › environnement invalide « prod » : config_missing — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › environnement invalide « test » : config_missing — ABSENT server/utils/helloasso.ts
- critère : configuration runtimeConfig.helloasso (resolveHelloAssoConfig) › webhookSecret vide : n'empêche pas le client (il ne sert qu'au lot 7) — ABSENT server/utils/helloasso.ts
- critère : jeton mis en cache en base, partagé entre instances › jeton valide en base : 0 appel d'auth, 0 verrou, en-tête Bearer présent — ABSENT server/utils/helloasso.ts
- critère : jeton mis en cache en base, partagé entre instances › get() appelle apiUrl + path en GET, query ajoutée à l'URL — ABSENT server/utils/helloasso.ts
- critère : jeton mis en cache en base, partagé entre instances › post() envoie le corps en JSON avec le Bearer — ABSENT server/utils/helloasso.ts
- critère : jeton mis en cache en base, partagé entre instances › getAccessToken() renvoie le jeton valide de la base — ABSENT server/utils/helloasso.ts
- critère : jeton mis en cache en base, partagé entre instances › le client expose sa config résolue — ABSENT server/utils/helloasso.ts
- critère : jeton mis en cache en base, partagé entre instances › une ligne par environnement : en production, la ligne sandbox est ignorée et laissée intacte — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › aucune ligne en base : 1 seul appel client_credentials, form-urlencoded — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › jeton expiré et pas de refresh_token : 1 seul appel client_credentials, form-urlencoded — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › jeton expiré et refresh_token expiré : 1 seul appel client_credentials, form-urlencoded — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › écrit en base le couple de jetons, le client_id et les dates d'expiration — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › prend le verrou via la RPC helloasso_acquire_token_lock (environnement + détenteur) et le libère — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › le jeton expire dans moins de 5 min : renouvelé avant expiration — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › le jeton expire dans plus de 5 min : réutilisé tel quel — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › ligne ignorée (client_id différent) : nouvel appel client_credentials, même si un refresh_token existe — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › ligne ignorée (client_id vide) : nouvel appel client_credentials, même si un refresh_token existe — ABSENT server/utils/helloasso.ts
- critère : obtention en client_credentials, un seul appel d'auth par renouvellement › ligne ignorée (client_id absent) : nouvel appel client_credentials, même si un refresh_token existe — ABSENT server/utils/helloasso.ts
- critère : renouvellement par refresh_token, par un seul chemin (verrou) › refresh_token valide : 1 seul appel grant_type=refresh_token (pas de client_credentials) — ABSENT server/utils/helloasso.ts
- critère : renouvellement par refresh_token, par un seul chemin (verrou) › écrit le nouveau couple de jetons (le refresh_token tourne) et libère le verrou — ABSENT server/utils/helloasso.ts
- critère : renouvellement par refresh_token, par un seul chemin (verrou) › écriture conditionnée à lock_holder : une instance qui a perdu le verrou n'écrase rien — ABSENT server/utils/helloasso.ts
- critère : renouvellement par refresh_token, par un seul chemin (verrou) › 3 get() concurrents sans jeton : 1 seul appel d'auth, 1 seule prise de verrou, 3 appels API — ABSENT server/utils/helloasso.ts
- critère : verrou déjà pris par une autre instance › verrou perdu et jeton jamais renouvelé : lock_timeout, 0 appel d'auth, 0 appel API, relecture bornée — ABSENT server/utils/helloasso.ts
- critère : verrou déjà pris par une autre instance › verrou perdu puis jeton écrit par l'autre instance : jeton relu, 0 appel d'auth — ABSENT server/utils/helloasso.ts
- critère : verrou déjà pris par une autre instance › RPC à false (verrou refusé) : même comportement, sans toucher à l'endpoint d'auth — ABSENT server/utils/helloasso.ts
- critère : 401 de l'API => une seule ré-authentification puis une erreur claire › 401 puis succès : 1 seule ré-auth et 1 seul rejeu avec le nouveau jeton — ABSENT server/utils/helloasso.ts
- critère : 401 de l'API => une seule ré-authentification puis une erreur claire › 401 puis 401 : unauthorized, 2 appels API et 1 appel d'auth au total, jetons absents du message — ABSENT server/utils/helloasso.ts
- critère : refus de l'endpoint d'auth (400/401) › refresh refusé (400) : auth_failed, refresh_token effacé, 1 seul appel d'auth, aucun appel API — ABSENT server/utils/helloasso.ts
- critère : refus de l'endpoint d'auth (400/401) › refresh refusé (401) : auth_failed, refresh_token effacé, 1 seul appel d'auth, aucun appel API — ABSENT server/utils/helloasso.ts
- critère : refus de l'endpoint d'auth (400/401) › refresh refusé : le verrou est libéré — ABSENT server/utils/helloasso.ts
- critère : refus de l'endpoint d'auth (400/401) › refresh refusé : l'appel suivant repasse en client_credentials — ABSENT server/utils/helloasso.ts
- critère : refus de l'endpoint d'auth (400/401) › client_credentials refusé (400) : auth_failed, 1 seul appel d'auth, aucun secret dans l'erreur — ABSENT server/utils/helloasso.ts
- critère : refus de l'endpoint d'auth (400/401) › client_credentials refusé (401) : auth_failed, 1 seul appel d'auth, aucun secret dans l'erreur — ABSENT server/utils/helloasso.ts
- critère : 429 sans boucle, erreur exploitable › 429 sur l'API : rate_limited immédiat, un seul appel API, retryAfter lu, aucune ré-auth — ABSENT server/utils/helloasso.ts
- critère : 429 sans boucle, erreur exploitable › 429 sans en-tête Retry-After : rate_limited, retryAfter indéfini — ABSENT server/utils/helloasso.ts
- critère : 429 sans boucle, erreur exploitable › 429 sur l'endpoint d'auth : rate_limited immédiat, un seul appel d'auth, retryAfter lu, aucun appel API — ABSENT server/utils/helloasso.ts
- critère : 403, erreur réseau et autres statuts, sans boucle › 403 : forbidden, un seul appel API, aucune ré-auth — ABSENT server/utils/helloasso.ts
- critère : 403, erreur réseau et autres statuts, sans boucle › erreur réseau sur l'API : network, un seul appel, aucune boucle — ABSENT server/utils/helloasso.ts
- critère : 403, erreur réseau et autres statuts, sans boucle › erreur réseau sur l'endpoint d'auth : network, un seul appel d'auth — ABSENT server/utils/helloasso.ts
- critère : 403, erreur réseau et autres statuts, sans boucle › statut 404 : http_error avec le statut, un seul appel, aucune ré-auth — ABSENT server/utils/helloasso.ts
- critère : 403, erreur réseau et autres statuts, sans boucle › statut 500 : http_error avec le statut, un seul appel, aucune ré-auth — ABSENT server/utils/helloasso.ts
- critère : useHelloAsso(event) branché sur runtimeConfig et le service role › lit runtimeConfig.helloasso : URLs sandbox par défaut, jeton obtenu et rangé dans la base du service role — ABSENT server/utils/helloasso.ts
- critère : useHelloAsso(event) branché sur runtimeConfig et le service role › configuration absente : config_missing (aucun appel réseau) — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › config_missing → HTTP 500 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › rate_limited → HTTP 503 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › lock_timeout → HTTP 503 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › auth_failed → HTTP 502 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › unauthorized → HTTP 502 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › forbidden → HTTP 502 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › http_error → HTTP 502 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › network → HTTP 502 — ABSENT server/utils/helloasso.ts
- toH3Error : traduction des codes HelloAssoError en erreurs HTTP › rate_limited avec Retry-After connu : la durée (7 s) est transmise au client HTTP — ABSENT server/utils/helloasso.ts

### tests/server/utils/requireAdmin.test.ts (22 tests)
_`requireAdmin` (option `allowedRoles`)_

- sans option (non-régression des autres appelants) › admin passe — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- sans option (non-régression des autres appelants) › secretary passe — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- sans option (non-régression des autres appelants) › initiateur passe — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- sans option (non-régression des autres appelants) › renvoie userId et les rôles trouvés — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- sans option (non-régression des autres appelants) › un utilisateur sans aucun de ces rôles : 403 — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- sans option (non-régression des autres appelants) › utilisateur dont l'identifiant est dans `sub` (JWT brut) : accepté — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- sans option (non-régression des autres appelants) › erreur de lecture des rôles : 403 — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- requiredRole: 'admin' › l'admin passe — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- requiredRole: 'admin' › secretary est refusé (403) — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- requiredRole: 'admin' › initiateur est refusé (403) — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- allowedRoles: ['admin', 'secretary'] (lectures HelloAsso) › admin passe — vert attendu : passe aujourd'hui car `allowedRoles` est ignoré (tous rôles admis) ; deviendra une vraie vérification
- allowedRoles: ['admin', 'secretary'] (lectures HelloAsso) › secretary passe — vert attendu : passe aujourd'hui car `allowedRoles` est ignoré (tous rôles admis) ; deviendra une vraie vérification
- allowedRoles: ['admin', 'secretary'] (lectures HelloAsso) › l'initiateur est refusé (403) — assertion : `allowedRoles` est ignoré, l'initiateur passe encore
- allowedRoles: ['admin', 'secretary'] (lectures HelloAsso) › un utilisateur admin + initiateur passe, et seul le rôle autorisé est renvoyé — assertion : `allowedRoles` ignoré, rôles renvoyés non filtrés (`initiateur` au lieu de `admin`)
- allowedRoles restreint à un autre rôle › allowedRoles: ['secretary'] refuse l'admin (403) — assertion : `allowedRoles: ['secretary']` ignoré, l'admin passe encore
- allowedRoles restreint à un autre rôle › allowedRoles: ['secretary'] accepte la secrétaire — vert attendu : `allowedRoles` ignoré aujourd'hui, résultat identique (anonyme ou rôle autorisé)
- requiredRole prioritaire sur allowedRoles › la secrétaire est refusée (403) quand requiredRole: 'admin' est aussi donné — vert attendu : `allowedRoles` ignoré aujourd'hui, résultat identique (anonyme ou rôle autorisé)
- requiredRole prioritaire sur allowedRoles › l'admin passe — vert attendu : `allowedRoles` ignoré aujourd'hui, résultat identique (anonyme ou rôle autorisé)
- anonyme › 401 (sans option), sans lecture des rôles — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- anonyme › 401 (requiredRole: admin), sans lecture des rôles — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)
- anonyme › 401 (allowedRoles: admin + secretary), sans lecture des rôles — vert attendu : `allowedRoles` ignoré aujourd'hui, résultat identique (anonyme ou rôle autorisé)
- anonyme › utilisateur sans identifiant (ni id ni sub) : 401 — vert attendu : non-régression (comportement actuel ou `requiredRole` déjà implémenté)

### tests/server/api/helloasso-test.test.ts (23 tests)
_Route `POST /api/admin/helloasso-test`_

- critère : réservée à l'admin › demande requiredRole: 'admin' à requireAdmin — ABSENT server/api/admin/helloasso-test.post.ts
- critère : réservée à l'admin › non-admin refusé (403) : aucun client HelloAsso créé, aucun appel — ABSENT server/api/admin/helloasso-test.post.ts
- critère : succès sur les 2 étapes › renvoie ok: true, environnement, slug et checks publicData/transactions à « ok » — ABSENT server/api/admin/helloasso-test.post.ts
- critère : succès sur les 2 étapes › fait exactement 2 appels API, dans l'ordre : formTypes puis items?pageSize=1 — ABSENT server/api/admin/helloasso-test.post.ts
- critère : succès sur les 2 étapes › formTypes, s'il est renvoyé, est la liste des types de formulaires — ABSENT server/api/admin/helloasso-test.post.ts
- critère : succès sur les 2 étapes › aucune fuite : ni secret, ni jeton, ni donnée d'item dans la réponse — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › forbidden : réponse 200 { ok: false, step: 'publicData', code }, et l'appel items n'est pas lancé — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › unauthorized : réponse 200 { ok: false, step: 'publicData', code }, et l'appel items n'est pas lancé — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › auth_failed : réponse 200 { ok: false, step: 'publicData', code }, et l'appel items n'est pas lancé — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › rate_limited : réponse 200 { ok: false, step: 'publicData', code }, et l'appel items n'est pas lancé — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › network : réponse 200 { ok: false, step: 'publicData', code }, et l'appel items n'est pas lancé — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › http_error : réponse 200 { ok: false, step: 'publicData', code }, et l'appel items n'est pas lancé — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › 403 à publicData : forbidden avec un message générique (sans « privilège AccessTransactions manquant ») — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape publicData › ne contient pas de checks.transactions « ok » — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › 403 sur items : step transactions, code forbidden, message « privilège AccessTransactions manquant » — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › le message du 403 transactions invite à vérifier les droits du client API (message neutre « vérifiez les droits du client API dans le back-office HelloAsso », sans « régénérer » ; modifié le 2026-10-28) — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › unauthorized à transactions : step transactions, code conservé, SANS le message AccessTransactions — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › rate_limited à transactions : step transactions, code conservé, SANS le message AccessTransactions — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › network à transactions : step transactions, code conservé, SANS le message AccessTransactions — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › http_error à transactions : step transactions, code conservé, SANS le message AccessTransactions — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › l'étape publicData réussie est signalée dans checks — ABSENT server/api/admin/helloasso-test.post.ts
- critère : échec à l'étape transactions › aucune fuite sur un échec : ni secret, ni jeton, ni donnée d'item — ABSENT server/api/admin/helloasso-test.post.ts
- critère : configuration absente ou invalide › useHelloAsso lève config_missing : { ok: false, step: 'config', code: 'config_missing' }, aucun appel API — ABSENT server/api/admin/helloasso-test.post.ts

### tests/server/api/sync-helloasso.test.ts (9 tests)
_Route `POST /api/admin/sync-helloasso`_

- le fetch global n'est jamais appelé (ni OAuth, ni items) — assertion : la route appelle encore `fetch` directement (jeton OAuth + items)
- lit les items Membership du formulaire via useHelloAsso().get (chemin relatif à apiUrl) — assertion : `useHelloAsso().get` n'est jamais appelé (la route appelle `fetch`)
- une page de moins de 100 items : un seul appel par formulaire — assertion : `useHelloAsso().get` n'est jamais appelé (la route appelle `fetch`)
- rapprochement inchangé : l'adhérent retrouvé est compté, son paiement est enregistré (120 €, order 400001) — assertion : la route appelle `fetch` (piégé) au lieu de `useHelloAsso().get`, le rapprochement ne s'exécute pas
- rapprochement inchangé : un payeur sans profil est renvoyé dans unmatched, rien n'est écrit — assertion : la route appelle `fetch` (piégé) au lieu de `useHelloAsso().get`, le rapprochement ne s'exécute pas
- aucun formulaire Membership actif : { matched: 0, unmatched: [] } sans appel HelloAsso — vert attendu : comportement existant conservé (non-régression)
- erreur HelloAsso (429) : traduite par toH3Error, l'erreur HTTP obtenue est relancée — assertion : `toH3Error` n'est jamais appelé (la route n'utilise pas le client)
- erreur HelloAsso : aucun paiement n'est écrit — assertion : `useHelloAsso().get` n'est jamais appelé
- refus de requireAdmin : rien n'est lu en base ni appelé chez HelloAsso — vert attendu : comportement existant conservé (non-régression)

### tests/server/api/helloasso-forms.test.ts (33 tests)
_Routes formulaires (`season`)_

- POST /api/admin/helloasso-forms › season absent : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (année seule) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (années sur 2 chiffres) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (séparateur « / ») : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (même année deux fois) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (années non consécutives) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (ordre inversé) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (lettres) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (suffixe parasite) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (chaîne vide) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (espaces) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (nombre) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season invalide (null) : 400, rien n'est inséré — assertion : le POST ne valide pas `season` (aucun 400, ligne insérée)
- POST /api/admin/helloasso-forms › season 2026-2027 : accepté, inséré avec sa saison — assertion : `season` n'est pas écrit à l'insertion
- POST /api/admin/helloasso-forms › season 2025-2026 : accepté — vert attendu : comportement existant conservé (non-régression)
- POST /api/admin/helloasso-forms › form_slug et label restent requis (400) — vert attendu : comportement existant conservé (non-régression)
- POST /api/admin/helloasso-forms › event_id n'est pas exposé : ignoré s'il est envoyé — vert attendu : comportement existant conservé (non-régression)
- PATCH /api/admin/helloasso-forms/[id] › active seul : toujours accepté — vert attendu : comportement existant conservé (non-régression)
- PATCH /api/admin/helloasso-forms/[id] › season seule (2026-2027) : acceptée et enregistrée — assertion : le PATCH exige encore `active` (400 « active requis »)
- PATCH /api/admin/helloasso-forms/[id] › active et season ensemble : les deux sont enregistrés — assertion : le PATCH ignore `season`, seul `active` est enregistré
- PATCH /api/admin/helloasso-forms/[id] › season invalide (année seule), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (années sur 2 chiffres), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (séparateur « / »), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (même année deux fois), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (années non consécutives), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (ordre inversé), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (lettres), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (suffixe parasite), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (chaîne vide), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (espaces), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (nombre), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` (aucun 400, ligne modifiée)
- PATCH /api/admin/helloasso-forms/[id] › season invalide (null), même avec un active valide : 400, la ligne n'est pas modifiée — assertion : le PATCH ne valide pas `season` *(ajouté le 2026-10-28, décision de l'utilisateur)*
- PATCH /api/admin/helloasso-forms/[id] › corps vide ou active non booléen sans season : 400 — vert attendu : comportement existant conservé (non-régression)
- PATCH /api/admin/helloasso-forms/[id] › event_id n'est pas exposé : ignoré s'il est envoyé — vert attendu : comportement existant conservé (non-régression)

### tests/server/api/helloasso-roles.test.ts (24 tests)
_Matrice des rôles (6 routes)_

- POST helloasso-test › anonyme : refusé (401), sans lecture, écriture ni appel HelloAsso — ABSENT server/api/admin/helloasso-test.post.ts
- POST helloasso-test › initiateur : refusé (403), sans lecture, écriture ni appel HelloAsso — ABSENT server/api/admin/helloasso-test.post.ts
- POST helloasso-test › secretary : refusé (403), sans lecture, écriture ni appel HelloAsso — ABSENT server/api/admin/helloasso-test.post.ts
- POST helloasso-test › admin : accepté (ni 401 ni 403) — ABSENT server/api/admin/helloasso-test.post.ts
- POST sync-helloasso › anonyme : refusé (401), sans lecture, écriture ni appel HelloAsso — vert attendu : garde 401 déjà en place
- POST sync-helloasso › initiateur : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : l'initiateur passe encore le garde (`requireAdmin` sans restriction de rôle)
- POST sync-helloasso › secretary : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : la secrétaire n'est pas refusée (la route n'exige pas `requiredRole: 'admin'`)
- POST sync-helloasso › admin : accepté (ni 401 ni 403) — vert attendu : accès déjà accordé (non-régression)
- POST helloasso-forms › anonyme : refusé (401), sans lecture, écriture ni appel HelloAsso — vert attendu : garde 401 déjà en place
- POST helloasso-forms › initiateur : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : l'initiateur passe encore le garde (`requireAdmin` sans restriction de rôle)
- POST helloasso-forms › secretary : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : la secrétaire n'est pas refusée (la route n'exige pas `requiredRole: 'admin'`)
- POST helloasso-forms › admin : accepté (ni 401 ni 403) — vert attendu : accès déjà accordé (non-régression)
- PATCH helloasso-forms/[id] › anonyme : refusé (401), sans lecture, écriture ni appel HelloAsso — vert attendu : garde 401 déjà en place
- PATCH helloasso-forms/[id] › initiateur : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : l'initiateur passe encore le garde (`requireAdmin` sans restriction de rôle)
- PATCH helloasso-forms/[id] › secretary : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : la secrétaire n'est pas refusée (la route n'exige pas `requiredRole: 'admin'`)
- PATCH helloasso-forms/[id] › admin : accepté (ni 401 ni 403) — vert attendu : accès déjà accordé (non-régression)
- GET helloasso-forms › anonyme : refusé (401), sans lecture, écriture ni appel HelloAsso — vert attendu : garde 401 déjà en place
- GET helloasso-forms › initiateur : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : l'initiateur passe encore le garde (`requireAdmin` sans restriction de rôle)
- GET helloasso-forms › secretary : accepté (ni 401 ni 403) — vert attendu : accès déjà accordé (non-régression)
- GET helloasso-forms › admin : accepté (ni 401 ni 403) — vert attendu : accès déjà accordé (non-régression)
- GET helloasso-stats › anonyme : refusé (401), sans lecture, écriture ni appel HelloAsso — vert attendu : garde 401 déjà en place
- GET helloasso-stats › initiateur : refusé (403), sans lecture, écriture ni appel HelloAsso — assertion : l'initiateur passe encore le garde (`requireAdmin` sans restriction de rôle)
- GET helloasso-stats › secretary : accepté (ni 401 ni 403) — vert attendu : accès déjà accordé (non-régression)
- GET helloasso-stats › admin : accepté (ni 401 ni 403) — vert attendu : accès déjà accordé (non-régression)

### tests/server/helloasso-boundary.test.ts (7 tests)
_Frontière du client unique (lecture de fichiers)_

- le module client server/utils/helloasso.ts existe — ABSENT server/utils/helloasso.ts
- le module client porte les URL par défaut (sandbox et production) et l'endpoint oauth2 — ABSENT server/utils/helloasso.ts
- aucun autre fichier de server/ ne contient « helloasso.com » — assertion : `sync-helloasso.post.ts` contient encore `api.helloasso.com`
- aucun autre fichier de server/ ne contient « helloasso-sandbox.com » — vert attendu : garde-fou, aucune occurrence aujourd'hui
- aucun autre fichier de server/ ne contient « oauth2 » — assertion : `sync-helloasso.post.ts` contient encore l'endpoint `oauth2`
- aucun autre fichier de server/ ne lit process.env.HELLOASSO* (la config passe par runtimeConfig) — assertion : `sync-helloasso.post.ts` et `webhooks/helloasso.post.ts` lisent encore `process.env.HELLOASSO*`
- le client lui-même ne lit pas process.env.HELLOASSO* (runtimeConfig serveur uniquement) — ABSENT server/utils/helloasso.ts

## Bilan (état cible : alias `#supabase/server` présent)

| Fichier | Tests | ABSENT | assertion | vert attendu | autre |
|---|---|---|---|---|---|
| `tests/server/utils/helloasso.test.ts` | 64 | 64 | 0 | 0 | 0 |
| `tests/server/utils/requireAdmin.test.ts` | 22 | 0 | 3 | 19 | 0 |
| `tests/server/api/helloasso-test.test.ts` | 23 | 23 | 0 | 0 | 0 |
| `tests/server/api/sync-helloasso.test.ts` | 9 | 0 | 7 | 2 | 0 |
| `tests/server/api/helloasso-forms.test.ts` | 33 | 0 | 27 | 6 | 0 |
| `tests/server/api/helloasso-roles.test.ts` | 24 | 4 | 8 | 12 | 0 |
| `tests/server/helloasso-boundary.test.ts` | 7 | 3 | 3 | 1 | 0 |
| **Total** | **182** | **94** | **48** | **40** | **0** |

- **Zéro « autre »** (syntaxe, import, mock, dépendance) : vérifié avec un rapport JSON de Vitest, échec par échec.
- `npm test` complet avec l'alias : 290 tests, 148 verts = **les 108 tests existants (10 fichiers, mêmes résultats qu'avant)** + 40 nouveaux verts attendus, 142 rouges (94 ABSENT + 48 assertion). Sans l'alias (config actuelle) : 109 verts, 181 rouges, dont 84 `INFRA` (voir prérequis).
- `npm run typecheck` : 192 erreurs, baseline 192, **0 nouvelle erreur**.

### Verts attendus (ne signifient pas « fait »)
- `requireAdmin` sans option, `requiredRole: 'admin'`, anonyme : le comportement existe déjà (non-régression des appelants `members.get`, `create-member.post`, `send-email.post`).
- `requireAdmin` avec `allowedRoles: ['admin', 'secretary']` pour l'admin et la secrétaire : passent aujourd'hui car l'option est ignorée ; la vraie vérification est portée par le test « initiateur refusé ».
- Matrice des rôles : 401 anonyme et acceptations déjà acquises ; `helloasso-forms` : validations `form_slug`/`label`, `active` seul, `event_id` non exposé ; `sync` : aucun formulaire actif et refus de `requireAdmin` ; `boundary` : aucune occurrence de `helloasso-sandbox.com` (garde-fou).

## Écarts, hypothèses et cas non couverts

1. **Alias `#supabase/server`** : prérequis ci-dessus. Le plan et la skill `testing` supposaient que `vi.mock('#supabase/server', …)` suffisait ; ce n'est pas le cas.
2. **`resolveHelloAssoConfig(rc)`** : le plan ne dit pas si `rc` est le `runtimeConfig` entier ou son sous-objet `helloasso`. Les tests passent un objet qui satisfait les deux lectures (`{ ...cfg, helloasso: cfg }`). Un dev peut choisir l'une ou l'autre.
3. **Constructeur de `HelloAssoError`** non figé : les tests des routes utilisent un double (`code`, `status`, `retryAfter`), les tests du client obtiennent les vraies erreurs en pilotant le client. Les routes doivent donc reposer sur `err.code` / `instanceof HelloAssoError`, pas sur la signature du constructeur.
4. **`now?`** (type non précisé : `Date` ou nombre) : non injecté, les tests utilisent l'horloge réelle avec des dates relatives. `sleep?` est injecté (`(ms) => Promise<void>`).
5. **`Retry-After` de `toH3Error`** : le plan dit « en-tête s'il est connu » sans préciser le support. Le test accepte `headers['Retry-After']`, `data.retryAfter` ou `retryAfter` sur l'erreur renvoyée, et vérifie la valeur `7`. `toH3Error` peut renvoyer l'erreur ou la lever (les deux sont acceptés).
6. **Déductions du contrat** (à confirmer en revue) : un statut `404`/`500` de l'API donne `http_error` avec `status` ; une erreur réseau sur l'endpoint d'auth donne `network` ; le verrou est **libéré** même quand l'auth échoue ; `webhookSecret` vide n'empêche pas `resolveHelloAssoConfig` ; `staging`, `prod`, `test` sont des environnements invalides ; `config_missing` cite `environment` quand l'environnement est absent.
7. **Route de test** : les tests vérifient aussi `requireAdmin(event, { requiredRole: 'admin' })` (formulation du contrat) ; les deux appels `get` acceptent `get(path, { pageSize: 1 })` ou un `path` avec `?pageSize=1`. La cellule « admin accepté » de la matrice des rôles pour `helloasso-test` utilise le vrai client (dépend donc aussi de T3).
8. **PATCH `season: null`** : tranché le 2026-10-28, 400 (test ajouté ; total 183 tests, 49 en assertion).
9. **Non testés en Vitest** (aucun comportement observable ou hors périmètre T0) : le timeout des appels `fetch` ; le contenu de `nuxt.config.ts` (`runtimeConfig.helloasso` côté serveur, rien dans `public` : la config privée n'est pas visible dans l'environnement `nuxt` de Vitest, à vérifier en revue de T2 et par la route de test) ; la migration SQL, les RLS, le `REVOKE`/`GRANT` de la RPC, le CHECK de `season` côté base (revue + scénario manuel) ; la lecture du secret du webhook via `runtimeConfig` (seul le test de frontière interdit `process.env.HELLOASSO*`).
10. **Aucune fixture inventée** : le corps des `401/403/429` n'est jamais utilisé, seul le statut compte.

## C0 — corrections post-revue

Tests d'abord des corrections C1 à C4 (2026-10-28). 4 fichiers nouveaux, aucun test existant modifié. **85 tests : 51 rouges (assertion : comportement absent), 34 verts (non-régression ou contrôles déjà vrais), 0 « autre »** (vérifié avec un rapport JSON de Vitest : les 51 échecs sont tous des `AssertionError`). `npm test` : 395 tests, 344 verts = les 310 existants + 34 nouveaux verts ; `npm run typecheck` : 191, baseline 191, 0 nouvelle erreur.

| Fichier | Tests | Rouges | Verts |
|---|---|---|---|
| `tests/server/api/helloasso-webhook-secret.test.ts` (C1) | 16 | 12 | 4 |
| `tests/server/api/helloasso-forms-errors.test.ts` (C2) | 21 | 9 | 12 |
| `tests/components/admin/HelloAssoConfig.errors.test.ts` (C3) | 18 | 8 | 10 |
| `tests/server/api/sync-helloasso-encoding.test.ts` (C4) | 30 | 22 | 8 |

### C1 — Webhook fermé par défaut (`helloasso-webhook-secret.test.ts`)
Refus attendu : erreur levée (`createError`, statut >= 400) ou `setResponseStatus` >= 400 ; le test ne fige pas le mécanisme, seulement le statut (503 dans un test dédié). Rouge aujourd'hui : la route répond `{ ok: true }` et traite la notification.
- `secret vide / absent / null / bloc helloasso absent`, **sans** `secret` dans l'URL (4 tests) : rouge, statut 0 au lieu de >= 400 (la notification est traitée et le paiement écrit).
- Mêmes 4 configurations, **avec** un secret forgé dans l'URL (4 tests) : rouge, même raison.
- Config vide et `secret=` vide dans l'URL : rouge, « vide = vide » est accepté aujourd'hui.
- Le refus est un 503 : rouge, statut 0.
- Une notification non pertinente (`eventType: 'Order'`) est refusée aussi : rouge, `{ ok: true }` renvoyé.
- Aucun log ne contient le secret de l'URL ni le corps (nom, prénom, id de commande, slug) : **vert** (la route actuelle ne journalise rien de tel sur ce chemin ; garde-fou pour le correctif).
- Le message de l'erreur renvoyée ne contient ni secret ni corps : rouge, aucune erreur renvoyée.
- Non-régression, secret défini : secret correct => paiement 120 € enregistré et flag `payment_done` (vert) ; secret faux => `{ ok: true }` sans lecture ni écriture (vert) ; secret absent de l'URL => `{ ok: true }` sans écriture (vert).

### C2 — Erreurs des formulaires (`helloasso-forms-errors.test.ts`)
Le faux Supabase ne produit pas d'erreur `23505` : un client factice (Proxy thenable) renvoie l'erreur donnée.
- POST doublon `23505` => 409 : rouge, 500 aujourd'hui.
- POST doublon : message en français (`déjà` ou `existe`) : rouge, texte brut `duplicate key value…`.
- POST doublon, absence de fuite de 10 fragments bruts (nom de contrainte, `duplicate key`, `violates`, `unique constraint`, `23505`, `Key (form_type`, `already exists`, `PGRST116`, `JSON object requested`, `rows returned`) : 4 rouges (nom de contrainte, `duplicate key`, `violates`, `unique constraint` sont dans `statusMessage`), 6 verts (fragments qui n'apparaissent aujourd'hui que dans `details`, que la route ne recopie pas : garde-fous).
- POST autre erreur base (`57P01`) => 500 ; POST erreur sans code => 500 ; POST insertion réussie : 3 verts (non-régression).
- PATCH id inconnu avec le faux Supabase (`PGRST116` émulé) => 404 : rouge, 500.
- PATCH id inconnu, erreur `PGRST116` renvoyée par le client => 404 : rouge, 500.
- PATCH id inconnu : message en français (`introuvable`, `inconnu`, `existe pas` ou `trouvé`), sans `PGRST116` ni `JSON object requested` : rouge sur le message en français (texte brut PostgREST) ; le test regroupe les trois assertions.
- PATCH autre erreur base => 500 ; PATCH erreur sans code => 500 ; PATCH id connu modifié et renvoyé : 3 verts (non-régression).

### C3 — Message du serveur dans `HelloAssoConfig.vue` (`HelloAssoConfig.errors.test.ts`)
`fetch` natif simulé, `useToast` simulé (`mockNuxtImport`) : on lit la description des toasts `color: 'error'`. 4 actions (chargement de la liste, ajout, activation/désactivation, synchronisation) x 4 cas :
- corps h3 avec `statusMessage` (et `message` différent) : le toast contient le `statusMessage` : 4 rouges, le toast ne contient que « Erreur 409 ».
- corps avec `message` seul : le toast contient le message : 4 rouges, même raison.
- corps JSON sans message (502) : repli sur « Erreur 502 » : 4 verts (comportement actuel, à conserver).
- corps non JSON, page HTML (500) : repli sur « Erreur 500 » : 4 verts.
- Non-régression : succès de la liste, de la bascule et de la sync => aucun toast d'erreur ; montage seul => aucun toast d'erreur : 2 verts.

### C4 — Slugs encodés dans la sync (`sync-helloasso-encoding.test.ts`)
`useHelloAsso().get` est mocké ; le chemin reçu est comparé à `encodeURIComponent`. 7 slugs : `a/b`, `a?b=c`, `a b`, `../admin`, `x/../y`, `a#b&c%d`, `adhésion`.
- `form_slug` encodé (7 tests) : 7 rouges, chemin brut.
- `form_slug` : 6 segments, sans `?` ni `../` (7 tests) : 4 rouges (`/`, `?`, `../admin`, `x/../y`) ; 3 verts (espace, `#&%`, accent : ne changent ni le nombre de segments ni la query, garde-fous).
- `orgSlug` encodé (7 tests) : 7 rouges.
- `orgSlug` : 6 segments, sans `?` (7 tests) : 4 rouges (`/`, `?`, `../admin`, `x/../y`) ; 3 verts (mêmes garde-fous).
- Non-régression : slugs ordinaires inchangés ; pagination `{ pageIndex: 1, pageSize: 100 }` passée en second argument : 2 verts.

### Ambiguïtés
- Le webhook : le refus peut être une erreur levée ou un `setResponseStatus` ; seul le statut >= 400 est exigé (503 dans un test à part).
- Le test « notification non pertinente refusée aussi » est une interprétation de « refuse toute notification » (pas d'acquittement 200 sans secret) : à retirer si le dev préfère acquitter les types ignorés.
- `encodeURIComponent('..')` renvoie `..` : un slug réduit à `..` n'est pas neutralisé par l'encodage, il n'est donc pas testé seul (les cas `../admin` et `x/../y` le sont).
- Messages en français de C2 : seuls des mots-clés sont exigés (`déjà|existe` pour le 409, `introuvable|inconnu|existe pas|trouvé` pour le 404).
