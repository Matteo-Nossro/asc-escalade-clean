// T7 auth-profils (complément) — middleware, utilisateur connecté dont la lecture du profil échoue (authStatus « error »).
// Comportement ACTUEL, documenté tel quel : sans état « ready », la redirection vers /completer-profil n'a pas lieu
// (on ne peut pas savoir si le profil est complet) ; /profil, /mes-inscriptions et /completer-profil laissent passer ;
// /admin renvoie vers « / ». Pas de boucle de redirection. (VRAI useAuth, Supabase simulé en échec.)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => h.navigateTo)

const { client, from, user } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: middleware } = await import('~/middleware/auth.global')

const db = createAuthDb({
  profiles: { nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }) },
  roles: { nouveau: [] },
})

const route = (path: string) => ({ path, fullPath: path, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
async function visit(path: string) {
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
  const call = h.navigateTo.mock.calls[0]
  return call ? { to: call[0] as string } : null
}

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = true
  db.reads.length = 0
  serveAuth(from, db)
  user.value = { id: 'nouveau', email: 'nouveau@test.fr' }
  h.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
})

describe('connecté, lecture du profil en échec (état error)', () => {
  it.each(['/profil', '/mes-inscriptions', '/completer-profil'])('%s : on passe (pas de redirection ni de boucle)', async (path) => {
    expect(await visit(path)).toBeNull()
  })

  it('/admin : renvoyé vers /', async () => {
    expect((await visit('/admin/dashboard'))?.to).toBe('/')
  })
})
