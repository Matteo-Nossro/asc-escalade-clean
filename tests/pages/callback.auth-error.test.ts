// R2b-T0 auth-profils — R2b-3 (/callback) : callback-link-error (avec renvoi) est réservé à error_code=otp_expired.
// Toute autre erreur (refus OAuth, server_error sans error_code…) => callback-auth-error (« n'a pas abouti »),
// btn-callback-login, SANS formulaire de renvoi, SANS callback-link-error, SANS navigation. error_description jamais affiché.
// VRAI useAuth, Supabase simulé. L'erreur est lue dans la query ET dans le hash (route.hash et window.location.hash fournis).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { query: {} as Record<string, string>, hash: '', path: '/callback', fullPath: '/callback', params: {}, meta: {}, matched: [] as any[], name: 'callback' } as any,
}))
mockNuxtImport('navigateTo', () => h.navigateTo)
mockNuxtImport('useRoute', () => () => h.route)

const { client, from, user } = createSupabaseMock({ withAuth: true })
const resend = vi.fn()
client.auth.resend = resend
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: CallbackPage } = await import('~/pages/callback.vue')

const db = createAuthDb({ profiles: { adherent: profileOf('adherent') }, roles: { adherent: ['parent'] } })

const sel = (id: string) => `[data-testid="${id}"]`
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const DESCRIPTION = 'Description-technique-ne-pas-afficher'

/** Erreurs qui ne sont PAS un lien expiré : [libellé, query, hash]. */
const NOT_EXPIRED: Array<[string, Record<string, string>, string]> = [
  [
    'refus OAuth (access_denied / bad_oauth_state)',
    { error: 'access_denied', error_code: 'bad_oauth_state', error_description: DESCRIPTION },
    `#error=access_denied&error_code=bad_oauth_state&error_description=${DESCRIPTION}`,
  ],
  [
    'server_error sans error_code',
    { error: 'server_error', error_description: DESCRIPTION },
    `#error=server_error&error_description=${DESCRIPTION}`,
  ],
  [
    'error_code seul, autre que otp_expired',
    { error_code: 'unexpected_failure' },
    '#error_code=unexpected_failure',
  ],
]

let wrapper: any
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.route.query = {}
  h.route.hash = ''
  window.location.hash = ''
  h.navigateTo.mockReset()
  resend.mockReset().mockResolvedValue({ data: {}, error: null })
})
afterEach(async () => {
  db.releaseAll()
  wrapper?.unmount()
  wrapper = undefined
  window.location.hash = ''
  await flushPromises()
})

function setHash(hash: string) {
  h.route.hash = hash
  window.location.hash = hash
}
async function mountPage() {
  wrapper = await mountSuspended(CallbackPage)
}
async function mountAndWaitFor(testId: string) {
  await mountPage()
  await vi.waitFor(() => expect(wrapper.find(sel(testId)).exists(), `${testId} absent de la page`).toBe(true), { timeout: 1500 })
}
function expectAuthErrorScreen() {
  expect(wrapper.find(sel('callback-auth-error')).text()).toContain("n'a pas abouti")
  expect(wrapper.find(sel('btn-callback-login')).exists()).toBe(true)
  expect(wrapper.find(sel('btn-callback-login')).attributes('href')).toMatch(/^\/login/)
  expect(wrapper.find(sel('callback-link-error')).exists()).toBe(false)
  expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
  expect(wrapper.find(sel('input-resend-email')).exists()).toBe(false)
  expect(wrapper.find(sel('btn-resend-confirmation')).exists()).toBe(false)
  expect(wrapper.text()).not.toContain(DESCRIPTION)
}

describe.each(NOT_EXPIRED)('R2b-3 — %s', (_label, query, hash) => {
  it('dans la query : callback-auth-error + btn-callback-login, sans renvoi ni navigation', async () => {
    h.route.query = { ...query }
    await mountAndWaitFor('callback-auth-error')
    expectAuthErrorScreen()
    await wait(400)
    expect(h.navigateTo).not.toHaveBeenCalled()
    expect(resend).not.toHaveBeenCalled()
  })

  it('dans le hash : callback-auth-error + btn-callback-login, sans renvoi ni navigation', async () => {
    setHash(hash)
    await mountAndWaitFor('callback-auth-error')
    expectAuthErrorScreen()
    await wait(400)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('avec type=signup : toujours l\'écran d\'erreur, jamais « adresse confirmée »', async () => {
    h.route.query = { type: 'signup', ...query }
    await mountAndWaitFor('callback-auth-error')
    expectAuthErrorScreen()
  })

  it('avec type=recovery : écran d\'erreur sans renvoi', async () => {
    h.route.query = { type: 'recovery', ...query }
    await mountAndWaitFor('callback-auth-error')
    expectAuthErrorScreen()
  })

  it('même avec une session ouverte : pas de redirection', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    h.route.query = { ...query }
    await mountAndWaitFor('callback-auth-error')
    await wait(400)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })
})

describe('R2b-3 — otp_expired garde callback-link-error (avec renvoi)', () => {
  const EXPIRED = { error: 'access_denied', error_code: 'otp_expired', error_description: DESCRIPTION }

  it('dans la query : callback-link-error + formulaire de renvoi, pas callback-auth-error', async () => {
    h.route.query = { ...EXPIRED }
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(false)
    expect(wrapper.find(sel('input-resend-email')).exists()).toBe(true)
    expect(wrapper.find(sel('btn-resend-confirmation')).exists()).toBe(true)
    expect(wrapper.text()).not.toContain(DESCRIPTION)
  })

  it('dans le hash : callback-link-error, pas callback-auth-error', async () => {
    setHash(`#error=access_denied&error_code=otp_expired&error_description=${DESCRIPTION}`)
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(false)
  })

  it('otp_expired + type=recovery : callback-link-error sans formulaire de renvoi', async () => {
    h.route.query = { type: 'recovery', ...EXPIRED }
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(false)
    expect(wrapper.find(sel('input-resend-email')).exists()).toBe(false)
  })
})
