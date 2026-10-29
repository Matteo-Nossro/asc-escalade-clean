# HelloAsso Checkout (paiement intégré)

Sources : [Fonctionnement technique](https://dev.helloasso.com/docs/intégrer-le-paiement-sur-votre-site) · [Validation de vos paiements](https://dev.helloasso.com/docs/validation-de-vos-paiements) · [Guide d'intégration](https://dev.helloasso.com/docs/guide-dintégration) · [POST checkout-intents](https://dev.helloasso.com/reference/post_organizations-organizationslug-checkout-intents) · [GET checkout-intent](https://dev.helloasso.com/reference/get_organizations-organizationslug-checkout-intents-checkoutintentid) · [Échéances](https://dev.helloasso.com/docs/paiements-par-échéances)

## Déroulé

1. Serveur : `POST /v5/organizations/{slug}/checkout-intents` (privilège `Checkout`).
2. Réponse `200` : `{ "id": <checkoutIntentId>, "redirectUrl": "..." }`.
3. Rediriger le contributeur vers `redirectUrl` (**expire après 15 min**).
4. Retour : `backUrl` (retour arrière), `errorUrl` (erreur technique), `returnUrl` (flux terminé sans erreur).
5. HelloAsso envoie les webhooks `Order` puis `Payment` ; ils servent à **valider** le paiement.

## Corps de l'init (`additionalProperties: false`)

| Champ | Requis | Contraintes |
|---|---|---|
| `totalAmount` | oui | centimes TTC ; = `initialAmount` + somme de `terms[].amount` |
| `initialAmount` | oui | centimes, premier paiement |
| `itemName` | oui | 1 à 250 caractères |
| `backUrl`, `errorUrl`, `returnUrl` | oui | **HTTPS uniquement** (guide d'intégration) |
| `containsDonation` | oui | booléen, exigé pour conformité |
| `terms[]` | non | `{ amount, date }` des échéances futures |
| `payer` | non (recommandé) | `firstName`, `lastName`, `email`, `dateOfBirth`, `address`, `city`, `zipCode`, `country` (ISO alpha-3, ex. `FRA`), `companyName` |
| `metadata` | non | objet JSON, 20 000 caractères max sérialisé |
| `paymentOptions.enableSepa` | non | éligibilité SEPA |

Contrôles `payer` : prénom/nom sans chiffres ni valeurs génériques (« test », « admin »), non identiques ; email valide ; majeur.

```json
{ "totalAmount": 4500, "initialAmount": 4500, "itemName": "Adhésion 2026",
  "backUrl": "https://site.fr/inscription", "errorUrl": "https://site.fr/inscription/erreur",
  "returnUrl": "https://site.fr/inscription/retour", "containsDonation": false,
  "metadata": { "registrationId": "uuid" } }
```

Erreurs : `400` paramètres invalides, `401`, `403`, `409` association non éligible aux paiements (non vérifiée) — vérifier `isCashInCompliant` ou le webhook `Organization.IsCashinCompliant` ([guide](https://dev.helloasso.com/docs/guide-dintégration)). Paiement échelonné : règles dans [échéances](https://dev.helloasso.com/docs/paiements-par-échéances) (pas d'échéance après le 27 du mois, 1 par mois, 12 mois max, 1ère échéance pas dans le mois du paiement initial).

## Paramètres de retour

| URL | Paramètres ajoutés |
|---|---|
| `returnUrl` | `checkoutIntentId`, `code=succeeded`, `orderId` |
| `errorUrl` | `checkoutIntentId`, et `error` si l'erreur est identifiée |
| `backUrl` | non documenté |

Exemple doc : `https://www.partnertest.com/return.php?checkoutIntentId=3&code=succeeded&orderId=462873`. La doc contient une coquille (mentionne `redirectUrl` pour l'exemple d'erreur, probablement `errorUrl`).

## Ce qu'on peut / ne peut pas déduire côté serveur

- La doc dit que les paramètres de retour **peuvent être falsifiés** : « ne validez jamais un paiement sur leur seule base » ; `code` ne sert qu'à afficher une page de confirmation (l'utilisateur peut fermer la page, perdre sa connexion ou modifier l'URL).
- **Il faut valider via** (au choix, [validation](https://dev.helloasso.com/docs/validation-de-vos-paiements)) :
  - webhooks (recommandé) : `Order` + `Payment` (+ un `Payment` par échéance payée), qui portent vos `metadata` ;
  - polling : `GET /v5/organizations/{slug}/checkout-intents/{checkoutIntentId}` → `id`, `redirectUrl`, `metadata`, `order` (présent **uniquement si le paiement est autorisé**).
- Abandon : sans notification de paiement autorisé après 45 min, ou polling sans paiement, la doc autorise à considérer le checkout abandonné.
- `metadata` n'est renvoyé que dans les notifications Order/Payment et le GET checkout-intent, et seulement à l'émetteur.
- Associer à l'inscription locale : stocker `checkoutIntentId` à l'init ; il revient dans `Order.checkoutIntentId` et dans le retour. Voir le `order.checkoutIntentId` nullable pour les commandes hors checkout.
- Un paiement via checkout ne génère **pas** automatiquement de reçu fiscal (guide).
- Langue : paramètre de requête `lang` (`en` ou `es`) sur la page de checkout.

## Non trouvé

- Paramètres ajoutés à `backUrl`.
- Valeurs possibles de `code` autres que `succeeded` ; valeurs possibles de `error`.
- Si `returnUrl` peut contenir une query string préexistante (le comportement de concaténation).
- Si `returnUrl`/`errorUrl` doivent appartenir à un domaine déclaré (`PUT /partners/me/api-clients` existe pour les partenaires ; rien pour les associations).
- Règle sur l'unicité/idempotence d'un `checkout-intents` (re-POST pour la même inscription).
- Comportement si le même `redirectUrl` est ouvert deux fois, ou si l'utilisateur paie après les 15 min.
- Effet du paramètre `withFailedRefundOperation` sur `GET checkout-intents` (non décrit).
