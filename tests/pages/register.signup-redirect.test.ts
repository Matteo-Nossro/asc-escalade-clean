// R2-T0a auth-profils — R2-a (page /register) : l'inscription passe options.emailRedirectTo = <origine>/callback?type=signup.
// VRAI useAuth non requis ici (register.vue appelle directement supabase.auth.signUp) : Supabase est simulé, `fetch` aussi
// (/api/register), aucun réseau. Parcours adulte, sans enfant. Les champs sont posés par l'état de la page puis le
// formulaire est soumis par son événement `submit`.
// Rouge attendu : signUp est appelé sans `emailRedirectTo`.
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

const fetchMock = vi.fn()
let wrapper: any

beforeEach(() => {
  user.value = null
  h.navigateTo.mockReset()
  signUp.mockReset().mockResolvedValue({ data: { user: { id: 'u1', identities: [{ id: 'i1' }] } }, error: null })
  fetchMock.mockReset().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(async () => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
  await flushPromises()
})

describe('R2-a — /register : lien de retour de l\'e-mail de confirmation', () => {
  it('signUp reçoit options.emailRedirectTo = <origine>/callback?type=signup (full_name conservé)', async () => {
    wrapper = await mountSuspended(RegisterPage)
    await wrapper.find('[data-testid="btn-type-adult"]').trigger('click')
    await wrapper.find('[data-testid="btn-register-continue"]').trigger('click')
    await flushPromises()

    const form = wrapper.vm.form
    Object.assign(form, {
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
    await vi.waitFor(() => expect(signUp).toHaveBeenCalled(), { timeout: 3000 })

    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'camille@test.fr',
      options: expect.objectContaining({
        emailRedirectTo: `${window.location.origin}/callback?type=signup`,
        data: { full_name: 'Camille Durand' },
      }),
    }))
  })
})
