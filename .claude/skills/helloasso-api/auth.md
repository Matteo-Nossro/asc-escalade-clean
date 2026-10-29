# Authentification HelloAsso API v5

Sources : [S'authentifier](https://dev.helloasso.com/docs/getting-started) · [Obtenir une clé API](https://dev.helloasso.com/docs/obtenir-une-clé-api) · [Privilèges et rôles](https://dev.helloasso.com/docs/privilèges-et-rôles) · [API Overview](https://dev.helloasso.com/docs/api-overview) · [Ref token](https://dev.helloasso.com/reference/obtenir-un-access_token)

## OAuth2

| Question | Réponse |
|---|---|
| Grant type | `client_credentials` (puis `refresh_token` pour renouveler) |
| Endpoint prod | `POST https://api.helloasso.com/oauth2/token` |
| Endpoint sandbox | `POST https://api.helloasso-sandbox.com/oauth2/token` : **validé en sandbox le 2026-10-28** (HTTP 200, P0 de `helloasso-socle`). La doc n'écrit que `/oauth2` ([Tester](https://dev.helloasso.com/docs/environnements-production-et-sandbox-test)) ; ce repli n'a pas été testé. |
| Content-Type | `application/x-www-form-urlencoded` |
| Paramètres | `client_id`, `client_secret`, `grant_type=client_credentials` |
| Réponse | `access_token` (JWT), `refresh_token`, `token_type` (`bearer`), `expires_in` (secondes) |
| Usage | Header `Authorization: Bearer <access_token>` |

```
POST /oauth2/token
grant_type=client_credentials&client_id=...&client_secret=...
```

## Durées de vie

| Token | Durée | Source |
|---|---|---|
| `access_token` | ~30 min (`expires_in` = 1799) | [getting-started](https://dev.helloasso.com/docs/getting-started) |
| `refresh_token` | 30 jours (« 1 mois » dans la version anglaise) | [getting-started](https://dev.helloasso.com/docs/getting-started), [api-overview](https://dev.helloasso.com/docs/api-overview) |

## Renouvellement

- Même route, `grant_type=refresh_token` + `refresh_token=<valeur>` ; réponse identique (nouvelle paire de tokens).
- La doc **interdit** de régénérer un access_token via `client_id`/`client_secret` à chaque appel : il faut utiliser le refresh_token.
- Chaque refresh renvoie un **nouveau** refresh_token : il faut en faire au moins un tous les 30 jours.
- Rotation (doc) : utiliser A produit B (A et B valides) ; réutiliser A produit C et **révoque B** ; utiliser B produit D et révoque A.
  - Conséquence : deux processus qui rafraîchissent en parallèle avec le même token se révoquent mutuellement (déduction de la règle ci-dessus). Centraliser le refresh (un seul stockage partagé).
- Les appels au endpoint d'auth sont limités (voir [limits-sandbox.md](limits-sandbox.md)) : mettre le token en cache.

## Droits nécessaires

- Clé API (`clientId` + `clientSecret`) : compte association HelloAsso, section `Mon Compte > Intégration et API` ([clé API](https://dev.helloasso.com/docs/obtenir-une-clé-api)).
- Une association reçoit par défaut les privilèges `Checkout`, `AccessPublicData`, `AccessTransactions` ; les autres (`RefundManagement`, `FormAdministration`, `FormOpenDirectory`, `OrganizationOpenDirectory`) se demandent via un partenariat ([privilèges](https://dev.helloasso.com/docs/privilèges-et-rôles)).
- Rôle `OrganizationAdmin` attribué automatiquement à une clé générée depuis le back-office de l'association ; `FormAdmin` donne accès aux points sensibles d'un formulaire (paiements) ([privilèges](https://dev.helloasso.com/docs/privilèges-et-rôles)).
- Un token d'organisation n'accède qu'à l'organisation à laquelle le client est rattaché ; un client partenaire `client_credentials` n'a aucun rôle utilisateur sur les ressources d'une organisation ([overview](https://dev.helloasso.com/docs/api-overview)).
- Exigences par route (ex. : lecture commandes/items/paiements = rôle `FormAdmin` ou `OrganizationAdmin` + privilège `AccessTransactions` ; liste de paiements d'organisation = `OrganizationAdmin` ; `checkout-intents` = privilège `Checkout` ; remboursement = `RefundManagement`) : voir chaque page de référence.
- Codes : `401` JWT absent/invalide, `403` privilège ou rôle manquant.

## Secrets

- Doc : « Keep your client ID and secret confidential » ; ne jamais les exposer dans du code client ni dans des dépôts publics ([overview](https://dev.helloasso.com/docs/api-overview)).
- Rien d'autre n'est précisé sur le stockage (voir Non trouvé).

## Vérifié en sandbox (2026-10-28, `scripts/helloasso-sandbox-check.mjs`)

Clé générée depuis le back-office de l'association de test. Seules la structure et les codes HTTP ont été relevés, aucune valeur.

| Appel | HTTP | Structure de la réponse |
|---|---|---|
| `client_credentials` sur `/oauth2/token` | 200 | `access_token` (string), `expires_in` (number), `refresh_token` (string), `token_type` (string) |
| `refresh_token` sur `/oauth2/token` | 200 | identique à `client_credentials` |
| `GET /v5/organizations/{slug}/formTypes` | 200 | tableau de chaînes (voir [forms-memberships.md](forms-memberships.md)) |
| `GET /v5/organizations/{slug}/items?pageSize=1` | 200 | `{ data[], pagination }` : `AccessTransactions` est **présent** par défaut |

- En-têtes de l'endpoint token (200) : aucun en-tête de rate limit (`Retry-After`, `X-RateLimit-*`). La réponse passe par Cloudflare (`cf-ray`) et pose des cookies (`set-cookie`), que le client ignore.
- Les réponses `/v5` ajoutent les en-têtes `auth-scheme` et `request-context`.
- Les réponses d'erreur (400, 401, 403, 429) n'ont pas été provoquées : leur format reste non documenté.

## Non trouvé

- Rôle/droit minimal requis sur le compte utilisateur pour voir la section `Intégration et API` (admin ?) : la page « Obtenir une clé API » ne le dit pas.
- Procédure de rotation / révocation du `client_secret`.
- Format des erreurs du endpoint token (400/401) : seule la réponse 200 est documentée.
- Comportement exact si le refresh_token a expiré (ré-authentification via `client_credentials` présumée, non écrite).
- Recommandation officielle de stockage des secrets et du refresh_token.
