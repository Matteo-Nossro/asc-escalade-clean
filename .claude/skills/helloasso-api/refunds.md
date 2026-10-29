# Remboursements

Sources : [POST payments/{id}/refund](https://dev.helloasso.com/reference/post_payments-paymentid-refund) · [Privilèges et rôles](https://dev.helloasso.com/docs/privilèges-et-rôles) · [Changelog sécurité remboursement](https://dev.helloasso.com/changelog/mise-à-jour-de-sécurité-api-remboursement) · [POST orders/{id}/cancel](https://dev.helloasso.com/reference/post_orders-orderid-cancel) · [Paiement remboursé](https://dev.helloasso.com/docs/paiement-remboursé) · [Remboursement échoué](https://dev.helloasso.com/docs/remboursement-échoué)

## Par l'API

`POST https://api.helloasso.com/v5/payments/{paymentId}/refund` — pas de body.

| Paramètre (query) | Type | Défaut | Rôle |
|---|---|---|---|
| `amount` | int (centimes) | `0` | Vide = remboursement **total**. Montant partiel : « only for a partial refund for stripe » |
| `comment` | string | - | Commentaire |
| `sendRefundMail` | bool | `true` | Envoi du mail de remboursement |
| `cancelOrder` | bool | `false` | Annule paiements futurs et items liés ; **uniquement si le paiement est entièrement remboursé** |

- Prérequis : rôle `OrganizationAdmin` ou `FormAdmin` + privilège `RefundManagement` (non accordé par défaut aux associations : à demander via partenariat, [privilèges](https://dev.helloasso.com/docs/privilèges-et-rôles)).
- Réponse `200` : `RefundOperationModel` (`id`, `amount`, `cancelOrder`, `creationDate`, `state`, `sendRefundMail`, `paymentId`) ; `state` ∈ `Unknown`, `Init`, `Processing`, `Processed`, `Error`, `InternalError`, `Refused`, `Aborted`, `Canceled`.
- `409` : authentification multifacteur requise (`AuthorizationErrors.MFA.AccessTokenRequired`, `...AccessOtpSmsRequired`, `...AccessPasswordTokenRequired`, `AuthorizationErrors.UserNotEnrolled`) ; headers optionnels `x-mfa-access-authorization`, `x-mfa-sms-access-authorization`, `x-mfa-password-authorization`.
- Annuler les échéances futures sans rembourser : `POST /v5/orders/{orderId}/cancel` (privilège `RefundManagement`).

### Attention : clé API d'association

Le changelog annonce que le remboursement via **clé API d'association** est jugé incompatible avec les nouvelles exigences de sécurité : exception technique maintenue 90 jours, puis accès au endpoint désactivé (« d'ici 3 mois »). Les clés **partenaire** ne sont pas impactées. Solution transitoire : rembourser manuellement depuis l'interface admin (double authentification). Nouvelle version de l'API « pas prévue avant 2027 au plus tôt ». La page ne porte pas de date : vérifier l'état actuel auprès de HelloAsso.

**Conclusion pour ce projet (association, clé API) : ne pas bâtir de flux dépendant de l'API de remboursement ; prévoir remboursement manuel + synchronisation par webhook.**

### Contradiction dans la doc officielle

- Page Privilèges : « Le remboursement partiel n'est pas possible » (privilège `RefundManagement`).
- Page de référence du endpoint : `amount` pour remboursement partiel, « stripe » seulement.
Traiter le remboursement partiel comme **non garanti**.

### Non remboursable

Paiements Tap to Pay : « ne sont pas remboursables » ([changelog](https://dev.helloasso.com/changelog/tap-to-pay-sur-android-impacts-sur-lapi)). `isRefundable` sur les paiements d'une commande ; `GET /orders/{id}?checkPaymentsRefundEligibility=true` vérifie l'éligibilité.

## Côté back-office (centre d'aide, extraits de recherche)

La page [centre d'aide « Comment une association peut-elle rembourser un payeur »](https://centredaide.helloasso.com/association?question=comment-une-association-peut-elle-rembourser-un-payeur-via-helloasso) a renvoyé 403 au fetch ; les points suivants viennent de son extrait dans un moteur de recherche (à vérifier sur la page) :
- Admin de l'asso : `Suivi des paiements` > ligne du paiement > bouton de remboursement, confirmation + authentification ; irréversible ; statut « Remboursement en cours » puis « Remboursé », en général sous 48 h.
- Remboursement impossible si : paiement déjà versé à l'association, plus d'un an, payeur ayant contesté, carte expirée.
- Le remboursement s'applique à toute la commande ; pour une commande en échéances, rembourser une échéance n'arrête pas les suivantes.

## Notification

- Webhook `eventType: Payment`, `data.state: "Refunded"`, `data.refundOperations[]` avec `status: "PROCESSED"`, items passés `Canceled` ([exemple](https://dev.helloasso.com/docs/paiement-remboursé)).
- Échec : webhook `Payment` avec `refundOperations[].status: "Refused"` et `state` resté `Authorized` ([exemple](https://dev.helloasso.com/docs/remboursement-échoué)).
- Lecture : `GET /v5/payments/{id}` ; `withFailedRefundOperation=true` inclut les opérations en échec (`ABORTED`, `CANCELED`, `ERROR`, `REFUSED`).
- Liste webhooks associés : `Payment` remboursé, `Payment` remboursement échoué ([toutes les notifications](https://dev.helloasso.com/docs/notification-exemple)).

## Non trouvé

- Date effective de fermeture du endpoint pour clés association (aucune date absolue dans le changelog).
- Si un partenaire peut déclencher un remboursement partiel pour des paiements non-Stripe (CB/SEPA).
- Délai maximal de remboursement dans la doc développeur (la durée « 1 an » ne vient que du centre d'aide, via extrait).
- Statut des remboursements d'un paiement SEPA.
- Statut HTTP d'un `paymentId` inexistant.
