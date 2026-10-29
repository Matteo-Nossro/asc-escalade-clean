// Ajouté après les tests manuels (2026-10-28) : avec le compte admin, aucune action n'apparaissait.
// Cause : useAuth() ne partage pas ses rôles entre appels, et le composant ne les chargeait jamais.
// Ici le VRAI useAuth est utilisé, seul Supabase est simulé : les rôles doivent arriver jusqu'au composant
// depuis user_roles. (HelloAssoConfig.test.ts remplace useAuth par un faux et ne pouvait pas le voir.)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../../utils/supabase-mock'

const { client, from, user } = createSupabaseMock({ withAuth: true, user: { id: 'u-fictif', email: 'compte@example.com' } })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: HelloAssoConfig } = await import('~/components/admin/HelloAssoConfig.vue')

const FORMS = [
  { id: 'f1', form_slug: 'adhesion-2026', form_type: 'Membership', label: 'Adhésion 2026-2027', active: true, season: '2026-2027' },
]
const PROFILE = { id: 'u-fictif', full_name: 'Compte Fictif' }

/** Supabase simulé : profil + rôles lus dans user_roles (la réponse des rôles peut être retardée). */
function serveRoles(rolesResponse: Promise<{ data: any; error: any }>) {
  from.mockReset().mockImplementation((table: string) => {
    if (table === 'profiles') {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: PROFILE, error: null }) }) }) }
    }
    if (table === 'user_roles') {
      return { select: () => ({ eq: () => rolesResponse }) }
    }
    throw new Error(`table inattendue : ${table}`)
  })
}
const withRoles = (codes: string[]) => serveRoles(Promise.resolve({ data: codes.map(role_code => ({ role_code })), error: null }))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (input: any) => {
    const body = String(input) === '/api/admin/helloasso-forms' ? FORMS : {}
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }))
})
afterEach(() => {
  vi.unstubAllGlobals()
})

async function mountComponent() {
  const wrapper = await mountSuspended(HelloAssoConfig)
  await flushPromises()
  return wrapper
}
const hasButton = (wrapper: any, text: string) => wrapper.findAll('button').some((b: any) => b.text().includes(text))
const ADMIN_ACTIONS = ['Tester la connexion', 'Synchroniser maintenant', 'Ajouter']

describe('HelloAssoConfig — rôles chargés par le vrai useAuth (Supabase simulé)', () => {
  it('admin : les actions sont visibles (tester, synchroniser, ajouter, activer)', async () => {
    withRoles(['admin'])
    const wrapper = await mountComponent()
    for (const action of ADMIN_ACTIONS) expect(hasButton(wrapper, action), action).toBe(true)
    expect(wrapper.text()).toContain('Ajouter un formulaire')
    expect(wrapper.findAll('[role="switch"]').length).toBe(FORMS.length)
    expect(from).toHaveBeenCalledWith('user_roles')
  })

  it('secrétaire : les actions sont masquées, la liste reste visible', async () => {
    withRoles(['secretary'])
    const wrapper = await mountComponent()
    for (const action of ADMIN_ACTIONS) expect(hasButton(wrapper, action), action).toBe(false)
    expect(wrapper.text()).not.toContain('Ajouter un formulaire')
    expect(wrapper.findAll('[role="switch"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('Adhésion 2026-2027')
  })

  it('admin, rôles pas encore chargés : actions masquées, puis visibles une fois les rôles arrivés', async () => {
    let release!: (v: { data: any; error: any }) => void
    serveRoles(new Promise(r => { release = r }))
    const wrapper = await mountComponent()
    expect(hasButton(wrapper, 'Tester la connexion')).toBe(false)

    release({ data: [{ role_code: 'admin' }], error: null })
    await flushPromises()
    expect(hasButton(wrapper, 'Tester la connexion')).toBe(true)
  })

  it('lecture des rôles en échec : actions masquées (fermé par défaut)', async () => {
    serveRoles(Promise.resolve({ data: null, error: { message: 'refus' } }))
    const wrapper = await mountComponent()
    for (const action of ADMIN_ACTIONS) expect(hasButton(wrapper, action), action).toBe(false)
  })
})
