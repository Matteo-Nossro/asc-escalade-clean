// R2b-T0 auth-profils — R2b-1 (/login) : le bouton de renvoi valide l'e-mail saisi avant d'appeler Supabase.
// VRAI useAuth, Supabase simulé (auth.signInWithPassword / auth.resend). `navigateTo` et `useRoute` simulés.
// Parcours : échec « email_not_confirmed » (le bouton btn-login-resend apparaît), puis l'utilisateur vide ou abîme le
// champ e-mail et clique sur « Renvoyer ». Attendu : aucun appel à auth.resend et un message de champ
// (« L'adresse email est requise » / « Format d'email invalide »). Rouge attendu : l'appel part quand même.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'
import { createAuthDb, serveAuth, profileOf } from '../utils/auth-fake'

const h = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  route: { query: {} as Record<string, string>, hash: '', path: '/login', fullPath: '/login', params: {}, meta: {}, matched: [] as any[], name: 'login' } as any,
}))
mockNuxtImport('navigateTo', () => h.navigateTo)
mockNuxtImport('useRoute', () => () => h.route)

const { client, from, user } = createSupabaseMock({ withAuth: true })
const signInWithPassword = vi.fn()
const resend = vi.fn()
client.auth.signInWithPassword = signInWithPassword
client.auth.resend = resend
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: LoginPage } = await import('~/pages/login.vue')

const db = createAuthDb({ profiles: { adherent: profileOf('adherent') }, roles: { adherent: ['parent'] } })

const sel = (id: string) => `[data-testid="${id}"]`
const REQUIRED = /L'(adresse )?email est requise?/
const INVALID = "Format d'email invalide"

let wrapper: any
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.route.query = {}
  h.navigateTo.mockReset()
  signInWithPassword.mockReset().mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Email not confirmed', status: 400 } })
  resend.mockReset().mockResolvedValue({ data: {}, error: null })
})
afterEach(async () => {
  db.releaseAll()
  wrapper?.unmount()
  wrapper = undefined
  await flushPromises()
})

function inputOf(testId: string) {
  const el = wrapper.find(sel(testId))
  return el.element.tagName === 'INPUT' ? el : el.find('input')
}

/** Amène la page à l'état « e-mail non confirmé » (bouton de renvoi visible). */
async function reachNotConfirmed() {
  wrapper = await mountSuspended(LoginPage)
  await inputOf('input-login-email').setValue('camille@test.fr')
  await inputOf('input-login-password').setValue('Mdp-Valide1!')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
  expect(wrapper.find(sel('btn-login-resend')).exists(), 'btn-login-resend absent après un échec email_not_confirmed').toBe(true)
}

async function clickResendWith(email: string) {
  await inputOf('input-login-email').setValue(email)
  await wrapper.find(sel('btn-login-resend')).trigger('click')
  await flushPromises()
}

describe('R2b-1 — /login : renvoi avec un e-mail vide ou mal formé', () => {
  it('e-mail vide : aucun appel à auth.resend, message « L\'adresse email est requise »', async () => {
    await reachNotConfirmed()
    expect(wrapper.text()).not.toMatch(REQUIRED)
    await clickResendWith('')
    expect(resend).not.toHaveBeenCalled()
    expect(wrapper.text()).toMatch(REQUIRED)
    expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(false)
    expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(false)
  })

  it('e-mail composé d\'espaces : traité comme vide (aucun appel, message « requise »)', async () => {
    await reachNotConfirmed()
    await clickResendWith('   ')
    expect(resend).not.toHaveBeenCalled()
    expect(wrapper.text()).toMatch(REQUIRED)
  })

  it('e-mail mal formé : aucun appel à auth.resend, message « Format d\'email invalide »', async () => {
    await reachNotConfirmed()
    expect(wrapper.text()).not.toContain(INVALID)
    await clickResendWith('pas-un-email')
    expect(resend).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(INVALID)
    expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(false)
    expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(false)
  })

  it('témoin : un e-mail valide déclenche bien un seul appel à auth.resend', async () => {
    await reachNotConfirmed()
    await clickResendWith('camille@test.fr')
    await vi.waitFor(() => expect(resend).toHaveBeenCalledTimes(1), { timeout: 2000 })
    expect(wrapper.text()).not.toMatch(REQUIRED)
    expect(wrapper.text()).not.toContain(INVALID)
  })
})
