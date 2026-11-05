// auth-erreur-profil, T0 — TÉMOIN du test de coquille /admin (tests/pages/admin.error-shell.test.ts).
// Prouve que les valeurs semées sont bien visibles quand la vraie page /admin/dashboard est montée avec un admin dont
// le profil est lu : sans ce témoin, « la coquille ne contient aucune donnée » pourrait être vrai pour une mauvaise raison
// (page qui ne rend rien dans le test). Aucun code applicatif nouveau : ce test est vert avant implémentation.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'
import { SEED, makeFetchStub, serveBusinessTablesEmpty } from '../utils/admin-seed'

const h = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { path: '/admin/dashboard', fullPath: '/admin/dashboard', query: {}, hash: '', params: {}, meta: {}, matched: [] as any[], name: 'admin-dashboard' } as any,
}))
mockNuxtImport('navigateTo', () => h.navigateTo)
mockNuxtImport('useRoute', () => () => h.route)

const { client, from, user } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: Dashboard } = await import('~/pages/admin/dashboard.vue')

const db = createAuthDb({
  profiles: { admin: profileOf('admin', { full_name: SEED.profileName, email: SEED.profileEmail }) },
  roles: { admin: ['admin'] },
})

let wrapper: any
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.failTables = []
  db.reads.length = 0
  serveAuth(from, db)
  serveBusinessTablesEmpty(from, db)
  user.value = null
  h.navigateTo.mockReset()
  vi.stubGlobal('fetch', makeFetchStub())
})
afterEach(async () => {
  db.releaseAll()
  await flushPromises()
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
})

describe('témoin — la vraie page /admin/dashboard montée avec un admin affiche bien les valeurs semées', () => {
  it('après le montage : le nom et l\'e-mail du membre semé apparaissent dans la liste, et la page a lancé ses lectures', async () => {
    user.value = { id: 'admin', email: SEED.profileEmail }
    wrapper = await mountSuspended(Dashboard)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Seedmembre'), { timeout: 3000 })
    expect(wrapper.text()).toContain(`${SEED.memberFirst} ${SEED.memberLast}`)
    expect(global.fetch).toHaveBeenCalled()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })
})
