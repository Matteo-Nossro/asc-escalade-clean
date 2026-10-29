# Tester un appel HelloAsso, sans aucun appel réel

**Règle** : aucun test automatique n'appelle `api.helloasso.com`, `api.helloasso-sandbox.com` ni l'endpoint OAuth. Les réponses viennent de `tests/fixtures/helloasso/`.

## Fixtures
- **Nommage** : `<ressource>.<cas>.json` (voir `tests/fixtures/helloasso/README.md`). Exemples : `order.authorized.json`, `payment.refunded.json`, `items.page1.json`, `token.ok.json`.
- **Source tracée** par une clé racine `_source`, que les tests ignorent :
  - `"_source": "doc:.claude/skills/helloasso-api/webhooks.md"` : payload repris **tel quel** d'un exemple de la skill `helloasso-api`, quand aucune capture n'existe ;
  - `"_source": "sandbox:AAAA-MM-JJ"` : vraie capture de la sandbox, anonymisée. Elle **remplace** la version `doc`, avec le même nom de fichier.
- Ne jamais inventer un champ absent de la skill et de la capture. Un champ qui manque se signale dans le compte rendu.

## Pattern
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fixture } from '../../utils/helloasso-kit'

// 1. Mocker le module serveur unique : `useHelloAsso(event)` renvoie le client (`get`, `post`, `getAccessToken`).
//    Fournir aussi les exports que la route importe (`HelloAssoError`, `toH3Error`…) : voir tests/server/api/helloasso-test.test.ts
//    (la factory est hoistée : importer les aides dans la factory, avec `await import`).
const haGet = vi.hoisted(() => vi.fn())
vi.mock('../../../server/utils/helloasso', async () => {
  const { FakeHelloAssoError } = await import('../../utils/helloasso-kit')
  return { useHelloAsso: () => ({ get: haGet }), HelloAssoError: FakeHelloAssoError }
})

// 2. Filet de sécurité : tout appel réseau réel fait échouer le test
beforeEach(() => {
  const interdit = vi.fn(() => { throw new Error('Appel réseau interdit dans les tests') })
  vi.stubGlobal('fetch', interdit)
  vi.stubGlobal('$fetch', interdit)
})
afterEach(() => vi.unstubAllGlobals())

it('un item remboursé sur HelloAsso passe à « remboursé » (critère lot 2)', async () => {
  haGet.mockResolvedValueOnce(fixture('items.refunded'))   // un corps tableau est sous `body` : fixture(…).body
  // … appeler le moteur de synchro et vérifier l'écriture Supabase mockée
})
```

Pour le client réel (jeton, `401`, `429`, verrou), le faux `fetch` routé et le `sleep` factice viennent de `tests/utils/helloasso-kit.ts` (`createFetchRouter`, `createSleep`). La base se simule avec `tests/utils/fake-supabase.ts` (`createFakeSupabase`).

## Cas à couvrir systématiquement
- Doublon : la même fixture traitée deux fois ne produit aucun changement.
- Item inconnu ou non rapproché.
- Remboursement.
- `401` puis ré-authentification.
- `429` sans boucle.
- Réponse paginée : `continuationToken`, et arrêt quand `data` est vide.
