// R2-T0a auth-profils — R2-a (useAuth.signUp) et R2-b (useAuth().resendSignupConfirmation).
// VRAI useAuth, seul Supabase est simulé (client.auth.signUp / client.auth.resend). Aucun réseau.
// Rouge attendu : `emailRedirectTo` absent de signUp, et `resendSignupConfirmation` n'existe pas encore.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { createSupabaseMock } from '../utils/supabase-mock'

const { client, from, user } = createSupabaseMock({ withAuth: true })
const signUp = vi.fn()
const resend = vi.fn()
client.auth.signUp = signUp
client.auth.resend = resend
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { useAuth } = await import('~/composables/useAuth')

const REDIRECT = () => `${window.location.origin}/callback?type=signup`

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  from.mockReset()
  signUp.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  resend.mockReset().mockResolvedValue({ data: {}, error: null })
  user.value = null
})

/** Récupère la fonction de renvoi ; son absence est l'échec attendu (fonctionnalité manquante). */
function resendFn(): (email: string) => Promise<unknown> {
  const fn = (useAuth() as any).resendSignupConfirmation
  expect(fn, 'useAuth().resendSignupConfirmation est absente (R2-b)').toBeTypeOf('function')
  return fn
}

describe('R2-a — useAuth.signUp passe le lien de retour', () => {
  it('options.emailRedirectTo = <origine>/callback?type=signup, sans perdre full_name', async () => {
    await useAuth().signUp('camille@test.fr', 'Mdp-Valide1!', 'Camille Durand')
    expect(signUp).toHaveBeenCalledTimes(1)
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'camille@test.fr',
      password: 'Mdp-Valide1!',
      options: expect.objectContaining({
        emailRedirectTo: REDIRECT(),
        data: { full_name: 'Camille Durand' },
      }),
    }))
  })
})

describe('R2-b — resendSignupConfirmation : appel Supabase', () => {
  it('appelle auth.resend({ type: \'signup\', email, options: { emailRedirectTo } }) avec le même lien que R2-a', async () => {
    await resendFn()('camille@test.fr')
    expect(resend).toHaveBeenCalledTimes(1)
    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'camille@test.fr',
      options: { emailRedirectTo: REDIRECT() },
    })
  })
})

describe('R2-b — resendSignupConfirmation : résultat', () => {
  it('succès => \'sent\'', async () => {
    resend.mockResolvedValue({ data: {}, error: null })
    expect(await resendFn()('camille@test.fr')).toBe('sent')
  })

  it('succès => \'sent\' quelle que soit l\'adresse (ne révèle pas si le compte existe)', async () => {
    const fn = resendFn()
    expect(await fn('connu@test.fr')).toBe('sent')
    expect(await fn('inconnu@test.fr')).toBe('sent')
  })

  it('statut 429 => \'rate_limited\'', async () => {
    resend.mockResolvedValue({ data: null, error: { message: 'boom', status: 429 } })
    expect(await resendFn()('camille@test.fr')).toBe('rate_limited')
  })

  it.each([
    'email rate limit exceeded',
    'Email Rate Limit Exceeded',
    'Too many requests',
    'TOO MANY REQUESTS',
    'For security purposes, you can only request this after 45 seconds.',
    'for security purposes, you can only request this after 45 seconds.',
  ])('message « %s » => \'rate_limited\'', async (message) => {
    resend.mockResolvedValue({ data: null, error: { message, status: 400 } })
    expect(await resendFn()('camille@test.fr')).toBe('rate_limited')
  })

  it.each([
    { message: 'Error sending confirmation email', status: 500 },
    { message: 'Signup is disabled', status: 422 },
    { message: 'Something went wrong' },
  ])('autre erreur Supabase (%o) => \'error\'', async (err) => {
    resend.mockResolvedValue({ data: null, error: err })
    expect(await resendFn()('camille@test.fr')).toBe('error')
  })

  it('exception levée par le client (réseau) => \'error\', sans lever', async () => {
    resend.mockRejectedValue(new Error('Failed to fetch'))
    await expect(resendFn()('camille@test.fr')).resolves.toBe('error')
  })
})
