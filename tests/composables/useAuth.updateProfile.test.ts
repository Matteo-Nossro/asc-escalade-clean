// R1-c auth-profils — useAuth().updateProfile : vraie garde sur l'identifiant.
// Contrat retenu : sans identifiant d'utilisateur (ni `id` ni `sub`), updateProfile REJETTE avec
// Error('Non authentifié') et n'appelle JAMAIS Supabase (pas de `.eq('id', undefined)`).
// Cas visé par la revue : `useSupabaseUser()` renvoie un objet sans id ni sub (le simple test `!user.value` ne le voit pas).
import { describe, it, expect, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { createSupabaseMock } from '../utils/supabase-mock'

const { client, from, user } = createSupabaseMock({ withAuth: true })
mockNuxtImport('useSupabaseClient', () => () => client)
mockNuxtImport('useSupabaseUser', () => () => user)

const { useAuth } = await import('~/composables/useAuth')

beforeEach(() => {
  clearNuxtState(key => key.startsWith('auth:'))
  from.mockReset()
  user.value = null
})

describe('R1-c — updateProfile sans utilisateur identifiable', () => {
  it('aucun utilisateur : rejette « Non authentifié », aucun appel Supabase', async () => {
    user.value = null
    const { updateProfile } = useAuth()
    await expect(updateProfile({ phone: '0600000000' })).rejects.toThrow('Non authentifié')
    expect(from).not.toHaveBeenCalled()
  })

  it('utilisateur sans id ni sub : rejette « Non authentifié », aucune écriture sur profiles', async () => {
    user.value = { email: 'sans-id@test.fr' }
    const { updateProfile } = useAuth()
    await expect(updateProfile({ phone: '0600000000' })).rejects.toThrow('Non authentifié')
    expect(from).not.toHaveBeenCalled()
  })

  it('utilisateur sans id mais avec sub : l\'écriture cible le sub', async () => {
    const eqCalls: Array<[string, unknown]> = []
    from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'sub-1' }, error: null }) }) }),
          update: () => ({
            eq: (col: string, val: unknown) => {
              eqCalls.push([col, val])
              return { select: () => ({ single: () => Promise.resolve({ data: { id: 'sub-1', phone: '0600000000' }, error: null }) }) }
            },
          }),
        }
      }
      return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }
    })
    user.value = { sub: 'sub-1', email: 'sub@test.fr' }
    const { updateProfile } = useAuth()
    const data = await updateProfile({ phone: '0600000000' })
    expect(data).toMatchObject({ phone: '0600000000' })
    expect(eqCalls).toEqual([['id', 'sub-1']])
  })
})
