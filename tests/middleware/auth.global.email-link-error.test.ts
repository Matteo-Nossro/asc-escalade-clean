// R2-T0a auth-profils — R2-e : liens d'e-mail déjà utilisés ou expirés qui retombent sur une autre page que /callback.
// Contrat : auth.global.ts renvoie vers /callback toute route autre que /callback dont la query contient `error_code`,
// ou dont le hash contient `error_code=` (côté client), en conservant query ET hash. /callback n'est jamais redirigée.
// VRAI useAuth, Supabase simulé. `navigateTo` simulé : on observe la destination demandée. La forme de la destination
// (chaîne `/callback?…#…` ou objet { path, query, hash }) est laissée libre : elle est normalisée avant comparaison.
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
  profiles: { adherent: profileOf('adherent') },
  roles: { adherent: ['parent'] },
})

const QUERY = { error: 'access_denied', error_code: 'otp_expired', error_description: 'Email link is invalid or has expired' }
const HASH = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'

function route(path: string, query: Record<string, string> = {}, hash = '') {
  const qs = new URLSearchParams(query).toString()
  return { path, fullPath: `${path}${qs ? `?${qs}` : ''}${hash}`, query, hash, params: {}, meta: {}, matched: [], name: undefined } as any
}

/** Destination normalisée d'une redirection : { path, query, hash } (sans le « # » initial). */
function normalize(target: unknown) {
  if (typeof target === 'string') {
    const u = new URL(target, 'http://localhost')
    return { path: u.pathname, query: Object.fromEntries(u.searchParams.entries()), hash: u.hash.replace(/^#/, '') }
  }
  const t = target as any
  return { path: t?.path as string, query: { ...(t?.query ?? {}) }, hash: String(t?.hash ?? '').replace(/^#/, '') }
}

/** Lance le middleware et renvoie la redirection demandée (appel à navigateTo, sinon valeur renvoyée), ou null. */
async function visit(to: any) {
  const returned = await (middleware as any)(to, route('/'))
  await flushPromises()
  const call = h.navigateTo.mock.calls[0]
  if (call) return normalize(call[0])
  if (typeof returned === 'string' || (returned && typeof returned === 'object' && 'path' in returned)) return normalize(returned)
  return null
}

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.navigateTo.mockReset().mockImplementation((to: unknown) => ({ redirectedTo: to }))
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
})

const PAGES = ['/', '/tarifs', '/club/histoire', '/login', '/register']

describe('R2-e — error_code dans la query : renvoi vers /callback', () => {
  it.each(PAGES)('%s?error_code=… => /callback, query conservée', async (path) => {
    const redirect = await visit(route(path, QUERY))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject(QUERY)
  })

  it('query réduite à error_code : renvoyée vers /callback avec ce paramètre', async () => {
    const redirect = await visit(route('/', { error_code: 'otp_expired' }))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject({ error_code: 'otp_expired' })
  })

  it('utilisateur connecté : le renvoi a lieu aussi', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    const redirect = await visit(route('/', QUERY))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject(QUERY)
  })
})

describe('R2-e — error_code= dans le hash (côté client) : renvoi vers /callback', () => {
  it.each(PAGES)('%s#error=…&error_code=… => /callback, hash conservé', async (path) => {
    const redirect = await visit(route(path, {}, HASH))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.hash).toBe(HASH.slice(1))
  })

  it('query ET hash conservés ensemble', async () => {
    const redirect = await visit(route('/', { type: 'signup' }, HASH))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject({ type: 'signup' })
    expect(redirect?.hash).toBe(HASH.slice(1))
  })
})

describe('R2-e — /callback n\'est jamais redirigée', () => {
  it('/callback avec error_code en query : on passe', async () => {
    expect(await visit(route('/callback', QUERY))).toBeNull()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('/callback avec error_code= en hash : on passe', async () => {
    expect(await visit(route('/callback', {}, HASH))).toBeNull()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('/callback?type=signup#error_code=… : on passe', async () => {
    expect(await visit(route('/callback', { type: 'signup' }, HASH))).toBeNull()
  })
})

describe('R2-e — sans error_code : comportement inchangé', () => {
  it('page publique sans paramètre : on passe', async () => {
    expect(await visit(route('/'))).toBeNull()
  })

  it('page publique avec d\'autres paramètres (utm) : on passe', async () => {
    expect(await visit(route('/tarifs', { utm_source: 'newsletter' }))).toBeNull()
  })

  it('hash sans error_code= (retour implicite avec jeton) : on passe', async () => {
    expect(await visit(route('/', {}, '#access_token=abc&refresh_token=def&type=signup'))).toBeNull()
  })

  it('page protégée sans paramètre, non connecté : toujours /login avec le retour prévu', async () => {
    const redirect = await visit(route('/profil'))
    expect(redirect?.path).toBe('/login')
  })
})
