# Formulaires, adhésions, participants

Sources : [GET forms](https://dev.helloasso.com/reference/get_organizations-organizationslug-forms) · [GET formtypes](https://dev.helloasso.com/reference/get_organizations-organizationslug-formtypes) · [GET items d'un formulaire](https://dev.helloasso.com/reference/get_organizations-organizationslug-forms-formtype-formslug-items) · [GET orders d'un formulaire](https://dev.helloasso.com/reference/get_organizations-organizationslug-forms-formtype-formslug-orders) · [Pagination](https://dev.helloasso.com/docs/pagination)

## Types de formulaires

`formType` : `CrowdFunding`, `Membership`, `Event`, `Donation`, `PaymentForm`, `Checkout`, `Shop`.

- Adhésion = `Membership` (items `type: Membership`) ; billetterie = `Event` ; `Checkout` = paiement initié par API (formSlug `default` dans les exemples).
- États d'un formulaire (`states`) : `Public`, `Private`, `Draft`, `Disabled` (le schéma ajoute `Deleted`, non décrit).
- `GET /v5/organizations/{slug}/forms` (filtres `states`, `formTypes`, pagination ; privilège `AccessPublicData`) : champs `title`, `formSlug`, `formType`, `state`, `url`, `startDate`, `endDate`...
- `GET /v5/organizations/{slug}/formTypes` : types dont l'asso a au moins un formulaire.

## Récupérer adhérents / participants

Deux endpoints équivalents, rôle `FormAdmin` ou `OrganizationAdmin` + privilège `AccessTransactions` :

| Endpoint | Granularité |
|---|---|
| `GET /v5/organizations/{slug}/forms/{formType}/{formSlug}/items` | une ligne par item vendu (adhérent/participant) ; réponses `json`, `csv`, `xlsx` |
| `GET /v5/organizations/{slug}/forms/{formType}/{formSlug}/orders` | commandes avec `payer`, `items[]`, `payments[]` |
| `GET /v5/organizations/{slug}/items`, `.../orders` | idem sur toute l'organisation |

- Le **participant/adhérent** est dans `items[].user {firstName, lastName}` ; le **payeur** dans `payer` (peut être une autre personne).
- Item d'adhésion : `membershipCardUrl`, `qrCode`, `tierId`, `tierDescription`, `state` (`Processed` = payé et valide).

### Capturé en sandbox (2026-10-28, structure seule)
- `GET /v5/organizations/{slug}/formTypes` → tableau de chaînes ; l'association de test a renvoyé `Membership` et `Checkout`.
- `GET /v5/organizations/{slug}/items?pageSize=1` → HTTP 200 avec une clé générée depuis le back-office : `AccessTransactions` est présent. Clés d'un élément de `data[]` (adhésion payée par carte) :
  - `order` : `id`, `date`, `formSlug`, `formType`, `organizationName`, `organizationSlug`, `organizationType`, `organizationIsUnderColucheLaw`, `formName`, `meta { createdAt, updatedAt }`, `isAnonymous`, `isAmountHidden` ;
  - `payer` : `email`, `address`, `city`, `zipCode`, `country`, `dateOfBirth`, `firstName`, `lastName` ;
  - `payments[]` : `cashOutState`, `shareAmount`, `id`, `amount`, `date`, `paymentMeans`, `installmentNumber`, `state`, `meta { createdAt, updatedAt }`, `refundOperations[]` ;
  - champs de l'item : `name`, `user { firstName, lastName }`, `priceCategory`, `qrCode`, `membershipCardUrl`, `tierDescription`, `tierId`, `id`, `amount`, `type`, `initialAmount`, `state`.
  - `pagination` : `pageSize`, `totalCount`, `pageIndex`, `totalPages`, `continuationToken`.
- Pas de `customFields` sans `withDetails=true`, conformément à la doc.
- Fixtures correspondantes : `tests/fixtures/helloasso/{form-types.ok,items.page-size-1}.json`.

## Champs personnalisés (`customFields`)

- Absents par défaut : passer `withDetails=true` (défaut `false`) pour obtenir `customFields` (et `options`).
- Structure : `customFields[] { id, name, type, answer }` ; `type` ∈ `Date`, `TextInput`, `FreeText`, `ChoiceList`, `File`, `YesNo`, `Phone`, `Zipcode`, `Number`.
- Fichiers joints : [API des fichiers](https://dev.helloasso.com/reference/access-file) (non détaillée ici).

```json
{ "id": 20499, "name": "Adhésion adulte", "type": "Membership", "state": "Processed",
  "user": { "firstName": "Anne", "lastName": "Martin" },
  "customFields": [{ "id": 1, "name": "Date de naissance", "type": "Date", "answer": "2012-03-04" }] }
```
(Exemple illustratif construit à partir du schéma, pas un extrait officiel.)

## Pagination

- Paramètres : `pageSize` (défaut `20`), `pageIndex` (défaut `1`), `continuationToken`.
- Réponse : `{ "data": [...], "pagination": { pageSize, pageIndex, totalCount, totalPages, continuationToken } }`.
- `continuationToken` : jeton opaque à renvoyer tel quel ; `totalCount`/`totalPages` valent souvent `-1` (total non fourni).
- Fin de boucle : se fier à l'**absence de résultats** (`data` vide), pas à l'absence de token ([Pagination](https://dev.helloasso.com/docs/pagination)).

## Filtres

| Paramètre | Endpoints | Détail |
|---|---|---|
| `from`, `to` | orders, items, payments | `date-time` ; `to` exclusive |
| `userSearchKey` | orders, items, payments | prénom, nom ou email du participant/payeur |
| `tierTypes`, `itemStates`, `tierName` | items | filtres de tarif/état |
| `states` | payments, forms | filtre d'état |
| `sortOrder` | tous | `Asc` / `Desc` (défaut `Desc`) |
| `sortField` | items, payments | `Date`, `UpdateDate`, `CreationDate` |

## Non trouvé

- Format exact attendu pour `from`/`to` (la spec dit `date-time`, sans exemple) ni le fuseau considéré.
- Valeur maximale de `pageSize`.
- Schéma de réponse JSON formel de `/forms/.../items` (la page référence ne détaille pas les champs ; ceux de l'objet `OrderItem` des endpoints orders sont documentés).
- Quelle date filtre `from`/`to` (création, mise à jour ou paiement) ; `sortField` donne `Date`, `UpdateDate`, `CreationDate` sans lien explicite.
- Moyen de retrouver un adhérent d'une saison précise sans passer par le `formSlug` (un formulaire par saison est un choix d'organisation, pas dicté par la doc).
- Webhook dédié aux modifications d'un item/adhésion après création (aucun `eventType` correspondant).
