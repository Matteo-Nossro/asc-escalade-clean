// Mocks Supabase centralisés (option DB-2 : pas de base locale).
//
// Usage dans un fichier de test — la macro `mockNuxtImport` DOIT rester dans le
// fichier de test (elle est hoistée par le plugin Vitest de Nuxt) :
//
//   import { mockNuxtImport } from '@nuxt/test-utils/runtime'
//   import { createSupabaseMock, mockChain } from '../utils/supabase-mock'
//
//   const { client, from, user } = createSupabaseMock({ user: { id: 'u1' } })
//   mockNuxtImport('useSupabaseClient', () => () => client)
//   mockNuxtImport('useSupabaseUser', () => () => user)
//
// Les factories de mockNuxtImport sont appelées paresseusement (au premier import
// du composable testé, via `await import(...)`), donc les constantes ci-dessus sont
// déjà initialisées à ce moment-là.
//
// Limite : ces mocks ne détectent ni erreurs SQL, ni RLS, ni contraintes.

import { ref, type Ref } from 'vue'
import { vi } from 'vitest'

// Champs de réponse Supabase : retournent undefined s'ils sont absents du leaf
// (évite qu'ils soient des fonctions truthy qui déclenchent un throw).
const RESPONSE_FIELDS = new Set(['data', 'error', 'count', 'status', 'statusText', 'body'])

/**
 * Chaîne Supabase factice : n'importe quelle méthode chaînée (select, eq, order,
 * insert, update, delete, single, ...) renvoie une nouvelle chaîne, sauf si elle
 * est définie dans `leaf` (alors on renvoie la valeur de `leaf`).
 * `then/catch/finally` renvoient undefined pour que le Proxy ne soit pas pris
 * pour un thenable (timeout infini sinon).
 *
 * Exemples : mockChain({ insert: vi.fn().mockResolvedValue({ error: null }) })
 *            mockChain({ data: { id: 'x' }, error: null })
 *            mockChain({ count: 12, error: null })
 */
export function mockChain(leaf: Record<string, any> = {}) {
  const handler: ProxyHandler<object> = {
    get(_t, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
      if (prop in leaf) return (leaf as any)[prop]
      if (typeof prop === 'string' && RESPONSE_FIELDS.has(prop)) return undefined
      return () => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

interface SupabaseMockOptions {
  /** Valeur initiale du ref renvoyé par `useSupabaseUser` (défaut : null). */
  user?: any
  /** Ajoute `auth: { signOut }` au client (pour useAuth). */
  withAuth?: boolean
}

/**
 * Fabrique un client Supabase factice + un ref utilisateur.
 * - `from`   : vi.fn() à configurer par test (`from.mockReturnValue(...)`).
 * - `client` : objet renvoyé par `useSupabaseClient()`.
 * - `user`   : ref renvoyé par `useSupabaseUser()` (modifiable via `user.value = ...`).
 */
export function createSupabaseMock(options: SupabaseMockOptions = {}) {
  const from = vi.fn()
  const signOut = vi.fn()
  const user: Ref<any> = ref(options.user ?? null)
  const client: Record<string, any> = { from }
  if (options.withAuth) client.auth = { signOut }
  return { client, from, signOut, user }
}
