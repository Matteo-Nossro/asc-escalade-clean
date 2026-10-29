# Tester une route `server/api`

Modèle complet : `tests/server/api/revalidate.test.ts`. Helpers : `tests/utils/nitro.ts` (`stubNitroGlobals`, `createMockEvent`, `MockH3Error`).

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'

// Dépendances externes mockées (jamais de réseau)
const sendEmail = vi.hoisted(() => vi.fn())
vi.mock('resend', () => ({ Resend: vi.fn(() => ({ emails: { send: sendEmail } })) }))

const runtimeConfig = vi.hoisted(() => ({ monSecret: 'secret-de-test' }))   // valeur fictive
mockNuxtImport('useRuntimeConfig', original => () => ({ ...original(), ...runtimeConfig }))

const load = async () => (await import('../../../server/api/ma-route.post')).default as any

describe('POST /api/ma-route — critère : refuse sans authentification', () => {
  beforeEach(() => { vi.resetModules(); stubNitroGlobals(); sendEmail.mockReset() })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('401 sans secret', async () => {
    const handler = await load()
    await expect(handler(createMockEvent({ body: {} }))).rejects.toMatchObject({ statusCode: 401 })
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
```

- **Route admin** : mocker `requireAdmin` (`vi.mock('../../../server/utils/requireAdmin', …)`), puis tester deux cas : refus (`401`/`403`) et succès.
- **Supabase côté serveur** : `vi.mock('#supabase/server', () => ({ serverSupabaseServiceRole: () => client, serverSupabaseUser: async () => ({ id: 'u1' }) }))`, avec `client` issu de `createSupabaseMock()` (voir [supabase.md](supabase.md)).
- Toujours tester au moins : l'entrée invalide, le refus d'accès et le cas nominal.
