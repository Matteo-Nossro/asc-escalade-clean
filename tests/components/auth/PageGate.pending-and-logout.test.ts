// auth-erreur-profil, points de revue (review.md) — tests rouges écrits avant la correction, production non touchée.
//
// 1. Bloquant : pendant une lecture du profil qui SUIT une erreur, la page protégée ne doit jamais se monter.
//    Aujourd'hui `authStatus` passe à `loading` dès `fetchProfile()` ; la porte ne bloque plus que sur `error`,
//    le bloc disparaît et la page se monte (sur /admin/dashboard, son onMounted lance ses lectures).
// 2. Important : « Se déconnecter » reste une issue quand le réseau est coupé (décision 3 de plan.md).
// VRAI useAuth, VRAIE porte, VRAI middleware, vraie page /admin/dashboard ; seul Supabase (et fetch) est simulé.
// Aucune implémentation n'est imposée : on observe l'écran, les lectures, `user`, les appels à signOut et à navigateTo.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, effectScope, h, onMounted } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf, addCodeExchange } from '../../utils/auth-fake'
import { makeFetchStub, serveBusinessTablesEmpty } from '../../utils/admin-seed'

const ctx = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { path: '/profil', fullPath: '/profil', query: {}, hash: '', params: {}, meta: {}, matched: [] as any[], name: 'profil' } as any,
}))
mockNuxtImport('navigateTo', () => ctx.navigateTo)
mockNuxtImport('useRoute', () => () => ctx.route)

const { client, from, user, signOut } = createSupabaseMock({ withAuth: true })
const { getSession } = addCodeExchange(client)
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: PageGate } = await import('~/components/auth/PageGate.vue')
const { default: Dashboard } = await import('~/pages/admin/dashboard.vue')
const { default: middleware } = await import('~/middleware/auth.global')
const { default: authSyncPlugin } = await import('~/plugins/auth-sync.client')
const { useAuth } = await import('~/composables/useAuth')

const NAME = 'Gwendoline Seedprofil'
const db = createAuthDb({
  profiles: {
    adherent: profileOf('adherent', { full_name: NAME }),
    admin: profileOf('admin', { full_name: 'Aurélien Seedadmin' }),
  },
  roles: { adherent: ['parent'], admin: ['admin'] },
})

const mounts = { page: 0 }
const PageProbe = defineComponent({
  setup() {
    const { profile } = useAuth()
    onMounted(() => { mounts.page += 1 })
    return () => h('div', { 'data-testid': 'page-content' }, `PAGE ${profile.value?.full_name ?? ''}`)
  },
})

const route = (path: string) => ({ path, fullPath: path, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
const loginAs = (id: string | null) => { user.value = id ? { id, email: `${id}@test.fr` } : null }
const sel = (id: string) => `[data-testid="${id}"]`
const redirects = () => ctx.navigateTo.mock.calls.map(c => c[0])
const AUTH_TABLES = ['profiles', 'user_roles']
const businessReads = () => db.reads.filter(r => !AUTH_TABLES.includes(r.table)).map(r => r.table)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function navigate(path: string) {
  ctx.route.path = path
  ctx.route.fullPath = path
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
}

let wrapper: any
let fetchStub: ReturnType<typeof makeFetchStub>
async function mountGate(page: any = PageProbe) {
  wrapper = await mountSuspended(PageGate, {
    slots: { default: () => h(page) },
  })
  await flushPromises()
  return wrapper
}
const errorBlock = () => wrapper.find(sel('auth-profile-error'))
const retryButton = () => errorBlock().findAll('button').find((b: any) => b.text().includes('Réessayer'))

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.failTables = []
  db.failNext = 0
  db.reads.length = 0
  serveAuth(from, db)
  serveBusinessTablesEmpty(from, db)
  user.value = null
  mounts.page = 0
  signOut.mockReset().mockImplementation(async () => { user.value = null; return { error: null } })
  getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null })
  ctx.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
  ctx.route.path = '/profil'
  ctx.route.fullPath = '/profil'
  fetchStub = makeFetchStub()
  vi.stubGlobal('fetch', fetchStub)
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
})

