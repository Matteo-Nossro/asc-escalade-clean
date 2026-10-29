# Fixtures HelloAsso

Réponses de l'API HelloAsso enregistrées depuis la **sandbox**, utilisées par les tests des lots HelloAsso (handlers `server/api/webhooks/` et `server/api/admin/helloasso-*`).

Forme des réponses, champs et codes d'erreur : voir `.claude/skills/helloasso-api/` (ne pas recopier ici).

## Nommage

`<ressource>.<cas>.json`, par exemple :

- `payment.authorized.json`
- `payment.refused.json`
- `order.refunded.json`

## Source (clé racine `_source`, ignorée par les tests)

- `"_source": "doc:.claude/skills/helloasso-api/<fichier>.md"` : payload repris **tel quel** d'un exemple de la skill `helloasso-api`, en attendant une capture. N'ajouter aucun champ absent de la doc.
- `"_source": "sandbox:AAAA-MM-JJ"` : vraie capture de la sandbox, anonymisée. Elle remplace la version `doc` sous le même nom.
- Corps de réponse qui est un **tableau** (ex. `formTypes`) : il est rangé sous la clé racine `body` (`{ "_source": …, "body": […] }`) ; le test lit `fixture(…).body`.
- Captures du 2026-10-28 (P0 de `helloasso-socle`) : seule la **structure** (clés et types) a été relevée, toutes les valeurs sont factices. Les jetons valent `fixture-…`. Les valeurs d'énumération viennent de la skill `helloasso-api`, sauf `priceCategory` (`Fixed`) et `organizationType` (`Association`), non capturées.

Aucun test automatique n'appelle l'API HelloAsso : voir la skill `testing` (`examples/helloasso.md`).

## Anonymisation (obligatoire)

Avant de commiter un fichier, remplacer par des valeurs fictives :

- noms, prénoms, pseudos ;
- emails ;
- adresses postales et numéros de téléphone ;
- IBAN et tout identifiant bancaire.

Les montants, statuts, dates et identifiants techniques peuvent rester tels quels.

## Interdits

- Aucun jeton, `client_secret`, `access_token`, ni secret de webhook.
- Aucune réponse issue de la production : sandbox, ou exemple de la doc officielle (`_source: doc:…`), uniquement.

## Enregistrer une réponse

1. Effectuer l'action dans la sandbox HelloAsso (le token sandbox reste dans l'environnement local, jamais dans le fichier).
2. Copier le corps JSON de la réponse dans `<ressource>.<cas>.json`.
3. Appliquer l'anonymisation ci-dessus, puis vérifier qu'aucune chaîne sensible ne subsiste (`grep -iE "token|secret|iban|@"`).
4. Ne pas inclure les en-têtes HTTP.
