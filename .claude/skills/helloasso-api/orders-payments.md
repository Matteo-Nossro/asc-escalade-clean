# Commandes, paiements, items

Sources : [États des paiements](https://dev.helloasso.com/docs/etats-des-paiements) · [GET orders/{id}](https://dev.helloasso.com/reference/get_orders-orderid) · [GET payments/{id}](https://dev.helloasso.com/reference/get_payments-paymentid) · [GET payments org](https://dev.helloasso.com/reference/get_organizations-organizationslug-payments) · [GET orders form](https://dev.helloasso.com/reference/get_organizations-organizationslug-forms-formtype-formslug-orders) · [Échéances](https://dev.helloasso.com/docs/paiements-par-échéances)

## Modèle

- **Commande (`Order`)** : `id`, `formType`, `formSlug`, `payer`, `amount {total, vat, discount}`, `items[]`, `payments[]`, `checkoutIntentId` (nullable, `null` hors checkout).
- **Item** (`OrderItem`) : une ligne vendue (adhésion, billet, don...) ; `id`, `name`, `type` (`TierType`), `state` (`ItemState`), `user {firstName,lastName}` (participant/adhérent), `customFields`, `payments[] {id, shareAmount}`.
- **Paiement (`Payment`)** : `id`, `amount`, `amountTip`, `installmentNumber`, `state`, `paymentMeans`, `cashOutState`, `refundOperations[]`, `items[] {id, shareAmount, shareItemAmount}`.
- Liens : une commande a N items et N paiements (échéances) ; la répartition paiement/item se lit via `shareAmount` des deux côtés.
- Montants en centimes (`amount`, `shareAmount`...).

## Statuts de paiement

Documentés comme principaux ([États des paiements](https://dev.helloasso.com/docs/etats-des-paiements)) :

| `state` | Sens |
|---|---|
| `Pending` | Paiement à venir (échéance future) |
| `WaitingBankValidation` | Attente de confirmation du mandat SEPA |
| `Authorized` | Paiement accepté |
| `Refused` | Refusé (banque) |
| `Unknow` (sic, doc) | Statut incertain/non résolu |
| `Registered` | Paiement/don hors ligne (espèces, chèque) |
| `Refunding` | Remboursement en cours |
| `Refunded` | Remboursé |
| `Contested` | Contesté par le payeur auprès de sa banque |

Enum complet du schéma `PaymentState` (référence API) : `Pending`, `Authorized`, `Refused`, `Unknown`, `Registered`, `Error`, `Refunded`, `Refunding`, `Waiting`, `Canceled`, `Contested`, `WaitingBankValidation`, `WaitingBankWithdraw`, `Abandoned`, `WaitingAuthentication`, `AuthorizedPreprod`, `Corrected`, `Deleted`, `Inconsistent`, `NoDonation`, `Init`. Seuls les 9 ci-dessus sont décrits.

## Statuts d'item (`ItemState`)

`Waiting`, `Processed` (payé et valide), `Registered` (saisi manuellement, valide), `Deleted`, `Unknown`, `Canceled` (plus valide), `Refused`, `Abandoned` ([GET items form](https://dev.helloasso.com/reference/get_organizations-organizationslug-forms-formtype-formslug-items)). Dans l'exemple de remboursement, le paiement passe `Refunded` et les items `Canceled`.

## Statuts de versement (`cashOutState`)

`MoneyIn`, `WaitingForCashOutConfirmation`, `TransferInProgress`, `Transfered`, `CashedOut`, `Refunding`, `Refunded` (+ `CantTransferReceiverFull`, `Unknown`, `Contested` dans le schéma). Ne pas confondre avec `state`.

## Autres énumérations

- `paymentMeans` : `None`, `Card`, `Sepa`, `Check`, `Cash`, `BankTransfer`, `Other`.
- `TierType` : `Donation`, `Payment`, `Registration`, `Membership`, `MonthlyDonation`, `MonthlyPayment`, `OfflineDonation`, `Contribution`, `Bonus`, `Product`.
- `refundOperations[].status` (`OperationState`) : `Unknown`, `Init`, `Processing`, `Processed`, `Error`, `InternalError`, `Refused`, `Aborted`, `Canceled` (les webhooks montrent aussi `PROCESSED` en majuscules dans un exemple).

## Transitions

La doc **ne définit pas** de diagramme de transitions. Faits documentés :
- Commande en échéances : validée quand la **première** échéance est acceptée ([échéances](https://dev.helloasso.com/docs/paiements-par-échéances)). Exemple : 1ère échéance `Authorized`, suivantes `Pending` ([exemple](https://dev.helloasso.com/docs/commandes-créé-sur-un-paiement-checkout-avec-des-échéances)).
- Échéance refusée → notification `Payment` avec `state: Refused` ; le payeur reçoit un lien de régularisation valable 30 jours.
- Paiement SEPA : `WaitingBankValidation` ([exemple](https://dev.helloasso.com/docs/paiement-waiting-sur-un-checkout)).
- Remboursement : `Authorized` → `Refunding` → `Refunded` (enchaînement déduit des états décrits, non schématisé).

## Endpoints de lecture (base `https://api.helloasso.com/v5`)

| Endpoint | Rôle/privilège |
|---|---|
| `GET /orders/{orderId}` (`withFormData`, `checkPaymentsRefundEligibility`) | `FormAdmin`/`OrganizationAdmin` + `AccessTransactions` |
| `GET /payments/{paymentId}` (`withFailedRefundOperation`) | idem |
| `GET /organizations/{slug}/orders` | idem |
| `GET /organizations/{slug}/forms/{formType}/{formSlug}/orders` | idem |
| `GET /organizations/{slug}/payments` (`states`, `from`, `to`, `sortField`...) | `OrganizationAdmin` + `AccessTransactions` |
| `GET /organizations/{slug}/forms/{formType}/{formSlug}/payments` | voir [référence](https://dev.helloasso.com/reference/get_organizations-organizationslug-forms-formtype-formslug-payments) |
| `GET /items/{itemId}`, `GET /organizations/{slug}/items` | voir [référence](https://dev.helloasso.com/reference/get_items-itemid) |
| `GET /organizations/{slug}/checkout-intents/{id}` | privilège `Checkout` |

Annuler les paiements futurs d'une commande (sans remboursement) : `POST /orders/{orderId}/cancel` (rôle `OrganizationAdmin`/`FormAdmin`, privilège `RefundManagement`) ([ref](https://dev.helloasso.com/reference/post_orders-orderid-cancel)).

Tap to Pay : paiements rattachés au formulaire `shop` `solde-taptopay`, `payer.firstName/lastName/email` = `N/A` ([changelog](https://dev.helloasso.com/changelog/tap-to-pay-sur-android-impacts-sur-lapi)).

## Non trouvé

- Statut global d'une commande : aucun champ `state` sur l'objet commande dans les réponses documentées ; l'état se déduit des `items[].state` et `payments[].state`.
- Machine d'états complète des paiements et délais entre états (ex. `Authorized` → versement).
- Signification de `Unknow` vs `Unknown` (orthographe doc vs schéma).
- Pourquoi l'exemple « échéance refusée » montre l'item `Processed` alors que l'échéance est `Refused`.
- Comportement 404 d'un `paymentId`/`orderId` inconnu (seuls 200/401/403 sont documentés).