/** Compte connecté, 2 lectures du profil en échec par le vrai middleware : état `error`. */
async function reachError(id: string, path: string) {
  loginAs(id)
  db.fail = true
  await navigate(path)
  expect(db.count('profiles')).toBe(2)
  expect(useAuth().authStatus.value).toBe('error')
  ctx.navigateTo.mockClear()
  db.reads.length = 0
}

describe('1 — bloquant : une lecture qui suit une erreur ne monte jamais la page protégée', () => {
  describe('« Réessayer », lecture en cours (db.hold)', () => {
    beforeEach(async () => {
      await reachError('adherent', '/profil')
      await mountGate()
    })

    it('le bloc d\'erreur reste affiché, le bouton est désactivé, la page n\'est pas rendue', async () => {
      db.hold()
      await retryButton().trigger('click')
      await flushPromises()

      expect(useAuth().authStatus.value).toBe('loading') // la lecture est bien en cours
      expect(errorBlock().exists()).toBe(true)
      expect(retryButton()?.attributes('disabled')).toBeDefined()
      expect(wrapper.find(sel('page-content')).exists()).toBe(false)
      expect(mounts.page).toBe(0)
      expect(redirects()).toEqual([])
    })

    it('un double clic ne lance qu\'une lecture', async () => {
      db.hold()
      const button = retryButton()
      await button.trigger('click')
      await button.trigger('click')
      await flushPromises()

      expect(db.count('profiles')).toBe(1)
    })

    it('fin de lecture en succès : la page apparaît (montée une seule fois), le bloc disparaît', async () => {
      const release = db.hold()
      await retryButton().trigger('click')
      await flushPromises()
      expect(mounts.page).toBe(0)

      db.fail = false
      release()
      await flushPromises()

      expect(errorBlock().exists()).toBe(false)
      expect(wrapper.find(sel('page-content')).exists()).toBe(true)
      expect(wrapper.text()).toContain(NAME)
      expect(mounts.page).toBe(1)
    })

    it('fin de lecture en échec : le bloc reste, la page n\'a jamais été montée, aucune redirection', async () => {
      const release = db.hold()
      await retryButton().trigger('click')
      await flushPromises()

      release() // db.fail reste vrai
      await flushPromises()

      expect(errorBlock().exists()).toBe(true)
      expect(retryButton()?.attributes('disabled')).toBeUndefined() // de nouveau utilisable
      expect(wrapper.find(sel('page-content')).exists()).toBe(false)
      expect(mounts.page).toBe(0)
      expect(redirects()).toEqual([])
    })
  })

  describe('lecture lancée par un autre chemin que le bouton (ensureProfile / fetchProfile, comme auth-sync)', () => {
    beforeEach(async () => {
      await reachError('adherent', '/profil')
      await mountGate()
    })

    it('ensureProfile() en cours après une erreur : même exigence, le bloc reste et la page n\'est pas montée', async () => {
      db.hold()
      void useAuth().ensureProfile()
      await flushPromises()

      expect(useAuth().authStatus.value).toBe('loading')
      expect(errorBlock().exists()).toBe(true)
      expect(wrapper.find(sel('page-content')).exists()).toBe(false)
      expect(mounts.page).toBe(0)
    })

    it('ce chemin se termine en succès : la page apparaît ; en échec : le bloc reste', async () => {
      const release = db.hold()
      void useAuth().ensureProfile()
      await flushPromises()
      expect(mounts.page).toBe(0)
      release() // échec (db.fail vrai)
      await flushPromises()
      expect(errorBlock().exists()).toBe(true)
      expect(mounts.page).toBe(0)

      const release2 = db.hold()
      db.fail = false
      void useAuth().fetchProfile()
      await flushPromises()
      expect(errorBlock().exists()).toBe(true)
      expect(mounts.page).toBe(0)
      release2()
      await flushPromises()
      expect(errorBlock().exists()).toBe(false)
      expect(wrapper.find(sel('page-content')).exists()).toBe(true)
    })
  })

  describe('vraie page /admin/dashboard sous la porte', () => {
    async function mountGatedDashboard() {
      await reachError('admin', '/admin/dashboard')
      await mountGate(Dashboard)
    }
    const expectDashboardUntouched = () => {
      expect(businessReads()).toEqual([])
      // Chaque relecture du profil lit `profiles` ET `user_roles` une fois (useAuth). Une lecture de `user_roles` en plus
      // est celle de l'onMounted de la page : à égalité, la page ne s'est pas montée. Exactement 1 relecture ici.
      expect(db.count('profiles')).toBe(1)
      expect(db.count('user_roles')).toBe(db.count('profiles'))
      expect(fetchStub).not.toHaveBeenCalled()
      expect(ctx.navigateTo).not.toHaveBeenCalled()
    }

    it('« Réessayer » en cours : l\'onMounted de la page ne s\'exécute pas (aucune lecture métier, aucun navigateTo)', async () => {
      await mountGatedDashboard()
      db.hold()
      await retryButton().trigger('click')
      await flushPromises()
      await wait(100) // laisse partir un onMounted éventuel

      expect(errorBlock().exists()).toBe(true)
      expectDashboardUntouched()
    })

    it('« Réessayer » en cours, lecture finalement en échec : le message reste, aucune lecture métier, jamais de renvoi vers « / »', async () => {
      await mountGatedDashboard()
      const release = db.hold()
      await retryButton().trigger('click')
      await flushPromises()
      release() // db.fail reste vrai : réseau toujours coupé
      await flushPromises()
      await wait(100)

      expect(errorBlock().exists()).toBe(true)
      expectDashboardUntouched()
    })

    it('lecture lancée par ensureProfile() (auth-sync) après une erreur : l\'onMounted de la page ne s\'exécute pas', async () => {
      await mountGatedDashboard()
      db.hold()
      void useAuth().ensureProfile()
      await flushPromises()
      await wait(100)

      expect(errorBlock().exists()).toBe(true)
      expectDashboardUntouched()
    })
  })

  describe('garde-fou : sans erreur préalable, une lecture en cours n\'affiche pas de bloc d\'erreur', () => {
    it('premier chargement (loading, aucune erreur avant) : pas de bloc d\'erreur', async () => {
      loginAs('adherent')
      const release = db.hold()
      void useAuth().ensureProfile()
      await flushPromises()
      expect(useAuth().authStatus.value).toBe('loading')
      await mountGate()

      expect(errorBlock().exists()).toBe(false)
      release()
      await flushPromises()
    })
  })

  describe('auth-sync réel : combien de lectures pour un premier chargement en échec ?', () => {
    // Critère de la spec : « exactement 2 lectures du profil pour une navigation ». On branche le VRAI plugin auth-sync.client
    // (watcher sur useSupabaseUser) et on rejoue l'accès direct : useSupabaseUser() vide au départ, session présente.
    let scope: ReturnType<typeof effectScope> | undefined
    const timers: Array<ReturnType<typeof setTimeout>> = []
    afterEach(() => { scope?.stop(); scope = undefined; timers.splice(0).forEach(clearTimeout) })
    function startAuthSync() {
      const nuxtApp = useNuxtApp() as any
      scope = effectScope()
      scope.run(() => nuxtApp.runWithContext(() => (authSyncPlugin as any)(nuxtApp)))
    }
    function sessionAppearsAfter(userDelay: number, sessionDelay: number, id = 'admin') {
      const session = { user: { id, email: `${id}@test.fr` }, access_token: 'jeton-simule' }
      getSession.mockImplementation(async () => {
        await wait(sessionDelay)
        return { data: { session }, error: null }
      })
      timers.push(setTimeout(() => { user.value = { id, email: `${id}@test.fr` } }, userDelay))
    }

    it('utilisateur et session livrés ensemble : exactement 2 lectures du profil, état error, aucune redirection', async () => {
      startAuthSync()
      db.fail = true
      sessionAppearsAfter(30, 30)
      await navigate('/admin/dashboard')
      await wait(150) // laisse agir le watcher d'auth-sync

      expect(redirects()).toEqual([])
      expect(useAuth().authStatus.value).toBe('error')
      expect(db.count('profiles')).toBe(2)
    })

    it('utilisateur livré APRÈS les deux échecs (watcher d\'auth-sync tardif) : toujours 2 lectures, la porte n\'est pas contournée', async () => {
      startAuthSync()
      db.fail = true
      sessionAppearsAfter(120, 10)
      await navigate('/admin/dashboard')
      await wait(250)

      expect(redirects()).not.toContain('/login')
      expect(db.count('profiles')).toBeLessThanOrEqual(2)
    })
  })
})

