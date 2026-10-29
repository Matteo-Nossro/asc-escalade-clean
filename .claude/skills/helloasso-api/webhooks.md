# Webhooks / notifications HelloAsso

Sources : [Intro notifications](https://dev.helloasso.com/docs/notifications-webhook) · [Vérifier l'authenticité](https://dev.helloasso.com/docs/secure-webhook) · [Toutes nos notifications](https://dev.helloasso.com/docs/notification-exemple) · [Validation de vos paiements](https://dev.helloasso.com/docs/validation-de-vos-paiements) · [PUT api-notifications](https://dev.helloasso.com/reference/put_partners-me-api-notifications)

## Configuration

| Profil | Méthode |
|---|---|
| Association | Back-office : `Mon Compte > Intégrations et API` ([intro](https://dev.helloasso.com/docs/notifications-webhook)) |
| Partenaire | API : `PUT /v5/partners/me/api-notifications` (URL globale) ou `PUT /v5/partners/me/api-notifications/organizations/{organizationSlug}` (une asso) ; privilège `AccessPublicData` |

- Limite : « jusqu'à 5 Urls de notification par association ou jusqu'à 5 Urls de notification globales ».
- Body partenaire : `{ "url": "https://...", "notificationType": "Order" }` ; `notificationType` ∈ `Order`, `Payment`, `Form`, `Organization` ; absent/null = tous les types.
- Réponse du PUT : `url`, `apiNotificationType`, `signatureKey` (voir signature).
- Pour tester : la doc suggère un site type webhook.site ([intro](https://dev.helloasso.com/docs/notifications-webhook)).

## Valeurs de `eventType` ([tableau officiel](https://dev.helloasso.com/docs/notification-exemple))

| `eventType` | Quand |
|---|---|
| `Order` | Commande créée |
| `Payment` | Paiement (unique ou échéance) autorisé ; remboursement effectué ; paiement contesté ; contestation gagnée ; échéance refusée ; remboursement échoué |
| `Form` | Campagne/formulaire créé |
| `Organization` | Changement de nom d'une association (donc de slug) |
| `Organization.IsCashinCompliant` | Changement d'éligibilité aux paiements |

Les événements `Payment` partagent `eventType` : on les distingue par `data.state` (`Authorized`, `Refunded`, `Contested`, `Refused`, `WaitingBankValidation`) et `data.refundOperations[].status` (ex. `PROCESSED`, `Refused`) — d'après les exemples ([remboursé](https://dev.helloasso.com/docs/paiement-remboursé), [remboursement échoué](https://dev.helloasso.com/docs/remboursement-échoué), [contesté](https://dev.helloasso.com/docs/paiement-contesté), [échéance refusée](https://dev.helloasso.com/docs/paiement-par-échéance-refusé)).

## Structure des payloads

Enveloppe : `{ "data": {...}, "eventType": "...", "metadata": ... }`. Un checkout valide envoie **deux** notifications : `Order`, puis `Payment` (plus une `Payment` par échéance payée) ([validation](https://dev.helloasso.com/docs/validation-de-vos-paiements)).

- `metadata` : la page de validation dit que chaque notification contient les `metadata` fournies à l'init du checkout (ex. `payment_ref`, `contributor_id`). Les exemples montrent un champ `metadata` avec un `id` : sa signification n'est pas expliquée (voir Non trouvé).
- `Order` : `data.id` (commande), `data.checkoutIntentId` (checkout), `data.formType`, `data.formSlug`, `data.organizationSlug`, `data.payer`, `data.amount {total,vat,discount}`, `data.items[]`, `data.payments[]` ([ex. échéances](https://dev.helloasso.com/docs/commandes-créé-sur-un-paiement-checkout-avec-des-échéances), [ex. don](https://dev.helloasso.com/docs/commande-créé-sur-un-formulaire-de-don)).
- `Payment` : `data.id` (paiement), `data.amount`, `data.state`, `data.paymentMeans`, `data.installmentNumber`, `data.cashOutState`, `data.order {id, formSlug, formType, ...}`, `data.payer`, `data.items[]`, `data.refundOperations[]` ([ex. autorisé](https://dev.helloasso.com/docs/paiement-autorisé-sur-un-checkout)).
- Montants : entiers (centimes, déduit des exemples ; la doc checkout le dit pour `totalAmount`).

```json
{
  "data": {
    "order": { "id": 22707, "formType": "Checkout", "formSlug": "default", "organizationSlug": "bordeauxchess" },
    "payer": { "email": "john.doe@example.com", "firstName": "John", "lastName": "Doe" },
    "items": [{ "id": 22707, "amount": 6000, "type": "Payment", "state": "Processed" }],
    "id": 15222, "amount": 1000, "paymentMeans": "Card",
    "installmentNumber": 1, "state": "Authorized", "cashOutState": "Transfered",
    "refundOperations": []
  },
  "eventType": "Payment"
}
```

## Signature et authenticité ([secure-webhook](https://dev.helloasso.com/docs/secure-webhook))

- **Partenaires uniquement** : chaque URL de notification a une `signatureKey` ; le header `x-ha-signature` contient le HMAC SHA-256 du corps brut calculé avec cette clé. Comparer en temps constant (la doc PHP utilise `hash_equals`).
- **Associations (clé API)** : pas de signature documentée ; la doc propose de se baser sur l'**IP source** : production `51.138.206.200`, test `4.233.135.234`.
- Re-requêter l'API (ex. `GET /v5/payments/{id}` ou `GET /v5/orders/{id}`) pour confirmer est une pratique cohérente avec la doc (la page de validation propose le polling de `checkout-intents` comme alternative aux webhooks) mais **n'est pas décrite comme méthode d'authentification** de la notification.

## Renvoi en cas d'échec ([intro](https://dev.helloasso.com/docs/notifications-webhook))

- Déclencheur : HelloAsso ne reçoit pas un « retour 200 » → nouvelle tentative (« plusieurs fois »).
- Délai : `min(48h, 3 * 2 ** attempt)` ; démarre à 3 s ; après 16 retries, ~27 h.
- Autres codes (201, 204, 3xx, 4xx) : non précisés. Répondre `200` explicitement.

## Ordre, doublons, idempotence

Non documentés. Prévoir un traitement idempotent (recommandation du projet, pas de la doc) : clé de déduplication sur `data.id` + `data.state` (+ `eventType`), répondre `200` vite, traiter ensuite.

## Non trouvé

- Garantie d'ordre entre `Order` et `Payment` (la doc dit juste que les deux sont envoyés).
- Livraison « au moins une fois » / doublons possibles / identifiant unique de notification.
- Timeout côté HelloAsso avant de considérer l'appel en échec.
- Liste des headers envoyés (hors `x-ha-signature`) ; Content-Type ; schéma formel de chaque payload.
- Signification de `metadata.id` dans les exemples (identifiant de notification ou metadata utilisateur ?).
- Signature pour les associations (non partenaires) ; l'IP est la seule piste documentée (et peut changer, non garanti).
- Rejeu manuel des notifications ratées.
- Si le back-office association permet de filtrer par `notificationType`.
- Un utilisateur sandbox signale l'absence de notification après paiement test, sans réponse (non officiel : [discussion](https://dev.helloasso.com/discuss/68dffdc5c1cf7065acf07978)).
