// enfants-fiabilite T0 — Q4 (page /register) : le message d'un 403 de /api/register est affiché TEL QUEL.
// Piège connu : register.vue remplace aujourd'hui tout message contenant « déjà » par
// « Cette adresse email est déjà utilisée… ». Le nouveau message 403 contient « déjà » ; seul un 409 doit être remplacé.
// Supabase (signUp) et `fetch` (/api/register) sont simulés, aucun réseau. Parcours adulte, sans enfant.
// Rouge attendu : le 403 est affiché avec « Cette adresse email est déjà utilisée » au lieu du message du serveur.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createSupabaseMock } from '../utils/supabase-mock'

const h = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => h.navigateTo)

const { client, user } = createSupabaseMock({ withAuth: true })
const signUp = vi.fn()
client.auth.signUp = signUp
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { default: RegisterPage } = await import('~/pages/register.vue')

const MESSAGE_403 = 'Impossible de finaliser l\'inscription. Si vous avez déjà un compte, connectez-vous ; sinon, recommencez l\'inscription.'
const ALREADY_USED = 'Cette adresse email est déjà utilisée'

const registerResponse = vi.fn()
const fetchMock = vi.fn()
let wrapper: any

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  user.value = null
  h.navigateTo.mockReset()
  signUp.mockReset().mockResolvedValue({ data: { user: { id: 'u1', identities: [{ id: 'i1' }] } }, error: null })
  registerResponse.mockReset()
  fetchMock.mockReset().mockImplementation(async (url: any) =>
    String(url).includes('/api/register') ? registerResponse() : json(200, { features: [] }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(async () => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
  await flushPromises()
})

/** Parcours adulte jusqu'à l'envoi ; retourne le texte visible de la page une fois /api/register traité. */
async function submitAdult() {
  wrapper = await mountSuspended(RegisterPage)
  await wrapper.find('[data-testid="btn-type-adult"]').trigger('click')
  await wrapper.find('[data-testid="btn-register-continue"]').trigger('click')
  await flushPromises()

  Object.assign(wrapper.vm.form, {
    first_name: 'Camille',
    last_name: 'Durand',
    birth_date: '1990-05-12',
    gender: 'F',
    email: 'camille@test.fr',
    password: 'Mdp-Valide1!',
    passwordConfirm: 'Mdp-Valide1!',
  })
  await flushPromises()

  await wrapper.find('form').trigger('submit')
  await vi.waitFor(() => expect(registerResponse).toHaveBeenCalled(), { timeout: 3000 })
  await flushPromises()
  return wrapper.text() as string
}

describe('Q4 — /register : message d\'erreur de /api/register', () => {
  it('un 403 est affiché tel quel dans le bandeau d\'erreur (pas remplacé malgré le mot « déjà »)', async () => {
    registerResponse.mockResolvedValue(json(403, { statusCode: 403, statusMessage: MESSAGE_403 }))
    const text = await submitAdult()
    expect(text).toContain(MESSAGE_403)
    expect(text).not.toContain(ALREADY_USED)
  })

  it('le 403 fait revenir à l\'étape du formulaire (stepError visible, pas de page de succès)', async () => {
    registerResponse.mockResolvedValue(json(403, { statusCode: 403, statusMessage: MESSAGE_403 }))
    const text = await submitAdult()
    expect(wrapper.vm.currentStep).toBe(2)
    expect(text).toContain(MESSAGE_403)
  })

  it('un 409 affiche toujours « Cette adresse email est déjà utilisée… »', async () => {
    registerResponse.mockResolvedValue(json(409, { statusCode: 409, statusMessage: 'Cette adresse email est déjà inscrite.' }))
    const text = await submitAdult()
    expect(text).toContain(ALREADY_USED)
    expect(text).not.toContain('déjà inscrite')
  })

  it('une autre erreur (500) est affichée telle quelle', async () => {
    registerResponse.mockResolvedValue(json(500, { statusCode: 500, statusMessage: 'Erreur lien parent-enfant : boom' }))
    const text = await submitAdult()
    expect(text).toContain('Erreur lien parent-enfant : boom')
  })
})