describe('2 — important : « Se déconnecter » reste une issue quand le réseau est coupé', () => {
  const logoutButton = () => wrapper.find(sel('auth-profile-logout'))
  const initialSignOuts = () => signOut.mock.calls.filter(c => c[0]?.scope !== 'local')
  const localSignOuts = () => signOut.mock.calls.filter(c => c[0]?.scope === 'local')
  const failing = (failure: 'throw' | 'error') => async () => {
    if (failure === 'throw') throw new TypeError('Failed to fetch (simulé)')
    return { error: { message: 'Failed to fetch (simulé)', status: 0 } }
  }

  // Session « sb-* » comme la laisse le vrai client : jeton, chunks .0/.1 (localStorage et cookies) et clés étrangères.
  const SB_KEYS = ['sb-test-auth-token', 'sb-test-auth-token.0', 'sb-test-auth-token.1', 'sb-test-auth-token-code-verifier']
  const OTHER_KEYS = { 'theme': 'clair', 'nuxt-color-mode': 'light', 'xsb-pas-supabase': '1' }
  const sbKeysLeft = () => Object.keys(localStorage).filter(k => k.startsWith('sb-'))
  const cookieNames = () => document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(Boolean)
  function seedSession() {
    for (const k of SB_KEYS) localStorage.setItem(k, 'jeton-simule')
    for (const [k, v] of Object.entries(OTHER_KEYS)) localStorage.setItem(k, v)
    for (const k of ['sb-test-auth-token', 'sb-test-auth-token.0', 'sb-test-auth-token.1']) document.cookie = `${k}=jeton; path=/`
    document.cookie = 'cookie-etranger=1; path=/'
  }
  function wipeStorage() {
    localStorage.clear()
    for (const name of cookieNames()) document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
  const expectPurged = () => {
    expect(sbKeysLeft()).toEqual([])
    expect(cookieNames().filter(n => n.startsWith('sb-'))).toEqual([])
    for (const [k, v] of Object.entries(OTHER_KEYS)) expect(localStorage.getItem(k)).toBe(v) // seules les clés sb-* sont touchées
    expect(cookieNames()).toContain('cookie-etranger')
  }

  beforeEach(async () => {
    wipeStorage()
    seedSession()
    // Le vrai client lit sa session dans le stockage : sans clé sb-*, plus de session au prochain chargement.
    getSession.mockReset().mockImplementation(async () => localStorage.getItem('sb-test-auth-token')
      ? { data: { session: { user: { id: 'adherent', email: 'adherent@test.fr' } } }, error: null }
      : { data: { session: null }, error: null })
    await reachError('adherent', '/profil')
    await mountGate()
  })
  afterEach(() => { wipeStorage() })

  describe('les deux signOut échouent (réseau coupé : le repli « local » appelle lui aussi /auth/v1/logout)', () => {
    const bothFail = (failure: 'throw' | 'error') => signOut.mockReset().mockImplementation(failing(failure))

    it.each([
      ['signOut lève une exception', 'throw' as const],
      ['signOut renvoie { error }', 'error' as const],
    ])('%s : clés et cookies sb-* purgés (chunks compris), user à null, état idle, /login en rechargement complet', async (_label, failure) => {
      bothFail(failure)
      await logoutButton().trigger('click')
      await flushPromises()

      expect(initialSignOuts()).toHaveLength(1)
      expect(localSignOuts()).toHaveLength(1)
      expectPurged()
      expect(user.value).toBeNull()
      expect(useAuth().authStatus.value).toBe('idle')
      expect(useAuth().profile.value).toBeNull()
      const toLogin = ctx.navigateTo.mock.calls.filter(c => c[0] === '/login')
      expect(toLogin).toHaveLength(1)
      expect(toLogin[0][1]?.external).toBe(true) // rechargement complet : le client Supabase perd sa session en mémoire
    })

    it('ensuite, une page connectée se comporte comme pour un visiteur : /login avec le retour prévu, aucune lecture', async () => {
      bothFail('throw')
      await logoutButton().trigger('click')
      await flushPromises()
      ctx.navigateTo.mockClear()
      db.reads.length = 0

      await navigate('/profil')
      const call = ctx.navigateTo.mock.calls[0]
      expect(call?.[0]).toBe('/login')
      expect(call?.[1]?.query?.redirect).toBe('/profil')
      expect(db.reads).toEqual([])
    })
  })

  describe('la purge locale elle-même échoue', () => {
    it.each([
      ['signOut lève une exception', 'throw' as const],
      ['signOut renvoie { error }', 'error' as const],
    ])('%s : aucune navigation vers /login, la session reste, le bloc reste avec un message, aucune exception', async (_label, failure) => {
      signOut.mockReset().mockImplementation(failing(failure))
      const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('stockage inaccessible (simulé)') })
      const textBefore = errorBlock().text()
      try {
        await logoutButton().trigger('click')
        await flushPromises()
        expect(removeItem).toHaveBeenCalled() // la purge a bien été tentée (et c'est elle qui échoue)
      }
      finally {
        removeItem.mockRestore()
      }

      expect(redirects()).not.toContain('/login')
      expect(user.value).not.toBeNull() // la session est toujours là
      expect(errorBlock().exists()).toBe(true)
      expect(errorBlock().text()).not.toBe(textBefore) // un message explique l'échec de la déconnexion
    })
  })

  describe('inchangé : pas de purge manuelle quand la déconnexion aboutit', () => {
    it.each([
      ['signOut lève une exception', 'throw' as const],
      ['signOut renvoie { error }', 'error' as const],
    ])('%s, repli local réussi : user à null, /login, aucune clé touchée à la main', async (_label, failure) => {
      signOut.mockReset().mockImplementation(async (options?: { scope?: string }) => {
        if (options?.scope === 'local') { user.value = null; return { error: null } }
        return failing(failure)()
      })
      const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
      try {
        await logoutButton().trigger('click')
        await flushPromises()
        expect(removeItem).not.toHaveBeenCalled()
      }
      finally {
        removeItem.mockRestore()
      }

      expect(localSignOuts()).toHaveLength(1)
      expect(sbKeysLeft()).toEqual(SB_KEYS) // le faux client n'a rien retiré, la porte non plus
      expect(user.value).toBeNull()
      expect(useAuth().authStatus.value).toBe('idle')
      expect(redirects()).toContain('/login')
    })

    it('cas nominal : signOut réussit, un seul appel, aucune purge manuelle, /login, état visiteur', async () => {
      const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
      try {
        await logoutButton().trigger('click')
        await flushPromises()
        expect(removeItem).not.toHaveBeenCalled()
      }
      finally {
        removeItem.mockRestore()
      }

      expect(signOut).toHaveBeenCalledTimes(1)
      expect(sbKeysLeft()).toEqual(SB_KEYS)
      expect(user.value).toBeNull()
      expect(redirects()).toContain('/login')
      expect(useAuth().authStatus.value).toBe('idle')
    })
  })

  it('double clic : un seul signOut initial, une seule redirection vers /login', async () => {
    let finish!: () => void
    const pending = new Promise<void>((resolve) => { finish = resolve })
    signOut.mockReset().mockImplementation(async () => { await pending; user.value = null; return { error: null } })

    const button = logoutButton()
    await button.trigger('click')
    await button.trigger('click')
    await flushPromises()
    finish()
    await flushPromises()

    expect(initialSignOuts()).toHaveLength(1)
    expect(redirects().filter(to => to === '/login')).toHaveLength(1)
  })
})
