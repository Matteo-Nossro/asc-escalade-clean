// T0a auth-profils — critère C3 (middleware) + garde /admin et redirection vers /login (comportements à préserver).
// VRAI useAuth (rôles et profil lus dans le Supabase simulé). `navigateTo` est simulé : on observe la redirection demandée.
// Contrat : une seule liste de pages qui demandent d'être connecté (/admin, /profil, /mes-inscriptions, /completer-profil) ;
// profil incomplet (état ready) => /completer-profil depuis toutes ces pages sauf /completer-profil ; profil complété sur
// /completer-profil => /profil ; pages publiques jamais touchées.
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
  profiles: {
    visiteur: profileOf('visiteur'),
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
    'admin-incomplet': profileOf('admin-incomplet', { profile_completed_at: null }),
    adherent: profileOf('adherent'),
    admin: profileOf('admin'),
    secretaire: profileOf('secretaire'),
    initiateur: profileOf('initiateur'),
  },
  roles: {
    nouveau: [],
    'admin-incomplet': ['admin'],
    adherent: ['parent'],
    admin: ['admin'],
    secretaire: ['secretary'],
    initiateur: ['initiateur'],
  },
})

const route = (path: string) => ({ path, fullPath: path, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
/** Lance le middleware pour `path` et renvoie la première redirection demandée (ou null). */
async function visit(path: string) {
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
  const call = h.navigateTo.mock.calls[0]
  return call ? { to: call[0] as string, options: call[1] as any } : null
}
const loginAs = (id: string | null) => { user.value = id ? { id, email: `${id}@test.fr` } : null }

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
})

const AUTH_PAGES = ['/profil', '/mes-inscriptions', '/admin/dashboard', '/admin/blocs', '/completer-profil']
const PUBLIC_PAGES = ['/', '/login', '/register', '/callback', '/tarifs', '/club/histoire']

describe('non connecté', () => {
  it.each(AUTH_PAGES)('%s demande d\'être connecté : redirection vers /login (avec le retour prévu)', async (path) => {
    const redirect = await visit(path)
    expect(redirect?.to).toBe('/login')
    expect(redirect?.options?.query?.redirect).toBe(path)
  })

  it.each(PUBLIC_PAGES)('%s reste accessible', async (path) => {
    expect(await visit(path)).toBeNull()
  })
})

describe('C3 — profil incomplet : renvoi vers /completer-profil', () => {
  beforeEach(() => loginAs('nouveau'))

  it.each(['/profil', '/mes-inscriptions'])('%s => /completer-profil', async (path) => {
    expect((await visit(path))?.to).toBe('/completer-profil')
  })

  it.each(['/admin/dashboard', '/admin/blocs'])('%s => /completer-profil (même pour un compte admin au profil incomplet)', async (path) => {
    loginAs('admin-incomplet')
    expect((await visit(path))?.to).toBe('/completer-profil')
  })

  it('/completer-profil elle-même : on passe', async () => {
    expect(await visit('/completer-profil')).toBeNull()
  })

  it.each(PUBLIC_PAGES)('page publique %s : on passe (déconnexion, login, inscription et pages Storyblok jamais bloquées)', async (path) => {
    expect(await visit(path)).toBeNull()
  })
})

describe('C3 — profil complété', () => {
  it('/completer-profil => /profil', async () => {
    loginAs('adherent')
    expect((await visit('/completer-profil'))?.to).toBe('/profil')
  })

  it.each(['/profil', '/mes-inscriptions'])('%s : on passe', async (path) => {
    loginAs('adherent')
    expect(await visit(path)).toBeNull()
  })
})

describe('/admin — garde de rôle (comportement à préserver)', () => {
  it.each(['admin', 'secretaire', 'initiateur'])('compte %s : accès accordé', async (id) => {
    loginAs(id)
    expect(await visit('/admin/dashboard')).toBeNull()
  })

  it('adhérent sans rôle de gestion : renvoyé vers /', async () => {
    loginAs('adherent')
    expect((await visit('/admin/dashboard'))?.to).toBe('/')
  })

  it('lecture des rôles en échec : renvoyé vers / (jamais vers la complétion)', async () => {
    loginAs('admin')
    db.fail = true
    expect((await visit('/admin/dashboard'))?.to).toBe('/')
  })
})
