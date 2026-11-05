// auth-erreur-profil, porte e2e — accès DIRECT (ou rechargement) d'une page connectée avec `/admin/**` en `ssr: false`.
// Constat de l'agent e2e sur le build : un admin connecté qui ouvre /admin/dashboard ou /admin/blocs par l'URL est renvoyé
// sur /login ; par navigation interne, tout va bien. Cause probable (non confirmée) : sans rendu serveur, le middleware lit
// `useSupabaseUser()` avant que l'utilisateur soit disponible, alors que la session existe déjà dans le client Supabase.
//
// Scénario simulé « premier chargement côté client » : `useSupabaseUser()` est VIDE à l'entrée du middleware ; la session
// existe dans le client (`auth.getSession()` la renvoie) et l'utilisateur n'apparaît dans `useSupabaseUser()` qu'après
// ~30 ms (hydratation du module Supabase). Le faux `getSession()` ne répond qu'au même moment : tout code correct (attendre
// `getSession()`, attendre l'utilisateur, ou les deux) passe, aucune implémentation n'est imposée.
// VRAI useAuth, VRAI middleware, seul Supabase est simulé. Les autres fichiers du dossier posent `user.value` à l'avance
// et ne peuvent pas voir ce défaut.
// Rouge attendu avant correction : les tests 1 à 3 (renvoi vers /login au lieu d'attendre la session). Les tests 4 et 5
// (aucune session, pages publiques) décrivent le comportement actuel à conserver : ils sont verts d'emblée.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf, addCodeExchange } from '../utils/auth-fake'

const h = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => h.navigateTo)

const { client, from, user } = createSupabaseMock({ withAuth: true })
const { getSession } = addCodeExchange(client)
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: middleware } = await import('~/middleware/auth.global')
const { useAuth } = await import('~/composables/useAuth')

const HYDRATION_MS = 30
const timers: Array<ReturnType<typeof setTimeout>> = []
const db = createAuthDb({
  profiles: {
    adherent: profileOf('adherent'),
    admin: profileOf('admin'),
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
  },
  roles: { adherent: ['parent'], admin: ['admin'], nouveau: [] },
})

/** Une session existe dans le client Supabase : `getSession()` et `useSupabaseUser()` la livrent après HYDRATION_MS. */
function sessionExistsFor(id: string, delay = HYDRATION_MS) {
  const ready = new Promise<void>((resolve) => {
    timers.push(setTimeout(() => { user.value = { id, email: `${id}@test.fr` }; resolve() }, delay))
  })
  getSession.mockImplementation(async () => {
    await ready
    return { data: { session: { user: { id, email: `${id}@test.fr` }, access_token: 'jeton-simule' } }, error: null }
  })
}

const route = (path: string, fullPath = path) => ({ path, fullPath, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
async function visit(path: string, fullPath = path) {
  await (middleware as any)(route(path, fullPath), route('/'))
  await flushPromises()
  return h.navigateTo.mock.calls.map(c => ({ to: c[0] as string, options: c[1] as any }))
}

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.failTables = []
  db.failNext = 0
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null })
  h.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
})
afterEach(async () => {
  timers.splice(0).forEach(clearTimeout) // une hydratation simulée ne déborde jamais sur le test suivant
  db.releaseAll()
  await flushPromises()
})

describe('1 — session présente, useSupabaseUser() encore vide : pas de renvoi vers /login', () => {
  it.each(['/admin/dashboard', '/admin/blocs'])('admin, accès direct à %s : aucune redirection, profil et rôles chargés', async (path) => {
    sessionExistsFor('admin')
    expect(user.value).toBeNull() // précondition du scénario
    const calls = await visit(path)

    expect(calls.map(c => c.to)).not.toContain('/login')
    expect(calls).toEqual([])
    const auth = useAuth()
    expect(auth.authStatus.value).toBe('ready')
    expect(auth.profile.value?.id).toBe('admin')
    expect(auth.isAdmin.value).toBe(true)
    expect(db.count('profiles')).toBe(1)
    expect(db.count('user_roles')).toBe(1)
  })

  it.each(['/profil', '/mes-inscriptions'])('adhérent, accès direct à %s : aucune redirection, profil chargé', async (path) => {
    sessionExistsFor('adherent')
    const calls = await visit(path)

    expect(calls).toEqual([])
    expect(useAuth().authStatus.value).toBe('ready')
    expect(useAuth().profile.value?.id).toBe('adherent')
  })
})

describe('2 — même scénario, membre sans rôle de gestion', () => {
  it.each(['/admin/dashboard', '/admin/blocs'])('accès direct à %s : renvoi vers « / », jamais vers /login', async (path) => {
    sessionExistsFor('adherent')
    const calls = await visit(path)

    expect(calls.map(c => c.to)).toEqual(['/'])
    expect(calls.map(c => c.to)).not.toContain('/login')
    expect(useAuth().authStatus.value).toBe('ready') // le profil a bien été lu avant la décision
    expect(useAuth().isAdmin.value).toBe(false)
  })
})

