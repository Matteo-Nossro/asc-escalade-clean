# Limites et sandbox

Sources : [Limite d'appels](https://dev.helloasso.com/docs/limitation-api) · [Tester votre intégration](https://dev.helloasso.com/docs/environnements-production-et-sandbox-test) · [API Overview](https://dev.helloasso.com/docs/api-overview) · [Vérifier l'authenticité](https://dev.helloasso.com/docs/secure-webhook)

## Rate limits

La page officielle s'intitule « Limite d'appels sur l'API Authentification » et ne concerne que le **endpoint d'authentification** :

| Règle | Limite |
|---|---|
| 1 | 10 appels / 10 secondes |
| 2 | 20 appels / 10 minutes |
| 3 | 50 appels / heure |

- Dépassement : `429 Too Many Requests`. Durée de blocage et headers de rate limit : non précisés.
- Recommandation officielle : mettre en cache l'`access_token` (30 min) ou utiliser le `refresh_token`.
- Les autres endpoints (`/v5/...`) : aucune limite documentée (voir Non trouvé).

## Environnements

| | Production | Sandbox |
|---|---|---|
| API | `https://api.helloasso.com/v5` | `https://api.helloasso-sandbox.com/v5` |
| Token | `https://api.helloasso.com/oauth2/token` | `https://api.helloasso-sandbox.com/oauth2/token` (validé le 2026-10-28 ; la doc écrit `/oauth2`) |
| Site / back-office | `https://www.helloasso.com` | `http://www.helloasso-sandbox.com` |
| Création compte | - | `https://auth.helloasso-sandbox.com/inscription` (bouton « Créer mon asso de test ») |
| IP d'envoi des webhooks | `51.138.206.200` | `4.233.135.234` |

## Compte de test

1. Créer une association fictive sur la sandbox (lien ci-dessus).
2. « Pour effectuer un premier paiement en Sandbox, vous devez valider votre compte avec des documents fictifs. »
3. Récupérer le client API (`clientId`/`clientSecret`) depuis le back-office sandbox (Overview) : les identifiants prod et sandbox sont distincts (déduit : deux plateformes séparées).
4. Les `slug` d'organisation sont ceux de la sandbox.

## Cartes de test

La doc ne donne pas de numéros ; elle renvoie vers la liste Stripe (`https://docs.stripe.com/testing?numbers-or-method-or-token=card-numbers#visa`) et Worldline (`https://docs.sips.worldline-solutions.com/fr/cartes-de-test.html`).
- (non officiel) un extrait de recherche d'un post de la communauté dev (lien non relu : [Impossible de simuler les paiements ?](https://dev.helloasso.com/discuss/672cc4ddcc1d17007712781a)) évoque `4242424242424242` ; à ne pas considérer comme garanti.

## Différences avec la production

Documenté : URL d'API distinctes, IP de webhook distincte, compte et documents fictifs, cartes fictives, exemples de payload avec `helloasso-sandbox.com` dans `paymentReceiptUrl`.

(non officiel) Pièges rapportés dans la communauté dev.helloasso.com :
- `409` lors d'un paiement attribué par l'auteur à une organisation sandbox non validée, sans réponse publiée : [discussion](https://dev.helloasso.com/discuss/69a06b2040ea3a1c581c43bd). Cohérent avec la doc officielle : `409` si l'association ne peut pas recevoir de paiement.
- Aucun webhook reçu après paiement test, sans réponse publiée : [discussion](https://dev.helloasso.com/discuss/68dffdc5c1cf7065acf07978).
- Pas de méthode documentée pour simuler un paiement refusé : [discussion](https://dev.helloasso.com/discuss/686628335999220011d83d98).

## Non trouvé

- Rate limits des endpoints de données et des checkout-intents ; headers `Retry-After`/`X-RateLimit-*` (absents des réponses 200 en sandbox le 2026-10-28 ; une réponse 429 n'a pas été observée).
- URL du back-office sandbox pour obtenir la clé API (le site `helloasso-sandbox.com` est donné, pas la page).
- Numéros de cartes de test officiels HelloAsso et cas de refus/3DS simulables.
- Liste des différences fonctionnelles prod/sandbox (SEPA, virements, reçus, e-mails envoyés ?).
- Si les webhooks sandbox sont envoyés dans tous les cas (cas rapporté sans réponse).
- Contraintes sur les URL de retour en sandbox (HTTPS imposé aussi pour `localhost` ?) : la doc impose HTTPS pour `backUrl`/`errorUrl`/`returnUrl` sans exception ; pour développer en local, un tunnel HTTPS est donc requis (déduction, non écrit).
