// auth-erreur-profil, T0 — porte `AuthPageGate` (app/components/auth/PageGate.vue), Q25.
// Contrat (plan.md) : slot par défaut = la page ; bloque (slot non rendu) quand l'utilisateur est connecté, que la route
// courante est une page connectée et que authStatus vaut `error`, après montage. Bloc d'erreur `data-testid="auth-profile-error"`,
// bouton « Réessayer » (fetchProfile), lien « Se déconnecter » `data-testid="auth-profile-logout"`. Aucune redirection sur échec.
// Hypothèse de test : la porte lit la route courante par `useRoute()` (simulé ici, chemin réglable par test).
// VRAI useAuth ET vrai middleware : l'état `error` est produit par le middleware (2 lectures), seul Supabase est simulé.
// Le Header n'est jamais monté : tout passe par la porte seule.
// Rouge attendu avant T3 : le composant n'existe pas (import impossible).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../../utils/auth-fake'

const ctxRoute = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { path: '/profil', fullPath: '/profil', query: {}, hash: '', params: {}, meta: {}, matched: [] as any[], name: 'profil' } as any,
}))
mockNuxtImport('navigateTo', () => ctxRoute.navigateTo)
mockNuxtImport('useRoute', () => () => ctxRoute.route)

const { client, from, user, signOut } = createSupabaseMock({ withAuth: true })
const signInWithPassword = vi.fn()
client.auth.signInWithPassword = signInWithPassword
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: PageGate } = await import('~/components/auth/PageGate.vue')
const { default: middleware } = await import('~/middleware/auth.global')
const { useAuth } = await import('~/composables/useAuth')

const NAME = 'Gwendoline Seedprofil'
const db = createAuthDb({
  profiles: {
    adherent: profileOf('adherent', { full_name: NAME }),
    admin: profileOf('admin', { full_name: 'Aurélien Seedadmin' }),
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
  },
  roles: { adherent: ['parent'], admin: ['admin'], nouveau: [] },
})

// La « page » : lit le profil du vrai useAuth, comme le feraient /profil ou /admin.
const PageProbe = defineComponent({
  setup() {
    const { profile } = useAuth()
    return () => h('div', { 'data-testid': 'page-content' }, `PAGE ${profile.value?.full_name ?? ''}`)
  },
})

const route = (path: string) => ({ path, fullPath: path, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
const loginAs = (id: string | null) => { user.value = id ? { id, email: `${id}@test.fr` } : null }
const sel = (id: string) => `[data-testid="${id}"]`
const redirects = () => ctxRoute.navigateTo.mock.calls.map(c => c[0])

/** Navigation réelle (middleware) vers `path` sur une route simulée. */
async function navigate(path: string) {
  ctxRoute.route.path = path
  ctxRoute.route.fullPath = path
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
}

let wrapper: any
async function mountGate() {
  wrapper = await mountSuspended(PageGate, { slots: { default: () => h(PageProbe) } })
  await flushPromises()
  return wrapper
}
const retryButton = () => wrapper.find(sel('auth-profile-error')).findAll('button').find((b: any) => b.text().includes('Réessayer'))

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.failTables = []
  db.failNext = 0
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  signOut.mockReset().mockImplementation(async () => { user.value = null; return { error: null } })
  signInWithPassword.mockReset().mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } })
  ctxRoute.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
  ctxRoute.route.path = '/profil'
  ctxRoute.route.fullPath = '/profil'
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
  wrapper?.unmount()
  wrapper = undefined
})