describe('3 — même scénario, lecture du profil en échec', () => {
  it.each(['/admin/dashboard', '/admin/blocs'])('accès direct à %s : réessai unique (2 lectures), aucune redirection, état error pour la porte', async (path) => {
    sessionExistsFor('admin')
    db.fail = true
    const calls = await visit(path)

    expect(calls).toEqual([])
    expect(db.count('profiles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('error')
  })

  it('échec puis succès (accès direct à /admin/dashboard) : navigation normale, 2 lectures, état ready', async () => {
    sessionExistsFor('admin')
    db.failNext = 1
    const calls = await visit('/admin/dashboard')

    expect(calls).toEqual([])
    expect(db.count('profiles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('ready')
  })
})

describe('4 — aucune session : comportement actuel conservé, sans attente perceptible ni boucle', () => {
  it.each(['/admin/dashboard', '/admin/blocs', '/profil'])('accès direct à %s : /login avec redirect, une seule redirection, en moins d\'une seconde', async (path) => {
    // getSession renvoie `session: null` (réglage par défaut), useSupabaseUser reste vide
    const started = performance.now()
    const calls = await visit(path, `${path}?onglet=1`)
    const elapsed = performance.now() - started

    expect(calls).toHaveLength(1)
    expect(calls[0].to).toBe('/login')
    expect(calls[0].options?.query?.redirect).toBe(`${path}?onglet=1`)
    expect(elapsed).toBeLessThan(1000)
    expect(db.reads).toEqual([])
    expect(getSession.mock.calls.length).toBeLessThanOrEqual(2) // pas de boucle d'interrogation de la session
    expect(useAuth().authStatus.value).toBe('idle')
  })

  it('getSession lui-même en échec (erreur réseau) : /login, pas d\'exception, pas de lecture du profil', async () => {
    getSession.mockRejectedValue(new Error('réseau coupé (simulé)'))
    const started = performance.now()
    const calls = await visit('/admin/dashboard')

    expect(calls.map(c => c.to)).toEqual(['/login'])
    expect(performance.now() - started).toBeLessThan(1000)
    expect(db.reads).toEqual([])
  })
})

describe('6 — accès direct à /completer-profil (page ssr: false), useSupabaseUser() vide au départ', () => {
  it('session présente, profil incomplet : on reste sur la page, aucune redirection, profil lu', async () => {
    sessionExistsFor('nouveau')
    const calls = await visit('/completer-profil')

    expect(calls).toEqual([])
    expect(useAuth().authStatus.value).toBe('ready')
    expect(useAuth().isProfileComplete.value).toBe(false)
  })

  it('session présente, profil complet : une seule redirection, vers /profil (jamais /login)', async () => {
    sessionExistsFor('adherent')
    const calls = await visit('/completer-profil')

    expect(calls.map(c => c.to)).toEqual(['/profil'])
  })

  it('aucune session : /login avec redirect, une seule redirection', async () => {
    const calls = await visit('/completer-profil')

    expect(calls).toHaveLength(1)
    expect(calls[0].to).toBe('/login')
    expect(calls[0].options?.query?.redirect).toBe('/completer-profil')
    expect(db.reads).toEqual([])
  })

  it('session présente, lecture du profil en échec : 2 lectures, aucune redirection, état error', async () => {
    sessionExistsFor('nouveau')
    db.fail = true
    const calls = await visit('/completer-profil')

    expect(calls).toEqual([])
    expect(db.count('profiles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('error')
  })
})

describe('5 — pages publiques : aucune attente ni lecture de session ajoutée', () => {
  it.each(['/', '/tarifs', '/club', '/login', '/register', '/callback'])('%s, sans session : aucune redirection, session non interrogée, aucune lecture', async (path) => {
    const calls = await visit(path)

    expect(calls).toEqual([])
    expect(getSession).not.toHaveBeenCalled()
    expect(db.reads).toEqual([])
  })

  it('/tarifs avec une session en cours d\'hydratation lente : la navigation n\'attend pas la session', async () => {
    sessionExistsFor('admin', 400) // une attente éventuelle serait nettement visible
    const started = performance.now()
    const calls = await visit('/tarifs')

    expect(calls).toEqual([])
    expect(getSession).not.toHaveBeenCalled()
    expect(db.reads).toEqual([])
    expect(performance.now() - started).toBeLessThan(150)
    await new Promise(resolve => setTimeout(resolve, 450)) // laisse l'hydratation simulée se terminer
  })
})
