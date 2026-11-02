// R2-T0a auth-profils — R2-c (lien d'e-mail invalide) et R2-d (confirmation réussie sans session) sur la page /callback.
// VRAI useAuth, Supabase simulé (client.auth.resend inclus). `navigateTo` et `useRoute` simulés. Sans session, la page
// attend jusqu'à 3 s (R2b-4, ex-500 ms fixes) : on attend avec vi.waitFor et on laisse passer un délai réel avant de
// vérifier « aucune redirection ». Adapté en R2b-T0 : timeout de mountAndWaitFor porté à 4500 ms ; le cas `error` seul
// n'est plus un « lien invalide » (R2b-3 : callback-auth-error).
//
// L'erreur est lue dans la query ET dans le hash : le hash est fourni à la fois par `useRoute().hash` et par
// `window.location.hash`, pour ne pas imposer à l'implémentation l'une ou l'autre source (voir compte rendu).
// Les tests de non-régression du flux avec session sont dans tests/pages/callback.test.ts (non modifié).
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

const db = createAuthDb({
  profiles: {
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
    membre: profileOf('membre'),
    adherent: profileOf('adherent'),
  },
  roles: { nouveau: [], membre: ['admin'], adherent: ['parent'] },
})

const ERR = { error: 'access_denied', error_code: 'otp_expired', error_description: 'Email link is invalid or has expired' }
const ERR_HASH = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
const REDIRECT = () => `${window.location.origin}/callback?type=signup`

const sel = (id: string) => `[data-testid="${id}"]`
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

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
  return wrapper
}
/** Monte la page et attend qu'un élément de test apparaisse (échec = fonctionnalité absente). */
async function mountAndWaitFor(testId: string) {
  await mountPage()
  await vi.waitFor(() => expect(wrapper.find(sel(testId)).exists(), `${testId} absent de la page`).toBe(true), { timeout: 4500 })
}
/** Champ de saisie : data-testid porté soit par l'<input>, soit par son conteneur. */
function inputOf(testId: string) {
  const el = wrapper.find(sel(testId))
  return el.element.tagName === 'INPUT' ? el : el.find('input')
}
async function submitResend(email: string) {
  await inputOf('input-resend-email').setValue(email)
  await wrapper.find(sel('btn-resend-confirmation')).trigger('click')
  await flushPromises()
}

describe('R2-c — lien invalide : erreur dans la query', () => {
  beforeEach(() => { h.route.query = { ...ERR } })

  it('affiche callback-link-error (« n\'est plus valide »), sans aucune redirection', async () => {
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('callback-link-error')).text()).toContain("n'est plus valide")
    await wait(900) // marge pour une éventuelle redirection asynchrone (plus de délai fixe depuis R2b-4)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('propose « Se connecter » (btn-callback-login) vers /login', async () => {
    await mountAndWaitFor('callback-link-error')
    const login = wrapper.find(sel('btn-callback-login'))
    expect(login.exists()).toBe(true)
    expect(login.attributes('href')).toMatch(/^\/login/)
  })

  it('le seul paramètre `error` (sans error_code) suffit à afficher un écran d\'erreur (R2b-3 : callback-auth-error), sans redirection', async () => {
    h.route.query = { error: 'access_denied' }
    await mountAndWaitFor('callback-auth-error')
    await wait(900)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('le seul paramètre `error_code` (sans error) suffit à afficher l\'erreur', async () => {
    h.route.query = { error_code: 'otp_expired' }
    await mountAndWaitFor('callback-link-error')
  })

  it('même avec type=signup dans la query : lien invalide, pas « adresse confirmée »', async () => {
    h.route.query = { type: 'signup', ...ERR }
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
  })
})

describe('R2-c — lien invalide : erreur dans le hash (#error=…)', () => {
  beforeEach(() => { setHash(ERR_HASH) })

  it('affiche callback-link-error (« n\'est plus valide »), sans aucune redirection', async () => {
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('callback-link-error')).text()).toContain("n'est plus valide")
    await wait(900)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('propose « Se connecter » (btn-callback-login) vers /login', async () => {
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('btn-callback-login')).attributes('href')).toMatch(/^\/login/)
  })

  it('avec type=signup en query et l\'erreur dans le hash : lien invalide (le hash est lu avec la query)', async () => {
    h.route.query = { type: 'signup' }
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
    await wait(900)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })
})