describe('Q25 — après 2 échecs, la page connectée est remplacée par un message et « Réessayer »', () => {
  beforeEach(async () => {
    loginAs('adherent')
    db.fail = true
    await navigate('/profil')
  })

  it('le bloc d\'erreur est affiché, avec un message, le bouton « Réessayer » et le lien « Se déconnecter »', async () => {
    expect(db.count('profiles')).toBe(2)
    await mountGate()
    const block = wrapper.find(sel('auth-profile-error'))
    expect(block.exists()).toBe(true)
    expect(retryButton()).toBeTruthy()
    expect(wrapper.find(sel('auth-profile-logout')).exists()).toBe(true)
    expect(wrapper.find(sel('auth-profile-logout')).text()).toContain('Se déconnecter')
    const message = block.text().replace('Réessayer', '').replace('Se déconnecter', '').trim()
    expect(message.length).toBeGreaterThan(20)
  })

  it('aucun contenu dépendant du profil : la page n\'est pas rendue (ni son contenu, ni le nom du profil)', async () => {
    await mountGate()
    expect(wrapper.find(sel('page-content')).exists()).toBe(false)
    expect(wrapper.text()).not.toContain('PAGE')
    expect(wrapper.text()).not.toContain(NAME)
    expect(wrapper.html()).not.toContain('Seedprofil')
  })

  it('aucune redirection : ni /login, ni autre page (l\'URL ne change pas)', async () => {
    await mountGate()
    expect(redirects()).toEqual([])
    expect(ctxRoute.route.path).toBe('/profil')
  })

  it.each(['/mes-inscriptions', '/completer-profil'])('même blocage sur %s', async (path) => {
    ctxRoute.route.path = path
    await mountGate()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(true)
    expect(wrapper.find(sel('page-content')).exists()).toBe(false)
  })

  it('même blocage sur /admin/dashboard (une page connectée comme les autres)', async () => {
    ctxRoute.route.path = '/admin/dashboard'
    await mountGate()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(true)
    expect(wrapper.find(sel('page-content')).exists()).toBe(false)
    expect(redirects()).toEqual([])
  })
})

describe('Q25 — « Réessayer »', () => {
  beforeEach(async () => {
    loginAs('adherent')
    db.fail = true
    await navigate('/profil')
  })

  it('un clic = une seule nouvelle lecture ; en cas d\'échec le message reste, la page reste absente, aucune redirection', async () => {
    await mountGate()
    await retryButton().trigger('click')
    await flushPromises()
    expect(db.count('profiles')).toBe(3)
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(true)
    expect(wrapper.find(sel('page-content')).exists()).toBe(false)
    expect(redirects()).toEqual([])
  })

  it('en cas de succès, la page demandée s\'affiche sans rechargement, sur la même URL, sans redirection', async () => {
    await mountGate()
    db.fail = false
    await retryButton().trigger('click')
    await flushPromises()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
    expect(wrapper.text()).toContain(NAME)
    expect(ctxRoute.route.path).toBe('/profil')
    expect(redirects()).toEqual([])
    expect(useAuth().authStatus.value).toBe('ready')
  })

  it('échec puis succès au clic suivant : le deuxième clic suffit', async () => {
    await mountGate()
    await retryButton().trigger('click')
    await flushPromises()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(true)
    db.fail = false
    await retryButton().trigger('click')
    await flushPromises()
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
    expect(db.count('profiles')).toBe(4)
  })
})

describe('Q25 — « Réessayer » réussi : les redirections normales restent permises, au plus une', () => {
  it('profil incomplet => une seule redirection, vers /completer-profil (jamais /login)', async () => {
    loginAs('nouveau')
    db.fail = true
    await navigate('/profil')
    await mountGate()
    db.fail = false
    await retryButton().trigger('click')
    await flushPromises()
    expect(redirects()).toEqual(['/completer-profil'])
  })

  it('/admin sans rôle de gestion => une seule redirection, vers /', async () => {
    loginAs('adherent')
    db.fail = true
    await navigate('/admin/dashboard')
    await mountGate()
    db.fail = false
    await retryButton().trigger('click')
    await flushPromises()
    expect(redirects()).toEqual(['/'])
  })

  it('/admin avec le rôle admin : la page s\'affiche, aucune redirection', async () => {
    loginAs('admin')
    db.fail = true
    await navigate('/admin/dashboard')
    await mountGate()
    db.fail = false
    await retryButton().trigger('click')
    await flushPromises()
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
    expect(redirects()).toEqual([])
  })

  it('/completer-profil avec un profil déjà complet => une seule redirection, vers /profil', async () => {
    loginAs('adherent')
    db.fail = true
    await navigate('/completer-profil')
    await mountGate()
    db.fail = false
    await retryButton().trigger('click')
    await flushPromises()
    expect(redirects()).toEqual(['/profil'])
  })
})

