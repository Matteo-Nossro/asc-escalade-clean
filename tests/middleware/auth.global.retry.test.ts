// auth-erreur-profil, T0 — Q25, réessai unique du middleware (critères d'acceptation 1, 2, 6, 8, 9).
// VRAI useAuth, seul Supabase est simulé (tests/utils/auth-fake.ts : `failNext`, `failTables`, `count`).
// L'utilisateur est posé dans le corps du test, juste avant la navigation (voir auth.global.error-state.test.ts).
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
    adherent: profileOf('adherent'),
    admin: profileOf('admin'),
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
  },
  roles: { adherent: ['parent'], admin: ['admin'], nouveau: [] },
})

const route = (path: string, fullPath = path) => ({ path, fullPath, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
async function visit(path: string) {
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
  return h.navigateTo.mock.calls.map(c => ({ to: c[0] as string, options: c[1] as any }))
}
const loginAs = (id: string | null) => { user.value = id ? { id, email: `${id}@test.fr` } : null }

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
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

describe('Q25 — une lecture échoue, la suivante réussit : navigation normale, sans message d\'erreur', () => {
  it.each(['/profil', '/mes-inscriptions'])('%s : 2 lectures, état ready, aucune redirection', async (path) => {
    db.failNext = 1
    loginAs('adherent')
    expect(await visit(path)).toEqual([])
    expect(db.count('profiles')).toBe(2)
    const auth = useAuth()
    expect(auth.authStatus.value).toBe('ready')
    expect(auth.profile.value?.id).toBe('adherent')
  })

  it('/admin/dashboard avec le rôle admin : on passe (le renvoi vers / n\'a pas lieu), droits chargés', async () => {
    db.failNext = 1
    loginAs('admin')
    expect(await visit('/admin/dashboard')).toEqual([])
    expect(db.count('profiles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('ready')
    expect(useAuth().isAdmin.value).toBe(true)
  })

  it('après réessai réussi, un profil incomplet donne une seule redirection, vers /completer-profil', async () => {
    db.failNext = 1
    loginAs('nouveau')
    const calls = await visit('/profil')
    expect(calls.map(c => c.to)).toEqual(['/completer-profil'])
  })

  it('après réessai réussi, /admin sans rôle de gestion donne une seule redirection, vers /', async () => {
    db.failNext = 1
    loginAs('adherent')
    const calls = await visit('/admin/dashboard')
    expect(db.count('profiles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('ready') // le renvoi vient du rôle manquant, pas de l'échec de lecture
    expect(calls.map(c => c.to)).toEqual(['/'])
  })
})

describe('Q25 — échec persistant : exactement 2 lectures par navigation, aucune redirection', () => {
  it.each(['/profil', '/mes-inscriptions', '/completer-profil', '/admin/dashboard'])('%s : 2 lectures du profil, aucun navigateTo', async (path) => {
    db.fail = true
    loginAs('admin')
    expect(await visit(path)).toEqual([])
    expect(db.count('profiles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('error')
  })

  it('rôles en échec persistant (profil lisible) : 2 lectures, état error, aucune redirection', async () => {
    db.failTables = ['user_roles']
    loginAs('admin')
    expect(await visit('/admin/dashboard')).toEqual([])
    expect(db.count('profiles')).toBe(2)
    expect(db.count('user_roles')).toBe(2)
    expect(useAuth().authStatus.value).toBe('error')
  })

  it('deux navigations successives en échec : 2 lectures chacune (4 au total), jamais de réessai en boucle', async () => {
    db.fail = true
    loginAs('adherent')
    await visit('/profil')
    expect(db.count('profiles')).toBe(2)
    await visit('/mes-inscriptions')
    expect(db.count('profiles')).toBe(4)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('le lecteur est partagé : useAuth() lancé juste avant (auth-sync) ne double pas les lectures', async () => {
    db.fail = true
    loginAs('adherent')
    void useAuth().ensureProfile() // ce que fait le plugin auth-sync dès que l'id apparaît
    await visit('/profil')
    expect(db.count('profiles')).toBe(2)
  })
})

describe('Q25 — hors échec : comportements inchangés', () => {
  it('visiteur sans session : redirection vers /login avec le retour prévu, aucune lecture', async () => {
    db.fail = true
    const calls = await visit('/profil')
    expect(calls).toHaveLength(1)
    expect(calls[0].to).toBe('/login')
    expect(calls[0].options?.query?.redirect).toBe('/profil')
    expect(db.reads).toEqual([])
  })

  it.each(['/admin/dashboard', '/mes-inscriptions', '/completer-profil'])('visiteur sans session sur %s : /login', async (path) => {
    db.fail = true
    expect((await visit(path))[0]?.to).toBe('/login')
  })

  it.each(['/', '/login', '/register', '/callback', '/tarifs', '/club/histoire'])('page publique %s : intacte, le middleware ne lit ni ne relit rien, même connecté avec une lecture en échec', async (path) => {
    db.fail = true
    loginAs('admin')
    await flushPromises() // laisse le plugin auth-sync faire sa propre lecture (hors middleware)
    const readsBefore = db.reads.length
    expect(await visit(path)).toEqual([])
    expect(db.reads.length).toBe(readsBefore)
  })

  it('profil déjà ready : pas de relecture aux navigations suivantes (lecture unique par session)', async () => {
    loginAs('adherent')
    await visit('/profil')
    await visit('/mes-inscriptions')
    await visit('/profil')
    expect(db.count('profiles')).toBe(1)
    expect(db.count('user_roles')).toBe(1)
  })

  it('profil ready après un réessai réussi : toujours pas de relecture ensuite', async () => {
    db.failNext = 1
    loginAs('adherent')
    await visit('/profil')
    expect(db.count('profiles')).toBe(2)
    await visit('/mes-inscriptions')
    await visit('/profil')
    expect(db.count('profiles')).toBe(2)
  })

  it('profil déjà ready puis une lecture ultérieure qui échouerait : sans effet, le profil n\'est pas relu', async () => {
    loginAs('adherent')
    await visit('/profil')
    db.fail = true
    expect(await visit('/mes-inscriptions')).toEqual([])
    expect(useAuth().authStatus.value).toBe('ready')
    expect(db.count('profiles')).toBe(1)
  })
})
