// R2c-T0a auth-profils — R2c-1 : retour PKCE `?code=<uuid>` sur une autre page que /callback (Supabase retombe sur la Site URL).
// Contrat : toute route autre que /callback dont la query contient `code` au format UUID est renvoyée vers /callback,
// query ET hash conservés, AVANT les contrôles d'authentification et de complétion. Un `code` non UUID n'est pas touché.
// VRAI useAuth, Supabase simulé. `navigateTo` simulé : la forme de la destination (chaîne ou objet) est normalisée.
// Limite : « côté serveur » (import.meta.server) n'est pas testable en Vitest (valeur figée à false dans cet environnement) ;
// ce volet est à vérifier en revue (la règle doit précéder `if (import.meta.server) return`) et par e2e/email-link.spec.ts.
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
    adherent: profileOf('adherent'),
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
  },
  roles: { adherent: ['parent'], nouveau: [] },
})

const UUID = '0b9c7e2a-4d51-4f0e-9a3b-6c1d2e3f4a5b'

function route(path: string, query: Record<string, string> = {}, hash = '') {
  const qs = new URLSearchParams(query).toString()
  return { path, fullPath: `${path}${qs ? `?${qs}` : ''}${hash}`, query, hash, params: {}, meta: {}, matched: [], name: undefined } as any
}

function normalize(target: unknown) {
  if (typeof target === 'string') {
    const u = new URL(target, 'http://localhost')
    return { path: u.pathname, query: Object.fromEntries(u.searchParams.entries()), hash: u.hash.replace(/^#/, '') }
  }
  const t = target as any
  return { path: t?.path as string, query: { ...(t?.query ?? {}) }, hash: String(t?.hash ?? '').replace(/^#/, '') }
}

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

describe('R2c-1 — code UUID sur une autre page : renvoi vers /callback', () => {
  it('/?code=<uuid> => /callback?code=<uuid>', async () => {
    const redirect = await visit(route('/', { code: UUID }))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject({ code: UUID })
  })

  it('/profil?code=<uuid>&x=1#h => /callback, query (code et x) et hash conservés', async () => {
    const redirect = await visit(route('/profil', { code: UUID, x: '1' }, '#h'))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject({ code: UUID, x: '1' })
    expect(redirect?.hash).toBe('h')
  })

  it.each(['/tarifs', '/club/histoire', '/login', '/register'])('%s?code=<uuid> => /callback', async (path) => {
    const redirect = await visit(route(path, { code: UUID }))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject({ code: UUID })
  })

  it('UUID en majuscules : renvoyé aussi', async () => {
    const redirect = await visit(route('/', { code: UUID.toUpperCase() }))
    expect(redirect?.path).toBe('/callback')
  })

  it('type=signup conservé avec le code', async () => {
    const redirect = await visit(route('/', { code: UUID, type: 'signup' }))
    expect(redirect?.path).toBe('/callback')
    expect(redirect?.query).toMatchObject({ code: UUID, type: 'signup' })
  })
})

describe('R2c-1 — la règle passe avant les contrôles d\'authentification et de complétion', () => {
  it('page protégée, non connecté : /callback (et non /login)', async () => {
    const redirect = await visit(route('/profil', { code: UUID }))
    expect(redirect?.path).toBe('/callback')
  })

  it('profil incomplet connecté sur une page protégée : /callback (et non /completer-profil), sans lecture du profil', async () => {
    user.value = { id: 'nouveau', email: 'nouveau@test.fr' }
    // Le plugin auth-sync lit le profil dès que `user` change, indépendamment du middleware : on le laisse finir,
    // puis on ne mesure que les lectures déclenchées par le middleware.
    // Limite : ensureProfile ne relit pas un profil déjà chargé, donc un appel parasite du middleware
    // passerait inaperçu ici ; ce compte ne garantit que l'absence de nouvelle lecture.
    await flushPromises()
    await flushPromises()
    const readsBefore = db.reads.length
    const redirect = await visit(route('/mes-inscriptions', { code: UUID }))
    expect(redirect?.path).toBe('/callback')
    expect(db.reads.length).toBe(readsBefore)
  })

  it('utilisateur connecté sur une page publique : le renvoi a lieu aussi', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    const redirect = await visit(route('/', { code: UUID }))
    expect(redirect?.path).toBe('/callback')
  })
})

describe('R2c-1 — cas non redirigés', () => {
  it('/callback?code=<uuid> : on passe', async () => {
    expect(await visit(route('/callback', { code: UUID }))).toBeNull()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('/callback?code=<uuid>&type=signup : on passe', async () => {
    expect(await visit(route('/callback', { code: UUID, type: 'signup' }))).toBeNull()
  })

  it.each(['abc', '123456', `${UUID}-extra`, `x${UUID}`, UUID.slice(0, -1), ''])('/?code=%j (pas un UUID) : on passe', async (code) => {
    expect(await visit(route('/', { code }))).toBeNull()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('/tarifs?code=abc : on passe', async () => {
    expect(await visit(route('/tarifs', { code: 'abc' }))).toBeNull()
  })

  it('/?foo=<uuid> (le paramètre n\'est pas `code`) : on passe', async () => {
    expect(await visit(route('/', { foo: UUID }))).toBeNull()
  })

  it('page protégée avec un code non UUID, non connecté : comportement inchangé (/login)', async () => {
    const redirect = await visit(route('/profil', { code: 'abc' }))
    expect(redirect?.path).toBe('/login')
  })
})
