// auth-erreur-profil (après implémentation) — la porte est réellement branchée dans app/app.vue autour de <NuxtPage />.
// On monte le VRAI app.vue (vraie porte AuthPageGate, vrai useAuth, vrai middleware) ; seuls Supabase, la route et les
// composants lourds hors sujet (en-tête, pied de page, NuxtPage remplacé par une sonde) sont simulés.
// Si quelqu'un retire <AuthPageGate> d'app.vue ou sort <NuxtPage /> de la porte, ces tests rougissent.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createSupabaseMock } from '../../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../../utils/auth-fake'

const ctx = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { path: '/profil', fullPath: '/profil', query: {}, hash: '', params: {}, meta: {}, matched: [] as any[], name: 'profil' } as any,
}))
mockNuxtImport('navigateTo', () => ctx.navigateTo)
mockNuxtImport('useRoute', () => () => ctx.route)
// app.vue règle le mode de couleur : on évite le plugin @nuxtjs/color-mode, sans rapport avec la porte
mockNuxtImport('useColorMode', () => () => ({ preference: 'system', value: 'light' }))

const { client, from, user } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: App } = await import('~/app.vue')
const { default: middleware } = await import('~/middleware/auth.global')
const { useAuth } = await import('~/composables/useAuth')

const NAME = 'Gwendoline Seedprofil'
const db = createAuthDb({
  profiles: { adherent: profileOf('adherent', { full_name: NAME }) },
  roles: { adherent: ['parent'] },
})

// Remplace <NuxtPage /> : lit le profil du vrai useAuth, comme /profil.
const PageProbe = defineComponent({
  setup() {
    const { profile } = useAuth()
    return () => h('div', { 'data-testid': 'page-content' }, `PAGE ${profile.value?.full_name ?? ''}`)
  },
})
const passthrough = (tag = 'div') => defineComponent({ setup: (_p, { slots }) => () => h(tag, slots.default?.()) })
const stubs = {
  NuxtPage: PageProbe,
  LayoutHeader: { template: '<header data-testid="stub-header" />' },
  LayoutFooter: { template: '<footer data-testid="stub-footer" />' },
  UApp: passthrough(),
  UMain: passthrough('main'),
}

const route = (path: string) => ({ path, fullPath: path, query: {}, params: {}, meta: {}, matched: [], name: undefined, hash: '' }) as any
const sel = (id: string) => `[data-testid="${id}"]`
async function navigate(path: string) {
  ctx.route.path = path
  ctx.route.fullPath = path
  await (middleware as any)(route(path), route('/'))
  await flushPromises()
}

let wrapper: any
async function mountApp() {
  wrapper = await mountSuspended(App, { global: { stubs } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.failTables = []
  db.failNext = 0
  db.reads.length = 0
  serveAuth(from, db)
  user.value = { id: 'adherent', email: 'adherent@test.fr' }
  ctx.navigateTo.mockReset().mockImplementation((to: string) => ({ redirectedTo: to }))
  ctx.route.path = '/profil'
  ctx.route.fullPath = '/profil'
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
  wrapper?.unmount()
  wrapper = undefined
})

describe('app.vue — la porte enveloppe <NuxtPage />', () => {
  it('le gabarit d\'app.vue place <NuxtPage /> à l\'intérieur de <AuthPageGate>', () => {
    const src = readFileSync(resolve(__dirname, '../../../app/app.vue'), 'utf8')
    expect(src).toMatch(/<AuthPageGate>\s*<NuxtPage\s*\/>\s*<\/AuthPageGate>/)
  })

  it('profil en échec sur une page connectée : le bloc d\'erreur remplace la page, en-tête et pied de page restent', async () => {
    db.fail = true
    await navigate('/profil')
    expect(db.count('profiles')).toBe(2)
    await mountApp()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(true)
    expect(wrapper.find(sel('page-content')).exists()).toBe(false)
    expect(wrapper.html()).not.toContain('Seedprofil')
    expect(wrapper.find(sel('stub-header')).exists()).toBe(true)
    expect(wrapper.find(sel('stub-footer')).exists()).toBe(true)
    expect(ctx.navigateTo).not.toHaveBeenCalled()
  })

  it('même chose sur /admin/dashboard : aucune redirection, page non rendue', async () => {
    db.fail = true
    await navigate('/admin/dashboard')
    await mountApp()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(true)
    expect(wrapper.find(sel('page-content')).exists()).toBe(false)
    expect(ctx.navigateTo).not.toHaveBeenCalled()
  })

  it('« Réessayer » depuis app.vue : succès => la page s\'affiche, même URL, sans redirection', async () => {
    db.fail = true
    await navigate('/profil')
    await mountApp()
    db.fail = false
    const retry = wrapper.find(sel('auth-profile-error')).findAll('button').find((b: any) => b.text().includes('Réessayer'))
    await retry.trigger('click')
    await flushPromises()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
    expect(wrapper.text()).toContain(NAME)
    expect(ctx.route.path).toBe('/profil')
    expect(ctx.navigateTo).not.toHaveBeenCalled()
  })

  it('profil lu normalement : la page s\'affiche, pas de bloc', async () => {
    await navigate('/profil')
    await mountApp()
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
  })

  it('page publique avec profil en échec : la page s\'affiche (la porte ne touche pas aux pages publiques)', async () => {
    db.fail = true
    await navigate('/profil')
    ctx.route.path = '/tarifs'
    await mountApp()
    expect(useAuth().authStatus.value).toBe('error')
    expect(wrapper.find(sel('auth-profile-error')).exists()).toBe(false)
    expect(wrapper.find(sel('page-content')).exists()).toBe(true)
  })
})
