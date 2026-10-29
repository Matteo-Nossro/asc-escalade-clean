# Tester un composable

Modèle complet : `tests/composables/useEventRegistrations.test.ts`.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createSupabaseMock, mockChain } from '../utils/supabase-mock'

const { client, from, user } = createSupabaseMock({ user: { id: 'parent-123' } })
mockNuxtImport('useSupabaseClient', () => () => client)   // dans CE fichier (macro hoistée)
mockNuxtImport('useSupabaseUser', () => () => user)

const { useEventRegistrations } = await import('~/composables/useEventRegistrations')  // APRÈS les mocks

describe('register — critère : un parent inscrit son enfant', () => {
  beforeEach(() => { from.mockReset(); user.value = { id: 'parent-123' } })

  it('renseigne registered_by quand on inscrit un enfant', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue(mockChain({ insert }))
    await useEventRegistrations().register({ eventId: 'event-1', userId: 'enfant-9' })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ registered_by: 'parent-123' }))
  })
})
```

- État réactif : lire `.value` des refs renvoyés.
- Erreur Supabase : `mockChain({ data: null, error: { message: 'boom' } })`.
- Pas de timers réels : `vi.useFakeTimers()` si le composable utilise `setTimeout`.