describe('Q25 — lien « Se déconnecter » du bloc d\'erreur (indépendant de l\'en-tête)', () => {
  it('la déconnexion aboutit alors que la lecture du profil échoue toujours : session fermée, état visiteur, retour sur /login', async () => {
    loginAs('adherent')
    db.fail = true
    await navigate('/profil')
    await mountGate()
    const readsBefore = db.count('profiles')

    await wrapper.find(sel('auth-profile-logout')).trigger('click')
    await flushPromises()

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(user.value).toBeNull()
    expect(useAuth().authStatus.value).toBe('idle')
    expect(redirects()).toContain('/login')
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(db.fail).toBe(true) // la lecture du profil échoue toujours : la déconnexion n'en dépend pas
    expect(db.count('profiles')).toBe(readsBefore) // et ne relance aucune lecture
  })

  it('après la déconnexion, une page connectée se comporte comme pour un visiteur : /login avec le retour prévu, aucune lecture', async () => {
    loginAs('adherent')
    db.fail = true
    await navigate('/profil')
    await mountGate()
    await wrapper.find(sel('auth-profile-logout')).trigger('click')
    await flushPromises()
    ctxRoute.navigateTo.mockClear()
    const readsBefore = db.reads.length

    await navigate('/profil')
    const call = ctxRoute.navigateTo.mock.calls[0]
    expect(call?.[0]).toBe('/login')
    expect(call?.[1]?.query?.redirect).toBe('/profil')
    expect(db.reads.length).toBe(readsBefore)
  })

  it('le lien n\'existe que dans le bloc d\'erreur', async () => {
    loginAs('adherent')
    await navigate('/profil')
    await mountGate()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.find(sel('auth-profile-logout')).exists()).toBe(false)
  })
})

describe('Q25 — la porte ne bloque que sur échec de lecture du profil d\'une page connectée', () => {
  it('profil ready : la page s\'affiche avec ses données, pas de bloc', async () => {
    loginAs('adherent')
    await navigate('/profil')
    await mountGate()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.text()).toContain(NAME)
  })

  it('page publique : la page s\'affiche même si la lecture du profil est en échec', async () => {
    loginAs('adherent')
    db.fail = true
    await navigate('/profil') // état error posé par une navigation précédente
    expect(useAuth().authStatus.value).toBe('error')
    ctxRoute.route.path = '/tarifs'
    await mountGate()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
  })

  it('visiteur sans session : jamais de bloc (le comportement visiteur reste la redirection du middleware)', async () => {
    useAuth().authStatus.value = 'error' // reliquat improbable, mais sans utilisateur il ne doit rien bloquer
    ctxRoute.route.path = '/profil'
    await mountGate()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
  })

  it('lecture en cours (loading) : pas de bloc, la page n\'est pas masquée par la porte', async () => {
    loginAs('adherent')
    const release = db.hold()
    void useAuth().ensureProfile()
    await flushPromises()
    expect(useAuth().authStatus.value).toBe('loading')
    await mountGate()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    release()
    await flushPromises()
  })

  it('échec d\'une action de connexion (mauvais mot de passe) : jamais pris pour un échec de lecture, aucun bloc', async () => {
    loginAs('adherent')
    await navigate('/profil')
    await mountGate()
    await expect(useAuth().loginWithEmail('adherent@test.fr', 'mauvais')).rejects.toBeTruthy()
    await flushPromises()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
  })

  it('échec d\'une action de connexion côté visiteur : aucun bloc non plus', async () => {
    ctxRoute.route.path = '/profil'
    await mountGate()
    await expect(useAuth().loginWithEmail('x@test.fr', 'mauvais')).rejects.toBeTruthy()
    await flushPromises()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
  })
})
