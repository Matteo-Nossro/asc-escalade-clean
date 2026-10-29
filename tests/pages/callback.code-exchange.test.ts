// R2c-T0a auth-profils — R2c-2 : /callback avec `code` (PKCE) dans la query.
//   - une erreur dans l'URL reste prioritaire (R2b-3) : aucun échange ;
//   - sans erreur ni utilisateur au montage : `await getSession()`, puis, si toujours aucune session,
//     `exchangeCodeForSession(code)` UNE seule fois ; une erreur d'échange n'est jamais affichée et ne lève pas d'exception ;
//   - ensuite l'attente de session de R2b-4 s'applique (3 s) : flux connecté si la session arrive,
//     sinon callback-email-confirmed (type=signup) ou /login ;
//   - si getSession renvoie déjà une session, l'échange n'est pas appelé.
// VRAI useAuth, Supabase simulé (auth.getSession / auth.exchangeCodeForSession ajoutés par addCodeExchange).
// Quand une session « arrive », le test pose aussi useSupabaseUser, comme le module Supabase le ferait.
// Faux timers (setTimeout/clearTimeout/setInterval/clearInterval seulement : les microtâches restent réelles).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf, addCodeExchange } from '../utils/auth-fake'

const h = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { query: {} as Record<string, string>, hash: '', path: '/callback', fullPath: '/callback', params: {}, meta: {}, matched: [] as any[], name: 'callback' } as any,
}))
mockNuxtImport('navigateTo', () => h.navigateTo)
mockNuxtImport('useRoute', () => () => h.route)

const { client, from, user } = createSupabaseMock({ withAuth: true })
const { getSession, exchangeCodeForSession } = addCodeExchange(client)
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: CallbackPage } = await import('~/pages/callback.vue')

const db = createAuthDb({
  profiles: {
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
    adherent: profileOf('adherent'),
  },
  roles: { nouveau: [], adherent: ['parent'] },
})

const CODE = '0b9c7e2a-4d51-4f0e-9a3b-6c1d2e3f4a5b'
const sel = (id: string) => `[data-testid="${id}"]`
const NOUVEAU = { id: 'nouveau', email: 'nouveau@test.fr' }
const ADHERENT = { id: 'adherent', email: 'adherent@test.fr' }

let wrapper: any
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.route.query = { code: CODE }
  h.route.hash = ''
  window.location.hash = ''
  h.navigateTo.mockReset()
  getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null })
  exchangeCodeForSession.mockReset().mockResolvedValue({
    data: { session: null, user: null },
    error: { message: 'invalid flow state, no valid flow state found (simulé)' },
  })
})
afterEach(async () => {
  db.releaseAll()
  wrapper?.unmount()
  wrapper = undefined
  await flushPromises()
  vi.useRealTimers()
})

async function elapse(ms: number) {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
async function mountPage() {
  wrapper = await mountSuspended(CallbackPage)
  await elapse(0)
}
const destinations = () => h.navigateTo.mock.calls.map(c => c[0])

describe('R2c-2 — getSession renvoie déjà une session : pas d\'échange', () => {
  it('exchangeCodeForSession n\'est jamais appelé, flux connecté (/profil)', async () => {
    getSession.mockImplementation(async () => {
      user.value = ADHERENT // le client a fini l'échange automatique : la session est là
      return { data: { session: { user: ADHERENT } }, error: null }
    })
    await mountPage()
    await vi.waitFor(() => expect(destinations()).toEqual(['/profil']), { timeout: 1000 })
    await elapse(3500)
    expect(getSession).toHaveBeenCalled()
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(destinations()).toEqual(['/profil'])
  })
})

describe('R2c-2 — code sans session : un seul échange', () => {
  it('exchangeCodeForSession(code) est appelé exactement une fois (même après 3 s)', async () => {
    await mountPage()
    expect(getSession).toHaveBeenCalled()
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
    expect(exchangeCodeForSession).toHaveBeenCalledWith(CODE)
    await elapse(3500)
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
  })

  it('échange réussi + profil incomplet : /completer-profil, callback-email-confirmed jamais affiché', async () => {
    h.route.query = { code: CODE, type: 'signup' }
    exchangeCodeForSession.mockImplementation(async () => {
      user.value = NOUVEAU // le module Supabase pose l'utilisateur après l'échange
      return { data: { session: { user: NOUVEAU }, user: NOUVEAU }, error: null }
    })
    await mountPage()
    await vi.waitFor(() => expect(destinations()).toEqual(['/completer-profil']), { timeout: 1000 })
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
    await elapse(3500)
    expect(destinations()).toEqual(['/completer-profil'])
  })

  it('échange réussi, adhérent, sans type : /profil', async () => {
    exchangeCodeForSession.mockImplementation(async () => {
      user.value = ADHERENT
      return { data: { session: { user: ADHERENT }, user: ADHERENT }, error: null }
    })
    await mountPage()
    await vi.waitFor(() => expect(destinations()).toEqual(['/profil']), { timeout: 1000 })
  })
})

describe('R2c-2 — échange en erreur : jamais affiché, jamais d\'exception', () => {
  it('type=signup : callback-email-confirmed à 3 s (pas avant), sans erreur affichée, sans redirection', async () => {
    h.route.query = { code: CODE, type: 'signup' }
    await mountPage()
    await elapse(1400)
    expect(wrapper.find(sel('callback-email-confirmed')).exists(), 'callback-email-confirmed affiché avant 3 s').toBe(false)
    await elapse(1700)
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(true)
    expect(wrapper.find(sel('callback-link-error')).exists()).toBe(false)
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(false)
    expect(h.navigateTo).not.toHaveBeenCalled()
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
  })

  it('type=signup, échange qui rejette (exception) : même résultat, aucune exception remontée', async () => {
    h.route.query = { code: CODE, type: 'signup' }
    exchangeCodeForSession.mockRejectedValue(new Error('réseau (simulé)'))
    await mountPage()
    await elapse(3100)
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(true)
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(false)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('sans type : /login à 3 s (pas avant)', async () => {
    await mountPage()
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
    await elapse(1400)
    expect(h.navigateTo).not.toHaveBeenCalled()
    await elapse(1700)
    expect(destinations()).toEqual(['/login'])
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(false)
  })

  it('sans type, échange qui rejette : /login à 3 s, aucune exception remontée', async () => {
    exchangeCodeForSession.mockRejectedValue(new Error('réseau (simulé)'))
    await mountPage()
    await elapse(3100)
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
    expect(destinations()).toEqual(['/login'])
  })
})

describe('R2c-2 — une erreur dans l\'URL reste prioritaire', () => {
  it('code + error_code=otp_expired : callback-link-error, aucun échange', async () => {
    h.route.query = { code: CODE, error: 'access_denied', error_code: 'otp_expired' }
    await mountPage()
    expect(wrapper.find(sel('callback-link-error')).exists()).toBe(true)
    await elapse(3500)
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('code + autre error_code : callback-auth-error, aucun échange', async () => {
    h.route.query = { code: CODE, error: 'access_denied', error_code: 'bad_oauth_state' }
    await mountPage()
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(true)
    await elapse(3500)
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })
})

describe('R2c-2 — sans code : comportement R2b inchangé (garde-fou)', () => {
  it('aucun code : ni getSession ni échange, /login à 3 s', async () => {
    h.route.query = {}
    await mountPage()
    await elapse(3100)
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(destinations()).toEqual(['/login'])
  })

  it('code avec utilisateur déjà présent au montage : pas d\'échange, redirection immédiate', async () => {
    user.value = ADHERENT
    await mountPage()
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(destinations()).toEqual(['/profil'])
  })
})
