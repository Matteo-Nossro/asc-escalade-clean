// R2b-T0 auth-profils — R2b-4 (/callback) : plus d'attente fixe de 500 ms ; la page réagit à l'arrivée de la session
// (useSupabaseUser, observé par un watch), avec un délai maximal de 3 s.
//   - utilisateur présent au montage => redirection immédiate ;
//   - session qui arrive tard (après 500 ms, avant 3 s) => flux d'un utilisateur connecté, JAMAIS callback-email-confirmed ;
//   - rien à 3 s => comportement sans session (callback-email-confirmed si type=signup, sinon /login) ;
//   - erreur dans l'URL => écran d'erreur sans attente ; démontage => watch et délai nettoyés.
// VRAI useAuth, Supabase simulé. Faux timers (setTimeout/clearTimeout/setInterval/clearInterval seulement : les microtâches restent réelles).
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
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: CallbackPage } = await import('~/pages/callback.vue')

const db = createAuthDb({
  profiles: {
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
    membre: profileOf('membre'),
    adherent: profileOf('adherent'),
  },
  roles: { nouveau: [], membre: ['admin'], adherent: ['parent'] },
})

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
  h.route.query = {}
  h.route.hash = ''
  window.location.hash = ''
  h.navigateTo.mockReset()
})
afterEach(async () => {
  db.releaseAll()
  wrapper?.unmount()
  wrapper = undefined
  await flushPromises()
  vi.useRealTimers()
})

/** Laisse passer `ms` de temps simulé (microtâches comprises). */
async function elapse(ms: number) {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
async function mountPage() {
  wrapper = await mountSuspended(CallbackPage)
  await elapse(0)
}
const destinations = () => h.navigateTo.mock.calls.map(c => c[0])

describe('R2b-4 — utilisateur déjà présent au montage : redirection sans attendre', () => {
  it('profil complété (adhérent) : /profil sans aucun écoulement de temps', async () => {
    user.value = ADHERENT
    await mountPage()
    expect(destinations()).toEqual(['/profil'])
  })

  it('type=signup + profil incomplet : /completer-profil sans attente, sans callback-email-confirmed', async () => {
    user.value = NOUVEAU
    h.route.query = { type: 'signup' }
    await mountPage()
    expect(destinations()).toEqual(['/completer-profil'])
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
  })

  it('type=recovery : /profil?resetPassword=true sans attente', async () => {
    user.value = ADHERENT
    h.route.query = { type: 'recovery' }
    await mountPage()
    expect(destinations()).toEqual(['/profil?resetPassword=true'])
  })
})

describe('R2b-4 — session qui arrive tard (après 500 ms, avant 3 s)', () => {
  it('type=signup + profil incomplet : /completer-profil, callback-email-confirmed jamais affiché', async () => {
    h.route.query = { type: 'signup' }
    await mountPage()
    await elapse(1500)
    // la session n'est pas encore là : on attend, on n'affiche pas « adresse confirmée » et on ne redirige pas
    expect(wrapper.find(sel('callback-email-confirmed')).exists(), 'callback-email-confirmed affiché trop tôt (avant 3 s)').toBe(false)
    expect(h.navigateTo).not.toHaveBeenCalled()

    user.value = NOUVEAU // la session arrive à 1 500 ms
    await elapse(0)
    await vi.waitFor(() => expect(destinations()).toEqual(['/completer-profil']), { timeout: 1000 })
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
    await elapse(3500) // le délai de 3 s ne doit plus rien changer ensuite
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
    expect(destinations()).toEqual(['/completer-profil'])
  })

  it('sans type, adhérent : /profil (et pas /login)', async () => {
    await mountPage()
    await elapse(1500)
    expect(h.navigateTo).not.toHaveBeenCalled()
    user.value = ADHERENT
    await elapse(0)
    await vi.waitFor(() => expect(destinations()).toEqual(['/profil']), { timeout: 1000 })
    await elapse(3500)
    expect(destinations()).toEqual(['/profil'])
  })

  it('type=recovery : /profil?resetPassword=true', async () => {
    h.route.query = { type: 'recovery' }
    await mountPage()
    await elapse(1500)
    expect(h.navigateTo).not.toHaveBeenCalled()
    user.value = NOUVEAU
    await elapse(0)
    await vi.waitFor(() => expect(destinations()).toEqual(['/profil?resetPassword=true']), { timeout: 1000 })
  })

  it('admin, profil complété : /admin/dashboard', async () => {
    await mountPage()
    await elapse(1500)
    user.value = { id: 'membre', email: 'membre@test.fr' }
    await elapse(0)
    await vi.waitFor(() => expect(destinations()).toEqual(['/admin/dashboard']), { timeout: 1000 })
  })
})

describe('R2b-4 — aucune session à 3 s : comportement sans session', () => {
  it('type=signup : callback-email-confirmed apparaît (pas avant l\'attente), sans redirection', async () => {
    h.route.query = { type: 'signup' }
    await mountPage()
    await elapse(1400)
    expect(wrapper.find(sel('callback-email-confirmed')).exists(), 'callback-email-confirmed affiché avant le délai de 3 s').toBe(false)
    await elapse(1700) // 3 100 ms au total
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(true)
    expect(wrapper.find(sel('btn-callback-login')).exists()).toBe(true)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('sans type : redirection vers /login, pas avant l\'attente', async () => {
    await mountPage()
    await elapse(1400)
    expect(h.navigateTo).not.toHaveBeenCalled()
    await elapse(1700)
    expect(destinations()).toEqual(['/login'])
  })
})

describe('R2b-4 — erreur dans l\'URL : aucune attente', () => {
  it('otp_expired : callback-link-error dès le montage, sans écoulement de temps', async () => {
    h.route.query = { error: 'access_denied', error_code: 'otp_expired' }
    await mountPage()
    expect(wrapper.find(sel('callback-link-error')).exists()).toBe(true)
    await elapse(3500)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('autre erreur : callback-auth-error dès le montage, sans écoulement de temps', async () => {
    h.route.query = { error: 'access_denied', error_code: 'bad_oauth_state' }
    await mountPage()
    expect(wrapper.find(sel('callback-auth-error')).exists()).toBe(true)
    await elapse(3500)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })
})

describe('R2b-4 — démontage : watch et délai nettoyés', () => {
  it('page quittée avant la fin du délai : ni redirection vers /login, ni réaction à une session tardive', async () => {
    await mountPage()
    await elapse(1000)
    wrapper.unmount()
    wrapper = undefined
    await elapse(3500)
    expect(h.navigateTo).not.toHaveBeenCalled()
    user.value = ADHERENT
    await elapse(0)
    await elapse(500)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })
})
