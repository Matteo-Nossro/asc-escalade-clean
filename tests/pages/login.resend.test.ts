// R2-T0a auth-profils — R2-f (/login : renvoi de l'e-mail de confirmation) et R2-g (compte sans complétion qui se connecte).
// VRAI useAuth, Supabase simulé (auth.signInWithPassword / auth.resend). `navigateTo` et `useRoute` simulés.
//
// R2-f : échec « email_not_confirmed » (code OU message « Email not confirmed ») => message existant + bouton
//        btn-login-resend qui utilise l'e-mail saisi ; mêmes messages que /callback (msg-resend-sent / msg-resend-error).
// R2-g : un compte créé par signUp seul (profil de handle_new_user : profile_completed_at NULL, « En attente », aucun rôle)
//        qui se connecte par /login est envoyé par le middleware réel sur /completer-profil, que la redirection soit celle
//        par défaut (/admin/dashboard) ou explicite (?redirect=/profil). Ce parcours n'était couvert par aucun test existant
//        (callback.test.ts ne couvre que le retour OAuth, auth.global.test.ts ne passe pas par /login).
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
const { default: middleware } = await import('~/middleware/auth.global')

const db = createAuthDb({
  profiles: {
    // Profil tel que créé par le déclencheur handle_new_user : pas de complétion, statut « En attente », aucun rôle.
    nouveau: profileOf('nouveau', { profile_completed_at: null, status: 'En attente' }),
    adherent: profileOf('adherent'),
  },
  roles: { nouveau: [], adherent: ['parent'] },
})

const REDIRECT = () => `${window.location.origin}/callback?type=signup`
const sel = (id: string) => `[data-testid="${id}"]`

let wrapper: any
beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  db.fail = false
  db.reads.length = 0
  serveAuth(from, db)
  user.value = null
  h.route.query = {}
  h.navigateTo.mockReset().mockImplementation((to: unknown) => ({ redirectedTo: to }))
  signInWithPassword.mockReset()
  resend.mockReset().mockResolvedValue({ data: {}, error: null })
})
afterEach(async () => {
  db.releaseAll()
  wrapper?.unmount()
  wrapper = undefined
  await flushPromises()
})

/** Champ de saisie : data-testid porté soit par l'<input>, soit par son conteneur. */
function inputOf(testId: string) {
  const el = wrapper.find(sel(testId))
  return el.element.tagName === 'INPUT' ? el : el.find('input')
}
/** Monte la page, saisit les identifiants et soumet le formulaire de connexion. */
async function submitLogin(email: string, password = 'Mdp-Valide1!') {
  wrapper = await mountSuspended(LoginPage)
  await inputOf('input-login-email').setValue(email)
  await inputOf('input-login-password').setValue(password)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

/** Clique sur le bouton de renvoi ; son absence est l'échec attendu (fonctionnalité manquante). */
async function clickResend() {
  const btn = wrapper.find(sel('btn-login-resend'))
  expect(btn.exists(), 'btn-login-resend absent après un échec email_not_confirmed').toBe(true)
  await btn.trigger('click')
}

describe('R2-f — /login : e-mail non confirmé', () => {
  const NOT_CONFIRMED = [
    ['message « Email not confirmed »', { message: 'Email not confirmed', status: 400 }],
    ['code email_not_confirmed (message quelconque)', { message: 'Votre adresse n\'est pas validée', code: 'email_not_confirmed', status: 400 }],
  ] as const

  describe.each(NOT_CONFIRMED)('échec avec %s', (_label, authError) => {
    beforeEach(() => { signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: authError }) })

    it('affiche le message existant et le bouton btn-login-resend « Renvoyer l\'e-mail de confirmation »', async () => {
      await submitLogin('camille@test.fr')
      expect(wrapper.text()).toContain('Veuillez confirmer votre adresse email')
      const btn = wrapper.find(sel('btn-login-resend'))
      expect(btn.exists(), 'btn-login-resend absent après un échec email_not_confirmed').toBe(true)
      expect(btn.text()).toContain("Renvoyer l'e-mail de confirmation")
      expect(h.navigateTo).not.toHaveBeenCalled()
    })

    it('le bouton renvoie à l\'e-mail saisi via auth.resend, puis affiche msg-resend-sent', async () => {
      await submitLogin('camille@test.fr')
      await clickResend()
      await vi.waitFor(() => expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(true), { timeout: 2000 })
      expect(resend).toHaveBeenCalledTimes(1)
      expect(resend).toHaveBeenCalledWith({ type: 'signup', email: 'camille@test.fr', options: { emailRedirectTo: REDIRECT() } })
      expect(wrapper.find(sel('msg-resend-sent')).text()).toContain('Si une inscription non confirmée existe pour cette adresse')
      expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(false)
    })

    it('limite d\'envoi : msg-resend-error avec « patientez », pas de msg-resend-sent', async () => {
      resend.mockResolvedValue({ data: null, error: { message: 'email rate limit exceeded', status: 429 } })
      await submitLogin('camille@test.fr')
      await clickResend()
      await vi.waitFor(() => expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(true), { timeout: 2000 })
      expect(wrapper.find(sel('msg-resend-error')).text().toLowerCase()).toContain('patientez')
      expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(false)
    })

    it('autre échec d\'envoi : msg-resend-error générique, pas de msg-resend-sent', async () => {
      resend.mockResolvedValue({ data: null, error: { message: 'Error sending confirmation email', status: 500 } })
      await submitLogin('camille@test.fr')
      await clickResend()
      await vi.waitFor(() => expect(wrapper.find(sel('msg-resend-error')).exists()).toBe(true), { timeout: 2000 })
      expect(wrapper.find(sel('msg-resend-error')).text().toLowerCase()).not.toContain('patientez')
      expect(wrapper.find(sel('msg-resend-sent')).exists()).toBe(false)
    })
  })

  it('autre échec de connexion (identifiants invalides) : pas de bouton de renvoi', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login credentials', status: 400 } })
    await submitLogin('camille@test.fr')
    expect(wrapper.text()).toContain('Email ou mot de passe incorrect')
    expect(wrapper.find(sel('btn-login-resend')).exists()).toBe(false)
  })
})

