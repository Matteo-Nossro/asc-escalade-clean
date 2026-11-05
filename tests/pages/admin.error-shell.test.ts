// auth-erreur-profil, T0 — critère « la coquille de /admin rendue avant le montage ne contient aucune donnée » (décision 4).
//
// Ce test utilise les VRAIES pages app/pages/admin/dashboard.vue et blocs.vue, enveloppées par la VRAIE porte
// (app/components/auth/PageGate.vue), avec le VRAI useAuth et le VRAI middleware ; seul Supabase (et fetch) est simulé.
// Des valeurs reconnaissables sont semées (tests/utils/admin-seed.ts) : profil du compte, membre, e-mail, statistique HelloAsso.
// Le témoin tests/pages/admin.dashboard.seed-control.test.ts prouve que ces valeurs SONT visibles quand la page est montée
// avec un admin : l'absence constatée ici n'est donc pas un faux négatif.
//
// A. Avant montage : rendu serveur (vue/server-renderer, onMounted n'est jamais exécuté) = ce que le client hydrate en
//    premier. L'état d'auth est `error` (posé par le vrai middleware). Aucune donnée ne doit figurer dans le HTML.
//    blocs.vue est une page statique (exemples factices, aucune lecture) : son test ne peut échouer que si quelqu'un y
//    ajoute une lecture ; il est gardé pour couvrir « toutes les pages /admin rendues côté serveur ».
// B. Après montage (ce que l'utilisateur voit réellement) : le bloc d'erreur est affiché ET la page n'a lancé aucune
//    lecture de données métier ni redirection. dashboard.vue lance ses propres lectures dans onMounted : si la porte monte
//    la page avant de la bloquer, ces lectures partent (et, quand elles échouent, la page renvoie vers « / »).
//    Ces tests B sont plus stricts que le critère minimal ; ils traduisent « aucune redirection sur échec de lecture,
//    /admin compris » et « si possible, aucune lecture de données métier ».
// Rouge attendu avant T3 : le composant PageGate n'existe pas.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'
import { SEED, SEED_MARKERS, makeFetchStub, serveBusinessTablesEmpty } from '../utils/admin-seed'

const ctx = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { path: '/admin/dashboard', fullPath: '/admin/dashboard', query: {}, hash: '', params: {}, meta: {}, matched: [] as any[], name: 'admin' } as any,
}))
mockNuxtImport('navigateTo', () => ctx.navigateTo)
mockNuxtImport('useRoute', () => () => ctx.route)

const { client, from, user } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: PageGate } = await import('~/components/auth/PageGate.vue')
const { default: Dashboard } = await import('~/pages/admin/dashboard.vue')
const { default: Blocs } = await import('~/pages/admin/blocs.vue')
const { default: middleware } = await import('~/middleware/auth.global')
const { useAuth } = await import('~/composables/useAuth')

const db = createAuthDb({
  profiles: { admin: profileOf('admin', { full_name: SEED.profileName, email: SEED.profileEmail }) },
  roles: { admin: ['admin'] },
})

const route = (path: string) => ({ path, fullPath: path, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
const AUTH_TABLES = ['profiles', 'user_roles']
const businessReads = () => db.reads.filter(r => !AUTH_TABLES.includes(r.table)).map(r => r.table)
const KPI_AND_LIST_LABELS = ['Total membres', 'Licences actives', 'Places disponibles', 'Adhérents payés', 'Liste des membres']

/** L'admin est connecté, la lecture de son profil échoue (2 lectures par le vrai middleware) : état `error`. */
async function reachErrorState(path: string, failure: { fail?: boolean, failTables?: string[] }) {
  ctx.route.path = path
  ctx.route.fullPath = path
  user.value = { id: 'admin', email: SEED.profileEmail }
  db.fail = !!failure.fail
  db.failTables = failure.failTables ?? []
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
  expect(useAuth().authStatus.value).toBe('error')
  db.reads.length = 0 // la suite ne compte que ce que la porte et la page lancent
}

async function renderBeforeMount(page: any) {
  const app = createSSRApp({ render: () => h(PageGate, null, { default: () => h(page) }) })
  ;(app as any).$nuxt = useNuxtApp()
  return renderToString(app)
}

let wrapper: any
let fetchStub: ReturnType<typeof makeFetchStub>
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.failTables = []
  db.failNext = 0
  db.reads.length = 0
  serveAuth(from, db)
  serveBusinessTablesEmpty(from, db)
  user.value = null
  ctx.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
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

describe('A — coquille de /admin rendue avant le montage, lecture du profil en échec : aucune donnée', () => {
  it.each([
    ['dashboard', Dashboard, '/admin/dashboard'],
    ['blocs', Blocs, '/admin/blocs'],
  ])('page /admin/%s : le HTML rendu ne contient ni profil, ni liste de membres, ni statistique', async (_name, page, path) => {
    await reachErrorState(path, { failTables: ['profiles'] })
    const html = await renderBeforeMount(page)

    expect(html.trim().length).toBeGreaterThan(0) // la coquille existe (le test ne passe pas parce que rien n'est rendu)
    for (const marker of SEED_MARKERS) expect(html).not.toContain(marker)
    expect(html).not.toContain(String(SEED.paid))
    expect(html).not.toContain(String(SEED.total))
    for (const label of KPI_AND_LIST_LABELS) expect(html).not.toContain(label)
  })

  it.each([
    ['dashboard', Dashboard, '/admin/dashboard'],
    ['blocs', Blocs, '/admin/blocs'],
  ])('page /admin/%s : le rendu ne lance aucune lecture de données métier ni requête /api/admin, et ne redirige pas', async (_name, page, path) => {
    await reachErrorState(path, { failTables: ['profiles'] })
    await renderBeforeMount(page)
    await flushPromises()

    expect(businessReads()).toEqual([])
    expect(fetchStub).not.toHaveBeenCalled()
    expect(ctx.navigateTo).not.toHaveBeenCalled()
  })
})

describe.each([
  ['réseau coupé : toutes les lectures échouent', { fail: true }],
  ['seule la lecture du profil échoue (les rôles se lisent)', { failTables: ['profiles'] }],
])('B — /admin/dashboard après montage, %s', (_label, failure) => {
  async function mountGatedDashboard() {
    await reachErrorState('/admin/dashboard', failure)
    wrapper = await mountSuspended(PageGate, { slots: { default: () => h(Dashboard) } })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 100)) // laisse finir les lectures asynchrones d'un onMounted éventuel
    await flushPromises()
  }

  it('le message d\'erreur est affiché et la page ne montre aucune donnée', async () => {
    await mountGatedDashboard()
    expect(wrapper.find('[data-testid="auth-profile-error"]').exists()).toBe(true)
    const html = wrapper.html()
    for (const marker of SEED_MARKERS) expect(html).not.toContain(marker)
    for (const label of KPI_AND_LIST_LABELS) expect(html).not.toContain(label)
  })

  it('aucune redirection : la page /admin ne renvoie pas vers « / » ni vers /login sur un échec de lecture', async () => {
    await mountGatedDashboard()
    expect(ctx.navigateTo).not.toHaveBeenCalled()
  })

  it('aucune lecture de données métier ni requête /api/admin n\'est lancée par la page', async () => {
    await mountGatedDashboard()
    expect(businessReads()).toEqual([])
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('la page ne relit pas les rôles de son côté (user_roles) : seule la lecture de useAuth, déjà faite, existe', async () => {
    await mountGatedDashboard()
    expect(db.count('user_roles')).toBe(0)
  })
})
