---
name: helloasso-api
description: Intégration HelloAsso : API, paiements, inscriptions, adhésions, remboursements, webhooks. À consulter avant d'écrire ou de relire du code qui appelle l'API HelloAsso ou reçoit ses notifications.
---

# HelloAsso API v5

Source unique : documentation officielle ([dev.helloasso.com](https://dev.helloasso.com/docs/introduction-à-lapi-de-helloasso), index machine : [llms.txt](https://dev.helloasso.com/llms.txt)). Montants en centimes.

Dans ce projet : secrets uniquement côté serveur (`useRuntimeConfig()` hors `public`), appels API depuis `server/api` uniquement.

## Fichiers annexes
- [auth.md](auth.md) : OAuth2 client_credentials, durées des tokens, rotation du refresh_token, droits, secrets.
- [webhooks.md](webhooks.md) : configuration, `eventType`, payloads, signature, retries, idempotence.
- [orders-payments.md](orders-payments.md) : statuts commande/item/paiement, liens, endpoints de lecture.
- [forms-memberships.md](forms-memberships.md) : types de formulaires, adhérents/participants, `customFields`, pagination, filtres.
- [refunds.md](refunds.md) : remboursement par API (limites, MFA, dépréciation clé asso), notifications.
- [checkout.md](checkout.md) : `checkout-intents`, URL de retour, validation d'un paiement.
- [limits-sandbox.md](limits-sandbox.md) : rate limits, sandbox, cartes de test.

## URL de base
- Production : `https://api.helloasso.com/v5` ; token `https://api.helloasso.com/oauth2/token`
- Sandbox : `https://api.helloasso-sandbox.com/v5` ; token `https://api.helloasso-sandbox.com/oauth2/token` (validé le 2026-10-28, voir auth.md) ; site `http://www.helloasso-sandbox.com`

## Contraintes critiques
- `access_token` ~30 min, `refresh_token` 30 jours et rotatif : ne pas redemander un token à chaque appel (endpoint d'auth limité à 10 appels/10 s, 20/10 min, 50/h).
- Les paramètres de `returnUrl` sont falsifiables : valider un paiement par webhook (`Order`/`Payment`) ou `GET checkout-intents/{id}`, jamais sur `code=succeeded`.
- `redirectUrl` du checkout expire en 15 min ; `backUrl`, `errorUrl`, `returnUrl` en HTTPS uniquement.
- Webhook : répondre `200` sinon retries (`min(48h, 3 * 2 ** attempt)`, ~27 h après 16 essais) ; ordre et doublons non documentés.

## Pièges et contraintes
- Signature `x-ha-signature` (HMAC SHA-256, `signatureKey`) réservée aux partenaires ; une association n'a que la vérification par IP source (prod `51.138.206.200`, test `4.233.135.234`).
- 5 URL de notification max par association (ou 5 globales pour un partenaire).
- Un checkout produit 2 notifications : `Order` puis `Payment` (+ une par échéance payée). Tous les événements paiement ont `eventType: Payment` : lire `data.state`.
- Rotation du refresh_token : réutiliser un ancien token révoque le suivant. Centraliser le refresh.
- Remboursement par clé API d'association annoncé comme désactivé (changelog sécurité) ; MFA possible (`409`) ; partiel documenté « stripe » uniquement.
- `customFields` absents sauf `withDetails=true` ; `totalCount` de pagination souvent `-1`, s'arrêter quand `data` est vide.
- Commande en échéances validée au 1er paiement ; échéances : pas après le 27 du mois, 12 mois max.
- `409` à l'init du checkout si l'association n'est pas vérifiée/éligible aux paiements.
- `metadata` du checkout : 20 000 caractères max, renvoyé seulement dans notifications et `GET checkout-intents`.
- Pas de reçu fiscal automatique via checkout.

## Non trouvé dans la doc
- Rate limits hors endpoint d'auth ; durée de blocage après `429`.
- Garantie d'ordre, doublons, id unique de notification, timeout des webhooks, rejeu manuel.
- Signature pour les associations non partenaires.
- Cartes de test officielles (la doc renvoie à Stripe/Worldline) et URL du back-office sandbox.
- Date effective de fermeture du remboursement par clé d'association.
- Machine d'états des paiements, statut global d'une commande.
- Format de date exact pour `from`/`to`, `pageSize` maximal, stockage recommandé des secrets.
- Remboursement partiel : contradiction dans la doc (« impossible » sur la page Privilèges contre `amount` partiel pour Stripe dans la référence). À tester en sandbox.
- Règles du centre d'aide sur les remboursements : page inaccessible (403), reprise d'un extrait de recherche, à vérifier.
