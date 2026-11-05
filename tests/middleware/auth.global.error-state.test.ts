// auth-erreur-profil, T0 (réécrit) — middleware, utilisateur connecté dont la lecture du profil échoue en permanence.
// Ancien contrat (T7 auth-profils) : une seule lecture, et /admin renvoyait vers « / » même en erreur.
// Nouveau contrat (spec Q25 + décision 1 de l'utilisateur) :
//   - réessai unique : exactement 2 lectures du profil (et des rôles) pour une navigation ;
//   - aucune redirection sur échec de lecture, /admin compris (le blocage est affiché par la porte, pas par un renvoi) ;
//   - /profil, /mes-inscriptions, /completer-profil : on passe (inchangé).
// VRAI useAuth, Supabase simulé en échec. L'utilisateur est posé dans le corps du test, juste avant la navigation :
// un `user.value` posé dans beforeEach laisserait le plugin auth-sync lire le profil avant le middleware (lecture en plus).
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
const { useAuth } = await import('~/composables/useAuth')

const db = createAuthDb({
  profiles: {
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
    admin: profileOf('admin'),
  },
  roles: { nouveau: [], admin: ['admin'] },
})

const route = (path: string) => ({ path, fullPath: path, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
async function visit(path: string) {
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
  return h.navigateTo.mock.calls.map(c => c[0])
}

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = true
  db.failTables = []
  db.failNext = 0
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
})

describe('Q25 — connecté, lecture du profil en échec persistant', () => {
  it.each(['/profil', '/mes-inscriptions', '/completer-profil'])('%s : on passe (aucune redirection, pas de boucle)', async (path) => {
    user.value = { id: 'nouveau', email: 'nouveau@test.fr' }
    expect(await visit(path)).toEqual([])
  })

  it.each(['/admin', '/admin/dashboard', '/admin/blocs'])('%s : aucune redirection (ni vers /, ni vers /login, ni ailleurs)', async (path) => {
    user.value = { id: 'admin', email: 'admin@test.fr' }
    expect(await visit(path)).toEqual([])
  })

  it.each(['/profil', '/admin/dashboard'])('%s : exactement 2 lectures du profil (lecture initiale + 1 réessai), et l\'état reste error', async (path) => {
    user.value = { id: 'admin', email: 'admin@test.fr' }
    await visit(path)
    expect(db.count('profiles')).toBe(2)
    expect(db.count('user_roles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('error')
  })

  it('l\'échec laisse l\'état fermé : profil vide, aucun rôle', async () => {
    user.value = { id: 'admin', email: 'admin@test.fr' }
    await visit('/admin/dashboard')
    const auth = useAuth()
    expect(auth.profile.value).toBeNull()
    expect(auth.roles.value).toEqual([])
    expect(auth.isStaff.value).toBe(false)
  })
})