describe('R2-c — formulaire de renvoi', () => {
  beforeEach(() => { h.route.query = { ...ERR } })

  it('champ input-resend-email et bouton btn-resend-confirmation présents', async () => {
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('input-resend-email')).exists()).toBe(true)
    expect(wrapper.find(sel('btn-resend-confirmation')).exists()).toBe(true)
    expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(false)
    expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(false)
  })

  it('résultat \'sent\' : auth.resend({ type: \'signup\', email, emailRedirectTo }) puis msg-resend-sent', async () => {
    await mountAndWaitFor('callback-link-error')
    await submitResend('camille@test.fr')
    await vi.waitFor(() => expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(true), { timeout: 2000 })
    expect(resend).toHaveBeenCalledWith({ type: 'signup', email: 'camille@test.fr', options: { emailRedirectTo: REDIRECT() } })
    expect(wrapper.find(sel('msg-resend-sent')).text()).toContain('Si une inscription non confirmée existe pour cette adresse')
    expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(false)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('résultat \'rate_limited\' : msg-resend-error contenant « patientez », pas de msg-resend-sent', async () => {
    resend.mockResolvedValue({ data: null, error: { message: 'email rate limit exceeded', status: 429 } })
    await mountAndWaitFor('callback-link-error')
    await submitResend('camille@test.fr')
    await vi.waitFor(() => expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(true), { timeout: 2000 })
    expect(wrapper.find(sel('msg-resend-error')).text().toLowerCase()).toContain('patientez')
    expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(false)
  })

  it('résultat \'error\' : msg-resend-error générique (sans « patientez »), pas de msg-resend-sent', async () => {
    resend.mockResolvedValue({ data: null, error: { message: 'Error sending confirmation email', status: 500 } })
    await mountAndWaitFor('callback-link-error')
    await submitResend('camille@test.fr')
    await vi.waitFor(() => expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(true), { timeout: 2000 })
    expect(wrapper.find(sel('msg-resend-error')).text().toLowerCase()).not.toContain('patientez')
    expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(false)
  })

  it('le formulaire est aussi proposé quand l\'erreur vient du hash', async () => {
    h.route.query = {}
    setHash(ERR_HASH)
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('input-resend-email')).exists()).toBe(true)
    expect(wrapper.find(sel('btn-resend-confirmation')).exists()).toBe(true)
  })
})

describe('R2-c — type=recovery : pas de formulaire de renvoi', () => {
  it('erreur en query + type=recovery : callback-link-error et btn-callback-login, sans formulaire', async () => {
    h.route.query = { type: 'recovery', ...ERR }
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('btn-callback-login')).exists()).toBe(true)
    expect(wrapper.find(sel('input-resend-email')).exists()).toBe(false)
    expect(wrapper.find(sel('btn-resend-confirmation')).exists()).toBe(false)
    await wait(900)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('erreur en hash + type=recovery en query : sans formulaire', async () => {
    h.route.query = { type: 'recovery' }
    setHash(ERR_HASH)
    await mountAndWaitFor('callback-link-error')
    expect(wrapper.find(sel('btn-callback-login')).exists()).toBe(true)
    expect(wrapper.find(sel('input-resend-email')).exists()).toBe(false)
    expect(wrapper.find(sel('btn-resend-confirmation')).exists()).toBe(false)
  })
})

describe('R2-d — type=signup, sans erreur, sans utilisateur', () => {
  beforeEach(() => { h.route.query = { type: 'signup' } })

  it('affiche callback-email-confirmed (« Adresse e-mail confirmée ») et btn-callback-login, sans rediriger vers /login', async () => {
    await mountAndWaitFor('callback-email-confirmed')
    expect(wrapper.find(sel('callback-email-confirmed')).text()).toContain('Adresse e-mail confirmée')
    expect(wrapper.find(sel('btn-callback-login')).attributes('href')).toMatch(/^\/login/)
    await wait(900)
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('n\'affiche ni message d\'erreur de lien ni formulaire de renvoi', async () => {
    await mountAndWaitFor('callback-email-confirmed')
    expect(wrapper.find(sel('callback-link-error')).exists()).toBe(false)
    expect(wrapper.find(sel('input-resend-email')).exists()).toBe(false)
    expect(wrapper.find(sel('btn-resend-confirmation')).exists()).toBe(false)
  })
})

describe('R2-d — flux avec session inchangé (type=signup)', () => {
  /** Monte la page et renvoie la première redirection. */
  async function landOn() {
    await mountPage()
    await vi.waitFor(() => expect(h.navigateTo).toHaveBeenCalled(), { timeout: 4000 })
    return h.navigateTo.mock.calls[0]![0] as string
  }
  beforeEach(() => { h.route.query = { type: 'signup' } })

  it('profil incomplet => /completer-profil, sans écran « adresse confirmée »', async () => {
    user.value = { id: 'nouveau', email: 'nouveau@test.fr' }
    expect(await landOn()).toBe('/completer-profil')
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
  })

  it('profil complété, admin => /admin/dashboard', async () => {
    user.value = { id: 'membre', email: 'membre@test.fr' }
    expect(await landOn()).toBe('/admin/dashboard')
  })

  it('profil complété, adhérent => /profil', async () => {
    user.value = { id: 'adherent', email: 'adherent@test.fr' }
    expect(await landOn()).toBe('/profil')
  })
})

describe('R2-d — sans type ni erreur ni session : /login inchangé', () => {
  it('redirige vers /login, sans écran « adresse confirmée » ni erreur de lien', async () => {
    h.route.query = {}
    await mountPage()
    await vi.waitFor(() => expect(h.navigateTo).toHaveBeenCalled(), { timeout: 4000 })
    expect(h.navigateTo.mock.calls[0]![0]).toBe('/login')
    expect(wrapper.find(sel('callback-email-confirmed')).exists()).toBe(false)
    expect(wrapper.find(sel('callback-link-error')).exists()).toBe(false)
  })
})