describe('R2-g — compte sans complétion qui se connecte par /login', () => {
  /** Session simulée : signInWithPassword renvoie l'utilisateur et le propage à useSupabaseUser, comme Supabase. */
  function signInAs(id: string) {
    signInWithPassword.mockImplementation(async () => {
      const authUser = { id, email: `${id}@test.fr` }
      user.value = authUser
      return { data: { user: authUser, session: { user: authUser } }, error: null }
    })
  }
  /** Joue le middleware réel sur la destination choisie par la page de connexion. */
  async function middlewareRedirect(path: string) {
    h.navigateTo.mockClear()
    const to = { path, fullPath: path, query: {}, hash: '', params: {}, meta: {}, matched: [], name: undefined } as any
    const from_ = { path: '/login', fullPath: '/login', query: {}, hash: '', params: {}, meta: {}, matched: [], name: 'login' } as any
    const returned: any = await (middleware as any)(to, from_)
    await flushPromises()
    const call = h.navigateTo.mock.calls[0]
    return call ? (call[0] as string) : (typeof returned === 'string' ? returned : (returned?.path ?? null))
  }

  it('redirection par défaut : /login envoie vers /admin/dashboard, puis le middleware renvoie sur /completer-profil', async () => {
    signInAs('nouveau')
    await submitLogin('nouveau@test.fr')
    await vi.waitFor(() => expect(h.navigateTo).toHaveBeenCalled(), { timeout: 3000 })
    const destination = h.navigateTo.mock.calls[0]![0] as string
    expect(destination).toBe('/admin/dashboard')

    expect(await middlewareRedirect(destination)).toBe('/completer-profil')
  })

  it('redirection explicite (?redirect=/profil) : le middleware renvoie aussi sur /completer-profil', async () => {
    h.route.query = { redirect: '/profil' }
    signInAs('nouveau')
    await submitLogin('nouveau@test.fr')
    await vi.waitFor(() => expect(h.navigateTo).toHaveBeenCalled(), { timeout: 3000 })
    const destination = h.navigateTo.mock.calls[0]![0] as string
    expect(destination).toBe('/profil')

    expect(await middlewareRedirect(destination)).toBe('/completer-profil')
  })

  it('compte au profil complété (témoin) : la destination par défaut n\'est pas renvoyée sur /completer-profil', async () => {
    signInAs('adherent')
    await submitLogin('adherent@test.fr')
    await vi.waitFor(() => expect(h.navigateTo).toHaveBeenCalled(), { timeout: 3000 })
    const destination = h.navigateTo.mock.calls[0]![0] as string
    expect(destination).toBe('/admin/dashboard')

    expect(await middlewareRedirect(destination)).not.toBe('/completer-profil')
  })
})
